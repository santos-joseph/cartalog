const { app, BrowserWindow, dialog, ipcMain, safeStorage, session, shell } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')

try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'))
} catch {
  // A configuração local é opcional. O padrão aponta para a API local.
}

const devUrl = process.env.CARTALOG_DEV_SERVER_URL || ''
const rawApiUrl = process.env.CARTALOG_API_URL || 'http://127.0.0.1:3333'
const apiOrigin = new URL(rawApiUrl).origin
const apiUrl = new URL('/api/v1/', apiOrigin)
const webBaseUrl = process.env.CARTALOG_WEB_BASE_URL || 'http://localhost:3000'

if (apiUrl.protocol !== 'https:' && !(apiUrl.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(apiUrl.hostname))) {
  throw new Error('CARTALOG_API_URL deve usar HTTPS fora do ambiente local.')
}
const webOrigin = new URL(webBaseUrl)
if (webOrigin.protocol !== 'https:' && !(webOrigin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(webOrigin.hostname))) {
  throw new Error('CARTALOG_WEB_BASE_URL deve usar HTTPS fora do ambiente local.')
}

let mainWindow = null
let accessToken = null
let refreshToken = null
let platformToken = null
let currentUser = null
let currentCompany = null
let currentScope = null

const sessionPath = () => path.join(app.getPath('userData'), 'session.enc')
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function requireId(value) {
  if (typeof value !== 'string' || !uuid.test(value)) throw new Error('Identificador inválido.')
  return value
}

function requireOwner() {
  if (currentScope !== 'company' || !accessToken || currentUser?.role !== 'OWNER') throw new Error('Acesso restrito ao dono da loja.')
}

function requirePlatform() {
  if (currentScope !== 'platform' || !platformToken || !['PLATFORM_OWNER', 'PLATFORM_ADMIN'].includes(currentUser?.role)) throw new Error('Acesso global não autorizado.')
}

function assertObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Dados inválidos.')
  return value
}

async function forgetSession() {
  accessToken = null
  refreshToken = null
  platformToken = null
  currentUser = null
  currentCompany = null
  currentScope = null
  await fs.rm(sessionPath(), { force: true })
}

async function saveSessionCredential() {
  const credential = currentScope === 'platform' && platformToken ? `platform:${platformToken}` : refreshToken ? `company:${refreshToken}` : null
  if (!credential || !safeStorage.isEncryptionAvailable()) return
  await fs.mkdir(app.getPath('userData'), { recursive: true })
  await fs.writeFile(sessionPath(), safeStorage.encryptString(credential), { mode: 0o600 })
}

function parseApiError(data, status) {
  if (data?.details && typeof data.details === 'object') {
    const first = Object.values(data.details).flat().find((item) => typeof item === 'string')
    if (first) return first
  }
  if (status === 401) return 'Sessão expirada ou credenciais inválidas.'
  if (status === 403) return 'Você não tem permissão para esta ação.'
  if (status === 409) return 'Esse cadastro já existe.'
  if (typeof data?.error === 'string') return data.error
  return `A API respondeu com erro ${status}.`
}

async function requestWithRetry(url, options) {
  const attempts = options.method === 'GET' ? 2 : 1
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fetch(url, { ...options, signal: AbortSignal.timeout(20000) })
    } catch (error) {
      if (attempt + 1 < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        continue
      }
      if (error?.name === 'TimeoutError') {
        const unavailable = new Error(`A API em ${apiOrigin} demorou para responder. Tente atualizar o painel.`)
        unavailable.code = 'API_UNAVAILABLE'
        throw unavailable
      }
      const unavailable = new Error(`Não foi possível conectar à API em ${apiOrigin}. Inicie a API e confira a conexão.`)
      unavailable.code = 'API_UNAVAILABLE'
      throw unavailable
    }
  }
}

async function apiRequest(endpoint, { method = 'GET', body, auth = true, retry = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (auth) {
    if (!accessToken) throw new Error('Entre na sua conta para continuar.')
    headers.Authorization = `Bearer ${accessToken}`
  }
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'

  const response = await requestWithRetry(new URL(endpoint.replace(/^\//, ''), apiUrl), {
    method,
    headers,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  })

  if (response.status === 401 && auth && retry && refreshToken) {
    try {
      const refreshed = await apiRequest('auth/refresh', { method: 'POST', body: { refreshToken }, auth: false })
      accessToken = refreshed.accessToken
      return apiRequest(endpoint, { method, body, auth, retry: false })
    } catch (error) {
      if (error?.code === 'API_UNAVAILABLE') throw error
      await forgetSession()
      throw new Error('Sua sessão terminou. Entre novamente.')
    }
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(parseApiError(data, response.status))
  return data
}

async function platformRequest(endpoint, { method = 'GET', body, restoring = false } = {}) {
  if (restoring && endpoint === 'me' && platformToken) {
    // A sessão criptografada ainda precisa ser validada antes de carregar o usuário.
  } else requirePlatform()
  const response = await requestWithRetry(new URL(`platform/${endpoint.replace(/^\//, '')}`, apiUrl), {
    method,
    headers: { Accept: 'application/json', Authorization: `Bearer ${platformToken}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (response.status === 401) { await forgetSession(); throw new Error('Sua sessão terminou. Entre novamente.') }
  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(parseApiError(data, response.status))
  return data
}

async function acceptAuth(result) {
  if (result?.scope === 'platform' && ['PLATFORM_OWNER', 'PLATFORM_ADMIN'].includes(result.user?.role)) {
    accessToken = null
    refreshToken = null
    platformToken = result.accessToken
    currentUser = result.user
    currentCompany = null
    currentScope = 'platform'
    await saveSessionCredential()
    return { scope: 'platform', user: currentUser }
  }
  if (result?.user?.role !== 'OWNER') throw new Error('O app desktop é exclusivo para o dono da loja. Vendedores usam a web ou o mobile.')
  accessToken = result.accessToken
  refreshToken = result.refreshToken
  platformToken = null
  currentUser = result.user
  currentCompany = result.company
  currentScope = 'company'
  await saveSessionCredential()
  return { scope: 'company', user: currentUser, company: currentCompany }
}

async function restoreSession() {
  if (currentScope === 'platform' && currentUser) return { scope: 'platform', user: currentUser }
  if (currentScope === 'company' && currentUser && currentCompany) return { scope: 'company', user: currentUser, company: currentCompany }
  if (!safeStorage.isEncryptionAvailable()) return null
  try {
    const stored = safeStorage.decryptString(await fs.readFile(sessionPath()))
    if (stored.startsWith('platform:')) {
      platformToken = stored.slice('platform:'.length)
      currentScope = 'platform'
      currentUser = await platformRequest('me', { restoring: true })
      return { scope: 'platform', user: currentUser }
    }
    refreshToken = stored.startsWith('company:') ? stored.slice('company:'.length) : stored
    const refreshed = await apiRequest('auth/refresh', { method: 'POST', body: { refreshToken }, auth: false })
    accessToken = refreshed.accessToken
    const me = await apiRequest('auth/me')
    if (me.role !== 'OWNER') throw new Error('Acesso restrito ao dono da loja.')
    currentUser = { id: me.id, name: me.name, email: me.email, role: me.role }
    currentCompany = { id: me.company.id, name: me.company.name, slug: me.company.slug }
    currentScope = 'company'
    return { scope: 'company', user: currentUser, company: currentCompany }
  } catch (error) {
    if (error?.code === 'API_UNAVAILABLE') return null
    await forgetSession()
    return null
  }
}

function allowedSender(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents) return false
  const url = event.senderFrame?.url || ''
  if (devUrl) {
    try { return new URL(url).origin === new URL(devUrl).origin } catch { return false }
  }
  return url.startsWith('file://')
}

function handle(channel, fn) {
  ipcMain.handle(`cartalog:${channel}`, async (event, ...args) => {
    if (!allowedSender(event)) throw new Error('Origem não autorizada.')
    return fn(...args)
  })
}

function uploadMime(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' }[ext]
}

async function pickAndUpload(endpoint, maxBytes, extensions) {
  requireOwner()
  const selected = await dialog.showOpenDialog(mainWindow, {
    title: 'Escolher imagem',
    properties: ['openFile'],
    filters: [{ name: 'Imagens', extensions }],
  })
  if (selected.canceled || !selected.filePaths[0]) return null
  const filePath = selected.filePaths[0]
  const mime = uploadMime(filePath)
  if (!mime || !extensions.includes(path.extname(filePath).slice(1).toLowerCase())) throw new Error('Formato de imagem inválido.')
  if ((await fs.stat(filePath)).size > maxBytes) throw new Error(`A imagem deve ter até ${Math.floor(maxBytes / 1024 / 1024)} MB.`)
  const form = new FormData()
  form.append('file', new Blob([await fs.readFile(filePath)], { type: mime }), path.basename(filePath))
  return apiRequest(endpoint, { method: 'POST', body: form })
}

async function pickVehicleImages(vehicleId) {
  requireOwner()
  const selected = await dialog.showOpenDialog(mainWindow, {
    title: 'Fotos do veículo',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
  })
  if (selected.canceled || selected.filePaths.length === 0) return null
  if (selected.filePaths.length > 20) throw new Error('Escolha no máximo 20 fotos.')
  const form = new FormData()
  for (const filePath of selected.filePaths) {
    const mime = uploadMime(filePath)
    if (!mime || !['image/png', 'image/jpeg', 'image/webp'].includes(mime)) throw new Error('Formato de foto inválido.')
    if ((await fs.stat(filePath)).size > 5 * 1024 * 1024) throw new Error('Cada foto deve ter até 5 MB.')
    form.append('file', new Blob([await fs.readFile(filePath)], { type: mime }), path.basename(filePath))
  }
  return apiRequest(`vehicles/${requireId(vehicleId)}/images`, { method: 'POST', body: form })
}

function registerHandlers() {
  handle('window:minimize', () => { mainWindow.minimize(); return true })
  handle('window:toggleMaximize', () => { if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize(); return mainWindow.isMaximized() })
  handle('window:close', () => { mainWindow.close(); return true })
  handle('window:isMaximized', () => mainWindow.isMaximized())
  handle('bootstrap', async () => ({ session: await restoreSession(), apiOrigin, webBaseUrl }))
  handle('health', async () => {
    try {
      const response = await fetch(new URL('/health', apiOrigin), { signal: AbortSignal.timeout(4000) })
      return response.ok
    } catch { return false }
  })
  handle('login', async (input) => {
    const body = assertObject(input)
    const result = await apiRequest('auth/desktop-login', { method: 'POST', body, auth: false })
    return acceptAuth(result)
  })
  handle('logout', async () => { await forgetSession(); return true })
  handle('platform:overview', () => platformRequest('overview'))
  handle('platform:companies', () => platformRequest('companies'))
  handle('platform:createCompany', (input) => platformRequest('companies', { method: 'POST', body: assertObject(input) }))
  handle('platform:plans', () => platformRequest('plans'))
  handle('platform:createPlan', (input) => platformRequest('plans', { method: 'POST', body: assertObject(input) }))
  handle('platform:updatePlan', (id, input) => platformRequest(`plans/${requireId(id)}`, { method: 'PATCH', body: assertObject(input) }))
  handle('platform:updateSubscription', (id, input) => platformRequest(`companies/${requireId(id)}/subscription`, { method: 'PUT', body: assertObject(input) }))
  handle('platform:requests', () => platformRequest('demo-requests'))
  handle('platform:admins', () => platformRequest('admins'))
  handle('platform:createAdmin', (input) => platformRequest('admins', { method: 'POST', body: assertObject(input) }))
  handle('platform:setAdminActive', (id, input) => platformRequest(`admins/${requireId(id)}/active`, { method: 'PATCH', body: assertObject(input) }))
  handle('platform:audit', (options = {}) => {
    const params = new URLSearchParams()
    if (typeof options?.before === 'string') params.set('before', options.before)
    if (typeof options?.companyId === 'string') params.set('companyId', options.companyId)
    return platformRequest(`audit?${params}`)
  })
  handle('catalog:open', async () => {
    requireOwner()
    if (!/^[a-z0-9-]+$/.test(currentCompany.slug)) throw new Error('Endereço da loja inválido.')
    const url = new URL(webOrigin.origin)
    url.hostname = `${currentCompany.slug}.${['localhost', '127.0.0.1'].includes(url.hostname) ? 'localhost' : url.hostname}`
    await shell.openExternal(url.href)
    return true
  })
  handle('team:list', async () => { requireOwner(); return apiRequest('users/?includeInactive=true') })
  handle('team:create', async (input) => { requireOwner(); return apiRequest('users/', { method: 'POST', body: { ...assertObject(input), role: 'SELLER' } }) })
  handle('team:update', async (id, input) => { requireOwner(); return apiRequest(`users/${requireId(id)}`, { method: 'PUT', body: assertObject(input) }) })
  handle('team:deactivate', async (id) => { requireOwner(); return apiRequest(`users/${requireId(id)}`, { method: 'DELETE' }) })
  handle('team:reactivate', async (id) => { requireOwner(); return apiRequest(`users/${requireId(id)}/reactivate`, { method: 'PATCH' }) })
  handle('company:get', async () => { requireOwner(); return apiRequest('companies/me') })
  handle('settings:get', async () => { requireOwner(); return apiRequest('companies/settings') })
  handle('settings:save', async (input) => { requireOwner(); return apiRequest('companies/settings', { method: 'PUT', body: assertObject(input) }) })
  handle('settings:uploadLogo', async () => pickAndUpload('companies/settings/logo', 2 * 1024 * 1024, ['png', 'jpg', 'jpeg', 'webp', 'svg']))
  handle('maintenance:get', async () => { requireOwner(); return apiRequest('companies/settings/maintenance') })
  handle('maintenance:save', async (input) => { requireOwner(); return apiRequest('companies/settings/maintenance', { method: 'PATCH', body: assertObject(input) }) })
  handle('categories:list', async () => { requireOwner(); return apiRequest('companies/categories/') })
  handle('categories:create', async (input) => { requireOwner(); return apiRequest('companies/categories/', { method: 'POST', body: assertObject(input) }) })
  handle('categories:update', async (id, input) => { requireOwner(); return apiRequest(`companies/categories/${requireId(id)}`, { method: 'PUT', body: assertObject(input) }) })
  handle('categories:delete', async (id) => { requireOwner(); return apiRequest(`companies/categories/${requireId(id)}`, { method: 'DELETE' }) })
  handle('pages:list', async () => { requireOwner(); return apiRequest('companies/pages') })
  handle('pages:get', async (id) => { requireOwner(); return apiRequest(`companies/pages/${requireId(id)}`) })
  handle('pages:create', async (input) => { requireOwner(); return apiRequest('companies/pages', { method: 'POST', body: assertObject(input) }) })
  handle('pages:update', async (id, input) => { requireOwner(); return apiRequest(`companies/pages/${requireId(id)}`, { method: 'PUT', body: assertObject(input) }) })
  handle('pages:delete', async (id) => { requireOwner(); return apiRequest(`companies/pages/${requireId(id)}`, { method: 'DELETE' }) })
  handle('pages:uploadImage', async () => pickAndUpload('companies/pages/images', 8 * 1024 * 1024, ['png', 'jpg', 'jpeg', 'webp']))
  handle('banners:list', async () => { requireOwner(); return apiRequest('companies/banners') })
  handle('banners:create', async (input) => { requireOwner(); return apiRequest('companies/banners', { method: 'POST', body: assertObject(input) }) })
  handle('banners:update', async (id, input) => { requireOwner(); return apiRequest(`companies/banners/${requireId(id)}`, { method: 'PUT', body: assertObject(input) }) })
  handle('banners:delete', async (id) => { requireOwner(); return apiRequest(`companies/banners/${requireId(id)}`, { method: 'DELETE' }) })
  handle('banners:uploadImage', async (id) => pickAndUpload(`companies/banners/${requireId(id)}/image`, 8 * 1024 * 1024, ['png', 'jpg', 'jpeg', 'webp']))
  handle('vehicles:list', async (filters) => { requireOwner(); const query = new URLSearchParams(Object.entries(assertObject(filters)).filter(([, value]) => value !== undefined && value !== '')); return apiRequest(`vehicles/?${query}`) })
  handle('vehicles:get', async (id) => { requireOwner(); return apiRequest(`vehicles/${requireId(id)}`) })
  handle('vehicles:create', async (input) => { requireOwner(); return apiRequest('vehicles/', { method: 'POST', body: assertObject(input) }) })
  handle('vehicles:update', async (id, input) => { requireOwner(); return apiRequest(`vehicles/${requireId(id)}`, { method: 'PUT', body: assertObject(input) }) })
  handle('vehicles:delete', async (id) => { requireOwner(); return apiRequest(`vehicles/${requireId(id)}`, { method: 'DELETE' }) })
  handle('vehicles:brands', async () => { requireOwner(); return apiRequest('vehicles/brands') })
  handle('vehicles:models', async (brandId) => { requireOwner(); return apiRequest(`vehicles/models?brandId=${encodeURIComponent(requireId(brandId))}`) })
  handle('vehicles:fuels', async () => { requireOwner(); return apiRequest('vehicles/fuels') })
  handle('vehicles:transmissions', async () => { requireOwner(); return apiRequest('vehicles/transmissions') })
  handle('vehicles:features', async () => { requireOwner(); return apiRequest('vehicles/features') })
  handle('vehicles:uploadImages', async (id) => pickVehicleImages(id))
  handle('vehicles:deleteImage', async (id, imageId) => { requireOwner(); return apiRequest(`vehicles/${requireId(id)}/images/${requireId(imageId)}`, { method: 'DELETE' }) })
  handle('vehicles:setCover', async (id, imageId) => { requireOwner(); return apiRequest(`vehicles/${requireId(id)}/cover`, { method: 'PATCH', body: { imageId: requireId(imageId) } }) })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1000,
    minHeight: 680,
    title: 'Cartalog Desktop',
    frame: false,
    backgroundColor: '#f6f5f6',
    icon: path.join(__dirname, '..', 'assets', process.platform === 'win32' ? 'cartalog.ico' : 'cartalog-mark.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault())
  mainWindow.webContents.on('did-fail-load', (_event, code, description) => console.error('Falha ao carregar a interface:', code, description))
  mainWindow.webContents.on('render-process-gone', (_event, details) => console.error('A interface foi encerrada:', details.reason))
  const sendWindowState = () => mainWindow?.webContents.send('cartalog:window-state', mainWindow.isMaximized())
  mainWindow.on('maximize', sendWindowState)
  mainWindow.on('unmaximize', sendWindowState)
  if (process.env.CARTALOG_SMOKE === '1') {
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        if (!mainWindow || mainWindow.isDestroyed()) return
        const result = await mainWindow.webContents.executeJavaScript('({title: document.title, text: document.body.innerText.slice(0, 180), bridge: typeof window.cartalog, viewport: innerHeight, documentHeight: document.documentElement.scrollHeight, bodyHeight: document.body.scrollHeight, mainOverflow: getComputedStyle(document.querySelector(".main-panel") || document.body).overflowY, pageOverflow: getComputedStyle(document.querySelector(".page-content") || document.body).overflowY})')
        console.log('CARTALOG_SMOKE', JSON.stringify(result))
      }, 1500)
    })
  }
  if (devUrl) mainWindow.loadURL(devUrl)
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  mainWindow.on('closed', () => { mainWindow = null })
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })
  app.whenReady().then(() => {
    if (process.platform === 'win32') app.setAppUserModelId('com.cartalog.desktop')
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
    registerHandlers()
    createWindow()
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
  })
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

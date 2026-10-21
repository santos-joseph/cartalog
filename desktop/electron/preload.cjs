const { contextBridge, ipcRenderer } = require('electron')

const invoke = (name, ...args) => ipcRenderer.invoke(`cartalog:${name}`, ...args)

contextBridge.exposeInMainWorld('cartalog', {
  window: {
    minimize: () => invoke('window:minimize'),
    toggleMaximize: () => invoke('window:toggleMaximize'),
    close: () => invoke('window:close'),
    isMaximized: () => invoke('window:isMaximized'),
    onStateChange: (callback) => {
      const listener = (_event, maximized) => callback(Boolean(maximized))
      ipcRenderer.on('cartalog:window-state', listener)
      return () => ipcRenderer.removeListener('cartalog:window-state', listener)
    },
  },
  bootstrap: () => invoke('bootstrap'),
  health: () => invoke('health'),
  login: (input) => invoke('login', input),
  logout: () => invoke('logout'),
  platform: {
    overview: () => invoke('platform:overview'),
    companies: () => invoke('platform:companies'),
    createCompany: (input) => invoke('platform:createCompany', input),
    plans: () => invoke('platform:plans'),
    createPlan: (input) => invoke('platform:createPlan', input),
    updatePlan: (id, input) => invoke('platform:updatePlan', id, input),
    updateSubscription: (id, input) => invoke('platform:updateSubscription', id, input),
    requests: () => invoke('platform:requests'),
    admins: () => invoke('platform:admins'),
    createAdmin: (input) => invoke('platform:createAdmin', input),
    setAdminActive: (id, input) => invoke('platform:setAdminActive', id, input),
    audit: (options) => invoke('platform:audit', options),
  },
  catalog: { open: () => invoke('catalog:open') },
  team: {
    list: () => invoke('team:list'),
    create: (input) => invoke('team:create', input),
    update: (id, input) => invoke('team:update', id, input),
    deactivate: (id) => invoke('team:deactivate', id),
    reactivate: (id) => invoke('team:reactivate', id),
  },
  company: { get: () => invoke('company:get') },
  settings: {
    get: () => invoke('settings:get'),
    save: (input) => invoke('settings:save', input),
    uploadLogo: () => invoke('settings:uploadLogo'),
  },
  maintenance: {
    get: () => invoke('maintenance:get'),
    save: (input) => invoke('maintenance:save', input),
  },
  categories: {
    list: () => invoke('categories:list'),
    create: (input) => invoke('categories:create', input),
    update: (id, input) => invoke('categories:update', id, input),
    delete: (id) => invoke('categories:delete', id),
  },
  pages: {
    list: () => invoke('pages:list'),
    get: (id) => invoke('pages:get', id),
    create: (input) => invoke('pages:create', input),
    update: (id, input) => invoke('pages:update', id, input),
    delete: (id) => invoke('pages:delete', id),
    uploadImage: () => invoke('pages:uploadImage'),
  },
  banners: {
    list: () => invoke('banners:list'),
    create: (input) => invoke('banners:create', input),
    update: (id, input) => invoke('banners:update', id, input),
    delete: (id) => invoke('banners:delete', id),
    uploadImage: (id) => invoke('banners:uploadImage', id),
  },
  vehicles: {
    list: (filters) => invoke('vehicles:list', filters),
    get: (id) => invoke('vehicles:get', id),
    create: (input) => invoke('vehicles:create', input),
    update: (id, input) => invoke('vehicles:update', id, input),
    delete: (id) => invoke('vehicles:delete', id),
    brands: () => invoke('vehicles:brands'),
    models: (brandId) => invoke('vehicles:models', brandId),
    fuels: () => invoke('vehicles:fuels'),
    transmissions: () => invoke('vehicles:transmissions'),
    features: () => invoke('vehicles:features'),
    uploadImages: (id) => invoke('vehicles:uploadImages', id),
    deleteImage: (id, imageId) => invoke('vehicles:deleteImage', id, imageId),
    setCover: (id, imageId) => invoke('vehicles:setCover', id, imageId),
  },
})

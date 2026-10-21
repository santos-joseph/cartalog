const assert = require('node:assert/strict')
const path = require('node:path')
const { app, BrowserWindow } = require('electron')

async function main() {
  const window = new BrowserWindow({ show: false, width: 1480, height: 940, webPreferences: { sandbox: true, nodeIntegration: false } })
  try {
    await window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
    for (const [width, height] of [[1480, 940], [1100, 700]]) {
      window.setSize(width, height)
      const metrics = await window.webContents.executeJavaScript(`(() => {
        document.getElementById('root').innerHTML = '<div class="desktop-window"><header class="window-bar"></header><div class="app-shell"><aside class="sidebar"></aside><main class="main-panel"><div class="topbar"></div><div class="page-content"><div style="height:1800px"></div></div></main></div></div>';
        const page = document.querySelector('.page-content');
        return { viewport: innerHeight, document: document.documentElement.scrollHeight, body: document.body.scrollHeight, page: page.clientHeight, content: page.scrollHeight, mainOverflow: getComputedStyle(document.querySelector('.main-panel')).overflowY, pageOverflow: getComputedStyle(page).overflowY };
      })()`)
      assert.equal(metrics.document, metrics.viewport, 'A página externa não deve rolar')
      assert.equal(metrics.body, metrics.viewport, 'O body não deve rolar')
      assert.equal(metrics.mainOverflow, 'hidden')
      assert.equal(metrics.pageOverflow, 'auto')
      assert.ok(metrics.content > metrics.page, 'O conteúdo interno deve continuar rolável')
      console.log(`Layout ${width}x${height}: OK`)
    }
  } finally { window.destroy(); app.quit() }
}

app.whenReady().then(main).catch((error) => { console.error(error); app.exit(1) })

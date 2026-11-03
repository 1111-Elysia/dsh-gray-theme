/* ============================================================================
 * dsh-gray-theme — Host half
 * ----------------------------------------------------------------------------
 * 1. Serves the theme stylesheet, optional boot sequence, and local art.
 * 2. Injects the theme/boot into the Web index before the app paints.
 * 3. Persists the tiny settings surface in $DSH_HOME/dsh-gray-theme.json.
 *
 * The client half owns token overrides and the settings panel; this half only
 * supplies stable assets, config, and the first-paint boot shell.
 * ========================================================================== */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const CONFIG_FILE = path.join(DSH_HOME, 'dsh-gray-theme.json')
const ROUTE_BASE = '/gray-theme'
const PLUGIN_ID = 'dsh-gray-theme'
const PLUGIN_VERSION = readVersion()

const PORTRAITS = [
  { id: 'dusk', file: 'portrait-dusk.jpg', label: '星海暮色', hint: '银发、军装、STELLARIS 天空' },
  { id: 'nightfall', file: 'portrait-nightfall.jpg', label: '夜航', hint: '侧脸、环形光、深空机库' },
  { id: 'command', file: 'portrait-command.jpg', label: '指挥席', hint: '黑金军装、红色信号' },
  { id: 'bar', file: 'portrait-bar.jpg', label: '档案之外', hint: '酒吧、暖光、放松的瞬间' },
  { id: 'corridor', file: 'portrait-corridor.jpg', label: '纳米走廊', hint: '青绿电路、战备状态' },
  { id: 'seated', file: 'portrait-seated.jpg', label: '落日终端', hint: '坐姿、晚霞、远景' },
  { id: 'warform', file: 'warform.jpg', label: '战体', hint: '纳米装甲、绿色刃光' }
]

const DEFAULTS = {
  enabled: true,
  boot: true,
  mode: 'session', // session | daily | always
  portrait: 'nightfall',
  duration: 3600
}

const PORTRAIT_IDS = new Set(PORTRAITS.map((item) => item.id))
const MODES = new Set(['session', 'daily', 'always'])

function readVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'))
    return String(pkg.version || '0.0.0')
  } catch {
    return '0.0.0'
  }
}

function localDate() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function normalize(input) {
  const out = { ...DEFAULTS }
  const src = input && typeof input === 'object' ? input : {}
  if (typeof src.enabled === 'boolean') out.enabled = src.enabled
  if (typeof src.boot === 'boolean') out.boot = src.boot
  if (MODES.has(src.mode)) out.mode = src.mode
  if (PORTRAIT_IDS.has(src.portrait)) out.portrait = src.portrait
  const duration = Number(src.duration)
  if (Number.isFinite(duration)) out.duration = Math.min(7000, Math.max(2200, Math.round(duration)))
  return out
}

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
    return normalize(JSON.parse(raw))
  } catch {
    return { ...DEFAULTS }
  }
}

function writeConfig(next) {
  const value = normalize(next)
  fs.mkdirSync(DSH_HOME, { recursive: true })
  const temp = `${CONFIG_FILE}.${process.pid}.tmp`
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', 'utf8')
  fs.renameSync(temp, CONFIG_FILE)
  return value
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body)
  })
  res.end(body)
}

function sendText(res, type, value) {
  res.writeHead(200, {
    'content-type': type,
    'cache-control': 'no-cache',
    'content-length': Buffer.byteLength(value)
  })
  res.end(value)
}

function sendFile(res, type, file) {
  try {
    const data = fs.readFileSync(file)
    res.writeHead(200, {
      'content-type': type,
      'cache-control': 'public, max-age=86400',
      'content-length': data.length
    })
    res.end(data)
  } catch {
    sendJson(res, 404, { ok: false, error: 'asset not found' })
  }
}

function readBody(req, limit = 128 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function resolveWebServer(ctx) {
  return ctx.get('webServer') || ctx.webServer
}

function hasRouteApi(server) {
  return !!server && typeof server.register === 'function' && typeof server.tapIndex === 'function'
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}

function portraitUrl(id) {
  return `${ROUTE_BASE}/art/${id}`
}

function bootMarkup(config) {
  const portrait = PORTRAITS.find((item) => item.id === config.portrait) || PORTRAITS[0]
  const duration = config.duration
  return [
    '<noscript><style>#gray-boot{display:none!important}html.gray-boot{overflow:auto!important}</style></noscript>',
    `<div id="gray-boot" class="gray-boot" data-portrait="${portrait.id}" style="--gb-duration:${duration}ms" role="dialog" aria-label="灰风档案启动画面" aria-modal="true">`,
    `<div class="gb-photo" style="background-image:url('${portraitUrl(portrait.id)}')"></div>`,
    '<div class="gb-shade" aria-hidden="true"></div>',
    '<div class="gb-frame">',
    '<header class="gb-top"><span>L-CLUSTER / 灰风档案</span></header>',
    '<main class="gb-main">',
    '<div class="gb-kicker">GRAY / NANITE ARCHIVE</div>',
    '<h1 class="gb-title">灰风<span>GRAY</span></h1>',
    '<p class="gb-line">整个文明，只以一个人的形式与你对话。</p>',
    '<button type="button" class="gb-enter">进入档案库 <span>ENTER / →</span></button>',
    '</main>',
    '<footer class="gb-bottom"><span>L-GATE / RECONNECTED</span><span class="gb-skip">点击任意处或按 ESC 跳过</span></footer>',
    '<div class="gb-progress" aria-hidden="true"><i></i></div>',
    '</div>',
    '</div>'
  ].join('')
}

function injectIndex(html) {
  if (!html || html.includes('id="gray-boot"') || html.includes('gray-theme/theme.css')) return html
  const config = readConfig()

  const boot = config.boot
  const critical = [
    '<style id="gray-theme-critical">',
    'html[data-gray-theme="on"]{background:#070c0e}',
    'html.gray-boot,html.gray-boot body{overflow:hidden!important;background:#070c0e}',
    'html.gray-boot-skip #gray-boot{display:none!important}',
    'html.gray-boot-skip{overflow:auto!important}',
    '</style>'
  ].join('')

  const payload = {
    version: PLUGIN_VERSION,
    config,
    portraits: PORTRAITS.map(({ id, label }) => ({ id, label })),
    today: localDate()
  }

  let head = `${critical}<script>window.__GRAY_THEME__=${safeJson(payload)};</script>`
  head += `<link rel="stylesheet" href="${ROUTE_BASE}/theme.css">`

  if (config.enabled) {
    head += '<script>try{document.documentElement.dataset.grayTheme="on"}catch(e){}</script>'
  }

  if (boot) {
    head += `<link rel="stylesheet" href="${ROUTE_BASE}/splash.css">`
    head += `<script>(function(){try{var c=window.__GRAY_THEME__.config;var skip=false;if(location.search.indexOf("gray_boot=1")>=0){skip=false}else if(c.mode==="session"&&sessionStorage.getItem("gray-theme:booted")==="1"){skip=true}else if(c.mode==="daily"&&localStorage.getItem("gray-theme:day")===window.__GRAY_THEME__.today){skip=true}var root=document.documentElement;if(skip){root.classList.add("gray-boot-skip")}else{root.classList.add("gray-boot")}}catch(e){}})();</script>`
  }

  let body = ''
  if (boot) {
    body = bootMarkup(config) + `<script defer src="${ROUTE_BASE}/splash.js"></script>`
  }

  let out = html
  if (out.includes('</head>')) out = out.replace('</head>', head + '</head>')
  else out = head + out

  const bodyTag = out.match(/<body[^>]*>/i)
  if (bodyTag) out = out.replace(bodyTag[0], bodyTag[0] + body)
  else if (out.includes('</body>')) out = out.replace('</body>', body + '</body>')
  else out = out + body
  return out
}

function apply(ctx) {
  const webServer = resolveWebServer(ctx)
  if (!hasRouteApi(webServer)) {
    console.warn(`[${PLUGIN_ID}] webServer unavailable; theme not injected`)
    return
  }

  const disposers = []
  const register = (route, handler) => {
    try {
      const dispose = webServer.register({ kind: 'exact', path: route, handler })
      if (typeof dispose === 'function') disposers.push(dispose)
    } catch (error) {
      console.warn(`[${PLUGIN_ID}] failed to register ${route}: ${String(error && error.message || error)}`)
    }
  }

  register(`${ROUTE_BASE}/theme.css`, (req, res) => {
    sendFile(res, 'text/css; charset=utf-8', path.join(PACKAGE_ROOT, 'lib', 'theme.css'))
  })
  register(`${ROUTE_BASE}/splash.css`, (req, res) => {
    sendFile(res, 'text/css; charset=utf-8', path.join(PACKAGE_ROOT, 'lib', 'splash.css'))
  })
  register(`${ROUTE_BASE}/splash.js`, (req, res) => {
    sendFile(res, 'application/javascript; charset=utf-8', path.join(PACKAGE_ROOT, 'lib', 'splash.js'))
  })

  for (const portrait of PORTRAITS) {
    register(`${ROUTE_BASE}/art/${portrait.id}`, (req, res) => {
      sendFile(res, 'image/jpeg', path.join(PACKAGE_ROOT, 'lib', 'assets', portrait.file))
    })
  }

  register(`${ROUTE_BASE}/config`, async (req, res) => {
    const method = String(req.method || 'GET').toUpperCase()
    if (method === 'GET') {
      sendJson(res, 200, {
        ok: true,
        version: PLUGIN_VERSION,
        config: readConfig(),
        defaults: DEFAULTS,
        portraits: PORTRAITS.map(({ id, label, hint }) => ({ id, label, hint })),
        file: CONFIG_FILE
      })
      return
    }
    if (method !== 'POST') {
      sendJson(res, 405, { ok: false, error: 'method not allowed' })
      return
    }
    try {
      const raw = await readBody(req)
      const payload = raw ? JSON.parse(raw) : {}
      if (payload && payload.action === 'reset') {
        const config = writeConfig(DEFAULTS)
        sendJson(res, 200, { ok: true, config, defaults: DEFAULTS })
        return
      }
      const patch = payload && typeof payload.patch === 'object' && payload.patch ? payload.patch : payload
      const config = writeConfig({ ...readConfig(), ...patch })
      sendJson(res, 200, { ok: true, config, defaults: DEFAULTS })
    } catch (error) {
      sendJson(res, 400, { ok: false, error: String(error && error.message || error) })
    }
  })

  const tap = webServer.tapIndex((html) => injectIndex(html))
  if (typeof tap === 'function') disposers.push(tap)

  ctx.effect(() => () => {
    for (const dispose of disposers.splice(0)) {
      try { dispose() } catch { /* noop */ }
    }
  })
}

const inject = ['webServer']
const name = PLUGIN_ID

export { apply, inject, name }

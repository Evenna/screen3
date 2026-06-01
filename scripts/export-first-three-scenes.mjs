import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import os from 'node:os'

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const baseUrl = 'http://localhost:5173'
const outputDir = '/Users/bytedance/Downloads/evans_scene_exports'
const width = 1280
const height = 720
const debugPort = 9223
const captureFps = 30

const scenes = [
  { slug: 'S01_living-room', route: '/living-room', duration: 34 },
  { slug: 'S02_park-chess', route: '/park-chess', duration: 48 },
  { slug: 'S03_home-dispatch', route: '/home-dispatch', duration: 52 },
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      let raw = ''
      response.on('data', (chunk) => { raw += chunk })
      response.on('end', () => {
        try {
          resolve(JSON.parse(raw))
        } catch (error) {
          reject(error)
        }
      })
    }).on('error', reject)
  })
}

async function waitForChrome() {
  for (let index = 0; index < 160; index += 1) {
    try {
      const tabs = await fetchJson(`http://127.0.0.1:${debugPort}/json`)
      const page = Array.isArray(tabs) ? tabs.find((tab) => tab.type === 'page' && tab.webSocketDebuggerUrl) : undefined
      if (page) return page
    } catch {
      await sleep(250)
    }
  }
  throw new Error('Chrome remote debugging port did not become ready.')
}

class CdpClient {
  constructor(url) {
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Map()
    this.socket = new WebSocket(url)
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })
    this.socket.addEventListener('message', async (event) => {
      const raw = typeof event.data === 'string'
        ? event.data
        : Buffer.from(await event.data.arrayBuffer()).toString('utf8')
      const message = JSON.parse(raw)
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) reject(new Error(message.error.message))
        else resolve(message.result)
        return
      }
      if (message.method && this.listeners.has(message.method)) {
        for (const listener of this.listeners.get(message.method)) listener(message.params)
      }
    })
  }

  send(method, params = {}) {
    const id = this.nextId
    this.nextId += 1
    this.socket.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
    })
  }

  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, [])
    this.listeners.get(method).push(listener)
  }

  close() {
    this.socket.close()
  }
}

async function navigate(client, url) {
  const loaded = new Promise((resolve) => {
    const handler = () => resolve()
    client.on('Page.loadEventFired', handler)
  })
  await Promise.race([client.send('Page.navigate', { url }), sleep(2500)])
  await Promise.race([loaded, sleep(5000)])
}

async function preparePage(client) {
  await client.send('Page.enable')
  await client.send('Runtime.enable')
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  })
}

async function injectExportCss(client) {
  await client.send('Runtime.evaluate', {
    expression: `
      (() => {
        const style = document.createElement('style');
        style.textContent = '.scene-switcher{display:none!important}.interior-page{padding:0!important}.interior-shell{border-radius:0!important;width:100vw!important;height:100vh!important}';
        document.head.appendChild(style);
      })();
    `,
  })
}

async function waitForCanvas(client, label) {
  for (let index = 0; index < 80; index += 1) {
    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `Boolean(document.querySelector('canvas'))`,
    })
    if (result.result.value) return
    await sleep(250)
  }
  throw new Error(`Canvas did not appear for ${label}`)
}

async function captureScene(client, scene) {
  const url = `${baseUrl}${scene.route}`

  console.log(`[preload] ${scene.slug} ${url}`)
  await navigate(client, url)
  await waitForCanvas(client, `${scene.slug} preload`)
  await injectExportCss(client)
  await sleep(8000)

  await navigate(client, 'about:blank')
  await sleep(500)
  console.log(`[record] ${scene.slug} ${scene.duration}s`)
  await navigate(client, url)
  await waitForCanvas(client, `${scene.slug} record`)
  await injectExportCss(client)
  await sleep(650)

  const webmFile = path.join(outputDir, `${scene.slug}.webm`)
  const outputFile = path.join(outputDir, `${scene.slug}.mp4`)
  const recordResult = await client.send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      (async () => {
        const canvas = document.querySelector('canvas');
        if (!canvas) throw new Error('No canvas found for recording');
        const stream = canvas.captureStream(${captureFps});
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
            ? 'video/webm;codecs=vp8'
            : 'video/webm';
        const chunks = [];
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 9000000 });
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size) chunks.push(event.data);
        };
        const done = new Promise((resolve) => {
          recorder.onstop = resolve;
        });
        recorder.start(250);
        await new Promise((resolve) => setTimeout(resolve, ${Math.ceil(scene.duration * 1000)}));
        recorder.stop();
        await done;
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: mimeType });
        const buffer = await blob.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const batch = 0x8000;
        for (let i = 0; i < bytes.length; i += batch) {
          binary += String.fromCharCode(...bytes.subarray(i, i + batch));
        }
        return { mimeType, base64: btoa(binary), bytes: bytes.length };
      })()
    `,
  })

  if (recordResult.exceptionDetails) {
    throw new Error(recordResult.exceptionDetails.text || 'MediaRecorder failed')
  }

  const { base64, bytes, mimeType } = recordResult.result.value
  if (!base64 || bytes < 1024) throw new Error(`${scene.slug} recorded empty video`)
  fs.writeFileSync(webmFile, Buffer.from(base64, 'base64'))
  console.log(`[encode] ${scene.slug} ${(bytes / 1024 / 1024).toFixed(2)}MB ${mimeType}`)

  const result = spawnSync('ffmpeg', [
    '-y',
    '-i', webmFile,
    '-vf', `scale=${width}:${height}`,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-movflags', '+faststart',
    outputFile,
  ], { stdio: 'inherit' })

  if (result.status !== 0) throw new Error(`ffmpeg failed for ${scene.slug}`)
  fs.rmSync(webmFile, { force: true })
  console.log(`[done] ${outputFile}`)
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true })
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evans-chrome-export-'))
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${width},${height}`,
    '--window-position=80,80',
    '--hide-scrollbars',
    '--disable-extensions',
    '--no-sandbox',
    '--disable-crash-reporter',
    '--disable-crashpad',
    '--disable-breakpad',
    '--no-first-run',
    '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] })

  chrome.stderr.on('data', (data) => {
    const text = String(data)
    if (!text.includes('DevTools listening')) process.stderr.write(text)
  })

  try {
    const tab = await waitForChrome()
    const client = new CdpClient(tab.webSocketDebuggerUrl)
    await client.open()
    await preparePage(client)
    for (const scene of scenes) {
      await captureScene(client, scene)
    }
    client.close()
  } finally {
    chrome.kill('SIGTERM')
    await sleep(500)
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
    } catch {
      // Chrome may keep profile files briefly on macOS; leftover temp files do not affect exported videos.
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

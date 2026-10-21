import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const logo = PNG.sync.read(await readFile(path.join(root, 'assets', 'cartalog-logo-white.png')))
const width = 164
const height = 314
const rgb = new Uint8Array(width * height * 3)

function pixel(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return
  const i = (y * width + x) * 3
  rgb[i] = color[0]; rgb[i + 1] = color[1]; rgb[i + 2] = color[2]
}

for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const glow = Math.max(0, 1 - Math.hypot(x - 180, y - 265) / 190)
  const ring = Math.abs(Math.hypot(x - 142, y - 254) - 105) < 18 ? 10 : 0
  pixel(x, y, [Math.round(23 + glow * 25 + ring), Math.round(23 + glow * 3 + ring), Math.round(26 + glow * 5 + ring)])
}

for (let y = 0; y < height; y++) for (let x = 0; x < 5; x++) pixel(x, y, [217, 4, 41])
for (let y = 132; y < 136; y++) for (let x = 20; x < 144; x++) pixel(x, y, [217, 4, 41])

const targetWidth = 140
const targetHeight = Math.round(targetWidth * logo.height / logo.width)
const left = 16
const top = 48
for (let y = 0; y < targetHeight; y++) for (let x = 0; x < targetWidth; x++) {
  const sx = Math.floor(x * logo.width / targetWidth)
  const sy = Math.floor(y * logo.height / targetHeight)
  const source = (sy * logo.width + sx) * 4
  const alpha = logo.data[source + 3] / 255
  const dest = ((top + y) * width + left + x) * 3
  for (let channel = 0; channel < 3; channel++) rgb[dest + channel] = Math.round(rgb[dest + channel] * (1 - alpha) + logo.data[source + channel] * alpha)
}

const stride = Math.ceil(width * 3 / 4) * 4
const output = Buffer.alloc(54 + stride * height)
output.write('BM', 0)
output.writeUInt32LE(output.length, 2)
output.writeUInt32LE(54, 10)
output.writeUInt32LE(40, 14)
output.writeInt32LE(width, 18)
output.writeInt32LE(height, 22)
output.writeUInt16LE(1, 26)
output.writeUInt16LE(24, 28)
output.writeUInt32LE(stride * height, 34)
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const src = (y * width + x) * 3
  const dest = 54 + (height - 1 - y) * stride + x * 3
  output[dest] = rgb[src + 2]
  output[dest + 1] = rgb[src + 1]
  output[dest + 2] = rgb[src]
}
await writeFile(path.join(root, 'assets', 'installer-sidebar.bmp'), output)

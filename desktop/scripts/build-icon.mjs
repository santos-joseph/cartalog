import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ico = await pngToIco(path.join(root, 'assets', 'cartalog-mark.png'))
await writeFile(path.join(root, 'assets', 'cartalog.ico'), ico)

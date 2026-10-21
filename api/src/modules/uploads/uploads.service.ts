import path from 'path'
import fs from 'fs/promises'
import { env } from '../../config/env'
import { AppError } from '../../shared/errors/app-error'

export type UploadCategory = 'vehicles' | 'logos' | 'favicons' | 'banners' | 'pages'

const ALLOWED_TYPES: Record<UploadCategory, string[]> = {
  vehicles: ['image/jpeg', 'image/png', 'image/webp'],
  logos: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  favicons: ['image/x-icon', 'image/png', 'image/webp'],
  banners: ['image/jpeg', 'image/png', 'image/webp'],
  pages: ['image/jpeg', 'image/png', 'image/webp'],
}

const MAX_SIZES: Record<UploadCategory, number> = {
  vehicles: 5 * 1024 * 1024,   // 5MB
  logos: 2 * 1024 * 1024,      // 2MB
  favicons: 512 * 1024,         // 512KB
  banners: 8 * 1024 * 1024,    // 8MB
  pages: 8 * 1024 * 1024,      // 8MB
}

export class UploadsService {
  async saveFile(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    file: any,
    category: UploadCategory,
  ): Promise<string> {
    const allowed = ALLOWED_TYPES[category]
    if (!allowed.includes(file.mimetype)) {
      throw new AppError(
        `Invalid file type. Allowed: ${allowed.join(', ')}`,
        400,
        'INVALID_FILE_TYPE',
      )
    }

    const buffer: Buffer = await file.toBuffer()

    if (buffer.byteLength > MAX_SIZES[category]) {
      const maxMB = (MAX_SIZES[category] / 1024 / 1024).toFixed(1)
      throw new AppError(`File too large. Maximum size: ${maxMB}MB`, 400, 'FILE_TOO_LARGE')
    }

    const ext = this.getExtension(file.filename, file.mimetype)
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const dir = path.resolve(env.UPLOAD_DIR, category)

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, filename), buffer)

    return `/uploads/${category}/${filename}`
  }

  async deleteFile(url: string): Promise<void> {
    // url format: /uploads/vehicles/filename.jpg
    if (!url.startsWith('/uploads/')) return
    const relativePath = url.replace('/uploads/', '')
    const uploadRoot = path.resolve(env.UPLOAD_DIR)
    const fullPath = path.resolve(uploadRoot, relativePath)
    if (!fullPath.startsWith(`${uploadRoot}${path.sep}`)) return
    await fs.unlink(fullPath).catch(() => null) // silently ignore if file not found
  }

  private getExtension(filename: string, mimetype: string): string {
    const fromFilename = filename.split('.').pop()?.toLowerCase()
    if (fromFilename && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'ico'].includes(fromFilename)) {
      return fromFilename
    }
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'image/x-icon': 'ico',
    }
    return mimeMap[mimetype] ?? 'jpg'
  }
}

export const uploadsService = new UploadsService()

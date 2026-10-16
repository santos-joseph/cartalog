'use client'
import { useState } from 'react'
import { Car, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Image { id: string; imageUrl: string; isCover: boolean }

export function VehicleGallery({ images, apiUrl, title }: { images: Image[]; apiUrl: string; title: string }) {
  const sorted = [...images].sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0))
  const [active, setActive] = useState(0)

  function prev() { setActive((i) => (i === 0 ? sorted.length - 1 : i - 1)) }
  function next() { setActive((i) => (i === sorted.length - 1 ? 0 : i + 1)) }

  if (sorted.length === 0) {
    return (
      <div className="aspect-[16/9] rounded-2xl bg-muted flex items-center justify-center">
        <Car size={64} className="text-muted-foreground/30" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-[16/9] rounded-2xl overflow-hidden relative bg-muted group">
        <img
          src={`${apiUrl}${sorted[active].imageUrl}`}
          alt={title}
          className="w-full h-full object-cover"
        />
        {sorted.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {sorted.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={cn('w-2 h-2 rounded-full transition-all', i === active ? 'bg-white scale-125' : 'bg-white/50')}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={cn(
                'flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors',
                i === active ? 'border-primary' : 'border-transparent hover:border-border',
              )}
            >
              <img src={`${apiUrl}${img.imageUrl}`} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

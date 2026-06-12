import { useState } from "react"
import { cn } from "@/lib/utils"

interface Props {
  imageUrl: string
  gallery: string[]
  title: string
}

const FALLBACK = "https://placehold.co/800x500/e5e7eb/9ca3af?text=Nema+slike"

export default function PropertyGallery({ imageUrl, gallery, title }: Props) {
  // Merge main image + gallery, deduplicate, drop empties
  const allImages = [...new Set([imageUrl, ...gallery].filter(Boolean))]
  const [activeIdx, setActiveIdx] = useState(0)

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = FALLBACK
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg bg-muted">
        <img
          key={allImages[activeIdx]}
          src={allImages[activeIdx] ?? FALLBACK}
          alt={title}
          className="h-64 w-full object-cover lg:h-105"
          onError={handleError}
        />
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "shrink-0 overflow-hidden rounded border-2 transition-colors",
                activeIdx === i
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:border-muted-foreground/40 hover:opacity-100"
              )}
            >
              <img
                src={img}
                alt={`${title} ${i + 1}`}
                className="h-16 w-24 object-cover"
                onError={handleError}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import React from "react"

import { cn } from "@/lib/utils"
import { Camera, ImageIcon, X } from "lucide-react"
import { useRef, useState } from "react"

interface CameraUploadProps {
  label: string
  onImageCapture: (imageUrl: string) => void
  imageUrl?: string
  className?: string
}

export function CameraUpload({
  label,
  onImageCapture,
  imageUrl,
  className,
}: CameraUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(imageUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
      onImageCapture(url)
    }
  }

  const handleRemove = () => {
    setPreview(undefined)
    onImageCapture("")
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
        id={`camera-${label}`}
      />

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-success bg-success/5">
          <img
            src={preview || "/placeholder.svg"}
            alt="Captured"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg touch-target"
            aria-label="Remove image"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-success/90 text-success-foreground px-4 py-2 text-center font-medium">
            Photo captured
          </div>
        </div>
      ) : (
        <label
          htmlFor={`camera-${label}`}
          className="flex flex-col items-center justify-center min-h-[140px] rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors touch-target"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-3">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <span className="text-lg font-semibold text-primary text-center px-4">
            {label}
          </span>
          <span className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            Tap to capture
          </span>
        </label>
      )}
    </div>
  )
}

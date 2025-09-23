'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface FileUploadProps {
  onCapture: (imageSrc: string) => void
  onCancel: () => void
}

export default function FileUpload({ onCapture, onCancel }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setUploading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageSrc = e.target?.result as string
      setTimeout(() => {
        onCapture(imageSrc)
        setUploading(false)
      }, 300)
    }
    reader.onerror = () => {
      alert('Failed to read the image file')
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex justify-between items-center">
            <button
              onClick={onCancel}
              className="text-white p-2 rounded-full hover:bg-white/10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-white font-medium">Upload Receipt</h2>
            <div className="w-10 h-10" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-white text-6xl mb-6">📷</div>
            <h3 className="text-white text-2xl font-bold mb-4">Upload Receipt Photo</h3>
            <p className="text-white/80 mb-8 max-w-md">
              Select a photo of your receipt from your camera roll or take a new photo
            </p>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={triggerFileSelect}
                disabled={uploading}
                className={`w-full px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors
                  ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? 'Processing...' : 'Choose Photo'}
              </motion.button>

              <div className="text-white/60 text-sm">
                <p>Supports: JPG, PNG, HEIC</p>
                <p>Make sure the receipt is clearly visible</p>
              </div>
            </div>

            {uploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6"
              >
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-white/80 mt-2">Processing image...</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment" // This will prompt camera on mobile
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}
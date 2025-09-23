'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import CameraCapture from '@/components/camera/CameraCapture'
import FileUpload from '@/components/camera/FileUpload'
import Link from 'next/link'

export default function ScanReceipt() {
  const params = useParams()
  const groupId = params.id as string

  const [showCamera, setShowCamera] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [isMobileSafari, setIsMobileSafari] = useState(false)

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    // Detect mobile Safari
    const userAgent = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
    setIsMobileSafari(isIOS && isSafari)

    // Check if camera API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (isIOS && isSafari) {
        // Don't set error for mobile Safari, offer file upload instead
        console.log('Mobile Safari detected, camera may require HTTPS')
      } else {
        setError('Camera is not supported in this browser')
      }
    }
  }, [])

  const handleCapture = async (imageSrc: string) => {
    setCapturedImage(imageSrc)
    setShowCamera(false)
    setShowFileUpload(false)
    setProcessing(true)

    try {
      // Here we would:
      // 1. Upload image to Supabase storage
      // 2. Send to OpenAI for processing
      // 3. Extract receipt items
      // For now, simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Redirect to item assignment page
      window.location.href = `/groups/${groupId}/receipts/new?image=${encodeURIComponent(imageSrc)}`
    } catch (error) {
      setError('Failed to process receipt. Please try again.')
      setProcessing(false)
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setShowCamera(true)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Access Required</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href={`/groups/${groupId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Group
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {!showCamera && (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link href={`/groups/${groupId}`} className="text-xl font-bold text-gray-900">
                  ← Back to Group
                </Link>
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              {processing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16"
                >
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Receipt</h3>
                  <p className="text-gray-600">
                    Using AI to extract items from your receipt...
                  </p>
                </motion.div>
              ) : capturedImage ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-lg shadow-sm border p-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Receipt Preview</h2>

                  <div className="mb-6">
                    <img
                      src={capturedImage}
                      alt="Captured receipt"
                      className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleRetake}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Retake Photo
                    </button>
                    <button
                      onClick={() => handleCapture(capturedImage)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Process Receipt
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-16"
                >
                  <div className="text-blue-600 text-6xl mb-6">📱</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Scan Your Receipt</h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Take a clear photo of your receipt. Our AI will extract all the items automatically.
                  </p>

                  <div className="space-y-4 mb-8 text-left max-w-md mx-auto">
                    <div className="flex items-start space-x-3">
                      <div className="text-green-500 text-xl">✓</div>
                      <div>
                        <h4 className="font-medium text-gray-900">Good lighting</h4>
                        <p className="text-sm text-gray-600">Make sure the receipt is well lit</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="text-green-500 text-xl">✓</div>
                      <div>
                        <h4 className="font-medium text-gray-900">Flat surface</h4>
                        <p className="text-sm text-gray-600">Place receipt on a flat surface</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="text-green-500 text-xl">✓</div>
                      <div>
                        <h4 className="font-medium text-gray-900">Full receipt</h4>
                        <p className="text-sm text-gray-600">Capture the entire receipt in frame</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCamera(true)}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      📷 Open Camera
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowFileUpload(true)}
                      className={`px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors
                        ${isMobileSafari ? 'bg-blue-50 border-blue-700' : ''}`}
                    >
                      📱 Upload from Photos
                    </motion.button>

                    {isMobileSafari && (
                      <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                        💡 On Safari iPhone: "Upload from Photos" is recommended for best results
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      )}

      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CameraCapture
              onCapture={handleCapture}
              onCancel={() => setShowCamera(false)}
            />
          </motion.div>
        )}
        {showFileUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FileUpload
              onCapture={handleCapture}
              onCancel={() => setShowFileUpload(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
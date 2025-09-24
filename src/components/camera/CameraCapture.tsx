'use client'

import { useRef, useCallback, useState } from 'react'
import Webcam from 'react-webcam'
import { motion } from 'framer-motion'

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void
  onCancel: () => void
}

// interface CameraError {
//   name: string
//   message: string
// }

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null)
  const [capturing, setCapturing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setCapturing(true)
      setTimeout(() => {
        onCapture(imageSrc)
        setCapturing(false)
      }, 300)
    }
  }, [webcamRef, onCapture])

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: { ideal: 'environment' } // Use back camera on mobile
  }

  const handleUserMediaError = (error: string | DOMException) => {
    console.error('Camera error:', error)
    if (typeof error === 'string') {
      setCameraError(error)
    } else if (error.name === 'NotAllowedError') {
      setCameraError('Camera access was denied. Please allow camera access and try again.')
    } else if (error.name === 'NotFoundError') {
      setCameraError('No camera found. Please make sure your device has a camera.')
    } else if (error.message?.includes('getUserMedia is not implemented')) {
      setCameraError('Camera access requires HTTPS. Please use the file upload option instead.')
    } else {
      setCameraError('Camera access failed. This may be due to browser restrictions or HTTPS requirements.')
    }
  }

  if (cameraError) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Access Required</h3>
          <p className="text-gray-600 mb-6">{cameraError}</p>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCameraError(null)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative h-full flex flex-col">
        {/* Camera Header */}
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
            <h2 className="text-white font-medium">Scan Receipt</h2>
            <div className="w-10 h-10" />
          </div>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
            mirrored={false}
            onUserMediaError={handleUserMediaError}
          />

          {/* Receipt Frame Overlay */}
          <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-60 pointer-events-none">
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white"></div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-20 left-0 right-0 text-center px-4">
            <p className="text-white text-sm bg-black/50 rounded-full py-2 px-4 mx-auto inline-block">
              Position receipt within the frame and tap capture
            </p>
          </div>
        </div>

        {/* Camera Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={capture}
              disabled={capturing}
              className={`w-16 h-16 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm
                ${capturing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/30'}
                flex items-center justify-center`}
            >
              {capturing ? (
                <div className="w-6 h-6 bg-white rounded animate-pulse" />
              ) : (
                <div className="w-8 h-8 bg-white rounded-full" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {capturing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white z-20"
        />
      )}
    </div>
  )
}
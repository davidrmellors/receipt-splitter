'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import CameraCapture from '@/components/camera/CameraCapture'
import FileUpload from '@/components/camera/FileUpload'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Camera, Upload, CheckCircle, Loader2, AlertTriangle, Lightbulb } from 'lucide-react'

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="mb-2">Camera Access Required</CardTitle>
            <CardDescription className="mb-6">{error}</CardDescription>
            <Button asChild>
              <Link href={`/groups/${groupId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Group
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {!showCamera && (
        <div className="min-h-screen bg-background">
          <header className="border-b bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center h-16">
                <Button variant="ghost" asChild className="text-xl font-bold p-0">
                  <Link href={`/groups/${groupId}`}>
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Group
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <AnimatePresence mode="wait">
              {processing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <CardContent className="text-center py-16">
                      <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
                      <CardTitle className="mb-2">Processing Receipt</CardTitle>
                      <CardDescription>
                        Using AI to extract items from your receipt...
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : capturedImage ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Receipt Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <img
                          src={capturedImage}
                          alt="Captured receipt"
                          className="w-full max-w-md mx-auto rounded-lg shadow-sm border"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          variant="outline"
                          onClick={handleRetake}
                          className="flex-1"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Retake Photo
                        </Button>
                        <Button
                          onClick={() => handleCapture(capturedImage)}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Process Receipt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <CardContent className="text-center py-12 sm:py-16">
                      <Camera className="h-16 w-16 text-primary mx-auto mb-6" />
                      <CardTitle className="text-2xl mb-4">Scan Your Receipt</CardTitle>
                      <CardDescription className="mb-8 max-w-md mx-auto">
                        Take a clear photo of your receipt. Our AI will extract all the items automatically.
                      </CardDescription>

                      <div className="space-y-4 mb-8 text-left max-w-md mx-auto">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Good lighting</h4>
                            <p className="text-sm text-muted-foreground">Make sure the receipt is well lit</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Flat surface</h4>
                            <p className="text-sm text-muted-foreground">Place receipt on a flat surface</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Full receipt</h4>
                            <p className="text-sm text-muted-foreground">Capture the entire receipt in frame</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 max-w-sm mx-auto">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={() => setShowCamera(true)}
                            size="lg"
                            className="w-full"
                          >
                            <Camera className="w-5 h-5 mr-2" />
                            Open Camera
                          </Button>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant={isMobileSafari ? "default" : "outline"}
                            onClick={() => setShowFileUpload(true)}
                            size="lg"
                            className="w-full"
                          >
                            <Upload className="w-5 h-5 mr-2" />
                            Upload from Photos
                          </Button>
                        </motion.div>

                        {isMobileSafari && (
                          <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertDescription>
                              On Safari iPhone: &ldquo;Upload from Photos&rdquo; is recommended for best results
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
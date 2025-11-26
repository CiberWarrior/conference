'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Html5Qrcode } from 'html5-qrcode'

interface CheckInResult {
  success: boolean
  message: string
  registration?: {
    id: string
    name: string
    email: string
    checkedIn: boolean
    checkedInAt?: string
  }
}

export default function CheckInPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [manualId, setManualId] = useState('')
  const [processing, setProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const router = useRouter()

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear()
          })
          .catch(() => {})
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code detected
          handleQRCodeScan(decodedText)
        },
        (errorMessage) => {
          // Ignore scan errors (they happen frequently while scanning)
        }
      )

      setScanning(true)
      setResult(null)
    } catch (error) {
      alert('Failed to access camera. Please allow camera permissions.')
      console.error('Camera error:', error)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
      } catch (error) {
        console.error('Error stopping scanner:', error)
      }
    }
    setScanning(false)
  }

  const handleQRCodeScan = async (registrationId: string) => {
    if (processing) return

    try {
      setProcessing(true)
      const response = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          registration: data.registration,
        })
        stopScanning()
        // Clear result after 3 seconds
        setTimeout(() => {
          setResult(null)
          if (!scanning) startScanning()
        }, 3000)
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to check in',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error. Please try again.',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleManualCheckIn = async () => {
    if (!manualId.trim()) {
      alert('Please enter a registration ID')
      return
    }

    await handleQRCodeScan(manualId.trim())
  }


  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Check-In System</h1>
          <p className="mt-2 text-gray-600">Scan QR code or enter registration ID manually</p>
        </div>

        {/* Success/Error Message */}
        {result && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              result.success
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-start">
              {result.success ? (
                <svg className="w-6 h-6 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className="flex-1">
                <p className="font-semibold">{result.message}</p>
                {result.registration && (
                  <div className="mt-2 text-sm">
                    <p>
                      <strong>Name:</strong> {result.registration.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {result.registration.email}
                    </p>
                    {result.registration.checkedInAt && (
                      <p>
                        <strong>Checked in at:</strong>{' '}
                        {new Date(result.registration.checkedInAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Camera View */}
        {scanning ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div id="qr-reader" className="mb-4"></div>
            <div className="flex gap-3">
              <button
                onClick={stopScanning}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Stop Scanning
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              Point camera at QR code. For manual entry, stop scanning and use the form below.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <button
              onClick={startScanning}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-3 text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Start QR Code Scanner
            </button>
          </div>
        )}

        {/* Manual Entry */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Check-In</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration ID
              </label>
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Enter registration ID or scan QR code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualCheckIn()
                  }
                }}
              />
            </div>
            <button
              onClick={handleManualCheckIn}
              disabled={processing || !manualId.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Check In
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>Click &quot;Start QR Code Scanner&quot; to use camera</li>
            <li>Point camera at participant&apos;s QR code</li>
            <li>Or enter registration ID manually in the form below</li>
            <li>Check-in status will be updated automatically</li>
          </ol>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users, CheckCircle, ArrowRight, UserPlus } from 'lucide-react'
import type { Conference } from '@/types/conference'
import type { RegistrationFeeOption } from '@/types/custom-registration-fee'
import { DEFAULT_PAYMENT_SETTINGS } from '@/constants/defaultPaymentSettings'

// New enhanced components
import ProgressSteps from '@/components/ProgressSteps'
import SocialProof from '@/components/SocialProof'
import RegistrationSummary from '@/components/RegistrationSummary'
import ParticipantAuthModal from '@/components/ParticipantAuthModal'
import PaymentOptions from '@/components/PaymentOptions'
import RegistrationForm from '@/components/RegistrationForm'

export default function EnhancedRegisterPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasBankAccount, setHasBankAccount] = useState(false)
  const [registrationFees, setRegistrationFees] = useState<{
    fees: RegistrationFeeOption[]
    currency: string
  } | null>(null)

  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState(1)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [userAccount, setUserAccount] = useState<{
    email: string
    hasAccount: boolean
  } | null>(null)
  const [registrationCompleted, setRegistrationCompleted] = useState(false)
  
  // Registration data state (collected in Step 1)
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  
  // Payment processing state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const wizardSteps = [
    { id: 1, title: 'Register', description: 'Fill your details' },
    { id: 2, title: 'Account', description: 'Optional' },
    { id: 3, title: 'Review', description: 'Check details' },
    { id: 4, title: 'Payment', description: 'Complete order' },
  ]

  useEffect(() => {
    if (!slug) return

    const loadConference = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/conferences/${slug}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Conference not found')
          return
        }

        const conf = data.conference
        setConference(conf)

        // Check if registration is enabled
        const settings = conf.settings || {}
        if (settings.registration_enabled === false) {
          setError('Registration is not available for this conference')
          return
        }

        // Set bank account status from API response
        setHasBankAccount(data.organizer_has_bank_account || false)
      } catch (err) {
        setError('Failed to load conference')
        console.error('Error loading conference:', err)
      } finally {
        setLoading(false)
      }
    }

    loadConference()
  }, [slug])

  useEffect(() => {
    if (!slug) return
    const loadFees = async () => {
      try {
        const res = await fetch(`/api/conferences/${slug}/registration-fees`)
        const data = await res.json()
        if (res.ok && data.fees && Array.isArray(data.fees) && data.fees.length > 0) {
          setRegistrationFees({
            fees: data.fees as RegistrationFeeOption[],
            currency: data.currency ?? 'EUR',
          })
        } else {
          setRegistrationFees(null)
        }
      } catch {
        setRegistrationFees(null)
      }
    }
    loadFees()
  }, [slug])

  const handleRegistrationSuccess = () => {
    setRegistrationCompleted(true)
    setCurrentStep(2)
  }

  const handleAccountCreated = (userData: { email: string; hasAccount: boolean }) => {
    setUserAccount(userData)
    setShowAuthModal(false)
    setCurrentStep(3)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading registration form...</p>
        </div>
      </main>
    )
  }

  if (error || !conference) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Conference Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            Please check the URL or contact the organizer
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/conferences/${conference.slug}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Conference
          </Link>

          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
            <div className="flex items-center gap-6">
              {conference.logo_url && (
                <Image
                  src={conference.logo_url}
                  alt={conference.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-contain rounded-lg"
                  unoptimized
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {conference.name}
                </h1>
                <p className="text-gray-600">Conference Registration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <ProgressSteps steps={wizardSteps} currentStep={currentStep} />
        </div>

        {/* Participant Auth Modal */}
        <ParticipantAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAccountCreated}
          initialEmail={userAccount?.email || ''}
        />

        {/* STEP 1: Registration Form */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Registration Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <RegistrationForm
                  conferenceId={conference.id}
                  conferenceSlug={conference.slug}
                  customFields={conference.settings?.custom_registration_fields || []}
                  participantSettings={conference.settings?.participant_settings}
                  registrationInfoText={conference.settings?.registration_info_text}
                  hotelOptions={conference.settings?.hotel_options || []}
                  currency={registrationFees?.currency ?? 'EUR'}
                  conferenceStartDate={conference.start_date}
                  conferenceEndDate={conference.end_date}
                  abstractSubmissionEnabled={conference.settings?.abstract_submission_enabled}
                  paymentSettings={conference.settings?.payment_settings || DEFAULT_PAYMENT_SETTINGS}
                  hasBankAccount={hasBankAccount}
                  registrationFees={registrationFees?.fees ?? null}
                />
              </div>
            </div>

            {/* Right: Social Proof */}
            <div className="space-y-6">
              <SocialProof
                conferenceStats={{
                  totalRegistrations: 150,
                  rating: 4.9,
                  recentRegistrations: 12,
                }}
                showTestimonial={true}
              />
            </div>
          </div>
        )}

        {/* STEP 2: Create Account (Optional) */}
        {currentStep === 2 && !registrationCompleted && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Create Your Account (Optional)
                </h2>
                <p className="text-gray-600">
                  Track your registrations, manage your profile, and access exclusive benefits
                </p>
              </div>

              {/* Benefits of Creating Account */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  {
                    icon: '📊',
                    title: 'Track Registrations',
                    desc: 'View all your event registrations in one place',
                  },
                  {
                    icon: '🎫',
                    title: 'Digital Certificates',
                    desc: 'Download certificates from past events',
                  },
                  {
                    icon: '⚡',
                    title: 'Quick Checkout',
                    desc: 'Save details for faster future registrations',
                  },
                  {
                    icon: '🔔',
                    title: 'Event Updates',
                    desc: 'Get notified about upcoming conferences',
                  },
                ].map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                  >
                    <span className="text-2xl">{benefit.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{benefit.title}</p>
                      <p className="text-xs text-gray-600">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-4">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Create Account & Continue
                </button>

                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  Skip & Continue as Guest
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-600">
                  You can always create an account later from your dashboard
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Summary */}
        {currentStep === 3 && (
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Registration Summary */}
              <div className="lg:col-span-2">
                <RegistrationSummary
                  conferenceName={conference.name}
                  conferenceLocation={conference.location}
                  conferenceStartDate={conference.start_date}
                  conferenceEndDate={conference.end_date}
                  selectedFeeLabel="Early Bird"
                  selectedFeeAmount={400}
                  currency={conference.pricing?.currency || 'EUR'}
                  participantsCount={1}
                  userEmail={userAccount?.email}
                  vatPercentage={conference.pricing?.vat_percentage}
                  pricesIncludeVAT={conference.pricing?.prices_include_vat}
                />
              </div>

              {/* Right: Actions */}
              <div className="space-y-6">
                <SocialProof
                  conferenceStats={{
                    totalRegistrations: 150,
                    rating: 4.9,
                    recentRegistrations: 12,
                  }}
                  showTestimonial={false}
                />

                <div className="space-y-4">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    Continue to Payment
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setCurrentStep(2)}
                    className="w-full text-gray-600 hover:text-gray-900 font-semibold py-3 flex items-center justify-center gap-2"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Payment */}
        {currentStep === 4 && (
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Summary (što plaća) */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                  <PaymentOptions
                    amount={400}
                    currency={conference.pricing?.currency || 'EUR'}
                    registrationId={registrationId || undefined}
                    onPaymentMethodSelected={async (method) => {
                      setIsProcessingPayment(true)
                      
                      try {
                        if (method === 'card') {
                          // TODO: Stripe integration
                          // For now, just simulate success
                          await new Promise(resolve => setTimeout(resolve, 2000))
                          alert('Stripe payment would happen here. Redirecting to Stripe Checkout...')
                          setCurrentStep(5)
                        } else {
                          // Bank transfer - just show success
                          await new Promise(resolve => setTimeout(resolve, 1000))
                          setCurrentStep(5)
                        }
                      } catch (error) {
                        alert('Payment failed. Please try again.')
                      } finally {
                        setIsProcessingPayment(false)
                      }
                    }}
                    allowCard={true}
                    allowBank={hasBankAccount}
                    isProcessing={isProcessingPayment}
                  />
                </div>
              </div>

              {/* Right: Mini Summary */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                  <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conference</span>
                      <span className="font-semibold text-gray-900">{conference.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registration Fee</span>
                      <span className="font-semibold text-gray-900">400 {conference.pricing?.currency || 'EUR'}</span>
                    </div>
                    <div className="pt-3 border-t-2 border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-blue-600">400 {conference.pricing?.currency || 'EUR'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={isProcessingPayment}
                  className="w-full text-gray-600 hover:text-gray-900 font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  ← Back to Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Success */}
        {currentStep === 5 && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-12 rounded-2xl shadow-xl border-2 border-green-200">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Registration Successful!
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  Thank you for registering. You will receive a confirmation email shortly.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-green-200 mb-6">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    Check your email for confirmation
                  </span>
                </div>

                {userAccount && userAccount.hasAccount && (
                  <div>
                    <Link
                      href="/participant/dashboard"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Go to Dashboard →
                    </Link>
                  </div>
                )}

                {!userAccount?.hasAccount && (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="w-5 h-5" />
                    Create Account Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

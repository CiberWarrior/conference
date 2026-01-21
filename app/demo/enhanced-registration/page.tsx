'use client'

import { useState } from 'react'
import ProgressSteps from '@/components/ProgressSteps'
import SocialProof from '@/components/SocialProof'
import RegistrationSummary from '@/components/RegistrationSummary'
import ParticipantAuthModal from '@/components/ParticipantAuthModal'
import { UserPlus, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

export default function EnhancedRegistrationDemo() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [userAccount, setUserAccount] = useState<{
    email: string
    hasAccount: boolean
  } | null>(null)

  const wizardSteps = [
    { id: 1, title: 'Details', description: 'Registration info' },
    { id: 2, title: 'Account', description: 'Optional' },
    { id: 3, title: 'Review', description: 'Confirm & submit' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enhanced Registration Flow - Demo
          </h1>
          <p className="text-gray-600 text-lg">
            Pogledaj kako funkcioniraju sve nove komponente
          </p>
        </div>

        {/* Progress Steps Demo */}
        <div className="mb-12 bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Progress Steps</h2>
          <ProgressSteps steps={wizardSteps} currentStep={currentStep} />
          
          <div className="mt-6 flex gap-4 justify-center">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
              disabled={currentStep === 3}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Social Proof Demo */}
        <div className="mb-12 bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Social Proof</h2>
          <SocialProof
            conferenceStats={{
              totalRegistrations: 150,
              rating: 4.9,
              recentRegistrations: 12,
            }}
            showTestimonial={true}
          />
        </div>

        {/* Registration Summary Demo */}
        <div className="mb-12 bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            3. Registration Summary
          </h2>
          <RegistrationSummary
            conferenceName="International AI & Data Science Conference 2026"
            conferenceLocation="Zagreb, Croatia"
            conferenceStartDate="2026-06-15"
            conferenceEndDate="2026-06-17"
            selectedFeeLabel="Early Bird"
            selectedFeeAmount={400}
            currency="EUR"
            participantsCount={2}
            accommodation={{
              hotelName: 'Hotel Sheraton - Double Room',
              nights: 3,
              arrivalDate: '2026-06-14',
              departureDate: '2026-06-17',
            }}
            userEmail="john.doe@example.com"
            vatPercentage={25}
            pricesIncludeVAT={false}
          />
        </div>

        {/* Participant Auth Modal Demo */}
        <div className="mb-12 bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            4. Participant Auth Modal (Dual View)
          </h2>
          <p className="text-gray-600 mb-6">
            Modal sa toggle-om između "Create Account" i "Login"
          </p>
          
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Open Auth Modal
          </button>

          <ParticipantAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={(userData) => {
              setUserAccount(userData)
              setShowAuthModal(false)
              alert(`Success! Email: ${userData.email}, Has Account: ${userData.hasAccount}`)
            }}
            initialEmail=""
          />

          {userAccount && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-900">Account Info:</p>
              <p className="text-sm text-gray-700">Email: {userAccount.email}</p>
              <p className="text-sm text-gray-700">
                Has Account: {userAccount.hasAccount ? 'Yes' : 'No (Guest)'}
              </p>
            </div>
          )}
        </div>

        {/* Complete Flow Demo */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg border-2 border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🎯 Complete Enhanced Flow
          </h2>
          <p className="text-gray-700 mb-6">
            Da vidiš sve skupa u akciji, posjeti:{' '}
            <a
              href="/conferences/demo/register-v2"
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              /conferences/[slug]/register-v2
            </a>
          </p>
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <h3 className="font-bold text-gray-900 mb-3">What's Included:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Multi-step wizard (Registration → Account → Success)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Progress indicator sa visual feedback
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Social proof (ratings, testimonials, recent registrations)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Dual view auth modal (Signup / Login toggle)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Registration summary sa clear pricing breakdown
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Optional account creation (skip = continue as guest)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

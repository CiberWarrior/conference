'use client'

import { useTranslations } from 'next-intl'
import { Star, Users, CheckCircle, TrendingUp } from 'lucide-react'

interface SocialProofProps {
  conferenceStats?: {
    totalRegistrations?: number
    rating?: number
    recentRegistrations?: number
  }
  showTestimonial?: boolean
}

export default function SocialProof({
  conferenceStats = {},
  showTestimonial = true,
}: SocialProofProps) {
  const t = useTranslations('registrationForm')
  const {
    totalRegistrations = 0,
    rating = 4.9,
    recentRegistrations = 0,
  } = conferenceStats

  // Generate mock avatars for "recent participants"
  const avatarColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
  ]

  return (
    <div className="space-y-4">
      {/* Rating & Total Registrations */}
      <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.floor(rating)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="font-bold text-gray-900">
            {rating} <span className="text-gray-600 font-normal text-sm">(excellent)</span>
          </span>
        </div>

        {totalRegistrations > 0 && (
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-semibold">{totalRegistrations}+</span>
            <span className="text-sm">{t('registeredParticipants')}</span>
          </div>
        )}
      </div>

      {/* Recent Participants (Visual Social Proof) */}
      {(recentRegistrations > 0 || totalRegistrations > 0) && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {avatarColors.slice(0, 5).map((color, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full border-2 border-white ${color} flex items-center justify-center text-white font-bold text-sm`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {totalRegistrations > 5 && (
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-700 flex items-center justify-center text-white font-bold text-xs">
                  +{totalRegistrations - 5}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                {recentRegistrations > 0
                  ? t('peopleRegisteredRecently', { count: recentRegistrations })
                  : t('joinOtherParticipants')}
              </p>
              <p className="text-xs text-gray-600">Secure your spot today!</p>
            </div>
          </div>
        </div>
      )}

      {/* Benefits / What's Included */}
      <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
        <h4 className="font-bold text-gray-900 mb-3 text-sm">✨ What's Included:</h4>
        <div className="space-y-2">
          {[
            'Conference attendance & materials',
            'Access to all sessions & workshops',
            'Networking opportunities',
            'Digital certificate upon completion',
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Testimonial */}
      {showTestimonial && (
        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              JD
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-3 h-3 text-yellow-500 fill-yellow-500"
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700 italic mb-2">
                "Amazing conference! Well organized, great speakers, and excellent networking
                opportunities. Highly recommend!"
              </p>
              <p className="text-xs text-gray-600 font-semibold">
                - John Doe, {t('previousParticipant')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

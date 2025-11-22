'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PaymentSection from './PaymentSection'
import SuccessMessage from './SuccessMessage'
import type { RegistrationFormData } from '@/types/registration'

const registrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number must be at least 5 characters'),
  paymentRequired: z.boolean(),
})

export default function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<{
    message: string
    paymentUrl?: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      paymentRequired: false,
    },
  })

  const paymentRequired = watch('paymentRequired')

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      setSubmitSuccess({
        message: result.message || 'Registration successful!',
        paymentUrl: result.paymentUrl,
      })

      // Reset form
      if (typeof window !== 'undefined') {
        const form = document.querySelector('form')
        form?.reset()
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'An error occurred'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <SuccessMessage
        message={submitSuccess.message}
        paymentUrl={submitSuccess.paymentUrl}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Conference Registration
        </h1>

        <PaymentSection
          enabled={paymentRequired}
          onToggle={(enabled) => setValue('paymentRequired', enabled)}
        />

        <div className="space-y-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              First Name *
            </label>
            <input
              {...register('firstName')}
              type="text"
              id="firstName"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Name *
            </label>
            <input
              {...register('lastName')}
              type="text"
              id="lastName"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.lastName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email *
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone *
            </label>
            <input
              {...register('phone')}
              type="tel"
              id="phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Register'}
        </button>
      </div>
    </form>
  )
}


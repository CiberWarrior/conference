'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Building2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ParticipantSignupPage() {
  const t = useTranslations('auth.participantSignup')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    country: '',
    institution: '',
    marketing_consent: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError(t('errorPasswordsMismatch'))
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/participant/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || undefined,
          country: formData.country || undefined,
          institution: formData.institution || undefined,
          marketing_consent: formData.marketing_consent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('errorSignupFailed'))
      }

      setSuccess(data.message)
      setTimeout(() => {
        router.push('/participant/auth/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || t('errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const inputClassName =
    'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50 via-slate-50 to-transparent" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute -right-16 bottom-16 h-80 w-80 rounded-full bg-sky-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[1fr_1.15fr]">
          <aside className="relative hidden flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 text-white lg:flex">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold tracking-tight">MeetFlow</span>
              </Link>
              <h2 className="mt-10 text-3xl font-semibold leading-tight tracking-tight">
                {t('panelTitle')}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300">
                {t('panelSubtitle')}
              </p>
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-300" />
                <span>{t('panelPoint1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-300" />
                <span>{t('panelPoint2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-300" />
                <span>{t('panelPoint3')}</span>
              </li>
            </ul>
          </aside>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-6 lg:hidden">
              <Link href="/" className="mb-4 inline-flex items-center gap-2 text-slate-900">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold">MeetFlow</span>
              </Link>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {t('title')}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600">{t('subtitle')}</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                <p className="text-sm text-emerald-800">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t('firstName')}
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    required
                    autoComplete="given-name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={inputClassName}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t('lastName')}
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    required
                    autoComplete="family-name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className={inputClassName}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  {t('email')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClassName}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`${inputClassName} pr-11`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700"
                      aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t('confirmPassword')}
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`${inputClassName} pr-11`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700"
                      aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t('phone')}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClassName}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-slate-700">
                    {t('country')}
                  </label>
                  <input
                    id="country"
                    type="text"
                    autoComplete="country-name"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className={inputClassName}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="institution" className="mb-1.5 block text-sm font-medium text-slate-700">
                  {t('institution')}
                </label>
                <input
                  id="institution"
                  type="text"
                  autoComplete="organization"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className={inputClassName}
                  disabled={loading}
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-3">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={formData.marketing_consent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      marketing_consent: e.target.checked,
                    })
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <label htmlFor="marketing" className="text-sm text-slate-700">
                  {t('marketingConsent')}
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? t('creatingAccount') : t('createAccount')}
              </button>
            </form>

            <div className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-600">
                {t('alreadyHaveAccount')}{' '}
                <Link
                  href="/auth/admin-login"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  {t('login')}
                </Link>
              </p>
              <Link href="/" className="inline-block text-sm text-slate-500 hover:text-slate-700">
                {t('backToHome')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

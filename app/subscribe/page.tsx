'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Footer from '@/components/Footer'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle,
  CreditCard,
  Landmark,
  Loader2,
} from 'lucide-react'

interface PublicPlan {
  id: string
  name: string
  slug: string
  description: string | null
  price_monthly: number
  price_yearly: number
  currency: string
  features: string[]
}

interface BankInstructions {
  recipient: string | null
  iban: string | null
  bankName: string | null
  swift: string | null
  address: string | null
  amount: number
  currency: string
  reference: string
  note: string | null
}

function SubscribeContent() {
  const t = useTranslations('subscribe')
  const searchParams = useSearchParams()
  const planSlug = searchParams.get('plan') || ''
  const cycleParam = searchParams.get('cycle') === 'yearly' ? 'yearly' : 'monthly'
  const canceled = searchParams.get('canceled') === '1'

  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [bankTransferAvailable, setBankTransferAvailable] = useState(false)
  const [cardAvailable, setCardAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(cycleParam)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bankInstructions, setBankInstructions] = useState<BankInstructions | null>(null)
  const [selectedPlanName, setSelectedPlanName] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    organization: '',
    phone: '',
  })

  useEffect(() => {
    let cancelled = false
    fetch('/api/plans')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setPlans(data.plans || [])
        setBankTransferAvailable(!!data.bankTransferAvailable)
        setCardAvailable(!!data.cardAvailable)
        if (data.cardAvailable) setPaymentMethod('card')
        else if (data.bankTransferAvailable) setPaymentMethod('bank_transfer')
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const plan = plans.find((p) => p.slug === planSlug) || null
  const price = plan
    ? billingCycle === 'monthly'
      ? Number(plan.price_monthly)
      : Number(plan.price_yearly)
    : 0

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 2,
    }).format(amount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan || !paymentMethod) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: plan.slug,
          billingCycle,
          paymentMethod,
          fullName: form.fullName,
          email: form.email,
          organization: form.organization || null,
          phone: form.phone || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || t('errorGeneric'))
      }

      if (data.paymentMethod === 'card' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      if (data.paymentMethod === 'bank_transfer' && data.bankInstructions) {
        setSelectedPlanName(data.plan?.name || plan.name)
        setBankInstructions(data.bankInstructions)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (bankInstructions) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('bankSuccessTitle')}</h1>
              <p className="text-sm text-gray-500">
                {t('bankSuccessSubtitle', { plan: selectedPlanName })}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-3 text-sm">
            {bankInstructions.recipient && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">{t('bankRecipient')}</span>
                <span className="font-medium text-gray-900 text-right">
                  {bankInstructions.recipient}
                </span>
              </div>
            )}
            {bankInstructions.iban && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">{t('bankIban')}</span>
                <span className="font-mono font-medium text-gray-900 text-right">
                  {bankInstructions.iban}
                </span>
              </div>
            )}
            {bankInstructions.bankName && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">{t('bankName')}</span>
                <span className="font-medium text-gray-900 text-right">
                  {bankInstructions.bankName}
                </span>
              </div>
            )}
            {bankInstructions.swift && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">{t('bankSwift')}</span>
                <span className="font-mono font-medium text-gray-900 text-right">
                  {bankInstructions.swift}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">{t('bankAmount')}</span>
              <span className="font-bold text-gray-900 text-right">
                {formatPrice(bankInstructions.amount, bankInstructions.currency)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">{t('bankReference')}</span>
              <span className="font-mono font-bold text-indigo-700 text-right">
                {bankInstructions.reference}
              </span>
            </div>
            {bankInstructions.note && (
              <p className="pt-2 text-gray-600 border-t border-slate-200">
                {bankInstructions.note}
              </p>
            )}
          </div>

          <p className="mt-6 text-sm text-gray-600">{t('bankNextSteps')}</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50"
            >
              {t('backHome')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!planSlug || !plan) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('noPlanTitle')}</h1>
        <p className="text-gray-600 mb-6">{t('noPlanSubtitle')}</p>
        <Link
          href="/#pricing"
          className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700"
        >
          {t('viewPlans')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto grid lg:grid-cols-5 gap-8">
      {/* Selected plan summary */}
      <aside className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6 sticky top-24">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-2">
            {t('selectedPlan')}
          </p>
          <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
          {plan.description && (
            <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
          )}
          <div className="mt-6">
            <span className="text-3xl font-black text-gray-900">
              {formatPrice(price, plan.currency)}
            </span>
            <span className="text-gray-500 text-sm">
              {billingCycle === 'monthly' ? t('perMonth') : t('perYear')}
            </span>
          </div>
          {Array.isArray(plan.features) && plan.features.length > 0 && (
            <ul className="mt-6 space-y-2">
              {plan.features.slice(0, 6).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/#pricing"
            className="mt-6 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('changePlan')}
          </Link>
        </div>
      </aside>

      {/* Checkout form */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('title')}</h1>
          <p className="text-sm text-gray-500 mb-6">{t('subtitle')}</p>

          {canceled && (
            <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              {t('canceledNotice')}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('fullName')}
                </label>
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('email')}
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('organization')}
                </label>
                <input
                  type="text"
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            {/* Billing cycle */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">{t('billingCycle')}</p>
              <div className="inline-flex bg-gray-100 rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  {t('monthly')}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  {t('yearly')}
                </button>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">{t('paymentMethod')}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {cardAvailable && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold text-gray-900 text-sm">{t('payCard')}</span>
                  </button>
                )}
                {bankTransferAvailable && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Landmark className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold text-gray-900 text-sm">{t('payBank')}</span>
                  </button>
                )}
              </div>
              {!cardAvailable && !bankTransferAvailable && (
                <p className="mt-2 text-sm text-amber-700">{t('noPaymentMethods')}</p>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !paymentMethod}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {paymentMethod === 'card' ? t('payNowCard') : t('continueBank')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SubscribePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          }
        >
          <SubscribeContent />
        </Suspense>
      </div>
      <Footer />
    </main>
  )
}

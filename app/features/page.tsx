'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Footer from '@/components/Footer'
import {
  Users,
  FileText,
  BarChart3,
  Monitor,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'

function sectionKeys(
  t: (key: string) => string,
  base: string,
  sectionIds: string[]
): { title: string; description: string; features: string[] }[] {
  return sectionIds.map((sid) => ({
    title: t(`${base}.${sid}.title`),
    description: t(`${base}.${sid}.description`),
    features: [0, 1, 2, 3, 4, 5].map((i) => t(`${base}.${sid}.f${i}`)),
  }))
}

export default function FeaturesPage() {
  const t = useTranslations('featuresPage')
  const tFeatures = useTranslations('home.features')

  const features = [
    {
      id: 'smart-registration',
      title: tFeatures('smartRegistration'),
      subtitle: t('smartRegistration.subtitle'),
      description: t('smartRegistration.description'),
      icon: Users,
      gradientFrom: 'from-blue-500',
      gradientVia: 'via-blue-600',
      gradientTo: 'to-purple-600',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      sections: sectionKeys(t, 'smartRegistration', [
        'customForms',
        'ticketing',
        'payment',
        'invoice',
      ]),
    },
    {
      id: 'abstract-hub',
      title: tFeatures('abstractHub'),
      subtitle: t('abstractHub.subtitle'),
      description: t('abstractHub.description'),
      icon: FileText,
      gradientFrom: 'from-purple-500',
      gradientVia: 'via-purple-600',
      gradientTo: 'to-pink-600',
      borderColor: 'border-purple-300',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      sections: sectionKeys(t, 'abstractHub', [
        'submission',
        'review',
        'organization',
        'program',
      ]),
    },
    {
      id: 'organizer-dashboard',
      title: tFeatures('organizerDashboard'),
      subtitle: t('organizerDashboard.subtitle'),
      description: t('organizerDashboard.description'),
      icon: BarChart3,
      gradientFrom: 'from-green-500',
      gradientVia: 'via-green-600',
      gradientTo: 'to-teal-600',
      borderColor: 'border-green-300',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      sections: sectionKeys(t, 'organizerDashboard', [
        'analytics',
        'registration',
        'paymentTracking',
        'communication',
      ]),
    },
    {
      id: 'conference-websites',
      title: tFeatures('conferenceWebsites'),
      subtitle: t('conferenceWebsites.subtitle'),
      description: t('conferenceWebsites.description'),
      icon: Monitor,
      gradientFrom: 'from-indigo-500',
      gradientVia: 'via-indigo-600',
      gradientTo: 'to-violet-600',
      borderColor: 'border-indigo-300',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      sections: sectionKeys(t, 'conferenceWebsites', [
        'customDesign',
        'integrated',
        'contentMgmt',
        'performance',
      ]),
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.3),transparent_50%)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              <span className="block text-white">{t('hero.title')}</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                {t('hero.subtitle')}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed">
              {t('hero.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Features Sections */}
      {features.map((feature, index) => {
        const Icon = feature.icon
        return (
          <section
            key={feature.id}
            id={feature.id}
            className={`py-20 md:py-24 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} scroll-mt-16`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Feature Header */}
              <div className="text-center mb-16">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientVia} ${feature.gradientTo} mb-6 shadow-xl`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                  {feature.title}
                </h2>
                <p className="text-xl text-gray-600 mb-2">{feature.subtitle}</p>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  {feature.description}
                </p>
              </div>

              {/* Feature Sections */}
              <div className="space-y-16">
                {feature.sections.map((section, sectionIndex) => (
                  <div
                    key={sectionIndex}
                    className={`grid md:grid-cols-2 gap-12 items-center ${
                      sectionIndex % 2 === 1 ? 'md:grid-flow-dense' : ''
                    }`}
                  >
                    <div
                      className={`${
                        sectionIndex % 2 === 1 ? 'md:col-start-2' : ''
                      }`}
                    >
                      <h3 className={`text-3xl font-black text-gray-900 mb-4 ${feature.textColor}`}>
                        {section.title}
                      </h3>
                      <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                        {section.description}
                      </p>
                      <ul className="space-y-4">
                        {section.features.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start">
                            <CheckCircle
                              className={`w-6 h-6 ${feature.textColor} mr-3 mt-0.5 flex-shrink-0`}
                            />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div
                      className={`${
                        sectionIndex % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''
                      }`}
                    >
                      <div
                        className={`rounded-2xl p-8 ${feature.bgColor} border-2 ${feature.borderColor} shadow-lg`}
                      >
                        <div className={`aspect-video bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientVia} ${feature.gradientTo} rounded-xl flex items-center justify-center`}>
                          <Icon className="w-24 h-24 text-white opacity-50" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button for each feature */}
              <div className="text-center mt-12">
                <Link
                  href="/#contact"
                  className={`inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientVia} ${feature.gradientTo} text-white rounded-lg font-bold text-lg shadow-xl hover:shadow-2xl transition-all`}
                >
                  {t('cta.welcome')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </section>
        )
      })}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-violet-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            {t('cta.readyTitle')}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {t('cta.readyDesc')}
          </p>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
          >
            {t('cta.contactUs')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}


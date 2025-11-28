'use client'

import { useState } from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import {
  ArrowRight,
  Upload,
  Users,
  Calendar,
  TrendingUp,
  Zap,
  FileText,
  BarChart3,
  Sparkles,
  CheckCircle,
  Info,
  Clock,
  Globe,
  GitMerge,
  MapPin,
  Mail,
  Phone,
  Send,
} from 'lucide-react'

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // For now, we'll use mailto link. Later you can create an API route
      const subject = encodeURIComponent(`MeetFlow Inquiry from ${formData.name}`)
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\nOrganization: ${formData.organization}\n\nMessage:\n${formData.message}`
      )
      window.location.href = `mailto:info@meetflow.com?subject=${subject}&body=${body}`
      
      // Simulate success after a short delay
      setTimeout(() => {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', organization: '', message: '' })
        setIsSubmitting(false)
      }, 500)
    } catch (error) {
      setSubmitStatus('error')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border-2 border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="organization"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Organization
          </label>
          <input
            type="text"
            id="organization"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            placeholder="Your organization name"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
            placeholder="Describe your needs and how we can help..."
          />
        </div>

        {submitStatus === 'success' && (
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 font-medium">
              Thank you! Your inquiry has been sent. We'll contact you soon.
            </p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-3">
            <Info className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 font-medium">
              An error occurred. Please try again.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Send</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center bg-gradient-to-br from-slate-800 via-blue-900 to-purple-900 text-white overflow-hidden">
        {/* Geometric pattern background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Decorative icons/shapes */}
          <div className="absolute top-20 left-[10%] w-16 h-16 text-blue-400/20">
            <Calendar className="w-full h-full" />
          </div>
          <div className="absolute top-40 right-[15%] w-20 h-20 text-purple-400/20">
            <Users className="w-full h-full" />
          </div>
          <div className="absolute bottom-32 left-[20%] w-14 h-14 text-cyan-400/20">
            <FileText className="w-full h-full" />
          </div>
          <div className="absolute bottom-40 right-[25%] w-12 h-12 text-violet-400/20">
            <TrendingUp className="w-full h-full" />
          </div>
          
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-[5%] w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/4 right-[5%] w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full">
          <div className="max-w-4xl mx-auto">
            {/* Content - Centered */}
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-400/20">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-200">Professional Event Platform</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1]">
                <span className="block text-white">
                  Modern
                </span>
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                  Conference
                </span>
                <span className="block text-white">
                  Management
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl mb-12 text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Register as an attendee, submit your research, and manage your abstracts with ease. A streamlined workflow for scientific events — from registration to payment and submission.
              </p>

              {/* Features list - 4 columns on larger screens */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-slate-800/40 border-2 border-white/20 shadow-lg">
                  <div className="w-12 h-12 rounded-full bg-green-500/30 flex items-center justify-center border-2 border-green-400/50">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-white font-semibold text-base">Easy Registration</span>
                </div>
                <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-slate-800/40 border-2 border-white/20 shadow-lg">
                  <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center border-2 border-blue-400/50">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-white font-semibold text-base">Secure Payments</span>
                </div>
                <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-slate-800/40 border-2 border-white/20 shadow-lg">
                  <div className="w-12 h-12 rounded-full bg-violet-500/30 flex items-center justify-center border-2 border-violet-400/50">
                    <FileText className="w-6 h-6 text-violet-400" />
                  </div>
                  <span className="text-white font-semibold text-base">Abstract Hub</span>
                </div>
                <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-slate-800/40 border-2 border-white/20 shadow-lg">
                  <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center border-2 border-purple-400/50">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-white font-semibold text-base">Real-time Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block mb-4 px-6 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                POWERFUL FEATURES
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6">
              Everything you need,
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                all in one place
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Streamline your conference management with our comprehensive suite of tools
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Registration + Payment */}
            <div className="group relative p-10 rounded-3xl bg-white border-2 border-gray-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full -mr-20 -mt-20 opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Smart Registration</h3>
                <p className="text-gray-600 leading-relaxed mb-6 text-base">
                  Seamless registration with integrated payment processing. Customizable forms that capture exactly what you need.
                </p>
                <Link href="#solutions" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 group-hover:gap-4 transition-all text-sm">
                  Explore Feature
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Abstract Management */}
            <div className="group relative p-10 rounded-3xl bg-white border-2 border-gray-100 hover:border-purple-300 hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full -mr-20 -mt-20 opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Abstract Hub</h3>
                <p className="text-gray-600 leading-relaxed mb-6 text-base">
                  Streamlined submission and review process. Organize, evaluate, and manage research abstracts effortlessly.
                </p>
                <Link href="/abstracts" className="inline-flex items-center gap-2 text-purple-600 font-bold hover:text-purple-700 group-hover:gap-4 transition-all text-sm">
                  Explore Feature
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Event Management */}
            <div className="group relative p-10 rounded-3xl bg-white border-2 border-gray-100 hover:border-green-300 hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500 to-green-600 rounded-full -mr-20 -mt-20 opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 via-green-600 to-teal-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Organizer Dashboard</h3>
                <p className="text-gray-600 leading-relaxed mb-6 text-base">
                  Your conference, all in one place. Follow new registrations, payments, and abstract submissions the moment they come in — clearly, simply, and in real time.
                </p>
                <Link href="/admin" className="inline-flex items-center gap-2 text-green-600 font-bold hover:text-green-700 group-hover:gap-4 transition-all text-sm">
                  Explore Feature
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Project Discussion Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                We'd love to talk about your project
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our experts and developers would love to contribute their expertise and insights to your potential projects.
              </p>
            </div>
          </div>

          {/* Contact Us Box with Title and Form */}
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl border-2 border-gray-100">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left Side - Contact Us Title and Description */}
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                  Contact Us
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  Anything you ask, no matter how small, will make a big difference in helping us. Give us a call or send an email, we answer all inquiries within 24 hours.
                </p>
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Get a Quote</h2>
                  <p className="text-gray-600">
                    Fill in the form and we will contact you.
                  </p>
                </div>
              </div>

              {/* Right Side - Contact Form */}
              <div>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conference Types Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-6 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
              <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                FLEXIBLE FORMATS
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6">
              Support any
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                conference format
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From virtual to in-person, our platform adapts to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Virtual Conference */}
            <div className="group relative p-8 rounded-3xl bg-white border-2 border-gray-100 hover:border-indigo-300 hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full -mr-16 -mt-16 opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Virtual Conference</h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect attendees worldwide through an interactive platform. No travel required—participants join from anywhere.
                </p>
              </div>
            </div>

            {/* Hybrid Conference */}
            <div className="group relative p-8 rounded-3xl bg-white border-2 border-gray-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full -mr-16 -mt-16 opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <GitMerge className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Hybrid Conference</h3>
                <p className="text-gray-600 leading-relaxed">
                  Best of both worlds. Engage in-person and virtual audiences simultaneously with seamless integration.
                </p>
              </div>
            </div>

            {/* On-site Conference */}
            <div className="group relative p-8 rounded-3xl bg-white border-2 border-gray-100 hover:border-green-300 hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full -mr-16 -mt-16 opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">On-site Conference</h3>
                <p className="text-gray-600 leading-relaxed">
                  Traditional in-person events with modern digital tools. Create memorable face-to-face experiences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl"></div>
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <span className="text-sm font-semibold text-blue-200">Ready to get started?</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Start managing your
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              conference today
            </span>
          </h2>
          
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join organizers worldwide who trust our platform for seamless event management
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}

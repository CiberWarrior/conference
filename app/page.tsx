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
  ChevronDown,
  CheckCircle,
  Info,
  Clock,
  Globe,
  GitMerge,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-slate-800 via-blue-900 to-purple-900 text-white overflow-hidden">
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full">
          <div className="max-w-4xl mx-auto">
            {/* Content - Centered */}
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-400/20">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-200">Professional Event Platform</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.1]">
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
              <p className="text-lg md:text-xl mb-10 text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Register as an attendee, submit your research, and join our scientific community. Seamless registration with integrated payment and abstract submission.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link
                  href="/register"
                  className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-purple-600/40 flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Register as Attendee</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/submit-abstract"
                  className="group relative bg-slate-700/50 backdrop-blur-sm text-white px-10 py-5 rounded-xl font-bold hover:bg-slate-700 transition-all duration-300 border border-slate-600 hover:border-slate-500 flex items-center justify-center gap-3"
                >
                  <Upload className="w-5 h-5" />
                  <span>Submit Abstract</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Features list - 4 columns on larger screens */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 transition-all">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-slate-300 font-medium text-sm">Easy Registration</span>
                </div>
                <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 transition-all">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-slate-300 font-medium text-sm">Secure Payments</span>
                </div>
                <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 transition-all">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-violet-400" />
                  </div>
                  <span className="text-slate-300 font-medium text-sm">Abstract Hub</span>
                </div>
                <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 transition-all">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-slate-300 font-medium text-sm">Real-time Analytics</span>
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
                <h3 className="text-2xl font-black text-gray-900 mb-4">Command Center</h3>
                <p className="text-gray-600 leading-relaxed mb-6 text-base">
                  Centralized dashboard with real-time analytics. Monitor registrations, payments, and submissions instantly.
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

      {/* Registration & Abstract Section - 2 Simple Boxes */}
      <section id="solutions" className="py-24 bg-gradient-to-b from-white via-blue-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full">
              <span className="text-sm font-semibold text-blue-700">Get Started</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Join the Conference
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Register as an attendee or submit your research paper to participate in the conference
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Registration Box */}
            <div className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-2">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Attendee Registration</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Register as a conference participant and secure your spot. Complete the registration form and pay your attendance fee online with integrated payment processing.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Secure online payment</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Instant confirmation email</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Early bird discounts available</span>
                </div>
              </div>

              <Link
                href="/register"
                className="group/btn w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
              >
                <span>Register as Attendee</span>
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Abstract Submission Box */}
            <div className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-purple-500 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-2">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Submit Your Research</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Share your research with the scientific community. Submit your abstract or paper to be considered for presentation at the conference. Quick and easy submission process.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Word format (.doc, .docx)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Quick upload process</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Instant submission confirmation</span>
                </div>
              </div>

              <Link
                href="/submit-abstract"
                className="group/btn w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl"
              >
                <span>Submit Abstract</span>
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
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

      {/* Info Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Important Dates */}
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full -mr-16 -mt-16 opacity-10 blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900">Important Dates</h3>
                </div>
                <ul className="space-y-5">
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 mb-1">Abstract Submission</div>
                      <div className="text-gray-600">Deadline TBD</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 mb-1">Early Registration</div>
                      <div className="text-gray-600">Deadline TBD</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 mb-1">Conference Dates</div>
                      <div className="text-gray-600">TBD</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Information */}
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full -mr-16 -mt-16 opacity-10 blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900">Get in Touch</h3>
                </div>
                <ul className="space-y-5">
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 mb-1">Email</div>
                      <div className="text-gray-600">conference@example.com</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 mb-1">Phone</div>
                      <div className="text-gray-600">+1 (555) 123-4567</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 mb-1">Location</div>
                      <div className="text-gray-600">Zagreb, Croatia</div>
                    </div>
                  </li>
                </ul>
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
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-purple-600/40 flex items-center justify-center gap-3"
            >
              <Sparkles className="w-5 h-5" />
              <span>Start Registration</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/abstracts"
              className="group relative bg-slate-700/50 backdrop-blur-sm text-white px-10 py-5 rounded-xl font-bold hover:bg-slate-700 transition-all duration-300 border border-slate-600 hover:border-slate-500 flex items-center justify-center gap-3"
            >
              <Upload className="w-5 h-5" />
              <span>Submit Abstract</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

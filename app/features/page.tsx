import Link from 'next/link'
import Footer from '@/components/Footer'
import {
  Users,
  FileText,
  BarChart3,
  Monitor,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'

export default function FeaturesPage() {
  const features = [
      {
        id: 'smart-registration',
        title: 'Smart Registration',
        subtitle: 'Seamless registration with integrated payment processing',
        description: 'Create custom registration forms that capture exactly what you need. Our powerful system handles everything from attendee information to payment processing.',
        icon: Users,
        color: 'blue',
        gradientFrom: 'from-blue-500',
        gradientVia: 'via-blue-600',
        gradientTo: 'to-purple-600',
        borderColor: 'border-blue-300',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
      sections: [
        {
          title: 'Custom Registration Forms',
          description: 'Build fully customizable registration forms with our drag-and-drop builder. Choose from various field types and apply conditional logic for advanced options.',
          features: [
            'Drag-and-drop form builder',
            'Multiple field types (text, dropdown, checkbox, file upload)',
            'Conditional logic and field dependencies',
            'Multi-step forms for better UX',
            'Custom validation rules',
            'Mobile-responsive design',
          ],
        },
        {
          title: 'Ticketing System',
          description: 'Create, manage, and sell different types of tickets for your event with ease.',
          features: [
            'Multiple ticket types (Early Bird, Regular, VIP)',
            'Hidden tickets for special offers',
            'Accommodation booking integration',
            'Transportation options',
            'Gala dinners and special events',
            'Automatic capacity management',
          ],
        },
        {
          title: 'Payment Processing',
          description: 'Offer your attendees various payment methods and currencies with secure processing.',
          features: [
            'Credit card payments (Stripe integration)',
            'Bank transfer tracking',
            'Multiple currency support',
            'Automatic payment confirmation',
            'Payment reminders',
            'Refund management',
          ],
        },
        {
          title: 'Invoice Management',
          description: 'Automated invoice creation and management for seamless financial tracking.',
          features: [
            'Automatic invoice generation',
            'Proforma invoice tracking',
            'Payment status monitoring',
            'Email delivery to attendees',
            'PDF export',
            'Multi-language invoices',
          ],
        },
      ],
    },
      {
        id: 'abstract-hub',
        title: 'Abstract Hub',
        subtitle: 'Streamlined submission and review process',
        description: 'Organize, evaluate, and manage research abstracts effortlessly. From submission to review to acceptance, everything is handled in one place.',
        icon: FileText,
        color: 'purple',
        gradientFrom: 'from-purple-500',
        gradientVia: 'via-purple-600',
        gradientTo: 'to-pink-600',
        borderColor: 'border-purple-300',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50',
      sections: [
        {
          title: 'Abstract Submission',
          description: 'Easy-to-use submission system that guides authors through the process.',
          features: [
            'User-friendly submission form',
            'File upload support (PDF, DOCX)',
            'Template-based submissions',
            'Draft saving functionality',
            'Submission confirmation emails',
            'Real-time validation',
          ],
        },
        {
          title: 'Review Management',
          description: 'Comprehensive review system for evaluating abstracts efficiently.',
          features: [
            'Blind peer review system',
            'Multiple reviewer assignments',
            'Scoring and rating system',
            'Reviewer comments and feedback',
            'Review deadline tracking',
            'Automated reminders',
          ],
        },
        {
          title: 'Abstract Organization',
          description: 'Organize abstracts by topic, track, or category for easy management.',
          features: [
            'Category and topic classification',
            'Track assignment',
            'Status tracking (submitted, under review, accepted, rejected)',
            'Search and filter functionality',
            'Bulk operations',
            'Export capabilities',
          ],
        },
        {
          title: 'Program Building',
          description: 'Build your conference program from accepted abstracts.',
          features: [
            'Session scheduling',
            'Time slot assignment',
            'Room allocation',
            'Speaker management',
            'Program export (PDF, Excel)',
            'Online program display',
          ],
        },
      ],
    },
      {
        id: 'organizer-dashboard',
        title: 'Organizer Dashboard',
        subtitle: 'Your conference, all in one place',
        description: 'Follow new registrations, payments, and abstract submissions the moment they come in — clearly, simply, and in real time.',
        icon: BarChart3,
        color: 'green',
        gradientFrom: 'from-green-500',
        gradientVia: 'via-green-600',
        gradientTo: 'to-teal-600',
        borderColor: 'border-green-300',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
      sections: [
        {
          title: 'Real-Time Analytics',
          description: 'Get instant insights into your conference performance with comprehensive analytics.',
          features: [
            'Registration statistics',
            'Payment tracking',
            'Abstract submission metrics',
            'Attendee demographics',
            'Revenue reports',
            'Custom date range analysis',
          ],
        },
        {
          title: 'Registration Management',
          description: 'Manage all registrations from a single, powerful dashboard.',
          features: [
            'View all registrations',
            'Filter and search functionality',
            'Bulk actions',
            'Check-in management',
            'Badge printing',
            'Export to Excel/CSV',
          ],
        },
        {
          title: 'Payment Tracking',
          description: 'Monitor all payments and financial transactions in real time.',
          features: [
            'Payment status overview',
            'Pending payments tracking',
            'Payment history',
            'Refund management',
            'Financial reports',
            'Invoice management',
          ],
        },
        {
          title: 'Communication Tools',
          description: 'Stay connected with your attendees through integrated communication tools.',
          features: [
            'Email campaigns',
            'Bulk messaging',
            'Personalized emails',
            'Email templates',
            'Delivery tracking',
            'Automated notifications',
          ],
        },
      ],
    },
      {
        id: 'conference-websites',
        title: 'Conference Websites',
        subtitle: 'Professional, custom-designed websites for your conference',
        description: 'Beautiful, responsive, and fully integrated with our platform for seamless registration and management.',
        icon: Monitor,
        color: 'indigo',
        gradientFrom: 'from-indigo-500',
        gradientVia: 'via-indigo-600',
        gradientTo: 'to-violet-600',
        borderColor: 'border-indigo-300',
        textColor: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
      sections: [
        {
          title: 'Custom Design',
          description: 'Get a professional website tailored to your conference brand and style.',
          features: [
            'Custom color schemes',
            'Logo and branding integration',
            'Responsive design (mobile, tablet, desktop)',
            'Modern, clean layouts',
            'Custom pages and sections',
            'SEO optimization',
          ],
        },
        {
          title: 'Integrated Features',
          description: 'Seamless integration with our platform for a unified experience.',
          features: [
            'Direct registration integration',
            'Abstract submission portal',
            'Program and schedule display',
            'Speaker profiles',
            'Sponsor showcase',
            'News and updates section',
          ],
        },
        {
          title: 'Content Management',
          description: 'Easy-to-use content management system for updating your website.',
          features: [
            'WYSIWYG editor',
            'Image and media management',
            'Page builder',
            'Menu management',
            'Multi-language support',
            'Version control',
          ],
        },
        {
          title: 'Performance & Security',
          description: 'Fast, secure, and reliable hosting for your conference website.',
          features: [
            'Fast loading times',
            'SSL certificate included',
            'Regular backups',
            '99.9% uptime guarantee',
            'CDN integration',
            'Security monitoring',
          ],
        },
      ],
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
              <span className="block text-white">Powerful Features</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                For Your Conference
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed">
              Everything you need to manage your conference successfully, all in one comprehensive platform.
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
                  Get Started
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
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Contact us today to discuss how we can help make your conference a success.
          </p>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
          >
            Contact Us
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}


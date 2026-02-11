'use client'

import { useState } from 'react'
import { Plus, Trash2, Users, Mail, Building2, Globe, ArrowUp, ArrowDown } from 'lucide-react'
import type { Author } from '@/types/author'
import type { CustomRegistrationField } from '@/types/conference'

interface AuthorManagerProps {
  authors: Author[]
  onChange: (authors: Author[]) => void
  maxAuthors?: number // Optional, no limit if not provided
  customFields?: CustomRegistrationField[]
  showCustomFields?: boolean
}

export default function AuthorManager({
  authors,
  onChange,
  maxAuthors, // No default limit
  customFields = [],
  showCustomFields = false,
}: AuthorManagerProps) {
  const [expandedAuthor, setExpandedAuthor] = useState<number>(0)

  const addAuthor = () => {
    // No limit on number of authors
    if (maxAuthors && authors.length >= maxAuthors) {
      alert(`Maximum ${maxAuthors} authors allowed`)
      return
    }

    const newAuthor: Author = {
      firstName: '',
      lastName: '',
      email: '',
      affiliation: '',
      country: '',
      city: '',
      orcid: '',
      isCorresponding: authors.length === 0, // First author is corresponding by default
      order: authors.length + 1,
      customFields: {},
    }

    onChange([...authors, newAuthor])
    setExpandedAuthor(authors.length)
  }

  const removeAuthor = (index: number) => {
    if (authors.length <= 1) {
      alert('At least one author is required')
      return
    }

    const updated = authors.filter((_, i) => i !== index)
    // Re-order remaining authors
    const reordered = updated.map((author, idx) => ({
      ...author,
      order: idx + 1,
    }))
    onChange(reordered)
    if (expandedAuthor === index) {
      setExpandedAuthor(0)
    }
  }

  const updateAuthor = (index: number, updates: Partial<Author>) => {
    const updated = [...authors]
    updated[index] = {
      ...updated[index],
      ...updates,
    }
    onChange(updated)
  }

  const updateAuthorCustomField = (index: number, fieldName: string, value: any) => {
    const updated = [...authors]
    updated[index] = {
      ...updated[index],
      customFields: {
        ...updated[index].customFields,
        [fieldName]: value,
      },
    }
    onChange(updated)
  }

  const moveAuthor = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === authors.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const updated = [...authors]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp

    // Update order numbers
    const reordered = updated.map((author, idx) => ({
      ...author,
      order: idx + 1,
    }))

    onChange(reordered)
    setExpandedAuthor(newIndex)
  }

  const setCorrespondingAuthor = (index: number) => {
    const updated = authors.map((author, idx) => ({
      ...author,
      isCorresponding: idx === index,
    }))
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Autori ({authors.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={addAuthor}
          className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transform hover:-translate-y-0.5 active:translate-y-0 font-semibold"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          Dodaj autora
        </button>
      </div>

      {/* Author Cards */}
      <div className="space-y-3">
        {authors.map((author, index) => {
          const isExpanded = expandedAuthor === index
          const displayName = author.firstName || author.lastName
            ? `${author.firstName || ''} ${author.lastName || ''}`.trim()
            : `Autor ${index + 1}`

          return (
            <div
              key={index}
              className={`border rounded-lg transition-all ${
                isExpanded
                  ? 'border-purple-500 bg-white shadow-lg'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Header - Always visible */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors rounded-t-lg"
                onClick={() => setExpandedAuthor(isExpanded ? -1 : index)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {displayName}
                      {author.isCorresponding && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          Glavni autor
                        </span>
                      )}
                    </p>
                    {author.email && (
                      <p className="text-xs text-gray-500 truncate">{author.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Move buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveAuthor(index, 'up')
                      }}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Pomjeri gore"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveAuthor(index, 'down')
                      }}
                      disabled={index === authors.length - 1}
                      className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Pomjeri dolje"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {authors.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeAuthor(index)
                      }}
                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Ukloni autora"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Expand/collapse indicator */}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-4 bg-white rounded-b-lg">
                  {/* Corresponding Author Checkbox */}
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <input
                      type="checkbox"
                      id={`corresponding-${index}`}
                      checked={author.isCorresponding || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCorrespondingAuthor(index)
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`corresponding-${index}`}
                      className="text-sm font-medium text-blue-900 cursor-pointer flex-1"
                    >
                      Glavni autor (autor za korespondenciju)
                    </label>
                  </div>

                  {/* Basic Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Ime <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={author.firstName || ''}
                        onChange={(e) =>
                          updateAuthor(index, { firstName: e.target.value })
                        }
                        placeholder="Unesite ime"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Prezime <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={author.lastName || ''}
                        onChange={(e) =>
                          updateAuthor(index, { lastName: e.target.value })
                        }
                        placeholder="Unesite prezime"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={author.email || ''}
                      onChange={(e) => updateAuthor(index, { email: e.target.value })}
                      placeholder="autor@primjer.com"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Affiliation */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Institucija / Organizacija <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={author.affiliation || ''}
                      onChange={(e) =>
                        updateAuthor(index, { affiliation: e.target.value })
                      }
                      placeholder="Sveučilište, Institut ili Tvrtka"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Country and City */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Country */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Globe className="w-4 h-4 inline mr-1" />
                        Država
                      </label>
                      <input
                        type="text"
                        value={author.country || ''}
                        onChange={(e) =>
                          updateAuthor(index, { country: e.target.value })
                        }
                        placeholder="Hrvatska, SAD, itd."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Grad
                      </label>
                      <input
                        type="text"
                        value={author.city || ''}
                        onChange={(e) =>
                          updateAuthor(index, { city: e.target.value })
                        }
                        placeholder="Zagreb, New York, itd."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>


                  {/* Custom Fields (if enabled and available) */}
                  {showCustomFields && customFields.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Dodatna polja
                      </h4>
                      <div className="space-y-3">
                        {customFields
                          .filter((field) => field.type !== 'separator')
                          .map((field) => (
                            <div key={field.id}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                                {field.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              {field.description && (
                                <p className="text-xs text-gray-500 mb-2">
                                  {field.description}
                                </p>
                              )}
                              
                              {field.type === 'text' && (
                                <input
                                  type="text"
                                  value={author.customFields?.[field.name] || ''}
                                  onChange={(e) =>
                                    updateAuthorCustomField(
                                      index,
                                      field.name,
                                      e.target.value
                                    )
                                  }
                                  placeholder={field.placeholder}
                                  required={field.required}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                />
                              )}

                              {field.type === 'textarea' && (
                                <textarea
                                  value={author.customFields?.[field.name] || ''}
                                  onChange={(e) =>
                                    updateAuthorCustomField(
                                      index,
                                      field.name,
                                      e.target.value
                                    )
                                  }
                                  placeholder={field.placeholder}
                                  required={field.required}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-y"
                                />
                              )}

                              {field.type === 'select' && (
                                <select
                                  value={author.customFields?.[field.name] || ''}
                                  onChange={(e) =>
                                    updateAuthorCustomField(
                                      index,
                                      field.name,
                                      e.target.value
                                    )
                                  }
                                  required={field.required}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                >
                                  <option value="">
                                    {field.placeholder || 'Odaberite...'}
                                  </option>
                                  {field.options?.map((option, idx) => (
                                    <option key={idx} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {authors.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-2">
            Još nema dodanih autora
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Kliknite "Dodaj autora" za dodavanje prvog autora
          </p>
        </div>
      )}
    </div>
  )
}

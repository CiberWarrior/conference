'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CheckCircle, FileText, AlertCircle, Upload } from 'lucide-react'
import { ABSTRACT_DOCUMENT_ACCEPT, validateAbstractFile } from '@/lib/abstract-file'

export default function ReviseAbstractPage() {
  const t = useTranslations('abstractRevise')
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params?.slug as string
  const token = searchParams?.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [conferenceName, setConferenceName] = useState('')
  const [decisionNotes, setDecisionNotes] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [keywords, setKeywords] = useState('')
  const [abstractType, setAbstractType] = useState('poster')
  const [isDocument, setIsDocument] = useState(false)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const [replacementFile, setReplacementFile] = useState<File | null>(null)

  useEffect(() => {
    if (!slug || !token) {
      setError(t('missingToken'))
      setLoading(false)
      return
    }

    fetch(`/api/conferences/${slug}/revise-abstract?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || json.details || t('invalidLink'))
        setConferenceName(json.conference.name)
        setDecisionNotes(json.abstract.decision_notes)
        setTitle(json.abstract.title || '')
        setContent(json.abstract.content || '')
        setKeywords(json.abstract.keywords || '')
        setAbstractType(json.abstract.type || 'poster')
        setIsDocument(json.abstract.submission_method === 'document_upload')
        setCurrentFileName(json.abstract.file_name || null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug, token, t])

  const submitRevision = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setFormError(null)

    try {
      const url = `/api/conferences/${slug}/revise-abstract?token=${encodeURIComponent(token)}`
      let res: Response

      if (isDocument) {
        if (!replacementFile) {
          setFormError(t('documentRequired'))
          setBusy(false)
          return
        }
        const validation = validateAbstractFile(replacementFile)
        if (!validation.ok) {
          setFormError(validation.details ? `${validation.error}. ${validation.details}` : validation.error)
          setBusy(false)
          return
        }
        const formData = new FormData()
        formData.append('abstractTitle', title)
        if (keywords.trim()) formData.append('abstractKeywords', keywords)
        formData.append('abstractType', abstractType)
        formData.append('file', replacementFile)
        res = await fetch(url, { method: 'POST', body: formData })
      } else {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            abstractTitle: title,
            abstractContent: content,
            abstractKeywords: keywords,
            abstractType,
          }),
        })
      }
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || json.details || t('uploadFailed'))
      setDone(true)
    } catch (e: any) {
      setFormError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {t('loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-lg mx-auto bg-white border border-emerald-200 rounded-xl p-6 sm:p-8 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">{t('successTitle')}</h1>
          <p className="text-slate-600">{t('successBody')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-600 mt-1">{conferenceName}</p>
        </header>

        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          {decisionNotes && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                {t('organizerNotes')}
              </p>
              <p className="text-sm text-amber-900 mt-2 whitespace-pre-wrap">{decisionNotes}</p>
            </div>
          )}

          <p className="text-sm text-slate-600">{t('instructions')}</p>

          <form onSubmit={submitRevision} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t('fieldTitle')}</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </label>

            {isDocument ? (
              <div>
                <span className="text-sm font-medium text-slate-700">{t('fieldDocument')}</span>
                {currentFileName && (
                  <p className="text-xs text-slate-500 mt-1">
                    {t('currentDocument')}: {currentFileName}
                  </p>
                )}
                <label
                  htmlFor="replacement-document"
                  className="mt-2 flex flex-col items-center justify-center w-full h-28 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <Upload className="w-7 h-7 mb-2 text-slate-400" />
                  <span className="text-sm text-slate-600">{t('documentDropHint')}</span>
                  <span className="text-xs text-slate-500 mt-0.5">.docx / .pdf · max 10MB</span>
                  <input
                    id="replacement-document"
                    type="file"
                    className="hidden"
                    accept={ABSTRACT_DOCUMENT_ACCEPT}
                    onChange={(e) => {
                      const selected = e.target.files?.[0] || null
                      if (!selected) return
                      const result = validateAbstractFile(selected)
                      if (!result.ok) {
                        setFormError(result.details ? `${result.error}. ${result.details}` : result.error)
                        e.target.value = ''
                        setReplacementFile(null)
                        return
                      }
                      setFormError(null)
                      setReplacementFile(selected)
                    }}
                  />
                </label>
                {replacementFile && (
                  <p className="text-sm text-slate-800 mt-2 inline-flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-violet-600" />
                    {replacementFile.name} · {(replacementFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            ) : (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">{t('fieldContent')}</span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={12}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-y"
                />
                <span className="text-xs text-slate-500 mt-1 block">
                  {content.length} / 2000 {t('characters')}
                </span>
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {isDocument ? t('fieldKeywordsOptional') : t('fieldKeywords')}
                {isDocument && (
                  <span className="text-slate-400 font-normal"> ({t('optional')})</span>
                )}
              </span>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                required={!isDocument}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </label>

            <fieldset>
              <legend className="text-sm font-medium text-slate-700 mb-2">{t('fieldType')}</legend>
              <div className="flex flex-wrap gap-3">
                {(['poster', 'oral', 'invited'] as const).map((type) => (
                  <label key={type} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="abstractType"
                      value={type}
                      checked={abstractType === type}
                      onChange={() => setAbstractType(type)}
                    />
                    {t(`type_${type}`)}
                  </label>
                ))}
              </div>
            </fieldset>

            {formError && (
              <p className="text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-violet-700 text-white rounded-lg text-sm font-semibold hover:bg-violet-800 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {busy ? t('uploading') : t('submit')}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

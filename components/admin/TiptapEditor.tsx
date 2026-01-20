'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { useEffect, useState, useRef } from 'react'

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  conferenceId?: string // For image upload
}

export default function TiptapEditor({ content, onChange, placeholder, conferenceId }: TiptapEditorProps) {
  const [mounted, setMounted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleImageUpload = async (file: File) => {
    if (!conferenceId) {
      alert('Conference ID is required for image upload')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/admin/conferences/${conferenceId}/pages/upload-image`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to upload image')
      }

      // Insert image into editor using Image extension
      if (editor && data.url) {
        console.log('Inserting image with URL:', data.url)
        
        // Try setImage first, fallback to insertContent
        let inserted = false
        try {
          editor.chain().focus().setImage({ src: data.url, alt: '' }).run()
          inserted = true
          console.log('Image inserted using setImage')
        } catch (e) {
          console.warn('setImage failed, trying insertContent:', e)
          // Fallback if setImage is not available
          editor.chain().focus().insertContent(`<img src="${data.url}" alt="" class="max-w-full h-auto rounded-lg my-4" />`).run()
          inserted = true
          console.log('Image inserted using insertContent')
        }

        // Force a React state sync so the parent "Save" sends HTML that includes the image.
        // Tiptap's onUpdate might not fire immediately for programmatic inserts
        const updateContent = () => {
          try {
            const html = editor.getHTML()
            const hasImg = html.includes('<img')
            console.log('Updating content after image insert:', {
              htmlLength: html.length,
              hasImg,
              htmlPreview: html.substring(0, 300)
            })
            
            if (hasImg) {
              onChange(html)
              console.log('Content updated with image')
            } else {
              console.warn('Image not found in editor HTML after insert!')
            }
          } catch (err) {
            console.warn('Failed to update content after image insert:', err)
          }
        }
        
        // Update immediately
        updateContent()
        
        // Also update after a short delay to catch any async updates
        setTimeout(updateContent, 50)
        setTimeout(updateContent, 200)
      }
    } catch (error: any) {
      alert(error.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        // Disable link and underline from StarterKit since we add them separately with custom config
        link: false,
        underline: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-700 underline',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
    ],
    content,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Only update editor if content prop changed externally (e.g., after load)
      // Don't reset if editor has newer content (e.g., after image insert)
      const editorHtml = editor.getHTML()
      // Only sync if the difference is significant (more than just whitespace)
      const contentTrimmed = content.trim()
      const editorTrimmed = editorHtml.trim()
      
      if (contentTrimmed !== editorTrimmed && contentTrimmed.length > 0) {
        console.log('Syncing editor content from prop:', contentTrimmed.substring(0, 100))
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  // Don't render editor until mounted (client-side only)
  if (!mounted || !editor) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 min-h-[300px] bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-300 bg-gray-50 p-2">
        {/* First row - Main formatting */}
        <div className="flex flex-wrap gap-2 mb-2">
          {/* Undo/Redo */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="px-3 py-1.5 rounded text-sm font-semibold bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            title="Undo"
          >
            ↶ Undo
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="px-3 py-1.5 rounded text-sm font-semibold bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            title="Redo"
          >
            ↷ Redo
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Heading 3"
          >
            H3
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Text formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive('bold')
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive('italic')
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive('underline')
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive('strike')
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold font-mono ${
              editor.isActive('code')
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Inline code"
          >
            {'</>'}
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive('bulletList')
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Bullet list"
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive('orderedList')
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Numbered list"
          >
            1. List
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Block elements */}
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive('blockquote')
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Blockquote"
          >
            " Quote
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold font-mono ${
              editor.isActive('codeBlock')
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Code block"
          >
            {'{ }'}
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="px-3 py-1.5 rounded text-sm font-semibold bg-white text-gray-700 hover:bg-gray-100"
            type="button"
            title="Horizontal rule"
          >
            ───
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Image - Upload or URL */}
          {conferenceId ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => {
                  fileInputRef.current?.click()
                }}
                disabled={uploading}
                className="px-3 py-1.5 rounded text-sm font-semibold bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                title="Upload image"
              >
                {uploading ? '⏳ Uploading...' : '📤 Upload Image'}
              </button>
            </>
          ) : null}
          <button
            onClick={() => {
              const url = window.prompt('Enter image URL:')
              if (url && editor) {
                try {
                  editor.chain().focus().setImage({ src: url, alt: '' }).run()
                } catch (e) {
                  // Fallback if setImage is not available
                  editor.chain().focus().insertContent(`<img src="${url}" alt="" class="max-w-full h-auto rounded-lg my-4" />`).run()
                }
              }
            }}
            className="px-3 py-1.5 rounded text-sm font-semibold bg-white text-gray-700 hover:bg-gray-100"
            type="button"
            title="Insert image from URL"
          >
            🖼️ Image URL
          </button>

          {/* Link */}
          <button
            onClick={() => {
              const url = window.prompt('Enter URL:')
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive('link')
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Add link"
          >
            🔗 Link
          </button>
        </div>

        {/* Second row - Text alignment */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-500 self-center px-2">Align:</span>
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Align left"
          >
            ⬅ Left
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Align center"
          >
            ⬌ Center
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Align right"
          >
            ➡ Right
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`px-3 py-1.5 rounded text-sm font-semibold ${
              editor.isActive({ textAlign: 'justify' })
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
            title="Justify"
          >
            ⬌⬌ Justify
          </button>
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="min-h-[300px]" />
    </div>
  )
}

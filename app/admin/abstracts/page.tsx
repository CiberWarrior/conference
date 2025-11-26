'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Abstract } from '@/types/abstract'
import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx'
import jsPDF from 'jspdf'
import { saveAs } from 'file-saver'

export default function AbstractsPage() {
  const [abstracts, setAbstracts] = useState<Abstract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  useEffect(() => {
    loadAbstracts()
  }, [])

  const loadAbstracts = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('abstracts')
        .select('*')
        .order('uploaded_at', { ascending: false })

      if (fetchError) throw fetchError

      setAbstracts(
        data.map((a) => ({
          id: a.id,
          fileName: a.file_name,
          filePath: a.file_path,
          fileSize: a.file_size,
          email: a.email,
          registrationId: a.registration_id || null,
          uploadedAt: a.uploaded_at,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load abstracts')
    } finally {
      setLoading(false)
    }
  }

  const downloadAbstract = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('abstracts')
        .download(filePath)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download file: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  // Helper function to prepare data for export
  const prepareExportData = () => {
    const headers = ['File Name', 'Email', 'File Size (MB)', 'Uploaded At']
    const rows = filteredAbstracts.map((a) => [
      a.fileName,
      a.email || '',
      (a.fileSize / 1024 / 1024).toFixed(2),
      new Date(a.uploadedAt).toLocaleString(),
    ])
    return { headers, rows }
  }

  const exportToCSV = () => {
    const { headers, rows } = prepareExportData()
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `abstracts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportMenuOpen(false)
  }

  const exportToExcel = () => {
    const { headers, rows } = prepareExportData()
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    
    // Set column widths
    const colWidths = headers.map(() => ({ wch: 25 }))
    ws['!cols'] = colWidths
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Abstracts')
    
    // Generate Excel file
    const fileName = `abstracts-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    setExportMenuOpen(false)
  }

  const exportToGoogleSheets = () => {
    const { headers, rows } = prepareExportData()
    
    // Create CSV content optimized for Google Sheets
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `abstracts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    // Show instructions
    alert(
      'CSV file downloaded! To import into Google Sheets:\n\n' +
      '1. Open Google Sheets (sheets.google.com)\n' +
      '2. Click File → Import\n' +
      '3. Upload the downloaded CSV file\n' +
      '4. Choose "Replace spreadsheet" or "Insert new sheet"\n' +
      '5. Click Import'
    )
    setExportMenuOpen(false)
  }

  const exportToWord = async () => {
    try {
      const { headers, rows } = prepareExportData()

      // Create Word document
      const tableRows = [
        // Header row
        new TableRow({
          children: headers.map(
            (header) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: header,
                        bold: true,
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 20, type: WidthType.PERCENTAGE },
              })
          ),
        }),
        // Data rows
        ...rows.map(
          (row) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: String(cell),
                          }),
                        ],
                      }),
                    ],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  })
              ),
            })
        ),
      ]

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Abstracts List',
                    bold: true,
                    size: 32,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Generated: ${new Date().toLocaleString()}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
            ],
          },
        ],
      })

      // Generate and download
      const blob = await Packer.toBlob(doc)
      saveAs(blob, `abstracts-${new Date().toISOString().split('T')[0]}.docx`)
      setExportMenuOpen(false)
    } catch (error) {
      console.error('Error exporting to Word:', error)
      alert('Failed to export to Word format')
    }
  }

  const exportToPDF = () => {
    try {
      const { headers, rows } = prepareExportData()

      const doc = new jsPDF('landscape', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 10
      const startY = 20
      let yPos = startY

      // Title
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Abstracts List', pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      // Date
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      // Table
      const colWidths = [60, 60, 30, 50] // Adjust based on number of columns
      const rowHeight = 8
      const tableStartX = margin

      // Header row
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(240, 240, 240)
      doc.rect(tableStartX, yPos, pageWidth - 2 * margin, rowHeight, 'F')
      
      let xPos = tableStartX
      headers.forEach((header, index) => {
        doc.text(header, xPos + 2, yPos + 5)
        xPos += colWidths[index] || 50
      })
      yPos += rowHeight

      // Data rows
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      rows.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (yPos + rowHeight > pageHeight - margin) {
          doc.addPage()
          yPos = margin
        }

        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(tableStartX, yPos, pageWidth - 2 * margin, rowHeight, 'F')
        }

        xPos = tableStartX
        row.forEach((cell, cellIndex) => {
          const cellText = String(cell).substring(0, 30) // Truncate long text
          doc.text(cellText, xPos + 2, yPos + 5)
          xPos += colWidths[cellIndex] || 50
        })
        yPos += rowHeight
      })

      // Save PDF
      doc.save(`abstracts-${new Date().toISOString().split('T')[0]}.pdf`)
      setExportMenuOpen(false)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      alert('Failed to export to PDF format')
    }
  }

  const filteredAbstracts = abstracts.filter((abstract) => {
    const matchesSearch =
      abstract.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (abstract.email &&
        abstract.email.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Abstracts</h2>
          <p className="mt-2 text-gray-600">Manage submitted abstracts</p>
        </div>
        {/* Export Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {exportMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setExportMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="py-1">
                  <button
                    onClick={exportToCSV}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as CSV
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as Excel (.xlsx)
                  </button>
                  <button
                    onClick={exportToGoogleSheets}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export for Google Sheets
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={exportToWord}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as Word (.docx)
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Export as PDF
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by file name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAbstracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mt-4 text-sm">No abstracts found</p>
                  </td>
                </tr>
              ) : (
                filteredAbstracts.map((abstract) => (
                  <tr key={abstract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-gray-400 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="text-sm font-medium text-gray-900">
                          {abstract.fileName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{abstract.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {(abstract.fileSize / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(abstract.uploadedAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => downloadAbstract(abstract.filePath, abstract.fileName)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredAbstracts.length}</span> of{' '}
            <span className="font-medium">{abstracts.length}</span> abstracts
          </p>
        </div>
      </div>
    </div>
  )
}


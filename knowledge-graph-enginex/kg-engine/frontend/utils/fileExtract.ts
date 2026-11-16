// Client-side extraction of text from external files so instructors can upload
// real PDF / DOCX / PPTX / HTML / text material without pasting content.
// Text-ish files are read natively; PDF via pdfjs (per-page, form-feed separated so
// the ingest stage maps pages correctly); DOCX and PPTX are zip+XML parsed via JSZip.

import * as pdfjs from 'pdfjs-dist'
// same-origin worker asset; allowed by CSP (script-src 'self', worker-src 'self' blob:)
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import JSZip from 'jszip'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export type ExtractableType = 'pdf' | 'pptx' | 'docx' | 'text' | 'html' | 'url'

export interface ExtractedFile {
  name: string
  fileType: ExtractableType
  content: string
  /** page count when the source format is paginated */
  pageCount: number | null
  /** true when a paginated document produced no text (image-only; needs OCR) */
  imageOnly: boolean
  warning: string | null
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, d: string) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&amp;/g, '&')
}

function extType(name: string): ExtractableType | null {
  const ext = name.toLowerCase().split('.').pop()
  switch (ext) {
    case 'pdf':
      return 'pdf'
    case 'pptx':
      return 'pptx'
    case 'docx':
      return 'docx'
    case 'txt':
    case 'md':
    case 'csv':
      return 'text'
    case 'html':
    case 'htm':
      return 'html'
    default:
      return null
  }
}

async function extractPdf(file: File): Promise<ExtractedFile> {
  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const tc = await page.getTextContent()
    let text = ''
    for (const item of tc.items) {
      if (!('str' in item)) continue
      text += item.str
      if (item.hasEOL) text += '\n'
      else text += ' '
    }
    pages.push(text.trim())
  }
  const content = pages.filter((p) => p.length > 0).join('\f')
  const imageOnly = content.trim().length === 0
  return {
    name: file.name,
    fileType: 'pdf',
    content,
    pageCount: doc.numPages,
    imageOnly,
    warning: imageOnly ? `No extractable text in ${doc.numPages} pages — set "OCR pages" to ${doc.numPages} to flag it for OCR` : null,
  }
}

async function extractPptx(file: File): Promise<ExtractedFile> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide(\d+)\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)?.[1] || '0', 10)
      const nb = parseInt(b.match(/slide(\d+)/)?.[1] || '0', 10)
      return na - nb
    })
  if (slideNames.length === 0) {
    return { name: file.name, fileType: 'pptx', content: '', pageCount: 0, imageOnly: true, warning: 'No slide XML found in the PPTX' }
  }
  const pages: string[] = []
  for (const slideName of slideNames) {
    const xml = await zip.files[slideName]!.async('string')
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => decodeXmlEntities(m[1] || ''))
    // group runs into paragraphs using a:t boundaries joined; PPTX paragraphs are <a:p> blocks
    const paragraphs = [...xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)].map((m) =>
      [...(m[1] || '').matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((t) => decodeXmlEntities(t[1] || '')).join('')
    )
    const lines = (paragraphs.length > 0 ? paragraphs : runs).filter((l) => l.trim())
    pages.push(lines.join('\n'))
  }
  const content = pages.filter((p) => p.trim().length > 0).join('\f')
  return {
    name: file.name,
    fileType: 'pptx',
    content,
    pageCount: slideNames.length,
    imageOnly: content.trim().length === 0,
    warning: content.trim().length === 0 ? `No extractable text in ${slideNames.length} slides — mark OCR pages` : null,
  }
}

async function extractDocx(file: File): Promise<ExtractedFile> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const docXml = zip.files['word/document.xml']
  if (!docXml) {
    return { name: file.name, fileType: 'docx', content: '', pageCount: null, imageOnly: true, warning: 'word/document.xml not found in the DOCX' }
  }
  const xml = await docXml.async('string')
  // paragraphs -> lines; runs of text -> joined
  const paragraphs = [...xml.matchAll(/<w:p[ >]([\s\S]*?)<\/w:p>/g)].map((m) =>
    [...(m[1] || '').matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((t) => decodeXmlEntities(t[1] || '')).join('')
  )
  const content = paragraphs.filter((p) => p.trim()).join('\n\n')
  return {
    name: file.name,
    fileType: 'docx',
    content,
    pageCount: null,
    imageOnly: content.trim().length === 0,
    warning: content.trim().length === 0 ? 'No extractable text — the document may be scanned images; mark OCR pages' : null,
  }
}

export async function extractFile(file: File): Promise<ExtractedFile> {
  const type = extType(file.name)
  if (!type) {
    return { name: file.name, fileType: 'text', content: '', pageCount: null, imageOnly: false, warning: `Unsupported file type: ${file.name}` }
  }
  try {
    if (type === 'pdf') return await extractPdf(file)
    if (type === 'pptx') return await extractPptx(file)
    if (type === 'docx') return await extractDocx(file)
    const text = await file.text()
    return { name: file.name, fileType: type, content: text, pageCount: null, imageOnly: false, warning: null }
  } catch (e) {
    return {
      name: file.name,
      fileType: type,
      content: '',
      pageCount: null,
      imageOnly: false,
      warning: e instanceof Error ? `Extraction failed: ${e.message}` : 'Extraction failed',
    }
  }
}

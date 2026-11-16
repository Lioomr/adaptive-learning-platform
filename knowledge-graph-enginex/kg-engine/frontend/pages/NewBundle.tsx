import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateBundle } from '../hooks/backend/bundles'
import { Button } from '../lib/shadcn/button'
import { Input } from '../lib/shadcn/input'
import { Label } from '../lib/shadcn/label'
import { Textarea } from '../lib/shadcn/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../lib/shadcn/select'
import { Switch } from '../lib/shadcn/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../lib/shadcn/card'
import { Trash2, Plus, Upload, Loader2 } from 'lucide-react'
import { extractFile } from '../utils/fileExtract'

interface FileRow {
  name: string
  fileType: 'pdf' | 'pptx' | 'docx' | 'text' | 'html' | 'url'
  languageHint: 'auto' | 'ar' | 'en'
  content: string
  ocrPages: string
}

const EMPTY_FILE: FileRow = { name: '', fileType: 'text', languageHint: 'auto', content: '', ocrPages: '' }

export default function NewBundle() {
  const navigate = useNavigate()
  const create = useCreateBundle()
  const [bundleId, setBundleId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [role, setRole] = useState<'course_material' | 'background_resource'>('course_material')
  const [version, setVersion] = useState('1.0')
  const [instructorId, setInstructorId] = useState('')
  const [isHeldOut, setIsHeldOut] = useState(false)
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<FileRow[]>([{ ...EMPTY_FILE }])
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadNotes, setUploadNotes] = useState<string[]>([])

  const onFilesSelected = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return
    setUploading(true)
    setUploadNotes([])
    const notes: string[] = []
    const newRows: FileRow[] = []
    for (const f of Array.from(selected)) {
      const ex = await extractFile(f)
      newRows.push({
        name: ex.name,
        fileType: ex.fileType,
        languageHint: 'auto',
        content: ex.content,
        ocrPages: ex.imageOnly && ex.pageCount ? String(ex.pageCount) : '',
      })
      if (ex.warning) notes.push(ex.warning)
    }
    setFiles((prev) => {
      const cleaned = prev.filter((p) => p.name || p.content)
      return [...cleaned, ...newRows]
    })
    setUploadNotes(notes)
    setUploading(false)
  }

  const updateFile = (i: number, patch: Partial<FileRow>) => {
    setFiles((prev) => prev.map((f, k) => (k === i ? { ...f, ...patch } : f)))
  }

  const submit = async () => {
    setError(null)
    const res = await create.trigger({
      manifest: {
        bundleId,
        courseId,
        role,
        version,
        instructorId,
        isHeldOut,
        notes,
        files: files.map((f) => ({
          name: f.name,
          fileType: f.fileType,
          languageHint: f.languageHint,
          content: f.content,
          ...(f.ocrPages ? { ocrPages: parseInt(f.ocrPages, 10) || undefined } : {}),
        })),
      },
    })
    if (res?.ok) {
      navigate(`/bundles/${bundleId}`)
    } else {
      setError(res?.errors?.join('; ') || res?.error || 'Failed to create bundle')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">New bundle</h1>
        <p className="text-sm text-muted-foreground">
          A bundle is a collection of files plus a manifest. Bundle IDs are stable and never reused.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manifest</CardTitle>
          <CardDescription>Bundle identity and role in the curriculum.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Bundle ID</Label>
            <Input value={bundleId} onChange={(e) => setBundleId(e.target.value)} placeholder="e.g. cs201-2025-spring" />
          </div>
          <div className="space-y-1.5">
            <Label>Course ID</Label>
            <Input value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="e.g. CS201" />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'course_material' | 'background_resource')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="course_material">Course material</SelectItem>
                <SelectItem value="background_resource">Background resource</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Version</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Instructor ID</Label>
            <Input value={instructorId} onChange={(e) => setInstructorId(e.target.value)} placeholder="instructor name or id" />
          </div>
          <div className="flex items-end gap-2 pb-1">
            <Switch id="heldout" checked={isHeldOut} onCheckedChange={setIsHeldOut} />
            <Label htmlFor="heldout">Held-out bundle (generalization test)</Label>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Files</CardTitle>
            <CardDescription>
              Upload PDF, PPTX, DOCX, HTML or text files (text is extracted in your browser), paste content, or use a
              URL. Leave content empty to register an image-only file that requires OCR.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload files
              <input
                type="file"
                multiple
                accept=".pdf,.pptx,.docx,.txt,.md,.csv,.html,.htm"
                className="hidden"
                onChange={(e) => {
                  void onFilesSelected(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
            <Button variant="outline" size="sm" onClick={() => setFiles((p) => [...p, { ...EMPTY_FILE }])}>
              <Plus className="h-4 w-4" /> Add blank
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {files.map((f, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <div className="grid grid-cols-[1fr_130px_110px_90px_36px] items-end gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">File name</Label>
                  <Input value={f.name} onChange={(e) => updateFile(i, { name: e.target.value })} placeholder="lecture03.pdf" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={f.fileType} onValueChange={(v) => updateFile(i, { fileType: v as FileRow['fileType'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="pptx">PPTX</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                      <SelectItem value="text">Plain text</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Language</Label>
                  <Select value={f.languageHint} onValueChange={(v) => updateFile(i, { languageHint: v as FileRow['languageHint'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">OCR pages</Label>
                  <Input value={f.ocrPages} onChange={(e) => updateFile(i, { ocrPages: e.target.value })} placeholder="0" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove file"
                  onClick={() => setFiles((p) => (p.length > 1 ? p.filter((_, k) => k !== i) : p))}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Content</Label>
                <Textarea
                  value={f.content}
                  onChange={(e) => updateFile(i, { content: e.target.value })}
                  rows={4}
                  placeholder={f.fileType === 'url' ? 'https://…' : 'Paste the file text here…'}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          ))}
          {uploadNotes.length > 0 ? (
            <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {uploadNotes.map((n, i) => (
                <div key={i}>{n}</div>
              ))}
            </div>
          ) : null}
          {error ? <div className="text-sm text-rose-600 dark:text-rose-400">{error}</div> : null}
          <Button onClick={submit} disabled={create.loading || !bundleId || !courseId}>
            {create.loading ? 'Creating…' : 'Create bundle'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

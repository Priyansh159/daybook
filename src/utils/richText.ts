import DOMPurify from 'dompurify'

// Kept separate from RichText.tsx (which pulls in the full Tiptap/React
// editor) so that shared, non-editor code — like zod validation — doesn't
// drag the editor bundle into every page that validates a task.
//
// Tags/attrs must match what Tiptap's own serializer emits for the extensions
// configured in RichText.tsx (StarterKit lists + TaskList/TaskItem's
// `<ul data-type><li data-type data-checked><label><input><span></label><div>`
// structure) — stripping any of these would corrupt saved checklists.
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 's', 'ul', 'ol', 'li', 'span', 'label', 'input', 'div']
const ALLOWED_ATTR = ['style', 'data-type', 'data-checked', 'type']

export function sanitizeTaskHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}

// Tiptap emits "<p></p>" for an empty doc rather than "" — treat both as empty.
export function isRichTextEmpty(html: string | null | undefined): boolean {
  if (!html) return true
  return sanitizeTaskHtml(html).replace(/<p>\s*<\/p>/g, '').trim() === ''
}

// For truncated, single-line previews (e.g. a task card) where markup would
// otherwise show up as literal tags.
export function richTextToPlainText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).replace(/\s+/g, ' ').trim()
}

// Counts checklist items in a task's saved HTML to drive a progress bar.
// `data-checked` only ever appears on taskItem `<li>`s in our serialized
// format, so a plain string count avoids pulling in a DOM parser for this.
export function getChecklistProgress(html: string | null | undefined): { done: number; total: number } | null {
  if (!html) return null
  const total = (html.match(/data-type="taskItem"/g) ?? []).length
  if (total === 0) return null
  const done = (html.match(/data-checked="true"/g) ?? []).length
  return { done, total }
}

const HAS_HTML_TAG = /<\/?[a-z][^>]*>/i
const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Tasks created before the rich text editor stored description as plain text
// with raw newlines (rendered via `white-space: pre-wrap`). Feeding that
// straight into Tiptap collapses every newline into a single run-on line, so
// anything that isn't already markup gets its blank-line-separated blocks
// turned into paragraphs and single newlines into <br> — a one-time, read-only
// upgrade; the next save through the editor persists real HTML instead.
export function ensureTaskHtml(value: string): string {
  if (!value) return ''
  if (HAS_HTML_TAG.test(value)) return value
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

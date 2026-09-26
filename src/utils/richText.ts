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

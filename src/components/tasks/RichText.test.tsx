import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RichTextEditor, RichTextView } from './RichText'
import { isRichTextEmpty, richTextToPlainText, sanitizeTaskHtml } from '@/utils/richText'

describe('richText utils', () => {
  it('treats an empty tiptap doc as empty', () => {
    expect(isRichTextEmpty('')).toBe(true)
    expect(isRichTextEmpty(null)).toBe(true)
    expect(isRichTextEmpty('<p></p>')).toBe(true)
    expect(isRichTextEmpty('<p>Hello</p>')).toBe(false)
  })

  it('strips disallowed tags/attributes but keeps checklist structure and formatting', () => {
    const dirty =
      '<p onclick="alert(1)">Hi <script>alert(2)</script><strong>there</strong></p>' +
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="true">' +
      '<label><input type="checkbox" checked><span></span></label><div><p>Done</p></div></li></ul>'
    const clean = sanitizeTaskHtml(dirty)
    expect(clean).not.toContain('onclick')
    expect(clean).not.toContain('<script>')
    expect(clean).toContain('<strong>there</strong>')
    expect(clean).toContain('data-type="taskList"')
    expect(clean).toContain('data-checked="true"')
    expect(clean).toContain('<input type="checkbox">')
  })

  it('extracts readable plain text for previews', () => {
    const html = '<ul data-type="taskList"><li data-checked="true"><label></label><div><p>Ship it</p></div></li></ul>'
    expect(richTextToPlainText(html)).toBe('Ship it')
  })
})

describe('RichTextEditor', () => {
  it('reports updated HTML via onChange when a toolbar action is used', () => {
    const onChange = vi.fn()
    render(<RichTextEditor value="<p>Hello</p>" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Bullet list' }))

    expect(onChange).toHaveBeenCalled()
    const html = onChange.mock.calls.at(-1)?.[0] as string
    expect(html).toContain('<ul>')
    expect(html).toContain('Hello')
  })
})

describe('RichTextView', () => {
  it('lets a viewer toggle a checklist item and reports the updated HTML back', () => {
    const onToggleItem = vi.fn()
    const html =
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="false">' +
      '<label><input type="checkbox"><span></span></label><div><p>Subtask one</p></div></li></ul>'
    render(<RichTextView html={html} onToggleItem={onToggleItem} />)

    fireEvent.click(screen.getByRole('checkbox'))

    expect(onToggleItem).toHaveBeenCalledTimes(1)
    const nextHtml = onToggleItem.mock.calls[0]?.[0] as string
    expect(nextHtml).toContain('data-checked="true"')
    expect(nextHtml).toContain('Subtask one')
  })

  it('does nothing when no toggle handler is given (fully static view)', () => {
    const html =
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="false">' +
      '<label><input type="checkbox"><span></span></label><div><p>Subtask one</p></div></li></ul>'
    render(<RichTextView html={html} />)

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    fireEvent.click(checkbox)

    expect(checkbox.checked).toBe(false)
  })
})

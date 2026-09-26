import { useEffect } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { cn } from '@/utils/cn'
import { sanitizeTaskHtml } from '@/utils/richText'

// Shared node/mark set for both the editable form field and the read-only
// detail view — must match so content saved by one renders the same in the other.
function richTextExtensions() {
  return [
    StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
    TextStyle,
    Color.configure({ types: ['textStyle'] }),
    TaskList,
    TaskItem.configure({ nested: true }),
  ]
}

const TEXT_COLORS: Array<{ label: string; value: string | null }> = [
  { label: 'Default', value: null },
  { label: 'Red', value: '#dc2626' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Purple', value: '#7c3aed' },
]

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700',
        active && 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100',
      )}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-lg border-b border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
      <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
      <ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        •
      </ToolbarButton>
      <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </ToolbarButton>
      <ToolbarButton label="Checklist" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        ☑
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
      {TEXT_COLORS.map((color) => (
        <button
          key={color.label}
          type="button"
          title={color.label}
          aria-label={`Text color: ${color.label}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            color.value ? editor.chain().focus().setColor(color.value).run() : editor.chain().focus().unsetColor().run()
          }
          className={cn(
            'h-5 w-5 shrink-0 rounded-full border',
            color.value === null && 'bg-white dark:bg-slate-900',
            editor.isActive('textStyle', { color: color.value ?? undefined }) &&
              'ring-2 ring-brand-500 ring-offset-1 ring-offset-slate-50 dark:ring-offset-slate-800',
          )}
          style={{ backgroundColor: color.value ?? undefined, borderColor: color.value ?? '#94a3b8' }}
        />
      ))}
    </div>
  )
}

type EditorProps = {
  id?: string
  value: string
  onChange: (html: string) => void
  invalid?: boolean
}

export function RichTextEditor({ id, value, onChange, invalid }: EditorProps) {
  const editor = useEditor({
    extensions: richTextExtensions(),
    content: value || '',
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: 'rte-content min-h-[160px] px-3 py-2 text-sm focus:outline-none',
        'aria-invalid': invalid ? 'true' : 'false',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() === value) return
    editor.commands.setContent(value || '', { emitUpdate: false })
    // Only resync when the value changes from outside this editor instance
    // (e.g. the form resetting to a different task) — onUpdate above keeps
    // `value` and the editor's own HTML in lockstep while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20',
        'dark:border-slate-700 dark:bg-slate-900',
        invalid && 'border-red-400 dark:border-red-500',
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export function RichTextView({
  html,
  onToggleItem,
}: {
  html: string
  onToggleItem?: (nextHtml: string) => void
}) {
  const interactive = Boolean(onToggleItem)

  // Checkboxes stay clickable (and keyboard-toggleable) while everything else
  // stays read-only — rather than disabling the editor outright, every DOM
  // path that could mutate text is swallowed, so the built-in TaskItem
  // checkbox handler (which needs `editable: true` to use its reliable,
  // position-based toggle instead of the reference-matching read-only
  // fallback) is the only thing left that can still change the doc. This is
  // what lets a viewer "cross off" a subtask from the task detail view
  // without opening edit mode.
  const editor = useEditor({
    extensions: richTextExtensions(),
    editable: interactive,
    content: html,
    editorProps: {
      attributes: { class: 'rte-content rte-content--view text-sm' },
      handleKeyDown: (_view, event) => (event.target as HTMLElement | null)?.tagName !== 'INPUT',
      handleTextInput: () => true,
      handleDrop: () => true,
      handlePaste: () => true,
    },
    onUpdate: ({ editor }) => onToggleItem?.(sanitizeTaskHtml(editor.getHTML())),
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() === html) return
    editor.commands.setContent(html, { emitUpdate: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, editor])

  return <EditorContent editor={editor} />
}

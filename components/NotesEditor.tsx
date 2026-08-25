'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import { useEffect, useState } from 'react'
import { Chart } from 'chart.js/auto'

interface NotesEditorProps {
  value: string
  onChange?: (html: string) => void
  editable?: boolean
}

const CHART_COLORS = ['#A50021', '#00538C', '#2E7D32', '#8a6400', '#697077', '#1F3864']

export default function NotesEditor({ value, onChange, editable = true }: NotesEditorProps) {
  const [showChartForm, setShowChartForm] = useState(false)
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar')
  const [chartLabels, setChartLabels] = useState('')
  const [chartValues, setChartValues] = useState('')

  const editor = useEditor({
    extensions: [StarterKit, Table.configure({ resizable: false }), TableRow, TableHeader, TableCell, Image],
    content: value || '',
    editable,
    onUpdate: ({ editor }) => { if (onChange) onChange(editor.getHTML()) },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable)
  }, [editable, editor])

  if (!editor) return null

  function insertChart() {
    const labels = chartLabels.split(',').map(s => s.trim()).filter(Boolean)
    const values = chartValues.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))
    if (labels.length === 0 || values.length === 0) return
    const canvas = document.createElement('canvas')
    canvas.width = 480
    canvas.height = 280
    const chart = new Chart(canvas, {
      type: chartType,
      data: { labels, datasets: [{ label: 'Data', data: values, backgroundColor: CHART_COLORS, borderColor: chartType === 'line' ? CHART_COLORS[1] : CHART_COLORS, borderWidth: chartType === 'line' ? 2 : 1 }] },
      options: { responsive: false, animation: false, plugins: { legend: { display: chartType === 'pie' } } },
    })
    const dataUrl = canvas.toDataURL('image/png')
    chart.destroy()
    editor?.chain().focus().setImage({ src: dataUrl }).run()
    setShowChartForm(false)
    setChartLabels('')
    setChartValues('')
  }

  return (
    <div style={editable ? { border: '1px solid #CCCCCC', borderRadius: '5px', background: '#fff' } : {}}>
      {editable && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', padding: '6px', borderBottom: '1px solid #CCCCCC', background: '#F4F5F6' }}>
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={toolBtnStyle(editor.isActive('bold'))}><b>B</b></button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={toolBtnStyle(editor.isActive('italic'))}><i>I</i></button>
          <div style={sepStyle} />
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={toolBtnStyle(editor.isActive('bulletList'))}>• ≡</button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={toolBtnStyle(editor.isActive('orderedList'))}>1. ≡</button>
          <div style={sepStyle} />
          <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} style={toolBtnStyle(false)}>▦ Table</button>
          <button type="button" onClick={() => setShowChartForm(v => !v)} style={toolBtnStyle(showChartForm)}>📊 Chart</button>
        </div>
      )}
      {showChartForm && (
        <div style={{ padding: '10px', borderBottom: '1px solid #CCCCCC', background: '#F4F5F6', display: 'grid', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={chartType} onChange={e => setChartType(e.target.value as any)} style={{ fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '5px' }}>
              <option value="bar">Bar</option><option value="line">Line</option><option value="pie">Pie</option>
            </select>
            <input placeholder="Labels (comma separated)" value={chartLabels} onChange={e => setChartLabels(e.target.value)} style={{ flex: 1, fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
            <input placeholder="Values (comma separated)" value={chartValues} onChange={e => setChartValues(e.target.value)} style={{ flex: 1, fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" onClick={insertChart} style={{ padding: '5px 12px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Insert</button>
            <button type="button" onClick={() => setShowChartForm(false)} style={{ padding: '5px 12px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ padding: editable ? '10px 12px' : '0', fontSize: '12px', minHeight: editable ? '80px' : 'auto', color: editable ? '#323E48' : '#697077', lineHeight: editable ? 'normal' : 1.7 }}>
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .ProseMirror { outline: none; font-family: Roboto, sans-serif; }
        .ProseMirror p { margin: 0 0 8px 0; }
        .ProseMirror ul, .ProseMirror ol { margin: 0 0 8px 20px; padding: 0; }
        .ProseMirror table { border-collapse: collapse; margin: 8px 0; width: 100%; }
        .ProseMirror table td, .ProseMirror table th { border: 1px solid #CCCCCC; padding: 6px 8px; font-size: 12px; }
        .ProseMirror table th { background: #F4F5F6; font-weight: 700; }
        .ProseMirror img { max-width: 100%; border-radius: 4px; margin: 8px 0; }
      `}</style>
    </div>
  )
}

function toolBtnStyle(active: boolean): React.CSSProperties {
  return { minWidth: '28px', height: '26px', padding: '0 8px', border: 'none', borderRadius: '4px', background: active ? '#E9F0FA' : 'transparent', color: active ? '#00538C' : '#323E48', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }
}
const sepStyle: React.CSSProperties = { width: '1px', background: '#CCCCCC', margin: '3px 2px' }

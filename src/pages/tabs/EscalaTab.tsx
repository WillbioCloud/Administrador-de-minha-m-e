import { useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Eraser, GripVertical, Loader2, Sparkles, Trash2, Users } from 'lucide-react'
import type { DayMark, Employee, Schedule } from '../../types'
import { buildDateArray, C, DAY_ABBR, MONTH_NAMES, TODAY_ISO } from '../patyHelpCore'
import { Avatar, FLabel, TypeBadge, addBtnSt, iconEditBtnSt, inputSt, outlineBtnSt, primaryBtnSt } from '../patyHelpUi'

interface EscalaProps {
  employees: Employee[]; schedule: Schedule
  violations: Record<number, Set<string>>; hasViolations: boolean
  viewYear: number; viewMonth: number
  setViewYear: (y: number) => void; setViewMonth: (m: number) => void
  onToggleCell: (empId: number, dateISO: string) => void
  onOpenVacation: (emp: Employee) => void
  onReorder: (fromId: number, toId: number) => void
  onDragToDay: (empId: number, dateISO: string) => void
  onClearFolgas: () => void
  onAIReview: () => void
  aiLoading: boolean
}

export function EscalaTab({ employees, schedule, violations, hasViolations, viewYear, viewMonth, setViewYear, setViewMonth, onToggleCell, onOpenVacation, onReorder, onDragToDay, onClearFolgas, onAIReview, aiLoading }: EscalaProps) {
  const dragIdRef = useRef<number | null>(null)
  const scrollWrapRef = useRef<HTMLDivElement>(null)
  const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const dragOverX = useRef(0)

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const getDateISO = (d: number) => `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const getDow = (d: number) => new Date(viewYear, viewMonth, d).getDay()
  const isWeekend = (d: number) => { const w = getDow(d); return w === 0 || w === 6 }
  const isToday = (d: number) => getDateISO(d) === TODAY_ISO

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) } else setViewMonth(viewMonth - 1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) } else setViewMonth(viewMonth + 1) }
  const goToday = () => { setViewYear(new Date().getFullYear()); setViewMonth(new Date().getMonth()) }

  const startScroll = () => {
    if (scrollInterval.current) return
    scrollInterval.current = setInterval(() => {
      const el = scrollWrapRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const ZONE = 100
      const SPEED = 18
      if (dragOverX.current - rect.left < ZONE) el.scrollLeft -= SPEED
      if (rect.right - dragOverX.current < ZONE) el.scrollLeft += SPEED
    }, 16)
  }

  const stopScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current)
      scrollInterval.current = null
    }
  }

  const handleWrapDragOver = (e: React.DragEvent) => {
    e.preventDefault(); dragOverX.current = e.clientX; startScroll()
  }

  const handleNameDrop = (targetEmpId: number) => {
    stopScroll()
    const fromId = dragIdRef.current
    dragIdRef.current = null
    if (fromId !== null && fromId !== targetEmpId) onReorder(fromId, targetEmpId)
  }

  const roles = [...new Set(employees.map(e => e.role))]

  if (employees.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textLight }}>
      <Users size={40} strokeWidth={1.5} style={{ marginBottom: 12 }} />
      <div style={{ fontWeight: 600, fontSize: 15 }}>Nenhum funcionário cadastrado</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <span className="ph-section-label" style={{ marginBottom: 0 }}>Escala mensal</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={onAIReview} disabled={aiLoading} style={{ ...addBtnSt, background: hasViolations ? C.violation : C.info, gap: 6 }}>
            {aiLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
            {hasViolations ? 'Violações detectadas' : 'Revisar com IA'}
          </button>
          <button onClick={onClearFolgas} style={{ ...addBtnSt, background: C.card, color: C.textMid, border: `1px solid ${C.border}` }}>
            <Eraser size={14} /> Limpar folgas
          </button>
          <button onClick={goToday} style={{ ...outlineBtnSt, width: 'auto', padding: '6px 12px', fontSize: 12 }}>Hoje</button>
          <button onClick={prevMonth} style={iconEditBtnSt}><ChevronLeft size={15} /></button>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.text, minWidth: 130, textAlign: 'center' }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} style={iconEditBtnSt}><ChevronRight size={15} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { bg: C.dangerLight, border: '#F0B0B0', color: C.danger, text: 'F', label: 'Folga — clique para marcar/remover' },
          { bg: C.vacationLight, border: '#E8D060', color: '#8B6A00', text: 'FÉR', label: 'Férias' },
          { bg: C.violationLight, border: '#FF6B00', color: C.violation, text: '!', label: '+7 dias seguidos' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.textMid }}>
            <div style={{ minWidth: 20, height: 20, borderRadius: 4, background: l.bg, border: `1px solid ${l.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: l.color }}>{l.text}</div>
            {l.label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.textMid }}>
          <GripVertical size={14} color={C.textLight} /> Arraste nome → reorder &nbsp;|&nbsp; Arraste nome → dia → agendar folga
        </div>
      </div>

      <div ref={scrollWrapRef} className="ph-escala-wrap" onDragOver={handleWrapDragOver} onDragLeave={stopScroll} onDrop={stopScroll}>
        <table className="ph-escala-table">
          <thead><tr>
            <th className="ph-escala-name-col" style={{ background: C.nav, color: '#FFF5EE', fontSize: 10, fontWeight: 700, padding: '9px 14px', textAlign: 'left', borderRight: `2px solid rgba(255,255,255,0.15)`, letterSpacing: '0.5px' }}>FUNCIONÁRIO</th>
            {days.map(d => {
              const dow = getDow(d); const weekend = isWeekend(d); const today = isToday(d)
              return <th key={d} style={{ background: today ? C.accent : weekend ? '#2D1208' : C.nav, color: today ? '#FFF' : weekend ? '#F0A07A' : '#C0A090', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: '4px 0', width: 32, minWidth: 32, borderRight: `1px solid rgba(255,255,255,0.08)` }}><div style={{ fontSize: 8, lineHeight: 1, marginBottom: 2 }}>{DAY_ABBR[dow]}</div><div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1 }}>{d}</div></th>
            })}
          </tr></thead>
          <tbody>
            {roles.map(role => (
              <>
                <tr key={`g-${role}`}><td colSpan={daysInMonth + 1} style={{ background: '#F4EFE9', padding: '6px 14px', fontSize: 11, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.6px', borderTop: `2px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>{role}</td></tr>
                {employees.filter(e => e.role === role).map(emp => {
                  const hasViolation = !!violations[emp.id]?.size
                  return (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}`, background: hasViolation ? '#FFF8F5' : 'transparent' }}>
                      <td className="ph-escala-name-col-td" draggable onDragStart={() => { dragIdRef.current = emp.id }} onDragEnd={stopScroll} onDragOver={e => e.preventDefault()} onDrop={() => handleNameDrop(emp.id)} style={{ cursor: 'grab', background: hasViolation ? '#FFF0EC' : '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px' }}>
                          <GripVertical size={13} color={hasViolation ? C.violation : C.border} strokeWidth={2} style={{ flexShrink: 0 }} />
                          <Avatar emp={emp} size={26} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 12, color: hasViolation ? C.violation : C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name.split(' ').slice(0, 2).join(' ')}</div>
                            <TypeBadge type={emp.type} small />
                          </div>
                          <button onClick={() => onOpenVacation(emp)} title="Editar férias" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, padding: '2px', flexShrink: 0 }}><Calendar size={12} strokeWidth={2} /></button>
                        </div>
                      </td>
                      {days.map(d => {
                        const dateISO = getDateISO(d)
                        const mark = (schedule[emp.id]?.[dateISO] as DayMark | undefined) ?? null
                        const weekend = isWeekend(d); const today = isToday(d)
                        const isVac = mark === 'vacation'; const isF = mark === 'folga'; const isViol = violations[emp.id]?.has(dateISO)

                        let bg = weekend ? '#FAF6F2' : '#FFFFFF'
                        if (today && !mark) bg = '#FFF8F4'
                        if (isF) bg = C.dangerLight
                        if (isVac) bg = C.vacationLight
                        if (isViol && !isF && !isVac) bg = C.violationLight

                        return (
                          <td key={d} className={`ph-escala-day-cell${isVac ? ' vacation' : ''}`} onClick={() => !isVac && onToggleCell(emp.id, dateISO)} onDragOver={e => { e.preventDefault(); e.stopPropagation() }} onDrop={e => { e.preventDefault(); e.stopPropagation(); stopScroll(); const fromId = dragIdRef.current; dragIdRef.current = null; if (fromId !== null) onDragToDay(fromId, dateISO) }} title={isViol ? '⚠ Mais de 7 dias seguidos' : undefined}
                            style={{ background: bg, color: isVac ? '#8B6A00' : isF ? C.danger : isViol ? C.violation : 'transparent', fontWeight: 800, fontSize: isVac ? 8 : 11, borderRight: today ? `1px solid ${C.accent}40` : `1px solid ${C.border}`, boxShadow: isViol && !isF && !isVac ? `inset 0 0 0 1px ${C.violation}50` : undefined }}>
                            {isVac ? 'FÉR' : isF ? 'F' : isViol ? '!' : ''}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ClearFolgasProps {
  viewYear: number; viewMonth: number; schedule: Schedule; employees: Employee[]
  onConfirm: (start: string, end: string) => void; onCancel: () => void
}

export function ClearFolgasForm({ viewYear, viewMonth, schedule, employees, onConfirm, onCancel }: ClearFolgasProps) {
  const firstDay = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-01`
  const lastDay = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${new Date(viewYear, viewMonth + 1, 0).getDate()}`
  const [start, setStart] = useState(firstDay)
  const [end, setEnd] = useState(lastDay)

  const dates = start && end && end >= start ? buildDateArray(start, end) : []
  const count = dates.reduce((acc, d) => acc + employees.filter(e => schedule[e.id]?.[d] === 'folga').length, 0)

  return (
    <div>
      <div style={{ fontSize: 13, color: C.textMid, marginBottom: 18, lineHeight: 1.6 }}>Apaga todas as marcações de <strong>Folga</strong> no período selecionado. Férias não são afetadas.</div>
      <FLabel>De que dia:</FLabel>
      <input type="date" value={start} min={firstDay} max={lastDay} onChange={e => setStart(e.target.value)} style={inputSt} />
      <FLabel style={{ marginTop: 12 }}>Até que dia:</FLabel>
      <input type="date" value={end} min={start || firstDay} max={lastDay} onChange={e => setEnd(e.target.value)} style={inputSt} />

      {dates.length > 0 && (
        <div style={{ marginTop: 14, padding: '12px 14px', background: count > 0 ? C.warningLight : C.successLight, borderRadius: 12, fontSize: 13, color: count > 0 ? C.warning : C.success, fontWeight: 600 }}>
          {count > 0 ? `${count} marcação(ões) de folga serão removidas em ${dates.length} dia(s)` : 'Nenhuma folga marcada no período selecionado'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
        <button onClick={onCancel} style={{ ...outlineBtnSt, width: 'auto' }}>Cancelar</button>
        <button onClick={() => count > 0 && onConfirm(start, end)} disabled={count === 0 || !start || !end || end < start} style={{ ...primaryBtnSt, width: 'auto', background: count > 0 ? C.danger : C.border, opacity: count === 0 ? 0.6 : 1 }}>
          <Trash2 size={15} /> Limpar {count > 0 ? `(${count})` : ''}
        </button>
      </div>
    </div>
  )
}
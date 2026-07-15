import { Fragment, useRef, useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Eraser, GripVertical, Loader2, Sparkles, Trash2, Users, MessageSquare, Send, X, Settings2, Bot, User } from 'lucide-react'
import type { DayMark, Employee, Schedule, ChatMessage } from '../../types'
import { buildDateArray, C, DAY_ABBR, MONTH_NAMES, TODAY_ISO } from '../patyHelpCore'
import { Avatar, FLabel, TypeBadge, addBtnSt, iconEditBtnSt, inputSt, outlineBtnSt, primaryBtnSt, BottomSheet } from '../patyHelpUi'

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
  isChatOpen: boolean
  setIsChatOpen: (v: boolean) => void
  chatHistory: ChatMessage[]
  onSendMessage: (msg: string) => void
  customAiRules: string
  setCustomAiRules: (v: string) => void
  scaleMode: string
  setScaleMode: (v: any) => void
}

export function EscalaTab({ employees, schedule, violations, hasViolations, viewYear, viewMonth, setViewYear, setViewMonth, onToggleCell, onOpenVacation, onReorder, onDragToDay, onClearFolgas, onAIReview, aiLoading, isChatOpen, setIsChatOpen, chatHistory, onSendMessage, customAiRules, setCustomAiRules, scaleMode, setScaleMode }: EscalaProps) {
  const dragIdRef = useRef<number | null>(null)
  const [scaleModalOpen, setScaleModalOpen] = useState(false)
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
    <div className="ph-escala-layout" style={{ display: 'flex', gap: 16, height: '100%', alignItems: 'flex-start' }}>
      <div className="ph-escala-main" style={{ flex: 1, minWidth: 0, width: '100%' }}>
        <div className="ph-escala-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <span className="ph-section-label" style={{ marginBottom: 0 }}>Escala mensal</span>
          <div className="ph-escala-toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setScaleModalOpen(true)} className="ph-action-btn" title="Configurar Escala (ex: 5x1, 6x1)" style={{ ...addBtnSt, background: C.card, color: C.text, border: `1px solid ${C.border}` }}>
              <Settings2 size={14} color={C.textMid} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Escala {scaleMode}</span>
            </button>
            <button onClick={() => setIsChatOpen(!isChatOpen)} className="ph-chat-toggle-btn" style={{ ...addBtnSt, background: isChatOpen ? C.infoLight : C.card, color: isChatOpen ? C.info : C.text, border: `1px solid ${isChatOpen ? C.info : C.border}` }}>
              <MessageSquare size={14} color={isChatOpen ? C.info : C.textMid} /> 
              <span style={{ fontSize: 13, fontWeight: 600 }}>IA Chat</span>
            </button>
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

      <div className="ph-escala-legend" style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { bg: C.dangerLight, border: '#F0B0B0', color: C.danger, text: 'F', label: 'Folga — clique para marcar/remover' },
          { bg: C.vacationLight, border: '#E8D060', color: '#8B6A00', text: 'FÉR', label: 'Férias' },
          { bg: C.violationLight, border: '#FF6B00', color: C.violation, text: '!', label: `+${scaleMode === '12x36' ? 1 : (scaleMode === '6x1' ? 6 : 5)} dias seguidos` },
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
              <Fragment key={`role-${role}`}>
                <tr><td colSpan={daysInMonth + 1} style={{ background: '#F4EFE9', padding: '6px 14px', fontSize: 11, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.6px', borderTop: `2px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>{role}</td></tr>
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
                          <td key={d} className={`ph-escala-day-cell${isVac ? ' vacation' : ''}`} onClick={() => !isVac && onToggleCell(emp.id, dateISO)} onDragOver={e => { e.preventDefault(); e.stopPropagation() }} onDrop={e => { e.preventDefault(); e.stopPropagation(); stopScroll(); const fromId = dragIdRef.current; dragIdRef.current = null; if (fromId !== null) onDragToDay(fromId, dateISO) }} title={isViol ? '⚠ Mais de 6 dias seguidos' : undefined}
                            style={{ background: bg, color: isVac ? '#8B6A00' : isF ? C.danger : isViol ? C.violation : 'transparent', fontWeight: 800, fontSize: isVac ? 8 : 11, borderRight: today ? `1px solid ${C.accent}40` : `1px solid ${C.border}`, boxShadow: isViol && !isF && !isVac ? `inset 0 0 0 1px ${C.violation}50` : undefined }}>
                            {isVac ? 'FÉR' : isF ? 'F' : isViol ? '!' : ''}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {/* Desktop Chat Sidebar */}
      {isChatOpen && (
        <div className="ph-chat-sidebar-desktop">
          <ChatPanel 
            chatHistory={chatHistory} 
            onSendMessage={onSendMessage} 
            aiLoading={aiLoading} 
            onClose={() => setIsChatOpen(false)}
            customAiRules={customAiRules}
            setCustomAiRules={setCustomAiRules}
          />
        </div>
      )}

      {/* Mobile Chat Bottom Sheet */}
      {isChatOpen && (
        <div className="ph-chat-mobile-sheet">
          <BottomSheet onClose={() => setIsChatOpen(false)} title="Assistente de Escala">
            <div style={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
              <ChatPanel 
                chatHistory={chatHistory} 
                onSendMessage={onSendMessage} 
                aiLoading={aiLoading} 
                onClose={() => setIsChatOpen(false)}
                customAiRules={customAiRules}
                setCustomAiRules={setCustomAiRules}
                isMobile
              />
            </div>
          </BottomSheet>
        </div>
      )}

      {/* Modal Scale Mode */}
      {scaleModalOpen && (
        <BottomSheet onClose={() => setScaleModalOpen(false)} title="Modo de Escala Global">
          <div style={{ marginBottom: 16, fontSize: 14, color: C.textMid }}>
            Defina o padrão de escala para que o sistema alerte sobre adiantamento ou excesso de dias de trabalho.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: '6x1', label: '6x1 (Trabalha 6, Folga 1)' },
              { id: '5x1', label: '5x1 (Trabalha 5, Folga 1)' },
              { id: '5x2', label: '5x2 (Trabalha 5, Folga 2)' },
              { id: '12x36', label: '12x36 (Trabalha 1, Folga 1)' }
            ].map(m => (
              <button 
                key={m.id} 
                onClick={() => { setScaleMode(m.id); setScaleModalOpen(false) }}
                style={{
                  padding: 14, borderRadius: 8, border: `1px solid ${scaleMode === m.id ? C.accent : C.border}`,
                  background: scaleMode === m.id ? C.accentLight : C.card,
                  color: scaleMode === m.id ? C.accent : C.text,
                  fontWeight: scaleMode === m.id ? 700 : 500,
                  textAlign: 'left', cursor: 'pointer'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

function ChatPanel({ 
  chatHistory, onSendMessage, aiLoading, onClose, customAiRules, setCustomAiRules, isMobile 
}: { 
  chatHistory: ChatMessage[], onSendMessage: (msg: string) => void, aiLoading: boolean, onClose: () => void, customAiRules: string, setCustomAiRules: (v: string) => void, isMobile?: boolean 
}) {
  const [msg, setMsg] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleSend = () => {
    if (!msg.trim() || aiLoading) return
    onSendMessage(msg)
    setMsg('')
  }

  return (
    <div className="ph-chat-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', borderRadius: isMobile ? 0 : 16, border: isMobile ? 'none' : `1px solid ${C.border}`, overflow: 'hidden' }}>
      {!isMobile && (
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.nav }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 600, fontSize: 14 }}>
            <Bot size={18} color={C.infoLight} /> Assistente de Escala
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: showSettings ? 1 : 0.6, padding: 4 }}>
              <Settings2 size={16} />
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.6, padding: 4 }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      {isMobile && (
        <div style={{ padding: '0 0 10px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowSettings(!showSettings)} style={{ ...outlineBtnSt, width: 'auto', padding: '6px 12px', fontSize: 12 }}>
            <Settings2 size={14} /> Regras Customizadas
          </button>
        </div>
      )}

      {showSettings && (
        <div style={{ padding: '16px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          <FLabel style={{ fontSize: 12, color: C.textMid, marginBottom: 8 }}>Regras fixas para a IA (ex: Domingos são sagrados)</FLabel>
          <textarea 
            value={customAiRules} 
            onChange={e => setCustomAiRules(e.target.value)}
            placeholder="Digite aqui regras importantes..."
            style={{ ...inputSt, minHeight: 80, resize: 'vertical' }}
          />
        </div>
      )}

      <div className="ph-chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {chatHistory.map((m, i) => {
          const isUser = m.role === 'user'
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, maxWidth: '90%' }}>
                {!isUser && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.infoLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={16} color={C.info} />
                  </div>
                )}
                <div style={{ 
                  padding: '10px 14px', 
                  borderRadius: 16, 
                  borderBottomRightRadius: isUser ? 4 : 16,
                  borderBottomLeftRadius: !isUser ? 4 : 16,
                  background: isUser ? C.accent : '#f4f4f4',
                  color: isUser ? '#fff' : C.text,
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {m.content}
                </div>
              </div>
            </div>
          )
        })}
        {aiLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMid, fontSize: 12 }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> IA digitando...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="ph-chat-input-area" style={{ padding: '14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, background: '#fff' }}>
        <input 
          value={msg}
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Peça para reorganizar a escala..."
          style={{ ...inputSt, flex: 1, borderRadius: 20, paddingLeft: 16 }}
        />
        <button 
          onClick={handleSend}
          disabled={!msg.trim() || aiLoading}
          style={{ width: 40, height: 40, borderRadius: '50%', background: msg.trim() && !aiLoading ? C.accent : '#e0e0e0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: msg.trim() && !aiLoading ? 'pointer' : 'default', transition: 'background 0.2s' }}
        >
          <Send size={18} style={{ marginLeft: -2 }} />
        </button>
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
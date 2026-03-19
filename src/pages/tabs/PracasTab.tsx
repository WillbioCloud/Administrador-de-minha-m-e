import {
  AlertTriangle, ChevronLeft, ChevronRight,
  Pencil, Pin, Plus, RefreshCw,
  Trash2, UtensilsCrossed, UserPlus, X,
} from 'lucide-react'
import { useState } from 'react'
import type { Employee, Station, StationAssignmentMap, ViewMode } from '../../types'
import { C, DAY_ABBR, MONTH_NAMES, getEmpColor, getIcon } from '../patyHelpCore'
import { Avatar, StatusBadge, TypeBadge, addBtnSt, iconEditBtnSt, primaryBtnSt } from '../patyHelpUi'

// ─── Local date helpers ───────────────────────────────────────────────────────

const isoToDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const dateToISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const addDays = (iso: string, n: number) => {
  const d = isoToDate(iso); d.setDate(d.getDate() + n); return dateToISO(d)
}
const weekStart = (iso: string) => {          // Monday-aligned
  const d = isoToDate(iso)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dateToISO(d)
}
const monthStart = (iso: string) => iso.slice(0, 8) + '01'
const daysInMonth = (iso: string) => {
  const [y, m] = iso.split('-').map(Number); return new Date(y, m, 0).getDate()
}
const navigate = (iso: string, mode: ViewMode, dir: -1 | 1): string => {
  if (mode === 'dia')    return addDays(iso, dir)
  if (mode === 'semana') return addDays(iso, dir * 7)
  const [y, m] = iso.split('-').map(Number)
  const nd = new Date(y, m - 1 + dir, 1); return dateToISO(nd)
}
const periodLabel = (iso: string, mode: ViewMode): string => {
  const d = isoToDate(iso)
  if (mode === 'dia') {
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }
  if (mode === 'semana') {
    const wStart = weekStart(iso)
    const wEnd   = addDays(wStart, 6)
    const [,sm,sd] = wStart.split('-'); const [,em,ed] = wEnd.split('-')
    return `${sd}/${sm} – ${ed}/${em}`
  }
  const [y, m] = iso.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

// ─── RotativaBadge ────────────────────────────────────────────────────────────

function RotativaBadge({ rotativa }: { rotativa: boolean }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: rotativa ? C.infoLight : '#F0EEDC',
      color: rotativa ? C.info : '#5C5010',
    }}>
      {rotativa
        ? <><RefreshCw size={9} strokeWidth={2.5} />Rotativa</>
        : <><Pin size={9} strokeWidth={2.5} />Fixa</>}
    </span>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  stations: Station[]
  employees: Employee[]
  getEmployee: (id: number) => Employee | undefined
  stationAssignments: StationAssignmentMap   // date → stationId → empIds[]
  viewMode: ViewMode
  viewDate: string                           // canonical date (YYYY-MM-DD)
  onViewModeChange: (m: ViewMode) => void
  onViewDateChange: (d: string) => void
  // mode='replace'|'add', forDate only passed for rotativa
  onAssign: (stationId: number, mode: 'replace' | 'add', forDate?: string) => void
  onRemoveFixed: (stationId: number, empId: number) => void
  onRemoveForDate: (stationId: number, empId: number, date: string) => void
  onToggleRotativa: (stationId: number, current: boolean) => void
  onEdit: (s: Station) => void
  onDelete: (id: number) => void
  onAdd: () => void
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PracasTab({
  stations, employees, getEmployee, stationAssignments,
  viewMode, viewDate,
  onViewModeChange, onViewDateChange,
  onAssign, onRemoveFixed, onRemoveForDate,
  onToggleRotativa, onEdit, onDelete, onAdd,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const isToday = (d: string) => d === today

  // Effective period start for week/month navigation
  const periodStart = viewMode === 'semana' ? weekStart(viewDate)
    : viewMode === 'mes'    ? monthStart(viewDate)
    : viewDate

  // Get employees for a station on a specific date
  const getEmpsOn = (s: Station, date: string): Employee[] => {
    if (!s.isRotativa) {
      return s.assignedIds.map(id => getEmployee(id)).filter(Boolean) as Employee[]
    }
    const ids = stationAssignments[date]?.[s.id] ?? []
    return ids.map(id => getEmployee(id)).filter(Boolean) as Employee[]
  }

  // Build day arrays for week/month views
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart(viewDate), i))
  const monthDays = Array.from({ length: daysInMonth(viewDate) }, (_, i) =>
    `${viewDate.slice(0, 8)}${String(i + 1).padStart(2, '0')}`)

  // ── Shared station card header ──
  const StationHeader = ({ s, date }: { s: Station; date: string }) => {
    const StIcon  = getIcon(s.iconKey)
    const emps    = getEmpsOn(s, date)
    const covered = emps.length > 0
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <StIcon size={20} color={C.accent} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{s.name}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusBadge status={covered ? 'covered' : 'empty'} />
            <RotativaBadge rotativa={s.isRotativa} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <button onClick={() => onToggleRotativa(s.id, s.isRotativa)}
            title={s.isRotativa ? 'Tornar fixa' : 'Tornar rotativa'}
            style={{ ...iconEditBtnSt, background: s.isRotativa ? C.infoLight : '#F0EEDC', borderColor: s.isRotativa ? `${C.info}40` : '#D4D0A0' }}>
            {s.isRotativa
              ? <Pin size={12} strokeWidth={2} color={C.info} />
              : <RefreshCw size={12} strokeWidth={2} color="#5C5010" />}
          </button>
          <button onClick={() => onEdit(s)} style={iconEditBtnSt} title="Editar"><Pencil size={13} strokeWidth={2} /></button>
          <button onClick={() => setConfirmDelete(s.id)}
            style={{ ...iconEditBtnSt, background: C.dangerLight, borderColor: `${C.danger}40` }} title="Apagar">
            <Trash2 size={13} strokeWidth={2} color={C.danger} />
          </button>
        </div>
      </div>
    )
  }

  // ── Delete confirm inline ──
  const DeleteConfirm = ({ s }: { s: Station }) =>
    confirmDelete === s.id ? (
      <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}35`, borderRadius: 11, padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, color: C.danger, fontWeight: 600 }}>Apagar "{s.name}"?</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setConfirmDelete(null)}
            style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: C.textMid, fontFamily: 'DM Sans,sans-serif' }}>
            Não
          </button>
          <button onClick={() => { onDelete(s.id); setConfirmDelete(null) }}
            style={{ background: C.danger, border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>
            Apagar
          </button>
        </div>
      </div>
    ) : null

  // ── Employee list for a station on a date ──
  const EmpList = ({ s, date }: { s: Station; date: string }) => {
    const emps = getEmpsOn(s, date)
    const forDate = s.isRotativa ? date : undefined
    return emps.length > 0 ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {emps.map(emp => (
          <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 11, background: getEmpColor(emp.id).bg, border: `1px solid ${getEmpColor(emp.id).border}` }}>
            <Avatar emp={emp} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
              <div style={{ display: 'flex', gap: 5, marginTop: 1 }}>
                <span style={{ fontSize: 11, color: C.textMid }}>{emp.role}</span>
                <TypeBadge type={emp.type} small />
              </div>
            </div>
            <button
              onClick={() => s.isRotativa
                ? onRemoveForDate(s.id, emp.id, date)
                : onRemoveFixed(s.id, emp.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, padding: 4 }}>
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 11, background: C.dangerLight, marginBottom: 12 }}>
        <AlertTriangle size={15} color={C.danger} />
        <span style={{ fontSize: 13, color: C.danger, fontWeight: 600 }}>
          {s.isRotativa ? `Sem atribuição neste dia` : 'Nenhum funcionário atribuído'}
        </span>
      </div>
    )
  }

  // ── Action buttons for a station ──
  const AssignBtns = ({ s, date }: { s: Station; date: string }) => {
    const emps    = getEmpsOn(s, date)
    const forDate = s.isRotativa ? date : undefined
    return (
      <div style={{ display: 'grid', gridTemplateColumns: emps.length > 0 ? '1fr 1fr' : '1fr', gap: 8 }}>
        {emps.length > 0 && (
          <button onClick={() => onAssign(s.id, 'replace', forDate)}
            style={{ ...primaryBtnSt, background: C.bg, color: C.textMid, border: `1px solid ${C.border}`, fontSize: 13 }}>
            Trocar
          </button>
        )}
        <button onClick={() => onAssign(s.id, 'add', forDate)}
          style={{ ...primaryBtnSt, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <UserPlus size={15} /> {emps.length === 0 ? 'Atribuir' : 'Adicionar'}
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <span className="ph-section-label" style={{ marginBottom: 0 }}>Praças do restaurante</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

          {/* View-mode dropdown */}
          <select
            value={viewMode}
            onChange={e => {
              onViewModeChange(e.target.value as ViewMode)
              onViewDateChange(today)   // reset to today on mode switch
            }}
            style={{ padding: '7px 10px', borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.card, fontSize: 13, fontFamily: 'DM Sans,sans-serif', color: C.text, cursor: 'pointer', fontWeight: 600, outline: 'none' }}>
            <option value="dia">📅 Dia</option>
            <option value="semana">📆 Semana</option>
            <option value="mes">🗓 Mês</option>
          </select>

          {/* Date navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => onViewDateChange(navigate(viewDate, viewMode, -1))} style={iconEditBtnSt}>
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 13, color: C.text, minWidth: 140, textAlign: 'center', whiteSpace: 'nowrap' }}>
              {periodLabel(periodStart, viewMode)}
            </span>
            <button onClick={() => onViewDateChange(navigate(viewDate, viewMode, 1))} style={iconEditBtnSt}>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Today shortcut — only if not on today */}
          {viewDate !== today && (
            <button onClick={() => onViewDateChange(today)}
              style={{ ...iconEditBtnSt, width: 'auto', padding: '0 12px', fontSize: 12, fontWeight: 700, color: C.accent, borderColor: `${C.accent}60` }}>
              Hoje
            </button>
          )}

          {/* Add station */}
          <button onClick={onAdd} style={addBtnSt}>
            <Plus size={14} strokeWidth={2.5} /> Nova praça
          </button>
        </div>
      </div>

      {/* Empty state */}
      {stations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textLight }}>
          <UtensilsCrossed size={40} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, fontSize: 15 }}>Nenhuma praça cadastrada</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Clique em "+ Nova praça" para começar</div>
        </div>
      )}

      {/* ╔══════════════════════════════╗
          ║  DIA — cards                ║
          ╚══════════════════════════════╝ */}
      {viewMode === 'dia' && (
        <div className="ph-stations-grid">
          {stations.map(s => (
            <div key={s.id} className="ph-card"
              style={{ borderLeft: `4px solid ${getEmpsOn(s, viewDate).length > 0 ? C.success : C.danger}` }}>
              <div className="ph-card-p">
                <StationHeader s={s} date={viewDate} />
                <DeleteConfirm s={s} />
                <EmpList s={s} date={viewDate} />
                <AssignBtns s={s} date={viewDate} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ╔══════════════════════════════╗
          ║  SEMANA — table             ║
          ╚══════════════════════════════╝ */}
      {viewMode === 'semana' && (
        <div style={{ overflowX: 'auto', borderRadius: 16, border: `1px solid ${C.border}`, background: C.card, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 680, width: '100%' }}>
            <thead>
              <tr>
                {/* Station column */}
                <th style={{ background: C.nav, color: '#FFF5EE', fontSize: 11, fontWeight: 700, padding: '10px 16px', textAlign: 'left', minWidth: 150, borderRight: `2px solid rgba(255,255,255,0.15)`, letterSpacing: '0.5px' }}>
                  PRAÇA
                </th>
                {weekDays.map(day => {
                  const dow = isoToDate(day).getDay()
                  const wknd = dow === 0 || dow === 6
                  const tod  = isToday(day)
                  const [,mm,dd] = day.split('-')
                  return (
                    <th key={day} style={{ background: tod ? C.accent : wknd ? '#2D1208' : C.nav, color: tod ? '#fff' : wknd ? '#F0A07A' : '#C0A090', fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '10px 4px', minWidth: 96, borderRight: `1px solid rgba(255,255,255,0.08)` }}>
                      <div style={{ fontSize: 9, lineHeight: 1, marginBottom: 3 }}>{DAY_ABBR[dow]}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1 }}>{dd}/{mm}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {stations.map((s, idx) => {
                const StIcon = getIcon(s.iconKey)
                return (
                  <tr key={s.id} style={{ borderBottom: idx < stations.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    {/* Station name */}
                    <td style={{ padding: '10px 14px', borderRight: `2px solid ${C.border}`, background: '#FAFAF8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <StIcon size={14} color={C.accent} strokeWidth={1.8} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{s.name}</div>
                          <RotativaBadge rotativa={s.isRotativa} />
                        </div>
                      </div>
                    </td>
                    {/* Day cells */}
                    {weekDays.map(day => {
                      const emps = getEmpsOn(s, day)
                      const tod  = isToday(day)
                      const forDate = s.isRotativa ? day : undefined
                      return (
                        <td key={day}
                          onClick={() => onAssign(s.id, 'add', forDate)}
                          title={`Atribuir para ${day.split('-').reverse().join('/')}`}
                          style={{ padding: '8px 6px', textAlign: 'center', cursor: 'pointer', verticalAlign: 'middle', background: tod ? '#FFF8F4' : emps.length > 0 ? `${C.successLight}88` : `${C.dangerLight}44`, borderRight: `1px solid ${C.border}`, transition: 'opacity 0.1s' }}>
                          {emps.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                              {emps.slice(0, 2).map(emp => (
                                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Avatar emp={emp} size={22} />
                                  <span style={{ fontSize: 10, fontWeight: 600, color: C.text, maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {emp.name.split(' ')[0]}
                                  </span>
                                </div>
                              ))}
                              {emps.length > 2 && <span style={{ fontSize: 10, color: C.textMid }}>+{emps.length - 2}</span>}
                            </div>
                          ) : (
                            <span style={{ fontSize: 20, color: C.border, lineHeight: 1 }}>·</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ╔══════════════════════════════╗
          ║  MÊS — station cards        ║
          ╚══════════════════════════════╝ */}
      {viewMode === 'mes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {stations.map(s => {
            const StIcon = getIcon(s.iconKey)

            // Summarise who appeared this month for rotativas
            const empDayCounts: Record<number, number> = {}
            monthDays.forEach(day => {
              getEmpsOn(s, day).forEach(emp => {
                empDayCounts[emp.id] = (empDayCounts[emp.id] ?? 0) + 1
              })
            })
            const monthSummary = Object.entries(empDayCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([id, cnt]) => ({ emp: employees.find(e => e.id === Number(id))!, cnt }))
              .filter(x => x.emp)

            return (
              <div key={s.id} className="ph-card">
                {/* Card header */}
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <StIcon size={16} color={C.accent} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{s.name}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                      <RotativaBadge rotativa={s.isRotativa} />
                    </div>
                  </div>
                  {/* Controls */}
                  <button onClick={() => onToggleRotativa(s.id, s.isRotativa)}
                    title={s.isRotativa ? 'Tornar fixa' : 'Tornar rotativa'}
                    style={{ ...iconEditBtnSt, background: s.isRotativa ? C.infoLight : '#F0EEDC', borderColor: s.isRotativa ? `${C.info}40` : '#D4D0A0' }}>
                    {s.isRotativa ? <Pin size={12} strokeWidth={2} color={C.info} /> : <RefreshCw size={12} strokeWidth={2} color="#5C5010" />}
                  </button>
                  <button onClick={() => onEdit(s)} style={iconEditBtnSt}><Pencil size={13} strokeWidth={2} /></button>
                </div>

                {/* Day mini-chips */}
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {monthDays.map(day => {
                      const emps  = getEmpsOn(s, day)
                      const d     = parseInt(day.split('-')[2])
                      const dow   = isoToDate(day).getDay()
                      const wknd  = dow === 0 || dow === 6
                      const tod   = isToday(day)
                      const ok    = emps.length > 0
                      return (
                        <div key={day}
                          onClick={() => { onViewModeChange('dia'); onViewDateChange(day) }}
                          title={`${day.split('-').reverse().join('/')} — ${ok ? emps.map(e => e.name.split(' ')[0]).join(', ') : 'sem atribuição'}`}
                          style={{
                            width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                            background: ok ? `${C.successLight}CC` : wknd ? '#F4EFE9' : C.bg,
                            border: `1.5px solid ${tod ? C.accent : ok ? `${C.success}60` : C.border}`,
                            outline: tod ? `2px solid ${C.accent}` : 'none',
                            outlineOffset: 1,
                            transition: 'opacity 0.12s',
                          }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: ok ? C.success : wknd ? C.textLight : C.textMid, lineHeight: 1 }}>{d}</span>
                          {ok && emps.length <= 2 && (
                            <div style={{ display: 'flex', gap: 2 }}>
                              {emps.map(e => (
                                <div key={e.id} style={{ width: 5, height: 5, borderRadius: '50%', background: getEmpColor(e.id).text }} />
                              ))}
                            </div>
                          )}
                          {ok && emps.length > 2 && (
                            <span style={{ fontSize: 8, color: C.success, fontWeight: 800, lineHeight: 1 }}>{emps.length}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Month summary — who covered this station and how many days */}
                  {s.isRotativa && monthSummary.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 11, color: C.textLight, alignSelf: 'center', marginRight: 4 }}>No mês:</span>
                      {monthSummary.map(({ emp, cnt }) => (
                        <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 7, background: getEmpColor(emp.id).bg, border: `1px solid ${getEmpColor(emp.id).border}` }}>
                          <Avatar emp={emp} size={18} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{emp.name.split(' ')[0]}</span>
                          <span style={{ fontSize: 11, color: C.textMid, fontWeight: 500 }}>{cnt}d</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fixed station — show permanent team in month view */}
                  {!s.isRotativa && s.assignedIds.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 11, color: C.textLight, alignSelf: 'center', marginRight: 4 }}>Fixos:</span>
                      {s.assignedIds.map(id => {
                        const emp = getEmployee(id); if (!emp) return null
                        return (
                          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 7, background: getEmpColor(emp.id).bg, border: `1px solid ${getEmpColor(emp.id).border}` }}>
                            <Avatar emp={emp} size={18} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{emp.name.split(' ')[0]}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

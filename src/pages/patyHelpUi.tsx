import type { CSSProperties } from 'react'
import { X } from 'lucide-react'
import type { Employee, EmpType, Status } from '../types'
import { C, getEmpColor, STATION_ICONS, type IconComp } from './patyHelpCore'

export function Avatar({ emp, size }: { emp: Employee; size: number }) {
  const c = getEmpColor(emp.id)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: c.bg, color: c.text, border: `1.5px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: Math.round(size * 0.34), flexShrink: 0, fontFamily: 'DM Sans,sans-serif' }}>
      {emp.initials}
    </div>
  )
}

export function MetricCard({ value, label, Icon, accent, light, dark = false }: { value: number; label: string; Icon: IconComp; accent: string; light: string; dark?: boolean }) {
  return (
    <div className="ph-card" style={{ background: dark ? C.nav : light, color: dark ? '#FFF5EE' : C.text }}>
      <div className="ph-card-p" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, marginBottom: 6 }}>{value}</div><div style={{ fontSize: 12, color: dark ? '#D4B8A8' : C.textMid, fontWeight: 500 }}>{label}</div></div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: dark ? 'rgba(255,255,255,0.16)' : '#FFFFFFA8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={19} color={dark ? '#FFF5EE' : accent} strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}

export function TypeBadge({ type, small = false }: { type: EmpType; small?: boolean }) {
  const efetivo = type === 'efetivo'
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: small ? '2px 6px' : '3px 8px', borderRadius: 999, fontSize: small ? 9 : 10, fontWeight: 700, letterSpacing: '0.2px', background: efetivo ? C.successLight : C.tealLight, color: efetivo ? C.success : C.teal, border: `1px solid ${efetivo ? '#A8D8C0' : '#9ED9DA'}`, textTransform: 'uppercase' }}>{efetivo ? 'Efetivo' : 'Temporário'}</span>
}

export function StatusBadge({ status, small = false }: { status: Status | 'covered' | 'empty'; small?: boolean }) {
  const map = {
    active:   { t: 'Trabalhando',  c: C.success, b: C.successLight, br: '#A8D8C0' },
    dayoff:   { t: 'Folga',        c: C.warning, b: C.warningLight, br: '#EEC980' },
    vacation: { t: 'Férias',       c: C.info,    b: C.infoLight,    br: '#A8C8F0' },
    covered:  { t: 'Coberta',      c: C.success, b: C.successLight, br: '#A8D8C0' },
    empty:    { t: 'Descoberta',   c: C.danger,  b: C.dangerLight,  br: '#F0B0B0' },
  } as const
  const m = map[status]
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: small ? '2px 7px' : '4px 9px', borderRadius: 999, fontSize: small ? 9 : 11, fontWeight: 700, background: m.b, color: m.c, border: `1px solid ${m.br}` }}>{m.t}</span>
}

export function TypeSelector({ value, onChange }: { value: EmpType; onChange: (t: EmpType) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {(['efetivo', 'temporario'] as EmpType[]).map(t => {
        const active = value === t
        return (
          <button key={t} onClick={() => onChange(t)} style={{ borderRadius: 11, border: `1.5px solid ${active ? (t === 'efetivo' ? C.success : C.teal) : C.border}`, background: active ? (t === 'efetivo' ? C.successLight : C.tealLight) : '#fff', padding: '11px', cursor: 'pointer', fontWeight: 700, color: active ? (t === 'efetivo' ? C.success : C.teal) : C.textLight, fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>
            {t === 'efetivo' ? 'Efetivo' : 'Temporário'}
          </button>
        )
      })}
    </div>
  )
}

export function ActionBtn({ onClick, Icon, label, bg, color, full }: { onClick: () => void; Icon: IconComp; label: string; bg: string; color: string; full?: boolean }) {
  return <button onClick={onClick} style={{ border: 'none', background: bg, color, borderRadius: 10, padding: '10px 9px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: full ? '100%' : undefined }}><Icon size={13} /> {label}</button>
}

export function GroupLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{children}</div>
}

export function FLabel({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 6, ...style }}>{children}</label>
}

export function BottomSheet({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="ph-modal-overlay" onClick={onClose}><div className="ph-modal-sheet" onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}><h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text, fontFamily: 'DM Sans,sans-serif' }}>{title}</h3><button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer', color: C.textLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button></div>
      {children}
    </div></div>
  )
}

export function IconPicker({ selected, onSelect }: { selected: string; onSelect: (k: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 8 }}>
      {STATION_ICONS.map(({ key, Icon, label }) => {
        const active = selected === key
        return (
          <button key={key} onClick={() => onSelect(key)} title={label}
            style={{ borderRadius: 10, border: `1.5px solid ${active ? C.accent : C.border}`, background: active ? C.accentLight : '#fff', padding: '9px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: active ? C.accent : C.textMid, fontSize: 10, fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>
            <Icon size={15} strokeWidth={2} /><span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export const inputSt: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontFamily: 'DM Sans,sans-serif', fontSize: 15, background: '#FAFAFA', color: C.text, outline: 'none' }
export const selectSt: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontFamily: 'DM Sans,sans-serif', fontSize: 15, background: '#FAFAFA', color: C.text, outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239A7866' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }
export const primaryBtnSt: CSSProperties = { width: '100%', padding: '13px', background: C.accent, color: '#FFF5EE', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }
export const addBtnSt: CSSProperties = { background: C.accent, color: '#FFF5EE', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 5 }
export const outlineBtnSt: CSSProperties = { width: '100%', padding: '11px', background: 'transparent', color: C.textMid, border: `1.5px solid ${C.border}`, borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
export const linkBtnSt: CSSProperties = { fontSize: 12, color: C.accent, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 2 }
export const iconEditBtnSt: CSSProperties = { width: 30, height: 30, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMid, flexShrink: 0 }

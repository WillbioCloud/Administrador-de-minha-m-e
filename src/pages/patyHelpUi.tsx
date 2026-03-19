import type { CSSProperties } from 'react'
import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import type { Employee, EmpType, Status } from '../types'
import { C, getEmpColor, STATION_ICONS, type IconComp } from './patyHelpCore'
import { BadgeCheck, Timer } from 'lucide-react'

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ emp, size }: { emp: Employee; size: number }) {
  const c = getEmpColor(emp.id)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: c.bg, color: c.text, border: `1.5px solid ${c.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.33, fontFamily: 'DM Sans,sans-serif',
    }}>
      {emp.initials}
    </div>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

export function MetricCard({ value, label, Icon, accent, light, dark = false }: {
  value: number; label: string; Icon: IconComp; accent: string; light: string; dark?: boolean
}) {
  return (
    <div className="ph-card" style={{ background: dark ? C.nav : C.card, borderColor: dark ? 'transparent' : C.border }}>
      <div className="ph-card-p">
        <div style={{ width: 36, height: 36, borderRadius: 10, background: dark ? 'rgba(193,68,14,0.25)' : light, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Icon size={18} color={dark ? '#E09070' : accent} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: dark ? '#FFF5EE' : C.text, lineHeight: 1, marginBottom: 6 }}>{value}</div>
        <div style={{ fontSize: 12, color: dark ? '#7A5040' : C.textLight, fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
      </div>
    </div>
  )
}

// ─── TypeBadge ────────────────────────────────────────────────────────────────

export function TypeBadge({ type, small = false }: { type: EmpType; small?: boolean }) {
  const isEf = type === 'efetivo'
  return (
    <span style={{ fontSize: small ? 10 : 11, fontWeight: 700, padding: small ? '2px 6px' : '3px 8px', borderRadius: 6, background: isEf ? C.infoLight : C.tealLight, color: isEf ? C.info : C.teal, whiteSpace: 'nowrap', letterSpacing: '0.2px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {isEf ? <BadgeCheck size={small ? 9 : 10} strokeWidth={2.5} /> : <Timer size={small ? 9 : 10} strokeWidth={2.5} />}
      {isEf ? 'Efetivo' : 'Temporário'}
    </span>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status, small = false }: { status: Status | 'covered' | 'empty'; small?: boolean }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:   { label: 'Ativo',      bg: C.successLight, color: C.success },
    dayoff:   { label: 'Folga',      bg: C.warningLight, color: C.warning },
    vacation: { label: 'Férias',     bg: C.infoLight,    color: C.info    },
    covered:  { label: 'Coberta',    bg: C.successLight, color: C.success },
    empty:    { label: 'Descoberta', bg: C.dangerLight,  color: C.danger  },
  }
  const s = map[status]
  return (
    <span style={{ fontSize: small ? 10 : 11, fontWeight: 700, padding: small ? '2px 6px' : '3px 8px', borderRadius: 6, background: s.bg, color: s.color, whiteSpace: 'nowrap', letterSpacing: '0.2px' }}>
      {s.label}
    </span>
  )
}

// ─── TypeSelector ─────────────────────────────────────────────────────────────

export function TypeSelector({ value, onChange }: { value: EmpType; onChange: (t: EmpType) => void }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {(['efetivo', 'temporario'] as EmpType[]).map(t => {
        const active = value === t
        const color  = t === 'efetivo' ? C.info : C.teal
        const light  = t === 'efetivo' ? C.infoLight : C.tealLight
        return (
          <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: '11px', borderRadius: 11, border: `1.5px solid ${active ? color : C.border}`, background: active ? light : C.card, color: active ? color : C.textMid, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.12s' }}>
            {t === 'efetivo' ? <BadgeCheck size={15} strokeWidth={2} /> : <Timer size={15} strokeWidth={2} />}
            {t === 'efetivo' ? 'Efetivo' : 'Temporário'}
          </button>
        )
      })}
    </div>
  )
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────

export function ActionBtn({ onClick, Icon, label, bg, color, full }: {
  onClick: () => void; Icon: IconComp; label: string; bg: string; color: string; full?: boolean
}) {
  return (
    <button onClick={onClick} style={{ width: full ? '100%' : undefined, padding: '9px 0', background: bg, color, border: `1px solid ${color}25`, borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
      <Icon size={13} strokeWidth={2} /> {label}
    </button>
  )
}

// ─── GroupLabel ───────────────────────────────────────────────────────────────

export function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
      {children}
    </div>
  )
}

// ─── FLabel ───────────────────────────────────────────────────────────────────

export function FLabel({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: C.textMid, marginBottom: 6, ...style }}>
      {children}
    </div>
  )
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────

export function BottomSheet({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,2,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#FFFFFF', borderRadius: '22px 22px 0 0', padding: '20px 18px 40px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 18px' }} />
        <div style={{ fontFamily: 'Instrument Serif,serif', fontSize: 20, color: C.text, marginBottom: 18 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

// ─── IconPicker ───────────────────────────────────────────────────────────────

export function IconPicker({ selected, onSelect }: { selected: string; onSelect: (k: string) => void }) {
  const [open, setOpen] = useState(false)
  const sel    = STATION_ICONS.find(i => i.key === selected) ?? STATION_ICONS[0]
  const SelIcon = sel.Icon
  return (
    <div>
      <button onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${open ? C.accent : C.border}`, background: '#FFF', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', transition: 'border-color 0.15s' }}>
        <SelIcon size={18} color={C.accent} strokeWidth={1.8} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 14, color: C.text, fontWeight: 500 }}>{sel.label}</span>
        <ChevronDown size={14} color={C.textLight} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{ marginTop: 8, padding: '12px', background: '#FFF', borderRadius: 12, border: `1.5px solid ${C.border}`, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {STATION_ICONS.map(({ key, Icon, label }) => (
            <button key={key} onClick={() => { onSelect(key); setOpen(false) }} title={label}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px', borderRadius: 10, border: `1.5px solid ${selected === key ? C.accent : 'transparent'}`, background: selected === key ? C.accentLight : C.bg, cursor: 'pointer', transition: 'all 0.12s' }}>
              <Icon size={18} color={selected === key ? C.accent : C.textMid} strokeWidth={1.8} />
              <span style={{ fontSize: 9, color: selected === key ? C.accent : C.textLight, fontFamily: 'DM Sans', fontWeight: 600, lineHeight: 1 }}>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Style constants ──────────────────────────────────────────────────────────

export const inputSt: CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px',
  borderRadius: 12, border: `1.5px solid ${C.border}`,
  fontFamily: 'DM Sans,sans-serif', fontSize: 15,
  background: '#FAFAFA', color: C.text, outline: 'none',
}

export const selectSt: CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px',
  borderRadius: 12, border: `1.5px solid ${C.border}`,
  fontFamily: 'DM Sans,sans-serif', fontSize: 15,
  background: '#FAFAFA', color: C.text, outline: 'none',
  cursor: 'pointer', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239A7866' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
}

export const primaryBtnSt: CSSProperties = {
  width: '100%', padding: '13px', background: C.accent, color: '#FFF5EE',
  border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14,
  cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
}

export const addBtnSt: CSSProperties = {
  background: C.accent, color: '#FFF5EE', border: 'none', borderRadius: 10,
  padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
  fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 5,
}

export const outlineBtnSt: CSSProperties = {
  width: '100%', padding: '11px', background: 'transparent', color: C.textMid,
  border: `1.5px solid ${C.border}`, borderRadius: 12, fontWeight: 600, fontSize: 13,
  cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
}

export const linkBtnSt: CSSProperties = {
  fontSize: 12, color: C.accent, fontWeight: 600, background: 'none',
  border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
  display: 'flex', alignItems: 'center', gap: 2,
}

export const iconEditBtnSt: CSSProperties = {
  width: 30, height: 30, borderRadius: 8, background: C.bg,
  border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', color: C.textMid, flexShrink: 0,
}

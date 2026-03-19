import { Calendar, Pencil, Trash2, Umbrella, UserCheck, Users, Briefcase } from 'lucide-react'
import { useState } from 'react'
import type { Employee, Schedule } from '../../types'
import { C, fmtDate, getStatusForDate, getVacationRange, TODAY_ISO } from '../patyHelpCore'
import { ActionBtn, Avatar, GroupLabel, StatusBadge, TypeBadge, addBtnSt, iconEditBtnSt } from '../patyHelpUi'

interface Props {
  employees: Employee[]; schedule: Schedule
  onSetFolga: (id: number) => void; onClearToday: (id: number) => void
  onEdit: (e: Employee) => void; onVacation: (e: Employee) => void
  onDelete: (id: number) => void; onAdd: () => void; onManageRoles: () => void
}

export function EquipeTab({ employees, schedule, onSetFolga, onClearToday, onEdit, onVacation, onDelete, onAdd, onManageRoles }: Props) {
  const active = employees.filter(e => getStatusForDate(e.id, schedule, TODAY_ISO) === 'active')
  const dayoff = employees.filter(e => getStatusForDate(e.id, schedule, TODAY_ISO) === 'dayoff')
  const vacation = employees.filter(e => getStatusForDate(e.id, schedule, TODAY_ISO) === 'vacation')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="ph-section-label" style={{ marginBottom: 0 }}>Equipe</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onManageRoles} style={{ ...addBtnSt, background: C.card, color: C.textMid, border: `1px solid ${C.border}` }}>
            <Briefcase size={14} strokeWidth={2} /> Cargos
          </button>
          <button onClick={onAdd} style={addBtnSt}>+ Funcionário</button>
        </div>
      </div>

      {employees.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textLight }}>
          <Users size={40} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, fontSize: 15 }}>Nenhum funcionário cadastrado</div>
        </div>
      )}

      {active.length > 0 && (<><GroupLabel>Trabalhando hoje · {active.length}</GroupLabel><div className="ph-equipe-grid" style={{ marginBottom: 20 }}>{active.map(e => <EmployeeCard key={e.id} emp={e} schedule={schedule} onSetFolga={onSetFolga} onClearToday={onClearToday} onEdit={onEdit} onVacation={onVacation} onDelete={onDelete} />)}</div></>)}
      {dayoff.length > 0 && (<><GroupLabel>De folga · {dayoff.length}</GroupLabel><div className="ph-equipe-grid" style={{ marginBottom: 20 }}>{dayoff.map(e => <EmployeeCard key={e.id} emp={e} schedule={schedule} onSetFolga={onSetFolga} onClearToday={onClearToday} onEdit={onEdit} onVacation={onVacation} onDelete={onDelete} />)}</div></>)}
      {vacation.length > 0 && (<><GroupLabel>De férias · {vacation.length}</GroupLabel><div className="ph-equipe-grid">{vacation.map(e => <EmployeeCard key={e.id} emp={e} schedule={schedule} onSetFolga={onSetFolga} onClearToday={onClearToday} onEdit={onEdit} onVacation={onVacation} onDelete={onDelete} />)}</div></>)}
    </div>
  )
}

function EmployeeCard({ emp, schedule, onSetFolga, onClearToday, onEdit, onVacation, onDelete }: {
  emp: Employee; schedule: Schedule
  onSetFolga: (id: number) => void; onClearToday: (id: number) => void
  onEdit: (e: Employee) => void; onVacation: (e: Employee) => void; onDelete: (id: number) => void
}) {
  const [confirmDel, setConfirmDel] = useState(false)
  const status = getStatusForDate(emp.id, schedule, TODAY_ISO)
  const vacRange = getVacationRange(emp.id, schedule)
  const accent = status === 'active' ? C.success : status === 'vacation' ? C.info : C.warning

  return (
    <div className="ph-card" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="ph-card-p">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <Avatar emp={emp} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
            <div style={{ fontSize: 12, color: C.textMid, marginTop: 1 }}>{emp.role}</div>
            {status === 'vacation' && vacRange && <div style={{ fontSize: 11, color: C.info, marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10} strokeWidth={2} /> {fmtDate(vacRange.start)} → {fmtDate(vacRange.end)}</div>}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => onEdit(emp)} style={iconEditBtnSt} title="Editar"><Pencil size={13} strokeWidth={2} /></button>
            <button onClick={() => setConfirmDel(true)} style={{ ...iconEditBtnSt, background: C.dangerLight, borderColor: C.danger + '40' }} title="Remover"><Trash2 size={13} strokeWidth={2} color={C.danger} /></button>
          </div>
        </div>

        {confirmDel && (
          <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}35`, borderRadius: 11, padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 12, color: C.danger, fontWeight: 600 }}>Remover "{emp.name.split(' ')[0]}"?</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setConfirmDel(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 9px', cursor: 'pointer', fontSize: 12, color: C.textMid, fontFamily: 'DM Sans,sans-serif' }}>Não</button>
              <button onClick={() => onDelete(emp.id)} style={{ background: C.danger, border: 'none', borderRadius: 8, padding: '4px 9px', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>Sim</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}><TypeBadge type={emp.type} /><StatusBadge status={status} /></div>

        {status === 'active' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ActionBtn onClick={() => onSetFolga(emp.id)} Icon={Umbrella} label="Folga" bg={C.warningLight} color={C.warning} />
            <ActionBtn onClick={() => onVacation(emp)} Icon={Calendar} label="Férias" bg={C.infoLight} color={C.info} />
          </div>
        ) : (
          <ActionBtn onClick={() => onClearToday(emp.id)} Icon={UserCheck} label={status === 'vacation' ? 'Encerrar férias' : 'Marcar como ativo'} bg={C.successLight} color={C.success} full />
        )}
      </div>
    </div>
  )
}
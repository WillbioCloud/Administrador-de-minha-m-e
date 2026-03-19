import { Plus, Trash2, UtensilsCrossed, Pencil } from 'lucide-react'
import type { Employee, Station } from '../../types'
import { C, getIcon } from '../patyHelpCore'
import { Avatar, StatusBadge, addBtnSt, iconEditBtnSt } from '../patyHelpUi'

interface Props {
  stations: Station[]; getEmployee: (id: number) => Employee | undefined
  onAssign: (id: number, mode: 'replace' | 'add') => void
  onRemoveEmp: (stationId: number, empId: number) => void
  onEdit: (s: Station) => void; onDelete: (id: number) => void; onAdd: () => void
}

export function PracasTab({ stations, getEmployee, onAssign, onRemoveEmp, onEdit, onDelete, onAdd }: Props) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="ph-section-label" style={{ marginBottom: 0 }}>Praças do restaurante</span>
        <button onClick={onAdd} style={addBtnSt}><Plus size={14} strokeWidth={2.5} /> Nova praça</button>
      </div>
      {stations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textLight }}>
          <UtensilsCrossed size={40} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, fontSize: 15 }}>Nenhuma praça cadastrada</div>
        </div>
      )}
      <div className="ph-stations-grid">
        {stations.map(s => {
          const emps = s.assignedIds.map(id => getEmployee(id)).filter(Boolean) as Employee[]
          const StIcon = getIcon(s.iconKey)
          const covered = emps.length > 0
          return (
            <div key={s.id} className="ph-card" style={{ borderLeft: `4px solid ${covered ? C.success : C.danger}` }}>
              <div className="ph-card-p">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <StIcon size={22} color={C.accent} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{s.name}</div>
                    <StatusBadge status={covered ? 'covered' : 'empty'} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => onEdit(s)} style={iconEditBtnSt}><Pencil size={13} strokeWidth={2} /></button>
                    <button onClick={() => onDelete(s.id)} style={{ ...iconEditBtnSt, background: C.dangerLight, borderColor: C.danger + '40' }}><Trash2 size={13} strokeWidth={2} color={C.danger} /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {emps.length === 0 ? <div style={{ fontSize: 12, color: C.textLight }}>Sem responsável</div> : emps.map(emp => (
                    <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar emp={emp} size={28} />
                      <div style={{ flex: 1, fontSize: 13, color: C.text }}>{emp.name}</div>
                      <button onClick={() => onRemoveEmp(s.id, emp.id)} style={{ border: 'none', background: 'transparent', color: C.danger, cursor: 'pointer', fontSize: 12 }}>Remover</button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={() => onAssign(s.id, 'replace')} style={{ ...addBtnSt, justifyContent: 'center' }}>Trocar</button>
                  <button onClick={() => onAssign(s.id, 'add')} style={{ ...addBtnSt, justifyContent: 'center', background: C.nav }}>Adicionar</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

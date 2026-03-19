import { AlertTriangle, Pencil, Plus, Trash2, UtensilsCrossed, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import type { Employee, Station } from '../../types'
import { C, getEmpColor, getIcon } from '../patyHelpCore'
import { Avatar, StatusBadge, TypeBadge, addBtnSt, iconEditBtnSt, primaryBtnSt } from '../patyHelpUi'

interface Props {
  stations: Station[]
  getEmployee: (id: number) => Employee | undefined
  onAssign: (id: number, mode: 'replace' | 'add') => void
  onRemoveEmp: (stationId: number, empId: number) => void
  onEdit: (s: Station) => void
  onDelete: (id: number) => void
  onAdd: () => void
}

export function PracasTab({ stations, getEmployee, onAssign, onRemoveEmp, onEdit, onDelete, onAdd }: Props) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="ph-section-label" style={{ marginBottom: 0 }}>Praças do restaurante</span>
        <button onClick={onAdd} style={addBtnSt}>
          <Plus size={14} strokeWidth={2.5} /> Nova praça
        </button>
      </div>

      {stations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textLight }}>
          <UtensilsCrossed size={40} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, fontSize: 15 }}>Nenhuma praça cadastrada</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Clique em "+ Nova praça" para começar</div>
        </div>
      )}

      <div className="ph-stations-grid">
        {stations.map(s => {
          const emps    = s.assignedIds.map(id => getEmployee(id)).filter(Boolean) as Employee[]
          const StIcon  = getIcon(s.iconKey)
          const covered = emps.length > 0

          return (
            <div key={s.id} className="ph-card" style={{ borderLeft: `4px solid ${covered ? C.success : C.danger}` }}>
              <div className="ph-card-p">

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <StIcon size={22} color={C.accent} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{s.name}</div>
                    <StatusBadge status={covered ? 'covered' : 'empty'} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => onEdit(s)} style={iconEditBtnSt} title="Editar">
                      <Pencil size={13} strokeWidth={2} />
                    </button>
                    <button onClick={() => setConfirmDelete(s.id)}
                      style={{ ...iconEditBtnSt, background: C.dangerLight, borderColor: C.danger + '40' }} title="Apagar">
                      <Trash2 size={13} strokeWidth={2} color={C.danger} />
                    </button>
                  </div>
                </div>

                {/* Delete confirm */}
                {confirmDelete === s.id && (
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
                )}

                {/* Employees list */}
                {emps.length > 0 ? (
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
                        <button onClick={() => onRemoveEmp(s.id, emp.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, padding: 4, flexShrink: 0 }} title="Remover">
                          <X size={14} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 11, background: C.dangerLight, marginBottom: 12 }}>
                    <AlertTriangle size={15} color={C.danger} />
                    <span style={{ fontSize: 13, color: C.danger, fontWeight: 600 }}>Nenhum funcionário atribuído</span>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: emps.length > 0 ? '1fr 1fr' : '1fr', gap: 8 }}>
                  {emps.length > 0 && (
                    <button onClick={() => onAssign(s.id, 'replace')}
                      style={{ ...primaryBtnSt, background: C.bg, color: C.textMid, border: `1px solid ${C.border}`, fontSize: 13 }}>
                      Trocar
                    </button>
                  )}
                  <button onClick={() => onAssign(s.id, 'add')}
                    style={{ ...primaryBtnSt, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <UserPlus size={15} /> {emps.length === 0 ? 'Atribuir' : 'Adicionar'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

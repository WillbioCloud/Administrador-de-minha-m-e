import { AlertTriangle, Check, ChevronRight, TrendingUp, Umbrella, UserCheck, Users } from 'lucide-react'
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Employee, Schedule, Station } from '../../types'
import { C, fmtDate, getIcon, getStatusForDate, getVacationRange, TODAY_ISO } from '../patyHelpCore'
import { Avatar, MetricCard, StatusBadge, TypeBadge, linkBtnSt, outlineBtnSt, primaryBtnSt } from '../patyHelpUi'

interface Props {
  employees: Employee[]; active: Employee[]; offToday: Employee[]; onVacation: Employee[]
  coveredSts: Station[]; uncovSts: Station[]; stations: Station[]
  getEmployee: (id: number) => Employee | undefined; schedule: Schedule
  pieData: any[]; weekData: any[]
  goToPracas: () => void; goToEquipe: () => void; goToEscala: () => void
}

export function HojeTab({ employees, active, offToday, onVacation, coveredSts, uncovSts, stations, getEmployee, schedule, pieData, weekData, goToPracas, goToEquipe, goToEscala }: Props) {
  const efetivos = employees.filter(e => e.type === 'efetivo').length
  const temporarios = employees.filter(e => e.type === 'temporario').length
  const absent = [...offToday, ...onVacation]

  return (
    <div>
      <span className="ph-section-label">Resumo do dia</span>
      <div className="ph-metrics">
        <MetricCard value={active.length} label="Trabalhando" Icon={UserCheck} accent={C.success} light={C.successLight} />
        <MetricCard value={offToday.length} label="De folga" Icon={Umbrella} accent={C.warning} light={C.warningLight} />
        <MetricCard value={coveredSts.length} label="Praças cobertas" Icon={TrendingUp} accent={C.accent} light={C.accentLight} />
        <MetricCard value={employees.length} label="Total da equipe" Icon={Users} accent={C.nav} light="#E8E0D8" dark />
      </div>

      <div className="ph-row-211">
        <div className="ph-card">
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Praças de hoje</span>
            <button onClick={goToPracas} style={linkBtnSt}>Gerenciar <ChevronRight size={12} /></button>
          </div>
          {stations.length === 0 && <div style={{ padding: '20px 18px', color: C.textLight, fontSize: 13, textAlign: 'center' }}>Nenhuma praça cadastrada</div>}
          {stations.map((s, idx) => {
            const StIcon = getIcon(s.iconKey)
            const emps = s.assignedIds.map(id => getEmployee(id)).filter(Boolean) as Employee[]
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: idx < stations.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <StIcon size={16} color={C.accent} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  {emps.length > 0 ? <div style={{ fontSize: 11, color: C.textMid, marginTop: 1 }}>{emps.map(e => e.name.split(' ')[0]).join(', ')}</div> : <div style={{ fontSize: 11, color: C.danger, fontWeight: 600, marginTop: 1 }}>Sem responsável</div>}
                </div>
                <div style={{ display: 'flex' }}>
                  {emps.slice(0, 3).map(e => <Avatar key={e.id} emp={e} size={26} />)}
                  {emps.length === 0 && <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.dangerLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={11} color={C.danger} /></div>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="ph-card ph-card-p">
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Equipe esta semana</div>
          <div style={{ fontSize: 11, color: C.textLight, marginBottom: 14, marginTop: 2 }}>Funcionários por dia</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.textLight, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.textLight, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: 'DM Sans', fontSize: 12 }} cursor={{ fill: C.accentLight }} />
              <Bar dataKey="n" name="Funcionários" fill={C.accent} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="ph-card ph-card-p" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>Composição da equipe</div>
          {[
            { label: 'Efetivos', value: efetivos, color: C.info },
            { label: 'Temporários', value: temporarios, color: C.teal },
            { label: 'De férias', value: onVacation.length, color: C.warning },
            { label: 'Descobertas', value: uncovSts.length, color: C.danger },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
          <button onClick={goToEquipe} style={{ ...outlineBtnSt, marginTop: 'auto', paddingTop: 14 }}><Users size={13} /> Ver equipe</button>
        </div>
      </div>

      <div className="ph-row-211">
        <div className="ph-card">
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Equipe hoje</span>
            <button onClick={goToEquipe} style={linkBtnSt}>Ver todos <ChevronRight size={12} /></button>
          </div>
          {employees.length === 0 && <div style={{ padding: '20px 18px', color: C.textLight, fontSize: 13, textAlign: 'center' }}>Nenhum funcionário cadastrado</div>}
          {employees.slice(0, 5).map((emp, idx) => (
            <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: idx < Math.min(4, employees.length - 1) ? `1px solid ${C.border}` : 'none' }}>
              <Avatar emp={emp} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                <div style={{ fontSize: 11, color: C.textMid }}>{emp.role}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                <TypeBadge type={emp.type} small />
                <StatusBadge status={getStatusForDate(emp.id, schedule, TODAY_ISO)} small />
              </div>
            </div>
          ))}
        </div>

        <div className="ph-card ph-card-p">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Ausências</div>
            <button onClick={goToEscala} style={linkBtnSt}>Escala <ChevronRight size={12} /></button>
          </div>
          {absent.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.textLight, fontSize: 12, padding: '20px 0', lineHeight: 1.6 }}>
              <Check size={22} color={C.success} style={{ display: 'block', margin: '0 auto 8px' }} />
              {employees.length === 0 ? 'Sem funcionários' : 'Todos presentes!'}
            </div>
          ) : absent.map(emp => {
            const vac = getVacationRange(emp.id, schedule)
            return (
              <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Avatar emp={emp} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                  {vac && <div style={{ fontSize: 10, color: C.info }}>{fmtDate(vac.start)} → {fmtDate(vac.end)}</div>}
                </div>
                <StatusBadge status={getStatusForDate(emp.id, schedule, TODAY_ISO)} small />
              </div>
            )
          })}
        </div>

        <div className="ph-card ph-card-p" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: uncovSts.length > 0 ? C.dangerLight : C.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            {uncovSts.length > 0 ? <AlertTriangle size={26} color={C.danger} strokeWidth={1.8} /> : <Check size={26} color={C.success} strokeWidth={2} />}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 8 }}>
            {uncovSts.length > 0 ? `${uncovSts.length} praça${uncovSts.length > 1 ? 's' : ''} sem cobertura` : stations.length === 0 ? 'Sem praças' : 'Tudo coberto!'}
          </div>
          <div style={{ fontSize: 12, color: C.textLight, lineHeight: 1.6, marginBottom: 16 }}>
            {uncovSts.length > 0 ? 'Atribua funcionários às praças abertas.' : 'Todas as praças têm responsável hoje.'}
          </div>
          {uncovSts.length > 0 && <button onClick={goToPracas} style={{ ...primaryBtnSt, fontSize: 13, padding: '10px 16px' }}>Resolver agora</button>}
        </div>
      </div>

      <div className="ph-card ph-card-p">
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>Cobertura de praças</div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={68} innerRadius={28} dataKey="value" label={({ name, value }: any) => value > 0 ? `${name}: ${value}` : ''} labelLine={{ stroke: C.textLight }}>
              {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: 'DM Sans', fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: 'DM Sans', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

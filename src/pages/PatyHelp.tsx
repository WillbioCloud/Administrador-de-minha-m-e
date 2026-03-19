import { useState, CSSProperties } from 'react'
import './PatyHelp.css'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Flame, Snowflake, ChefHat, Coffee, Wine, Package, Bell,
  UtensilsCrossed, ShoppingBag, CreditCard, Truck, Store,
  Warehouse, Star, ClipboardList, Wrench, Pizza, Utensils,
  Plus, Pencil, X, Check, ChevronDown, ChevronRight, ChevronLeft,
  Users, Calendar, UserCheck, LayoutDashboard, Settings,
  AlertTriangle, Umbrella, Home, TrendingUp, BadgeCheck, Timer,
  CalendarDays,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type DayMark  = 'folga' | 'vacation'
type Status   = 'active' | 'dayoff' | 'vacation'
type EmpType  = 'efetivo' | 'temporario'
type Tab      = 'hoje' | 'pracas' | 'escala' | 'equipe'
type IconComp = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>

interface Employee {
  id: number; name: string; role: string; initials: string; type: EmpType
}

interface Station {
  id: number; name: string; iconKey: string; assignedId: number | null
}

// schedule: empId → { 'YYYY-MM-DD' → 'folga' | 'vacation' }
type Schedule = Record<number, Record<string, DayMark>>

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = {
  bg:           '#EDE8E3',
  card:         '#FFFFFF',
  accent:       '#C1440E',
  accentLight:  '#FDE8DC',
  success:      '#2A7A4F',
  successLight: '#DEF2EA',
  warning:      '#B5690A',
  warningLight: '#FEF2D8',
  danger:       '#B83232',
  dangerLight:  '#FCDEDE',
  info:         '#1B5FA8',
  infoLight:    '#E6EFFE',
  teal:         '#0D7477',
  tealLight:    '#DDF3F3',
  vacation:     '#F5C518',
  vacationLight:'#FFFAE0',
  text:         '#18080A',
  textMid:      '#6B4435',
  textLight:    '#9A7866',
  border:       '#E8E0D8',
  nav:          '#1A0804',
}

const EMP_COLORS = [
  { bg: '#FDE8DC', text: '#7A2200', border: '#EEC0A0' },
  { bg: '#DEF2EA', text: '#1A5838', border: '#A8D8C0' },
  { bg: '#FEF2D8', text: '#7A4500', border: '#F0D098' },
  { bg: '#EAE6FF', text: '#3D2BB0', border: '#C0B8F5' },
  { bg: '#FCE4F0', text: '#8B1A56', border: '#F0B0D4' },
  { bg: '#E6EFFE', text: '#1A4A8B', border: '#A8C8F0' },
  { bg: '#F0EEDC', text: '#5C5010', border: '#D8D4A0' },
]
const getEmpColor = (id: number) => EMP_COLORS[(id - 1) % EMP_COLORS.length]

// ─── Station icons ────────────────────────────────────────────────────────────

const STATION_ICONS: { key: string; Icon: IconComp; label: string }[] = [
  { key: 'flame',      Icon: Flame,          label: 'Quente'     },
  { key: 'snowflake',  Icon: Snowflake,       label: 'Frio'       },
  { key: 'chefhat',    Icon: ChefHat,         label: 'Chef'       },
  { key: 'coffee',     Icon: Coffee,          label: 'Café'       },
  { key: 'wine',       Icon: Wine,            label: 'Bar'        },
  { key: 'package',    Icon: Package,         label: 'Estoque'    },
  { key: 'bell',       Icon: Bell,            label: 'Atend.'     },
  { key: 'utensils',   Icon: UtensilsCrossed, label: 'Utensílios' },
  { key: 'pizza',      Icon: Pizza,           label: 'Pizza'      },
  { key: 'store',      Icon: Store,           label: 'Loja'       },
  { key: 'truck',      Icon: Truck,           label: 'Entrega'    },
  { key: 'warehouse',  Icon: Warehouse,       label: 'Depósito'   },
  { key: 'creditcard', Icon: CreditCard,      label: 'Caixa'      },
  { key: 'shopping',   Icon: ShoppingBag,     label: 'Compras'    },
  { key: 'clipboard',  Icon: ClipboardList,   label: 'Lista'      },
  { key: 'wrench',     Icon: Wrench,          label: 'Manutenção' },
  { key: 'star',       Icon: Star,            label: 'Destaque'   },
  { key: 'home',       Icon: Home,            label: 'Casa'       },
  { key: 'users',      Icon: Users,           label: 'Equipe'     },
  { key: 'utensils2',  Icon: Utensils,        label: 'Pratos'     },
]
const getIcon = (key: string): IconComp => STATION_ICONS.find(i => i.key === key)?.Icon ?? Flame

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_ABBR   = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const getTodayISO = () => new Date().toISOString().split('T')[0]
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const fmtDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${String(y).slice(2)}` }

const buildRange = (start: string, end: string, mark: DayMark): Record<string, DayMark> => {
  const result: Record<string, DayMark> = {}
  const s = new Date(start + 'T12:00:00'), e = new Date(end + 'T12:00:00')
  const c = new Date(s)
  while (c <= e) {
    result[c.toISOString().split('T')[0]] = mark
    c.setDate(c.getDate() + 1)
  }
  return result
}

// Derive employee status from schedule for a given date
const getStatusForDate = (empId: number, schedule: Schedule, dateISO: string): Status => {
  const mark = schedule[empId]?.[dateISO]
  if (mark === 'folga')    return 'dayoff'
  if (mark === 'vacation') return 'vacation'
  return 'active'
}

const getVacationRange = (empId: number, schedule: Schedule) => {
  const empSch = schedule[empId] ?? {}
  const vDates = Object.entries(empSch).filter(([, m]) => m === 'vacation').map(([d]) => d).sort()
  if (!vDates.length) return null
  return { start: vDates[0], end: vDates[vDates.length - 1] }
}

// ─── Initial data ─────────────────────────────────────────────────────────────

const INIT_EMPLOYEES: Employee[] = [
  { id: 1, name: 'Maria Silva',    role: 'Cozinheira',  initials: 'MS', type: 'efetivo'    },
  { id: 2, name: 'João Santos',    role: 'Cozinheiro',  initials: 'JS', type: 'efetivo'    },
  { id: 3, name: 'Ana Costa',      role: 'Confeiteira', initials: 'AC', type: 'temporario' },
  { id: 4, name: 'Carlos Lima',    role: 'Atendimento', initials: 'CL', type: 'efetivo'    },
  { id: 5, name: 'Pedro Rocha',    role: 'Auxiliar',    initials: 'PR', type: 'temporario' },
  { id: 6, name: 'Lucia Ferreira', role: 'Barista',     initials: 'LF', type: 'efetivo'    },
  { id: 7, name: 'Rafael Dias',    role: 'Expedição',   initials: 'RD', type: 'efetivo'    },
]

const INIT_STATIONS: Station[] = [
  { id: 1, name: 'Cozinha Quente', iconKey: 'flame',     assignedId: 1    },
  { id: 2, name: 'Cozinha Fria',   iconKey: 'snowflake', assignedId: 2    },
  { id: 3, name: 'Confeitaria',    iconKey: 'chefhat',   assignedId: null },
  { id: 4, name: 'Bar',            iconKey: 'wine',      assignedId: null },
  { id: 5, name: 'Expedição',      iconKey: 'package',   assignedId: 7    },
  { id: 6, name: 'Atendimento',    iconKey: 'bell',      assignedId: 4    },
]

// Pre-populate demo schedule for March 2026
const INIT_SCHEDULE: Schedule = {
  3: { '2026-03-19': 'folga', '2026-03-20': 'folga', '2026-03-08': 'folga', '2026-03-09': 'folga' },
  6: buildRange('2026-03-10', '2026-03-28', 'vacation'),
  1: { '2026-03-22': 'folga', '2026-03-23': 'folga' },
  2: { '2026-03-29': 'folga', '2026-03-30': 'folga' },
  4: { '2026-03-08': 'folga', '2026-03-09': 'folga', '2026-03-29': 'folga', '2026-03-30': 'folga' },
  7: { '2026-03-15': 'folga', '2026-03-16': 'folga', '2026-03-22': 'folga', '2026-03-23': 'folga' },
  5: { '2026-03-15': 'folga', '2026-03-16': 'folga' },
}

const TODAY     = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const TODAY_ISO = getTodayISO()

const NAV_ITEMS = [
  { id: 'hoje'   as Tab, label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'escala' as Tab, label: 'Escala',    Icon: CalendarDays    },
  { id: 'pracas' as Tab, label: 'Praças',    Icon: UtensilsCrossed },
  { id: 'equipe' as Tab, label: 'Equipe',    Icon: Users           },
]

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PatyHelp() {
  const [tab, setTab] = useState<Tab>('hoje')
  const [employees, setEmployees] = useState<Employee[]>(INIT_EMPLOYEES)
  const [stations,  setStations]  = useState<Station[]>(INIT_STATIONS)
  const [schedule,  setSchedule]  = useState<Schedule>(INIT_SCHEDULE)

  const [assignModal,      setAssignModal]      = useState<number | null>(null)
  const [editStationModal, setEditStationModal] = useState<Station | null>(null)
  const [editEmpModal,     setEditEmpModal]     = useState<Employee | null>(null)
  const [vacationModal,    setVacationModal]    = useState<Employee | null>(null)
  const [addEmployeeModal, setAddEmployeeModal] = useState(false)
  const [addStationModal,  setAddStationModal]  = useState(false)

  const [newEmp, setNewEmp] = useState({ name: '', role: '', type: 'efetivo' as EmpType })
  const [newSt,  setNewSt]  = useState({ name: '', iconKey: 'flame' })

  // ─ Derived (all based on schedule, not a stored status field) ─
  const getStatus = (emp: Employee) => getStatusForDate(emp.id, schedule, TODAY_ISO)
  const active     = employees.filter(e => getStatus(e) === 'active')
  const offToday   = employees.filter(e => getStatus(e) === 'dayoff')
  const onVacation = employees.filter(e => getStatus(e) === 'vacation')
  const assigned   = stations.filter(s => s.assignedId !== null)
  const unassigned = stations.filter(s => s.assignedId === null)
  const getEmployee = (id: number | null) => employees.find(e => e.id === id)

  // ─ Schedule helpers ─
  const setDayMark = (empId: number, dateISO: string, mark: DayMark | null) => {
    setSchedule(prev => {
      const empSch = { ...(prev[empId] ?? {}) }
      if (mark === null) delete empSch[dateISO]
      else empSch[dateISO] = mark
      return { ...prev, [empId]: empSch }
    })
  }

  const toggleEscalaCell = (empId: number, dateISO: string) => {
    setSchedule(prev => {
      const current = prev[empId]?.[dateISO]
      if (current === 'vacation') return prev // don't touch vacation via cell click
      const empSch = { ...(prev[empId] ?? {}) }
      if (current === 'folga') delete empSch[dateISO]
      else empSch[dateISO] = 'folga'
      return { ...prev, [empId]: empSch }
    })
  }

  const setTodayFolga = (empId: number) => setDayMark(empId, TODAY_ISO, 'folga')
  const clearToday    = (empId: number) => setDayMark(empId, TODAY_ISO, null)

  const confirmVacation = (empId: number, start: string, end: string) => {
    setSchedule(prev => {
      const empSch = { ...(prev[empId] ?? {}), ...buildRange(start, end, 'vacation') }
      return { ...prev, [empId]: empSch }
    })
    // Remove from station if assigned
    setStations(st => st.map(s => s.assignedId === empId ? { ...s, assignedId: null } : s))
    setVacationModal(null)
  }

  const endVacation = (empId: number) => {
    setSchedule(prev => {
      const empSch = Object.fromEntries(
        Object.entries(prev[empId] ?? {}).filter(([d, m]) => !(m === 'vacation' && d >= TODAY_ISO))
      )
      return { ...prev, [empId]: empSch }
    })
    setVacationModal(null)
  }

  const assignEmployee = (stationId: number, empId: number) => {
    setStations(prev => prev.map(s => s.id === stationId ? { ...s, assignedId: empId } : s))
    setAssignModal(null)
  }
  const unassignStation = (stationId: number) =>
    setStations(prev => prev.map(s => s.id === stationId ? { ...s, assignedId: null } : s))

  const saveStation  = (u: Station)   => { setStations(p  => p.map(s => s.id === u.id ? u : s)); setEditStationModal(null) }
  const saveEmployee = (u: Employee)  => { setEmployees(p => p.map(e => e.id === u.id ? u : e)); setEditEmpModal(null) }

  const addEmployee = () => {
    if (!newEmp.name.trim()) return
    const initials = newEmp.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    const id = Math.max(...employees.map(e => e.id)) + 1
    setEmployees(p => [...p, { id, initials, name: newEmp.name.trim(), role: newEmp.role.trim() || 'Funcionário', type: newEmp.type }])
    setNewEmp({ name: '', role: '', type: 'efetivo' }); setAddEmployeeModal(false)
  }

  const addStation = () => {
    if (!newSt.name.trim()) return
    const id = Math.max(...stations.map(s => s.id)) + 1
    setStations(p => [...p, { id, assignedId: null, name: newSt.name.trim(), iconKey: newSt.iconKey }])
    setNewSt({ name: '', iconKey: 'flame' }); setAddStationModal(false)
  }

  const pieData  = [
    { name: 'Cobertas',    value: assigned.length,   color: C.success },
    { name: 'Descobertas', value: unassigned.length,  color: C.danger  },
  ]
  const weekData = [
    { day: 'Seg', n: 5 }, { day: 'Ter', n: 6 }, { day: 'Qua', n: 5 },
    { day: 'Qui', n: active.length },
    { day: 'Sex', n: 6 }, { day: 'Sáb', n: 4 }, { day: 'Dom', n: 3 },
  ]

  const modalStation = stations.find(s => s.id === assignModal)

  return (
    <div className="ph-app">

      {/* ── Sidebar ──────────────────────────────────────── */}
      <nav className="ph-sidebar">
        <div className="ph-sidebar-logo">
          <ChefHat size={22} color="#FFF5EE" strokeWidth={1.8} />
        </div>
        <div className="ph-sidebar-nav">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button key={id} className={`ph-nav-btn ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)} title={label}>
              <Icon size={20} strokeWidth={tab === id ? 2.2 : 1.8} />
              <span className="ph-nav-label">{label}</span>
            </button>
          ))}
        </div>
        <div className="ph-sidebar-bottom">
          <button className="ph-nav-btn" title="Configurações"><Settings size={18} strokeWidth={1.8} /></button>
        </div>
      </nav>

      {/* ── Page ─────────────────────────────────────────── */}
      <div className="ph-content">
        <header className="ph-header">
          <div>
            <div className="ph-greeting">Olá, Paty! 👋</div>
            <div className="ph-subline">Gerencie sua equipe e praças do restaurante</div>
          </div>
          <div className="ph-header-right">
            <div className="ph-date-chip">{cap(TODAY)}</div>
            <div className="ph-icon-btn"><Bell size={17} strokeWidth={1.8} color={C.textMid} /></div>
          </div>
        </header>

        <main className="ph-main">
          {tab === 'hoje' && (
            <HojeTab employees={employees} active={active} offToday={offToday} onVacation={onVacation}
              assigned={assigned} unassigned={unassigned} stations={stations}
              getEmployee={getEmployee} schedule={schedule}
              pieData={pieData} weekData={weekData}
              goToPracas={() => setTab('pracas')} goToEquipe={() => setTab('equipe')} goToEscala={() => setTab('escala')} />
          )}
          {tab === 'escala' && (
            <EscalaTab employees={employees} schedule={schedule}
              onToggleCell={toggleEscalaCell}
              onOpenVacation={e => setVacationModal(e)} />
          )}
          {tab === 'pracas' && (
            <PracasTab stations={stations} getEmployee={getEmployee}
              onAssign={id => setAssignModal(id)} onEdit={s => setEditStationModal(s)}
              onAdd={() => setAddStationModal(true)} />
          )}
          {tab === 'equipe' && (
            <EquipeTab employees={employees} schedule={schedule}
              onSetFolga={setTodayFolga} onClearToday={clearToday}
              onEdit={e => setEditEmpModal(e)} onVacation={e => setVacationModal(e)}
              onAdd={() => setAddEmployeeModal(true)} />
          )}
        </main>
      </div>

      {/* ── Mobile nav ───────────────────────────────────── */}
      <div className="ph-mobile-nav">
        <div className="ph-mob-inner">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button key={id} className={`ph-mob-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              <Icon size={19} strokeWidth={tab === id ? 2.2 : 1.8} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────── */}
      {assignModal && modalStation && (
        <BottomSheet onClose={() => setAssignModal(null)} title={`Responsável · ${modalStation.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {active.map(emp => (
              <button key={emp.id} onClick={() => assignEmployee(assignModal, emp.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${getEmpColor(emp.id).border}`, background: getEmpColor(emp.id).bg, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', width: '100%', textAlign: 'left' }}>
                <Avatar emp={emp} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{emp.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 12, color: C.textMid }}>{emp.role}</span>
                    <TypeBadge type={emp.type} small />
                  </div>
                </div>
                {modalStation.assignedId === emp.id && <Check size={17} color={C.success} />}
              </button>
            ))}
            {modalStation.assignedId && (
              <button onClick={() => { unassignStation(assignModal); setAssignModal(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${C.danger}35`, background: C.dangerLight, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', width: '100%', marginTop: 4 }}>
                <X size={15} color={C.danger} />
                <span style={{ color: C.danger, fontWeight: 600, fontSize: 14 }}>Remover responsável</span>
              </button>
            )}
          </div>
        </BottomSheet>
      )}

      {editStationModal && (
        <BottomSheet onClose={() => setEditStationModal(null)} title="Editar Praça">
          <EditStationForm station={editStationModal} onSave={saveStation} />
        </BottomSheet>
      )}

      {editEmpModal && (
        <BottomSheet onClose={() => setEditEmpModal(null)} title="Editar Funcionário">
          <EditEmployeeForm emp={editEmpModal} onSave={saveEmployee} />
        </BottomSheet>
      )}

      {vacationModal && (
        <BottomSheet onClose={() => setVacationModal(null)} title={`Férias · ${vacationModal.name}`}>
          <VacationForm emp={vacationModal} schedule={schedule}
            onConfirm={confirmVacation} onEnd={endVacation} />
        </BottomSheet>
      )}

      {addEmployeeModal && (
        <BottomSheet onClose={() => setAddEmployeeModal(false)} title="Novo Funcionário">
          <FLabel>Nome completo</FLabel>
          <input placeholder="Ex: Maria Silva" value={newEmp.name}
            onChange={e => setNewEmp(p => ({ ...p, name: e.target.value }))} style={inputSt} />
          <FLabel style={{ marginTop: 12 }}>Cargo</FLabel>
          <input placeholder="Ex: Cozinheiro" value={newEmp.role}
            onChange={e => setNewEmp(p => ({ ...p, role: e.target.value }))} style={inputSt} />
          <FLabel style={{ marginTop: 12 }}>Tipo de contrato</FLabel>
          <TypeSelector value={newEmp.type} onChange={t => setNewEmp(p => ({ ...p, type: t }))} />
          <button onClick={addEmployee} style={{ ...primaryBtnSt, marginTop: 20 }}>
            <Plus size={16} /> Adicionar funcionário
          </button>
        </BottomSheet>
      )}

      {addStationModal && (
        <BottomSheet onClose={() => setAddStationModal(false)} title="Nova Praça">
          <FLabel>Nome da praça</FLabel>
          <input placeholder="Ex: Caixa, Saladas…" value={newSt.name}
            onChange={e => setNewSt(p => ({ ...p, name: e.target.value }))} style={inputSt} />
          <FLabel style={{ marginTop: 12 }}>Ícone</FLabel>
          <IconPicker selected={newSt.iconKey} onSelect={k => setNewSt(p => ({ ...p, iconKey: k }))} />
          <button onClick={addStation} style={{ ...primaryBtnSt, marginTop: 20 }}>
            <Plus size={16} /> Adicionar praça
          </button>
        </BottomSheet>
      )}
    </div>
  )
}

// ─── HojeTab ──────────────────────────────────────────────────────────────────

function HojeTab({ employees, active, offToday, onVacation, assigned, unassigned, stations, getEmployee, schedule, pieData, weekData, goToPracas, goToEquipe, goToEscala }: {
  employees: Employee[]; active: Employee[]; offToday: Employee[]; onVacation: Employee[]
  assigned: Station[]; unassigned: Station[]; stations: Station[]
  getEmployee: (id: number | null) => Employee | undefined
  schedule: Schedule
  pieData: { name: string; value: number; color: string }[]
  weekData: { day: string; n: number }[]
  goToPracas: () => void; goToEquipe: () => void; goToEscala: () => void
}) {
  const efetivos    = employees.filter(e => e.type === 'efetivo').length
  const temporarios = employees.filter(e => e.type === 'temporario').length
  const absent      = [...offToday, ...onVacation]

  return (
    <div>
      <span className="ph-section-label">Resumo do dia</span>

      <div className="ph-metrics">
        <MetricCard value={active.length}    label="Trabalhando"     Icon={UserCheck}    accent={C.success} light={C.successLight} />
        <MetricCard value={offToday.length}  label="De folga"        Icon={Umbrella}     accent={C.warning} light={C.warningLight} />
        <MetricCard value={assigned.length}  label="Praças cobertas" Icon={TrendingUp}   accent={C.accent}  light={C.accentLight}  />
        <MetricCard value={employees.length} label="Total da equipe" Icon={Users}        accent={C.nav}     light="#E8E0D8" dark />
      </div>

      <div className="ph-row-211">
        {/* Praças list */}
        <div className="ph-card">
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Praças de hoje</span>
            <button onClick={goToPracas} style={linkBtnSt}>Gerenciar <ChevronRight size={12} /></button>
          </div>
          {stations.map((s, idx) => {
            const emp = getEmployee(s.assignedId); const StIcon = getIcon(s.iconKey)
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: idx < stations.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <StIcon size={16} color={C.accent} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  {emp ? <div style={{ fontSize: 11, color: C.textMid, marginTop: 1 }}>{emp.name}</div>
                       : <div style={{ fontSize: 11, color: C.danger, fontWeight: 600, marginTop: 1 }}>Sem responsável</div>}
                </div>
                {emp ? <Avatar emp={emp} size={28} />
                     : <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.dangerLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={12} color={C.danger} /></div>}
              </div>
            )
          })}
        </div>

        {/* Bar chart */}
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

        {/* Composition */}
        <div className="ph-card ph-card-p" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>Composição da equipe</div>
          {[
            { label: 'Efetivos',    value: efetivos,          color: C.info    },
            { label: 'Temporários', value: temporarios,       color: C.teal    },
            { label: 'De férias',   value: onVacation.length, color: C.warning },
            { label: 'Descobertas', value: unassigned.length, color: C.danger  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
          <button onClick={goToEquipe} style={{ ...outlineBtnSt, marginTop: 'auto', paddingTop: 14 }}>
            <Users size={13} /> Ver equipe
          </button>
        </div>
      </div>

      <div className="ph-row-211">
        {/* Team preview */}
        <div className="ph-card">
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Equipe hoje</span>
            <button onClick={goToEquipe} style={linkBtnSt}>Ver todos <ChevronRight size={12} /></button>
          </div>
          {employees.slice(0, 5).map((emp, idx) => (
            <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: idx < 4 ? `1px solid ${C.border}` : 'none' }}>
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

        {/* Absences */}
        <div className="ph-card ph-card-p">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Ausências</div>
            <button onClick={goToEscala} style={linkBtnSt}>Escala <ChevronRight size={12} /></button>
          </div>
          {absent.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.textLight, fontSize: 12, padding: '20px 0', lineHeight: 1.6 }}>
              <Check size={22} color={C.success} style={{ display: 'block', margin: '0 auto 8px' }} />
              Todos estão<br />presentes!
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

        {/* Alert card */}
        <div className="ph-card ph-card-p" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: unassigned.length > 0 ? C.dangerLight : C.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            {unassigned.length > 0
              ? <AlertTriangle size={26} color={C.danger}  strokeWidth={1.8} />
              : <Check         size={26} color={C.success} strokeWidth={2}   />}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 8 }}>
            {unassigned.length > 0 ? `${unassigned.length} praça${unassigned.length > 1 ? 's' : ''} sem cobertura` : 'Tudo coberto!'}
          </div>
          <div style={{ fontSize: 12, color: C.textLight, lineHeight: 1.6, marginBottom: 16 }}>
            {unassigned.length > 0 ? 'Atribua funcionários às praças abertas.' : 'Todas as praças têm responsável hoje. Ótimo!'}
          </div>
          {unassigned.length > 0 && (
            <button onClick={goToPracas} style={{ ...primaryBtnSt, fontSize: 13, padding: '10px 16px' }}>Resolver agora</button>
          )}
        </div>
      </div>

      {/* Pie chart */}
      <div className="ph-card ph-card-p">
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>Cobertura de praças</div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={68} innerRadius={28} dataKey="value"
              label={({ name, value }: { name: string; value: number }) => value > 0 ? `${name}: ${value}` : ''}
              labelLine={{ stroke: C.textLight }}>
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

// ─── EscalaTab ────────────────────────────────────────────────────────────────

function EscalaTab({ employees, schedule, onToggleCell, onOpenVacation }: {
  employees: Employee[]; schedule: Schedule
  onToggleCell: (empId: number, dateISO: string) => void
  onOpenVacation: (emp: Employee) => void
}) {
  const now = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const getDateISO  = (d: number) => {
    const month = String(viewMonth + 1).padStart(2, '0')
    const day   = String(d).padStart(2, '0')
    return `${viewYear}-${month}-${day}`
  }
  const getDow      = (d: number) => new Date(viewYear, viewMonth, d).getDay()
  const isWeekend   = (d: number) => { const dow = getDow(d); return dow === 0 || dow === 6 }
  const isToday     = (d: number) => getDateISO(d) === TODAY_ISO

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }
  const goToday = () => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()) }

  // group employees by role
  const roles = [...new Set(employees.map(e => e.role))]

  const getDayMark = (empId: number, d: number): DayMark | null =>
    (schedule[empId]?.[getDateISO(d)] as DayMark | undefined) ?? null

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="ph-section-label" style={{ marginBottom: 0 }}>Escala mensal</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={goToday} style={{ ...outlineBtnSt, width: 'auto', padding: '6px 12px', fontSize: 12 }}>Hoje</button>
          <button onClick={prevMonth} style={iconEditBtnSt}><ChevronLeft size={15} /></button>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.text, minWidth: 130, textAlign: 'center' }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} style={iconEditBtnSt}><ChevronRight size={15} /></button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { bg: C.dangerLight, border: '#F0B0B0', color: C.danger, text: 'F', label: 'Folga — clique para marcar' },
          { bg: C.vacationLight, border: '#E8D060', color: '#8B6A00', text: 'FÉR', label: 'Férias — via botão Férias' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.textMid }}>
            <div style={{ minWidth: l.text === 'FÉR' ? 28 : 20, height: 20, borderRadius: 4, background: l.bg, border: `1px solid ${l.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: l.color }}>{l.text}</div>
            {l.label}
          </div>
        ))}
      </div>

      {/* Scrollable schedule table */}
      <div className="ph-escala-wrap">
        <table className="ph-escala-table">
          <thead>
            <tr>
              {/* Name col header */}
              <th className="ph-escala-name-col" style={{ background: C.nav, color: '#FFF5EE', fontSize: 10, fontWeight: 700, padding: '9px 14px', textAlign: 'left', borderRight: `2px solid rgba(255,255,255,0.15)`, letterSpacing: '0.5px' }}>
                FUNCIONÁRIO
              </th>
              {days.map(d => {
                const dow = getDow(d); const weekend = isWeekend(d); const today = isToday(d)
                return (
                  <th key={d} style={{ background: today ? C.accent : weekend ? '#2D1208' : C.nav, color: today ? '#FFF' : weekend ? '#F0A07A' : '#C0A090', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: '4px 0', width: 32, minWidth: 32, borderRight: `1px solid rgba(255,255,255,0.08)` }}>
                    <div style={{ fontSize: 8, lineHeight: 1, marginBottom: 2 }}>{DAY_ABBR[dow]}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1 }}>{d}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <>
                {/* Group row */}
                <tr key={`g-${role}`}>
                  <td colSpan={daysInMonth + 1} style={{ background: '#F4EFE9', padding: '6px 14px', fontSize: 11, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.6px', borderTop: `2px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                    {role}
                  </td>
                </tr>
                {/* Employee rows */}
                {employees.filter(e => e.role === role).map(emp => (
                  <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    {/* Name cell — sticky */}
                    <td className="ph-escala-name-col-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px' }}>
                        <Avatar emp={emp} size={26} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {emp.name.split(' ').slice(0, 2).join(' ')}
                          </div>
                          <TypeBadge type={emp.type} small />
                        </div>
                        <button onClick={() => onOpenVacation(emp)} title="Editar férias"
                          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, padding: '2px', flexShrink: 0 }}>
                          <Calendar size={12} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                    {/* Day cells */}
                    {days.map(d => {
                      const mark    = getDayMark(emp.id, d)
                      const weekend = isWeekend(d)
                      const today   = isToday(d)
                      const isVac   = mark === 'vacation'
                      const isF     = mark === 'folga'

                      let bg = weekend ? '#FAF6F2' : '#FFFFFF'
                      if (today && !mark)  bg = '#FFF8F4'
                      if (isF)    bg = C.dangerLight
                      if (isVac)  bg = C.vacationLight

                      return (
                        <td key={d}
                          className={`ph-escala-day-cell${isVac ? ' vacation' : ''}`}
                          onClick={() => !isVac && onToggleCell(emp.id, getDateISO(d))}
                          style={{ background: bg, color: isVac ? '#8B6A00' : isF ? C.danger : 'transparent', fontWeight: 800, fontSize: isVac ? 8 : 11, borderRight: today ? `1px solid ${C.accent}40` : `1px solid ${C.border}` }}>
                          {isVac ? 'FÉR' : isF ? 'F' : ''}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── PracasTab ────────────────────────────────────────────────────────────────

function PracasTab({ stations, getEmployee, onAssign, onEdit, onAdd }: {
  stations: Station[]; getEmployee: (id: number | null) => Employee | undefined
  onAssign: (id: number) => void; onEdit: (s: Station) => void; onAdd: () => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="ph-section-label" style={{ marginBottom: 0 }}>Praças do restaurante</span>
        <button onClick={onAdd} style={addBtnSt}><Plus size={14} strokeWidth={2.5} /> Nova praça</button>
      </div>
      <div className="ph-stations-grid">
        {stations.map(s => {
          const emp = getEmployee(s.assignedId); const StIcon = getIcon(s.iconKey); const covered = !!emp
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
                  <button onClick={() => onEdit(s)} style={iconEditBtnSt} title="Editar praça">
                    <Pencil size={13} strokeWidth={2} />
                  </button>
                </div>
                {emp ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: getEmpColor(emp.id).bg, border: `1px solid ${getEmpColor(emp.id).border}`, marginBottom: 12 }}>
                    <Avatar emp={emp} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{emp.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <span style={{ fontSize: 12, color: C.textMid }}>{emp.role}</span>
                        <TypeBadge type={emp.type} small />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 11, background: C.dangerLight, marginBottom: 12 }}>
                    <AlertTriangle size={15} color={C.danger} />
                    <span style={{ fontSize: 13, color: C.danger, fontWeight: 600 }}>Nenhum funcionário atribuído</span>
                  </div>
                )}
                <button onClick={() => onAssign(s.id)} style={primaryBtnSt}>
                  {emp ? 'Trocar responsável' : 'Atribuir funcionário'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── EquipeTab ────────────────────────────────────────────────────────────────

function EquipeTab({ employees, schedule, onSetFolga, onClearToday, onEdit, onVacation, onAdd }: {
  employees: Employee[]; schedule: Schedule
  onSetFolga: (id: number) => void; onClearToday: (id: number) => void
  onEdit: (e: Employee) => void; onVacation: (e: Employee) => void; onAdd: () => void
}) {
  const active   = employees.filter(e => getStatusForDate(e.id, schedule, TODAY_ISO) === 'active')
  const dayoff   = employees.filter(e => getStatusForDate(e.id, schedule, TODAY_ISO) === 'dayoff')
  const vacation = employees.filter(e => getStatusForDate(e.id, schedule, TODAY_ISO) === 'vacation')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="ph-section-label" style={{ marginBottom: 0 }}>Equipe</span>
        <button onClick={onAdd} style={addBtnSt}><Plus size={14} strokeWidth={2.5} /> Funcionário</button>
      </div>
      {active.length > 0 && (
        <>
          <GroupLabel>Trabalhando hoje · {active.length}</GroupLabel>
          <div className="ph-equipe-grid" style={{ marginBottom: 20 }}>
            {active.map(e => <EmployeeCard key={e.id} emp={e} schedule={schedule} onSetFolga={onSetFolga} onClearToday={onClearToday} onEdit={onEdit} onVacation={onVacation} />)}
          </div>
        </>
      )}
      {dayoff.length > 0 && (
        <>
          <GroupLabel>De folga · {dayoff.length}</GroupLabel>
          <div className="ph-equipe-grid" style={{ marginBottom: 20 }}>
            {dayoff.map(e => <EmployeeCard key={e.id} emp={e} schedule={schedule} onSetFolga={onSetFolga} onClearToday={onClearToday} onEdit={onEdit} onVacation={onVacation} />)}
          </div>
        </>
      )}
      {vacation.length > 0 && (
        <>
          <GroupLabel>De férias · {vacation.length}</GroupLabel>
          <div className="ph-equipe-grid">
            {vacation.map(e => <EmployeeCard key={e.id} emp={e} schedule={schedule} onSetFolga={onSetFolga} onClearToday={onClearToday} onEdit={onEdit} onVacation={onVacation} />)}
          </div>
        </>
      )}
    </div>
  )
}

// ─── EmployeeCard ─────────────────────────────────────────────────────────────

function EmployeeCard({ emp, schedule, onSetFolga, onClearToday, onEdit, onVacation }: {
  emp: Employee; schedule: Schedule
  onSetFolga: (id: number) => void; onClearToday: (id: number) => void
  onEdit: (e: Employee) => void; onVacation: (e: Employee) => void
}) {
  const status  = getStatusForDate(emp.id, schedule, TODAY_ISO)
  const vacRange = getVacationRange(emp.id, schedule)
  const accent  = status === 'active' ? C.success : status === 'vacation' ? C.info : C.warning

  return (
    <div className="ph-card" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="ph-card-p">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <Avatar emp={emp} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
            <div style={{ fontSize: 12, color: C.textMid, marginTop: 1 }}>{emp.role}</div>
            {status === 'vacation' && vacRange && (
              <div style={{ fontSize: 11, color: C.info, marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Calendar size={10} strokeWidth={2} /> {fmtDate(vacRange.start)} → {fmtDate(vacRange.end)}
              </div>
            )}
          </div>
          <button onClick={() => onEdit(emp)} style={iconEditBtnSt} title="Editar funcionário">
            <Pencil size={13} strokeWidth={2} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <TypeBadge type={emp.type} />
          <StatusBadge status={status} />
        </div>

        {status === 'active' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ActionBtn onClick={() => onSetFolga(emp.id)} Icon={Umbrella} label="Folga"  bg={C.warningLight} color={C.warning} />
            <ActionBtn onClick={() => onVacation(emp)}    Icon={Calendar} label="Férias" bg={C.infoLight}    color={C.info}    />
          </div>
        ) : (
          <ActionBtn onClick={() => onClearToday(emp.id)} Icon={UserCheck}
            label={status === 'vacation' ? 'Encerrar férias' : 'Marcar como ativo'}
            bg={C.successLight} color={C.success} full
          />
        )}
      </div>
    </div>
  )
}

// ─── Edit Employee Form ───────────────────────────────────────────────────────

function EditEmployeeForm({ emp, onSave }: { emp: Employee; onSave: (e: Employee) => void }) {
  const [name, setName] = useState(emp.name)
  const [role, setRole] = useState(emp.role)
  const [type, setType] = useState<EmpType>(emp.type)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: getEmpColor(emp.id).bg, borderRadius: 12, marginBottom: 20 }}>
        <Avatar emp={{ ...emp, name: name || emp.name }} size={44} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{name || emp.name}</div>
          <div style={{ fontSize: 12, color: C.textMid, marginTop: 1 }}>{role || emp.role}</div>
        </div>
      </div>
      <FLabel>Nome completo</FLabel>
      <input value={name} onChange={e => setName(e.target.value)} style={inputSt} />
      <FLabel style={{ marginTop: 12 }}>Cargo</FLabel>
      <input value={role} onChange={e => setRole(e.target.value)} style={inputSt} />
      <FLabel style={{ marginTop: 12 }}>Tipo de contrato</FLabel>
      <TypeSelector value={type} onChange={setType} />
      <button onClick={() => onSave({ ...emp, name: name.trim() || emp.name, role: role.trim() || emp.role, type })}
        style={{ ...primaryBtnSt, marginTop: 20 }}>
        <Check size={16} /> Salvar alterações
      </button>
    </div>
  )
}

// ─── Vacation Form ────────────────────────────────────────────────────────────

function VacationForm({ emp, schedule, onConfirm, onEnd }: {
  emp: Employee; schedule: Schedule
  onConfirm: (id: number, start: string, end: string) => void
  onEnd: (id: number) => void
}) {
  const existing = getVacationRange(emp.id, schedule)
  const [start, setStart] = useState(existing?.start ?? '')
  const [end,   setEnd]   = useState(existing?.end   ?? '')
  const canConfirm = start && end && end >= start
  const isOnVacation = getStatusForDate(emp.id, schedule, TODAY_ISO) === 'vacation'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.infoLight, borderRadius: 12, marginBottom: 20 }}>
        <Avatar emp={emp} size={44} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{emp.name}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
            <TypeBadge type={emp.type} small />
            <span style={{ fontSize: 12, color: C.textMid }}>{emp.role}</span>
          </div>
        </div>
      </div>
      <FLabel>Início das férias</FLabel>
      <input type="date" value={start} onChange={e => setStart(e.target.value)} style={inputSt} />
      <FLabel style={{ marginTop: 12 }}>Fim das férias</FLabel>
      <input type="date" value={end}   onChange={e => setEnd(e.target.value)}   style={inputSt} />
      <div style={{ fontSize: 11, color: C.textLight, marginTop: 8 }}>
        As datas aparecerão automaticamente na aba Escala.
      </div>
      <button onClick={() => canConfirm && onConfirm(emp.id, start, end)}
        style={{ ...primaryBtnSt, marginTop: 18, opacity: canConfirm ? 1 : 0.5 }}>
        <Calendar size={16} /> Confirmar férias
      </button>
      {isOnVacation && (
        <button onClick={() => onEnd(emp.id)} style={{ ...outlineBtnSt, marginTop: 10, color: C.danger, borderColor: C.danger + '40' }}>
          <X size={14} /> Encerrar férias a partir de hoje
        </button>
      )}
    </div>
  )
}

// ─── Edit Station Form ────────────────────────────────────────────────────────

function EditStationForm({ station, onSave }: { station: Station; onSave: (s: Station) => void }) {
  const [name,    setName]    = useState(station.name)
  const [iconKey, setIconKey] = useState(station.iconKey)
  return (
    <div>
      <FLabel>Nome da praça</FLabel>
      <input value={name} onChange={e => setName(e.target.value)} style={inputSt} />
      <FLabel style={{ marginTop: 12 }}>Ícone</FLabel>
      <IconPicker selected={iconKey} onSelect={setIconKey} />
      <button onClick={() => onSave({ ...station, name: name.trim() || station.name, iconKey })}
        style={{ ...primaryBtnSt, marginTop: 20 }}>
        <Check size={16} /> Salvar praça
      </button>
    </div>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────

function Avatar({ emp, size }: { emp: Employee; size: number }) {
  const color = getEmpColor(emp.id)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: color.bg, color: color.text, border: `1.5px solid ${color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.33, fontFamily: 'DM Sans,sans-serif' }}>
      {emp.initials}
    </div>
  )
}

function MetricCard({ value, label, Icon, accent, light, dark = false }: {
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

function TypeBadge({ type, small = false }: { type: EmpType; small?: boolean }) {
  const isEf = type === 'efetivo'
  return (
    <span style={{ fontSize: small ? 10 : 11, fontWeight: 700, padding: small ? '2px 6px' : '3px 8px', borderRadius: 6, background: isEf ? C.infoLight : C.tealLight, color: isEf ? C.info : C.teal, whiteSpace: 'nowrap', letterSpacing: '0.2px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {isEf ? <BadgeCheck size={small ? 9 : 10} strokeWidth={2.5} /> : <Timer size={small ? 9 : 10} strokeWidth={2.5} />}
      {isEf ? 'Efetivo' : 'Temporário'}
    </span>
  )
}

function StatusBadge({ status, small = false }: { status: Status | 'covered' | 'empty'; small?: boolean }) {
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

function TypeSelector({ value, onChange }: { value: EmpType; onChange: (t: EmpType) => void }) {
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

function ActionBtn({ onClick, Icon, label, bg, color, full }: { onClick: () => void; Icon: IconComp; label: string; bg: string; color: string; full?: boolean }) {
  return (
    <button onClick={onClick} style={{ width: full ? '100%' : undefined, padding: '9px 0', background: bg, color, border: `1px solid ${color}25`, borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
      <Icon size={13} strokeWidth={2} /> {label}
    </button>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>{children}</div>
}

function FLabel({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: C.textMid, marginBottom: 6, ...style }}>{children}</div>
}

function BottomSheet({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
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

function IconPicker({ selected, onSelect }: { selected: string; onSelect: (k: string) => void }) {
  const [open, setOpen] = useState(false)
  const sel = STATION_ICONS.find(i => i.key === selected) ?? STATION_ICONS[0]
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

const inputSt: CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px',
  borderRadius: 12, border: `1.5px solid ${C.border}`,
  fontFamily: 'DM Sans,sans-serif', fontSize: 15,
  background: '#FAFAFA', color: C.text, outline: 'none',
}
const primaryBtnSt: CSSProperties = {
  width: '100%', padding: '13px', background: C.accent, color: '#FFF5EE',
  border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14,
  cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
}
const addBtnSt: CSSProperties = {
  background: C.accent, color: '#FFF5EE', border: 'none', borderRadius: 10,
  padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
  fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 5,
}
const outlineBtnSt: CSSProperties = {
  width: '100%', padding: '11px', background: 'transparent', color: C.textMid,
  border: `1.5px solid ${C.border}`, borderRadius: 12, fontWeight: 600, fontSize: 13,
  cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
}
const linkBtnSt: CSSProperties = {
  fontSize: 12, color: C.accent, fontWeight: 600, background: 'none',
  border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
  display: 'flex', alignItems: 'center', gap: 2,
}
const iconEditBtnSt: CSSProperties = {
  width: 30, height: 30, borderRadius: 8, background: C.bg,
  border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', color: C.textMid, flexShrink: 0,
}

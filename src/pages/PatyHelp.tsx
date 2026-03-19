import { useState, useEffect, useRef, CSSProperties, useCallback } from 'react'
import './PatyHelp.css'
import { supabase } from '../supabaseClient'
import type { Employee, Station, Schedule, DayMark, EmpType, Status, Tab } from '../types'
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
  CalendarDays, Trash2, GripVertical, ChevronUp, Briefcase, Loader2,
  UserPlus, Eraser, Sparkles, Bot,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: '#EDE8E3', card: '#FFFFFF',
  accent: '#C1440E', accentLight: '#FDE8DC',
  success: '#2A7A4F', successLight: '#DEF2EA',
  warning: '#B5690A', warningLight: '#FEF2D8',
  danger: '#B83232', dangerLight: '#FCDEDE',
  info: '#1B5FA8', infoLight: '#E6EFFE',
  teal: '#0D7477', tealLight: '#DDF3F3',
  vacation: '#F5C518', vacationLight: '#FFFAE0',
  violation: '#FF6B00', violationLight: '#FFF0E6',
  text: '#18080A', textMid: '#6B4435', textLight: '#9A7866',
  border: '#E8E0D8', nav: '#1A0804',
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

type IconComp = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>

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

const DAY_ABBR    = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB']
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const getTodayISO = () => new Date().toISOString().split('T')[0]
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const fmtDate = (iso: string) => { const [y,m,d] = iso.split('-'); return `${d}/${m}/${String(y).slice(2)}` }
const fmtDateLong = (iso: string) => {
  const [y,m,d] = iso.split('-')
  const dt = new Date(Number(y), Number(m)-1, Number(d))
  return dt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}
const TODAY       = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const TODAY_ISO   = getTodayISO()

const buildRange = (start: string, end: string, mark: DayMark): Record<string, DayMark> => {
  const out: Record<string, DayMark> = {}
  const s = new Date(start + 'T12:00:00'), e = new Date(end + 'T12:00:00'), c = new Date(s)
  while (c <= e) { out[c.toISOString().split('T')[0]] = mark; c.setDate(c.getDate() + 1) }
  return out
}
const buildDateArray = (start: string, end: string): string[] => {
  const dates: string[] = []
  const s = new Date(start + 'T12:00:00'), e = new Date(end + 'T12:00:00'), c = new Date(s)
  while (c <= e) { dates.push(c.toISOString().split('T')[0]); c.setDate(c.getDate() + 1) }
  return dates
}

const getStatusForDate = (empId: number, schedule: Schedule, dateISO: string): Status => {
  const m = schedule[empId]?.[dateISO]
  return m === 'folga' ? 'dayoff' : m === 'vacation' ? 'vacation' : 'active'
}
const getVacationRange = (empId: number, schedule: Schedule) => {
  const vd = Object.entries(schedule[empId] ?? {}).filter(([,m]) => m === 'vacation').map(([d]) => d).sort()
  return vd.length ? { start: vd[0], end: vd[vd.length - 1] } : null
}

// ─── 7-day consecutive violation detection ────────────────────────────────────

const getViolationDays = (
  employees: Employee[], schedule: Schedule, year: number, month: number
): Record<number, Set<string>> => {
  const result: Record<number, Set<string>> = {}
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (const emp of employees) {
    const violations = new Set<string>()
    let streak = 0
    const streakDates: string[] = []

    // Check 5 days before month start for continuity
    for (let d = -4; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d)
      const iso = dt.toISOString().split('T')[0]
      const mark = schedule[emp.id]?.[iso]
      const isResting = mark === 'folga' || mark === 'vacation'

      if (!isResting) {
        streak++
        if (d >= 1) streakDates.push(iso)
        if (streak > 7) {
          // All days in current streak that are in this month are violations
          streakDates.forEach(dd => violations.add(dd))
        }
      } else {
        streak = 0
        streakDates.length = 0
      }
    }
    if (violations.size > 0) result[emp.id] = violations
  }
  return result
}

// ─── Gemini AI ────────────────────────────────────────────────────────────────

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

const callGemini = async (prompt: string): Promise<string> => {
  if (!GEMINI_KEY) throw new Error('Chave VITE_GEMINI_API_KEY não encontrada no .env.local')
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Gemini ${res.status}: ${(err as any)?.error?.message ?? res.statusText}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

const buildScheduleContext = (
  employees: Employee[], schedule: Schedule, year: number, month: number
): string => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const header = `Mês: ${MONTH_NAMES[month]} ${year} (${daysInMonth} dias)\n`
  const empList = employees.map(e => `  ID${e.id}: ${e.name} | ${e.role} | ${e.type}`).join('\n')
  const legend = `\nLegenda: T=Trabalhando  F=Folga  V=Férias\n`
  const dayHeader = `${'Nome'.padEnd(22)} ${days.map(d => String(d).padStart(2)).join(' ')}`
  const rows = employees.map(emp => {
    const marks = days.map(d => {
      const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const m = schedule[emp.id]?.[iso]
      return m === 'folga' ? ' F' : m === 'vacation' ? ' V' : ' T'
    }).join('')
    return `${emp.name.slice(0, 22).padEnd(22)} ${marks}`
  }).join('\n')
  return `${header}\nFuncionários:\n${empList}${legend}\n${dayHeader}\n${rows}`
}

interface AiChange { employee_id: number; date: string; action: 'add_folga' | 'remove_folga' }
interface AiResponse { changes: AiChange[]; explanation: string }

const parseAiResponse = (raw: string): AiResponse => {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Resposta da IA não contém JSON válido')
  return JSON.parse(match[0]) as AiResponse
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'hoje'   as Tab, label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'escala' as Tab, label: 'Escala',    Icon: CalendarDays    },
  { id: 'pracas' as Tab, label: 'Praças',    Icon: UtensilsCrossed },
  { id: 'equipe' as Tab, label: 'Equipe',    Icon: Users           },
]

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PatyHelp() {
  const [tab, setTab]             = useState<Tab>('hoje')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stations,  setStations]  = useState<Station[]>([])
  const [schedule,  setSchedule]  = useState<Schedule>({})
  const [roles,     setRoles]     = useState<string[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  // Month navigation lifted to root (needed by AI handlers)
  const now = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  // Modals
  const [assignModal,      setAssignModal]      = useState<{ stationId: number; mode: 'replace' | 'add' } | null>(null)
  const [editStationModal, setEditStationModal] = useState<Station | null>(null)
  const [editEmpModal,     setEditEmpModal]     = useState<Employee | null>(null)
  const [vacationModal,    setVacationModal]    = useState<Employee | null>(null)
  const [addEmployeeModal, setAddEmployeeModal] = useState(false)
  const [addStationModal,  setAddStationModal]  = useState(false)
  const [rolesModal,       setRolesModal]       = useState(false)
  const [clearFolgasModal, setClearFolgasModal] = useState(false)
  const [aiReviewModal,    setAiReviewModal]    = useState(false)

  // Drag-to-day AI folga swap
  const [dragFolgaConfirm, setDragFolgaConfirm] = useState<{ empId: number; dateISO: string } | null>(null)
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiMessage,  setAiMessage]  = useState<string | null>(null)
  const [aiError,    setAiError]    = useState<string | null>(null)

  const [newEmp, setNewEmp] = useState({ name: '', role: '', type: 'efetivo' as EmpType })
  const [newSt,  setNewSt]  = useState({ name: '', iconKey: 'flame' })

  // ─ Load all ─
  const loadAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [rolesRes, empsRes, stationsRes, stEmpRes, schedRes] = await Promise.all([
        supabase.from('roles').select('id,name,sort_order').order('sort_order'),
        supabase.from('employees').select('id,name,role_id,initials,type,sort_order,roles(name)').order('sort_order'),
        supabase.from('stations').select('id,name,icon_key,sort_order').order('sort_order'),
        supabase.from('station_employees').select('station_id,employee_id,sort_order').order('sort_order'),
        supabase.from('schedule').select('employee_id,date,mark'),
      ])
      for (const r of [rolesRes, empsRes, stationsRes, stEmpRes, schedRes])
        if (r.error) throw r.error

      setRoles((rolesRes.data ?? []).map((r: any) => r.name))
      const emps: Employee[] = (empsRes.data ?? []).map((e: any) => ({
        id: e.id, name: e.name, initials: e.initials, type: e.type, sort_order: e.sort_order,
        role: e.roles?.name ?? '',
      }))
      setEmployees(emps)
      const stEmpMap: Record<number, number[]> = {}
      for (const se of (stEmpRes.data ?? []) as any[]) {
        if (!stEmpMap[se.station_id]) stEmpMap[se.station_id] = []
        stEmpMap[se.station_id].push(se.employee_id)
      }
      setStations((stationsRes.data ?? []).map((s: any) => ({
        id: s.id, name: s.name, iconKey: s.icon_key, sort_order: s.sort_order,
        assignedIds: stEmpMap[s.id] ?? [],
      })))
      const sched: Schedule = {}
      for (const row of (schedRes.data ?? []) as any[]) {
        if (!sched[row.employee_id]) sched[row.employee_id] = {}
        sched[row.employee_id][row.date] = row.mark
      }
      setSchedule(sched)
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ─ Derived ─
  const getStatus   = (e: Employee) => getStatusForDate(e.id, schedule, TODAY_ISO)
  const active      = employees.filter(e => getStatus(e) === 'active')
  const offToday    = employees.filter(e => getStatus(e) === 'dayoff')
  const onVacation  = employees.filter(e => getStatus(e) === 'vacation')
  const coveredSts  = stations.filter(s => s.assignedIds.length > 0)
  const uncovSts    = stations.filter(s => s.assignedIds.length === 0)
  const getEmployee = (id: number) => employees.find(e => e.id === id)

  const violations = getViolationDays(employees, schedule, viewYear, viewMonth)
  const hasViolations = Object.keys(violations).length > 0

  // ─ Schedule helpers ─
  const toggleEscalaCell = async (empId: number, dateISO: string) => {
    const cur = schedule[empId]?.[dateISO]
    if (cur === 'vacation') return

    // Block if removing folga would create >7 consecutive days
    if (cur === 'folga') {
      // simulate removing
      const simSched = { ...schedule, [empId]: { ...(schedule[empId] ?? {}) } }
      delete simSched[empId][dateISO]
      const simViolations = getViolationDays(employees.filter(e => e.id === empId), simSched, viewYear, viewMonth)
      if (simViolations[empId]?.size) {
        setAiError(`⚠️ Remover esta folga fará ${getEmployee(empId)?.name.split(' ')[0]} trabalhar mais de 7 dias seguidos! Use a IA para reorganizar.`)
        setTimeout(() => setAiError(null), 5000)
        return
      }
    }

    const newMark: DayMark | null = cur === 'folga' ? null : 'folga'
    setSchedule(prev => {
      const s = { ...(prev[empId] ?? {}) }
      if (newMark === null) delete s[dateISO]; else s[dateISO] = newMark
      return { ...prev, [empId]: s }
    })
    if (newMark === null)
      await supabase.from('schedule').delete().eq('employee_id', empId).eq('date', dateISO)
    else
      await supabase.from('schedule').upsert({ employee_id: empId, date: dateISO, mark: newMark })
  }

  const setTodayMark = async (empId: number, mark: DayMark | null) => {
    setSchedule(prev => {
      const s = { ...(prev[empId] ?? {}) }
      if (mark === null) delete s[TODAY_ISO]; else s[TODAY_ISO] = mark
      return { ...prev, [empId]: s }
    })
    if (mark === null)
      await supabase.from('schedule').delete().eq('employee_id', empId).eq('date', TODAY_ISO)
    else
      await supabase.from('schedule').upsert({ employee_id: empId, date: TODAY_ISO, mark })
    if (mark !== null) {
      setStations(prev => prev.map(s => ({ ...s, assignedIds: s.assignedIds.filter(id => id !== empId) })))
      for (const s of stations)
        if (s.assignedIds.includes(empId))
          await supabase.from('station_employees').delete().eq('station_id', s.id).eq('employee_id', empId)
    }
  }

  const confirmVacation = async (empId: number, start: string, end: string) => {
    const range = buildRange(start, end, 'vacation')
    const rows  = Object.entries(range).map(([date, mark]) => ({ employee_id: empId, date, mark }))
    setSchedule(prev => ({ ...prev, [empId]: { ...(prev[empId] ?? {}), ...range } }))
    setStations(prev => prev.map(s => ({ ...s, assignedIds: s.assignedIds.filter(id => id !== empId) })))
    await supabase.from('schedule').upsert(rows)
    for (const s of stations)
      if (s.assignedIds.includes(empId))
        await supabase.from('station_employees').delete().eq('station_id', s.id).eq('employee_id', empId)
    setVacationModal(null)
  }

  const endVacation = async (empId: number) => {
    const toRemove = Object.entries(schedule[empId] ?? {})
      .filter(([d, m]) => m === 'vacation' && d >= TODAY_ISO).map(([d]) => d)
    setSchedule(prev => ({
      ...prev, [empId]: Object.fromEntries(
        Object.entries(prev[empId] ?? {}).filter(([d, m]) => !(m === 'vacation' && d >= TODAY_ISO))
      )
    }))
    for (const date of toRemove)
      await supabase.from('schedule').delete().eq('employee_id', empId).eq('date', date)
    setVacationModal(null)
  }

  // ─ Clear folgas in range ─
  const clearFolgasInRange = async (start: string, end: string) => {
    const dates = buildDateArray(start, end)
    setSchedule(prev => {
      const next: Schedule = {}
      for (const [idStr, empSch] of Object.entries(prev)) {
        const s = { ...empSch }
        dates.forEach(d => { if (s[d] === 'folga') delete s[d] })
        next[Number(idStr)] = s
      }
      return next
    })
    await supabase.from('schedule').delete().in('date', dates).eq('mark', 'folga')
    setClearFolgasModal(false)
  }

  // ─ Employee CRUD ─
  const deleteEmployee = async (empId: number) => {
    setStations(prev => prev.map(s => ({ ...s, assignedIds: s.assignedIds.filter(id => id !== empId) })))
    setSchedule(prev => { const s = { ...prev }; delete s[empId]; return s })
    setEmployees(prev => prev.filter(e => e.id !== empId))
    await supabase.from('station_employees').delete().eq('employee_id', empId)
    await supabase.from('employees').delete().eq('id', empId)
  }

  const saveEmployee = async (updated: Employee) => {
    const roleRow = await supabase.from('roles').select('id').eq('name', updated.role).single()
    await supabase.from('employees').update({ name: updated.name, role_id: roleRow.data?.id ?? null, type: updated.type, initials: updated.initials }).eq('id', updated.id)
    setEmployees(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e))
    setEditEmpModal(null)
  }

  const addEmployee = async () => {
    if (!newEmp.name.trim()) return
    const initials  = newEmp.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    const roleName  = newEmp.role || roles[0] || ''
    const sortOrder = employees.length
    const roleRow   = await supabase.from('roles').select('id').eq('name', roleName).single()
    const { data, error } = await supabase.from('employees')
      .insert({ name: newEmp.name.trim(), role_id: roleRow.data?.id ?? null, initials, type: newEmp.type, sort_order: sortOrder })
      .select().single()
    if (!error && data)
      setEmployees(prev => [...prev, { id: data.id, name: data.name, role: roleName, initials: data.initials, type: data.type, sort_order: data.sort_order }])
    setNewEmp({ name: '', role: '', type: 'efetivo' }); setAddEmployeeModal(false)
  }

  // ─ Station CRUD ─
  const assignToStation = async (stationId: number, empId: number, mode: 'replace' | 'add') => {
    const station = stations.find(s => s.id === stationId)!
    let newIds: number[]
    if (mode === 'replace') {
      newIds = [empId]
      await supabase.from('station_employees').delete().eq('station_id', stationId)
      await supabase.from('station_employees').insert({ station_id: stationId, employee_id: empId, sort_order: 0 })
    } else {
      if (station.assignedIds.includes(empId)) { setAssignModal(null); return }
      newIds = [...station.assignedIds, empId]
      await supabase.from('station_employees').insert({ station_id: stationId, employee_id: empId, sort_order: newIds.length - 1 })
    }
    setStations(prev => prev.map(s => s.id === stationId ? { ...s, assignedIds: newIds } : s))
    setAssignModal(null)
  }

  const removeFromStation = async (stationId: number, empId: number) => {
    setStations(prev => prev.map(s => s.id === stationId ? { ...s, assignedIds: s.assignedIds.filter(id => id !== empId) } : s))
    await supabase.from('station_employees').delete().eq('station_id', stationId).eq('employee_id', empId)
  }

  const saveStation = async (u: Station) => {
    await supabase.from('stations').update({ name: u.name, icon_key: u.iconKey }).eq('id', u.id)
    setStations(prev => prev.map(s => s.id === u.id ? { ...s, name: u.name, iconKey: u.iconKey } : s))
    setEditStationModal(null)
  }

  const deleteStation = async (id: number) => {
    await supabase.from('stations').delete().eq('id', id)
    setStations(prev => prev.filter(s => s.id !== id))
  }

  const addStation = async () => {
    if (!newSt.name.trim()) return
    const { data, error } = await supabase.from('stations')
      .insert({ name: newSt.name.trim(), icon_key: newSt.iconKey, sort_order: stations.length })
      .select().single()
    if (!error && data)
      setStations(prev => [...prev, { id: data.id, name: data.name, iconKey: data.icon_key, sort_order: data.sort_order, assignedIds: [] }])
    setNewSt({ name: '', iconKey: 'flame' }); setAddStationModal(false)
  }

  const saveRoles = async (newRoles: string[]) => {
    setRoles(newRoles)
    const { data: existing } = await supabase.from('roles').select('id,name')
    for (const [i, name] of newRoles.entries())
      await supabase.from('roles').upsert({ name, sort_order: i }, { onConflict: 'name' })
    for (const r of (existing ?? []) as any[])
      if (!newRoles.includes(r.name))
        await supabase.from('roles').delete().eq('id', r.id)
  }

  const reorderEmployees = async (fromId: number, toId: number) => {
    setEmployees(prev => {
      const arr = [...prev]
      const fi = arr.findIndex(e => e.id === fromId), ti = arr.findIndex(e => e.id === toId)
      if (fi === -1 || ti === -1 || fi === ti) return prev
      const [item] = arr.splice(fi, 1); arr.splice(ti, 0, item)
      arr.forEach((e, i) => { e.sort_order = i })
      Promise.all(arr.map(e => supabase.from('employees').update({ sort_order: e.sort_order }).eq('id', e.id)))
      return arr
    })
  }

  // ─ AI: apply changes from Gemini response ─
  const applyAiChanges = async (changes: AiChange[]) => {
    const newSched = { ...schedule }
    for (const ch of changes) {
      const s = { ...(newSched[ch.employee_id] ?? {}) }
      if (ch.action === 'add_folga') s[ch.date] = 'folga'
      else delete s[ch.date]
      newSched[ch.employee_id] = s
    }
    setSchedule(newSched)
    for (const ch of changes) {
      if (ch.action === 'add_folga')
        await supabase.from('schedule').upsert({ employee_id: ch.employee_id, date: ch.date, mark: 'folga' })
      else
        await supabase.from('schedule').delete().eq('employee_id', ch.employee_id).eq('date', ch.date)
    }
  }

  // ─ AI: drag-to-day swap ─
  const handleAISwap = async (empId: number, dateISO: string, useAI: boolean) => {
    if (!useAI) {
      await toggleEscalaCell(empId, dateISO)
      setDragFolgaConfirm(null)
      return
    }
    setAiLoading(true); setAiError(null); setAiMessage(null)
    try {
      const emp = employees.find(e => e.id === empId)!
      const ctx = buildScheduleContext(employees, schedule, viewYear, viewMonth)
      const prompt = `${ctx}

Pedido: ${emp.name} (ID${emp.id}) quer folgar em ${fmtDateLong(dateISO)} (${dateISO}).

Regras obrigatórias:
1. Nenhum funcionário pode trabalhar mais de 7 dias consecutivos
2. Prefira fazer uma troca: encontre outro funcionário que tenha folga próxima a essa data e que possa trabalhar no dia desejado por ${emp.name.split(' ')[0]}, enquanto ${emp.name.split(' ')[0]} trabalha no dia que esse funcionário teria folga
3. Minimize alterações — faça apenas as mudanças necessárias
4. Mantenha o total de folgas do mês de cada funcionário

Responda SOMENTE com JSON válido (sem markdown), no formato exato:
{"changes":[{"employee_id":1,"date":"YYYY-MM-DD","action":"add_folga"},{"employee_id":2,"date":"YYYY-MM-DD","action":"remove_folga"}],"explanation":"Explicação breve em português das trocas feitas"}`

      const raw = await callGemini(prompt)
      const parsed = parseAiResponse(raw)
      await applyAiChanges(parsed.changes)
      setAiMessage(`✅ ${parsed.explanation}`)
      setDragFolgaConfirm(null)
    } catch (e: any) {
      setAiError(`Erro IA: ${e.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  // ─ AI: full schedule review ─
  const handleAIReview = async () => {
    setAiLoading(true); setAiError(null); setAiMessage(null)
    try {
      const ctx = buildScheduleContext(employees, schedule, viewYear, viewMonth)
      const prompt = `${ctx}

Analise a escala acima e:
1. Identifique funcionários que trabalham mais de 7 dias consecutivos
2. Sugira ajustes mínimos para corrigir essas violações
3. Mantenha o número de folgas de cada funcionário

Responda com JSON:
{"changes":[{"employee_id":1,"date":"YYYY-MM-DD","action":"add_folga"}],"explanation":"Resumo das violações encontradas e correções aplicadas em português"}`

      const raw = await callGemini(prompt)
      const parsed = parseAiResponse(raw)
      if (parsed.changes.length > 0) {
        await applyAiChanges(parsed.changes)
        setAiMessage(`✅ ${parsed.changes.length} ajuste(s) aplicado(s): ${parsed.explanation}`)
      } else {
        setAiMessage(`✅ ${parsed.explanation}`)
      }
    } catch (e: any) {
      setAiError(`Erro IA: ${e.message}`)
    } finally {
      setAiLoading(false)
      setAiReviewModal(false)
    }
  }

  // ─ Charts ─
  const pieData  = [
    { name: 'Cobertas',    value: coveredSts.length, color: C.success },
    { name: 'Descobertas', value: uncovSts.length,   color: C.danger  },
  ]
  const weekData = [
    { day: 'Seg', n: 0 }, { day: 'Ter', n: 0 }, { day: 'Qua', n: 0 },
    { day: 'Qui', n: active.length }, { day: 'Sex', n: 0 }, { day: 'Sáb', n: 0 }, { day: 'Dom', n: 0 },
  ]

  const modalStation = stations.find(s => s.id === assignModal?.stationId)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, flexDirection: 'column', gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: 15, background: C.nav, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChefHat size={26} color="#FFF5EE" strokeWidth={1.8} />
      </div>
      <Loader2 size={22} color={C.textLight} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontFamily: 'DM Sans,sans-serif', color: C.textLight, fontSize: 14 }}>Carregando dados…</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, flexDirection: 'column', gap: 14, padding: 32 }}>
      <AlertTriangle size={36} color={C.danger} />
      <div style={{ fontFamily: 'DM Sans,sans-serif', color: C.text, fontWeight: 700, fontSize: 16 }}>Erro ao conectar ao banco</div>
      <div style={{ fontFamily: 'DM Sans,sans-serif', color: C.textMid, fontSize: 13, textAlign: 'center', maxWidth: 340 }}>{error}</div>
      <button onClick={loadAll} style={{ ...primaryBtnSt, width: 'auto', padding: '10px 24px' }}>Tentar novamente</button>
    </div>
  )

  return (
    <div className="ph-app">
      {/* Sidebar */}
      <nav className="ph-sidebar">
        <div className="ph-sidebar-logo"><ChefHat size={22} color="#FFF5EE" strokeWidth={1.8} /></div>
        <div className="ph-sidebar-nav">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button key={id} className={`ph-nav-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)} title={label}>
              <Icon size={20} strokeWidth={tab === id ? 2.2 : 1.8} />
              <span className="ph-nav-label">{label}</span>
            </button>
          ))}
        </div>
        <div className="ph-sidebar-bottom">
          <button className="ph-nav-btn" title="Configurações"><Settings size={18} strokeWidth={1.8} /></button>
        </div>
      </nav>

      {/* Content */}
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

        {/* AI toast messages */}
        {(aiMessage || aiError) && (
          <div style={{ margin: '12px 28px 0', padding: '12px 16px', borderRadius: 12, background: aiError ? C.dangerLight : C.successLight, border: `1px solid ${aiError ? C.danger + '40' : C.success + '40'}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 13, color: aiError ? C.danger : C.success, flex: 1, lineHeight: 1.5 }}>{aiMessage ?? aiError}</span>
            <button onClick={() => { setAiMessage(null); setAiError(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, padding: 0 }}>
              <X size={14} />
            </button>
          </div>
        )}

        <main className="ph-main">
          {tab === 'hoje' && (
            <HojeTab employees={employees} active={active} offToday={offToday} onVacation={onVacation}
              coveredSts={coveredSts} uncovSts={uncovSts} stations={stations} getEmployee={getEmployee}
              schedule={schedule} pieData={pieData} weekData={weekData}
              goToPracas={() => setTab('pracas')} goToEquipe={() => setTab('equipe')} goToEscala={() => setTab('escala')} />
          )}
          {tab === 'escala' && (
            <EscalaTab
              employees={employees} schedule={schedule} violations={violations}
              hasViolations={hasViolations}
              viewYear={viewYear} viewMonth={viewMonth}
              setViewYear={setViewYear} setViewMonth={setViewMonth}
              onToggleCell={toggleEscalaCell}
              onOpenVacation={e => setVacationModal(e)}
              onReorder={reorderEmployees}
              onDragToDay={(empId, dateISO) => setDragFolgaConfirm({ empId, dateISO })}
              onClearFolgas={() => setClearFolgasModal(true)}
              onAIReview={() => setAiReviewModal(true)}
              aiLoading={aiLoading}
            />
          )}
          {tab === 'pracas' && (
            <PracasTab stations={stations} getEmployee={getEmployee}
              onAssign={(id, mode) => setAssignModal({ stationId: id, mode })}
              onRemoveEmp={removeFromStation} onEdit={s => setEditStationModal(s)}
              onDelete={deleteStation} onAdd={() => setAddStationModal(true)} />
          )}
          {tab === 'equipe' && (
            <EquipeTab employees={employees} schedule={schedule}
              onSetFolga={id => setTodayMark(id, 'folga')}
              onClearToday={id => setTodayMark(id, null)}
              onEdit={e => setEditEmpModal(e)} onVacation={e => setVacationModal(e)}
              onDelete={deleteEmployee}
              onAdd={() => setAddEmployeeModal(true)} onManageRoles={() => setRolesModal(true)} />
          )}
        </main>
      </div>

      {/* Mobile nav */}
      <div className="ph-mobile-nav">
        <div className="ph-mob-inner">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button key={id} className={`ph-mob-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              <Icon size={19} strokeWidth={tab === id ? 2.2 : 1.8} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Assign station */}
      {assignModal && modalStation && (
        <BottomSheet onClose={() => setAssignModal(null)}
          title={assignModal.mode === 'add' ? `Adicionar · ${modalStation.name}` : `Trocar · ${modalStation.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {active.map(emp => {
              const alreadyIn = modalStation.assignedIds.includes(emp.id)
              return (
                <button key={emp.id} onClick={() => assignToStation(assignModal.stationId, emp.id, assignModal.mode)}
                  disabled={assignModal.mode === 'add' && alreadyIn}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${alreadyIn ? C.success + '60' : getEmpColor(emp.id).border}`, background: alreadyIn ? C.successLight : getEmpColor(emp.id).bg, cursor: alreadyIn && assignModal.mode === 'add' ? 'default' : 'pointer', fontFamily: 'DM Sans,sans-serif', width: '100%', textAlign: 'left', opacity: alreadyIn && assignModal.mode === 'add' ? 0.6 : 1 }}>
                  <Avatar emp={emp} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{emp.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: C.textMid }}>{emp.role}</span>
                      <TypeBadge type={emp.type} small />
                    </div>
                  </div>
                  {alreadyIn && <Check size={17} color={C.success} />}
                </button>
              )
            })}
            {modalStation.assignedIds.length > 0 && (
              <button onClick={() => { modalStation.assignedIds.forEach(id => removeFromStation(modalStation.id, id)); setAssignModal(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${C.danger}35`, background: C.dangerLight, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', width: '100%', marginTop: 4 }}>
                <X size={15} color={C.danger} /><span style={{ color: C.danger, fontWeight: 600, fontSize: 14 }}>Remover todos os responsáveis</span>
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
          <EditEmployeeForm emp={editEmpModal} roles={roles} onSave={saveEmployee} />
        </BottomSheet>
      )}

      {vacationModal && (
        <BottomSheet onClose={() => setVacationModal(null)} title={`Férias · ${vacationModal.name}`}>
          <VacationForm emp={vacationModal} schedule={schedule} onConfirm={confirmVacation} onEnd={endVacation} />
        </BottomSheet>
      )}

      {rolesModal && (
        <BottomSheet onClose={() => setRolesModal(false)} title="Gerenciar Cargos">
          <RolesManager roles={roles} onChange={saveRoles} />
        </BottomSheet>
      )}

      {clearFolgasModal && (
        <BottomSheet onClose={() => setClearFolgasModal(false)} title="Limpar folgas do período">
          <ClearFolgasForm
            viewYear={viewYear} viewMonth={viewMonth}
            schedule={schedule} employees={employees}
            onConfirm={clearFolgasInRange} onCancel={() => setClearFolgasModal(false)} />
        </BottomSheet>
      )}

      {/* Drag-to-day AI swap confirmation */}
      {dragFolgaConfirm && (
        <BottomSheet onClose={() => setDragFolgaConfirm(null)} title="Agendar folga">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.infoLight, borderRadius: 12, marginBottom: 20 }}>
            <Avatar emp={employees.find(e => e.id === dragFolgaConfirm.empId)!} size={44} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>
                {employees.find(e => e.id === dragFolgaConfirm.empId)?.name}
              </div>
              <div style={{ fontSize: 13, color: C.textMid, marginTop: 2 }}>
                folga em <strong>{fmtDateLong(dragFolgaConfirm.dateISO)}</strong>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 20 }}>
            Como quer aplicar esta folga?
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => handleAISwap(dragFolgaConfirm.empId, dragFolgaConfirm.dateISO, false)}
              style={{ ...primaryBtnSt, background: C.bg, color: C.text, border: `1px solid ${C.border}` }}>
              <Check size={16} /> Só marcar a folga
            </button>
            <button onClick={() => handleAISwap(dragFolgaConfirm.empId, dragFolgaConfirm.dateISO, true)}
              disabled={aiLoading || !GEMINI_KEY}
              style={{ ...primaryBtnSt, opacity: aiLoading || !GEMINI_KEY ? 0.6 : 1 }}>
              {aiLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
              {aiLoading ? 'IA organizando...' : 'Reorganizar com IA'}
            </button>
            {!GEMINI_KEY && (
              <div style={{ fontSize: 11, color: C.danger, textAlign: 'center' }}>
                Configure VITE_GEMINI_API_KEY no .env.local para usar a IA
              </div>
            )}
          </div>
        </BottomSheet>
      )}

      {/* AI Review modal */}
      {aiReviewModal && (
        <BottomSheet onClose={() => setAiReviewModal(false)} title="Revisar escala com IA">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: C.infoLight, borderRadius: 12, marginBottom: 20 }}>
            <Bot size={28} color={C.info} strokeWidth={1.8} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Análise automática</div>
              <div style={{ fontSize: 12, color: C.textMid, marginTop: 2, lineHeight: 1.5 }}>
                A IA vai analisar {MONTH_NAMES[viewMonth]} {viewYear}, identificar funcionários com mais de 7 dias seguidos e sugerir correções.
              </div>
            </div>
          </div>
          {hasViolations && (
            <div style={{ padding: '10px 14px', background: C.violationLight, borderRadius: 11, marginBottom: 16, fontSize: 13, color: C.violation, fontWeight: 600 }}>
              ⚠️ {Object.keys(violations).length} funcionário(s) com violação detectada neste mês
            </div>
          )}
          <button onClick={handleAIReview} disabled={aiLoading || !GEMINI_KEY}
            style={{ ...primaryBtnSt, opacity: aiLoading || !GEMINI_KEY ? 0.6 : 1 }}>
            {aiLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
            {aiLoading ? 'Analisando...' : 'Analisar e corrigir'}
          </button>
          {!GEMINI_KEY && (
            <div style={{ fontSize: 11, color: C.danger, textAlign: 'center', marginTop: 8 }}>
              Configure VITE_GEMINI_API_KEY no .env.local
            </div>
          )}
        </BottomSheet>
      )}

      {addEmployeeModal && (
        <BottomSheet onClose={() => setAddEmployeeModal(false)} title="Novo Funcionário">
          <FLabel>Nome completo</FLabel>
          <input placeholder="Ex: Maria Silva" value={newEmp.name}
            onChange={e => setNewEmp(p => ({ ...p, name: e.target.value }))} style={inputSt} />
          <FLabel style={{ marginTop: 12 }}>Cargo</FLabel>
          <select value={newEmp.role || roles[0] || ''} onChange={e => setNewEmp(p => ({ ...p, role: e.target.value }))} style={selectSt}>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
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

function HojeTab({ employees, active, offToday, onVacation, coveredSts, uncovSts, stations, getEmployee, schedule, pieData, weekData, goToPracas, goToEquipe, goToEscala }: {
  employees: Employee[]; active: Employee[]; offToday: Employee[]; onVacation: Employee[]
  coveredSts: Station[]; uncovSts: Station[]; stations: Station[]
  getEmployee: (id: number) => Employee | undefined; schedule: Schedule
  pieData: any[]; weekData: any[]
  goToPracas: () => void; goToEquipe: () => void; goToEscala: () => void
}) {
  const efetivos    = employees.filter(e => e.type === 'efetivo').length
  const temporarios = employees.filter(e => e.type === 'temporario').length
  const absent      = [...offToday, ...onVacation]

  return (
    <div>
      <span className="ph-section-label">Resumo do dia</span>
      <div className="ph-metrics">
        <MetricCard value={active.length}     label="Trabalhando"     Icon={UserCheck}    accent={C.success} light={C.successLight} />
        <MetricCard value={offToday.length}   label="De folga"        Icon={Umbrella}     accent={C.warning} light={C.warningLight} />
        <MetricCard value={coveredSts.length} label="Praças cobertas" Icon={TrendingUp}   accent={C.accent}  light={C.accentLight}  />
        <MetricCard value={employees.length}  label="Total da equipe" Icon={Users}        accent={C.nav}     light="#E8E0D8" dark />
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
            const emps   = s.assignedIds.map(id => getEmployee(id)).filter(Boolean) as Employee[]
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: idx < stations.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <StIcon size={16} color={C.accent} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  {emps.length > 0
                    ? <div style={{ fontSize: 11, color: C.textMid, marginTop: 1 }}>{emps.map(e => e.name.split(' ')[0]).join(', ')}</div>
                    : <div style={{ fontSize: 11, color: C.danger, fontWeight: 600, marginTop: 1 }}>Sem responsável</div>}
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
            { label: 'Efetivos',    value: efetivos,          color: C.info    },
            { label: 'Temporários', value: temporarios,       color: C.teal    },
            { label: 'De férias',   value: onVacation.length, color: C.warning },
            { label: 'Descobertas', value: uncovSts.length,   color: C.danger  },
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
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={68} innerRadius={28} dataKey="value"
              label={({ name, value }: any) => value > 0 ? `${name}: ${value}` : ''} labelLine={{ stroke: C.textLight }}>
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

function EscalaTab({ employees, schedule, violations, hasViolations, viewYear, viewMonth, setViewYear, setViewMonth, onToggleCell, onOpenVacation, onReorder, onDragToDay, onClearFolgas, onAIReview, aiLoading }: {
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
}) {
  const dragIdRef      = useRef<number | null>(null)
  const scrollWrapRef  = useRef<HTMLDivElement>(null)
  const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const dragOverX      = useRef(0)

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const getDateISO = (d: number) => `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const getDow     = (d: number) => new Date(viewYear, viewMonth, d).getDay()
  const isWeekend  = (d: number) => { const w = getDow(d); return w === 0 || w === 6 }
  const isToday    = (d: number) => getDateISO(d) === TODAY_ISO

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) } else setViewMonth(viewMonth - 1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) } else setViewMonth(viewMonth + 1) }
  const goToday   = () => { setViewYear(new Date().getFullYear()); setViewMonth(new Date().getMonth()) }

  // Auto-scroll loop
  const startScroll = () => {
    if (scrollInterval.current) return
    scrollInterval.current = setInterval(() => {
      const el = scrollWrapRef.current; if (!el) return
      const rect = el.getBoundingClientRect()
      const ZONE = 100, SPEED = 18
      if (dragOverX.current - rect.left < ZONE)  el.scrollLeft -= SPEED
      if (rect.right - dragOverX.current < ZONE)  el.scrollLeft += SPEED
    }, 16)
  }
  const stopScroll = () => {
    if (scrollInterval.current) { clearInterval(scrollInterval.current); scrollInterval.current = null }
  }

  const handleWrapDragOver = (e: React.DragEvent) => {
    e.preventDefault(); dragOverX.current = e.clientX; startScroll()
  }

  const handleNameDragStart = (empId: number) => { dragIdRef.current = empId }

  const handleNameDrop = (targetEmpId: number) => {
    stopScroll()
    const fromId = dragIdRef.current; dragIdRef.current = null
    if (fromId !== null && fromId !== targetEmpId) onReorder(fromId, targetEmpId)
  }

  const handleDayDrop = (e: React.DragEvent, dateISO: string) => {
    e.preventDefault(); e.stopPropagation(); stopScroll()
    const empId = dragIdRef.current; dragIdRef.current = null
    if (empId !== null) onDragToDay(empId, dateISO)
  }

  const handleDragEnd = () => stopScroll()

  const roles = [...new Set(employees.map(e => e.role))]

  if (employees.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textLight }}>
      <Users size={40} strokeWidth={1.5} style={{ marginBottom: 12 }} />
      <div style={{ fontWeight: 600, fontSize: 15 }}>Nenhum funcionário cadastrado</div>
    </div>
  )

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <span className="ph-section-label" style={{ marginBottom: 0 }}>Escala mensal</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* AI review */}
          <button onClick={onAIReview} disabled={aiLoading}
            style={{ ...addBtnSt, background: hasViolations ? C.violation : C.info, gap: 6 }}>
            {aiLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
            {hasViolations ? 'Violações detectadas' : 'Revisar com IA'}
          </button>
          {/* Clear folgas */}
          <button onClick={onClearFolgas} style={{ ...addBtnSt, background: C.card, color: C.textMid, border: `1px solid ${C.border}` }}>
            <Eraser size={14} /> Limpar folgas
          </button>
          {/* Month navigation */}
          <button onClick={goToday} style={{ ...outlineBtnSt, width: 'auto', padding: '6px 12px', fontSize: 12 }}>Hoje</button>
          <button onClick={prevMonth} style={iconEditBtnSt}><ChevronLeft size={15} /></button>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.text, minWidth: 130, textAlign: 'center' }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} style={iconEditBtnSt}><ChevronRight size={15} /></button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { bg: C.dangerLight,    border: '#F0B0B0', color: C.danger,    text: 'F',   label: 'Folga — clique para marcar' },
          { bg: C.vacationLight,  border: '#E8D060', color: '#8B6A00',   text: 'FÉR', label: 'Férias' },
          { bg: C.violationLight, border: '#FF6B00', color: C.violation, text: '!',   label: '+7 dias seguidos' },
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

      {/* Scrollable table */}
      <div ref={scrollWrapRef} className="ph-escala-wrap"
        onDragOver={handleWrapDragOver} onDragLeave={stopScroll} onDrop={stopScroll}>
        <table className="ph-escala-table">
          <thead>
            <tr>
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
                <tr key={`g-${role}`}>
                  <td colSpan={daysInMonth + 1} style={{ background: '#F4EFE9', padding: '6px 14px', fontSize: 11, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.6px', borderTop: `2px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                    {role}
                  </td>
                </tr>
                {employees.filter(e => e.role === role).map(emp => {
                  const hasViolation = !!violations[emp.id]?.size
                  return (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}`, background: hasViolation ? '#FFF8F5' : 'transparent' }}>
                      {/* Draggable name cell */}
                      <td className="ph-escala-name-col-td"
                        draggable
                        onDragStart={() => handleNameDragStart(emp.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => handleNameDrop(emp.id)}
                        style={{ cursor: 'grab', background: hasViolation ? '#FFF0EC' : '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px' }}>
                          <GripVertical size={13} color={hasViolation ? C.violation : C.border} strokeWidth={2} style={{ flexShrink: 0 }} />
                          <Avatar emp={emp} size={26} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 12, color: hasViolation ? C.violation : C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                        const dateISO  = getDateISO(d)
                        const mark     = (schedule[emp.id]?.[dateISO] as DayMark | undefined) ?? null
                        const weekend  = isWeekend(d); const today = isToday(d)
                        const isVac    = mark === 'vacation'; const isF = mark === 'folga'
                        const isViol   = violations[emp.id]?.has(dateISO)

                        let bg = weekend ? '#FAF6F2' : '#FFFFFF'
                        if (today && !mark) bg = '#FFF8F4'
                        if (isF)    bg = C.dangerLight
                        if (isVac)  bg = C.vacationLight
                        if (isViol && !isF && !isVac) bg = C.violationLight

                        return (
                          <td key={d}
                            className={`ph-escala-day-cell${isVac ? ' vacation' : ''}`}
                            onClick={() => !isVac && onToggleCell(emp.id, dateISO)}
                            onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                            onDrop={e => handleDayDrop(e, dateISO)}
                            title={isViol ? '⚠ Mais de 7 dias seguidos' : undefined}
                            style={{
                              background: bg,
                              color: isVac ? '#8B6A00' : isF ? C.danger : isViol ? C.violation : 'transparent',
                              fontWeight: 800, fontSize: isVac ? 8 : 11,
                              borderRight: today ? `1px solid ${C.accent}40` : `1px solid ${C.border}`,
                              boxShadow: isViol && !isF && !isVac ? `inset 0 0 0 1px ${C.violation}50` : undefined,
                            }}>
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

// ─── ClearFolgasForm ──────────────────────────────────────────────────────────

function ClearFolgasForm({ viewYear, viewMonth, schedule, employees, onConfirm, onCancel }: {
  viewYear: number; viewMonth: number; schedule: Schedule; employees: Employee[]
  onConfirm: (start: string, end: string) => void; onCancel: () => void
}) {
  const firstDay = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-01`
  const lastDay  = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${new Date(viewYear, viewMonth + 1, 0).getDate()}`
  const [start, setStart] = useState(firstDay)
  const [end,   setEnd]   = useState(lastDay)

  const dates   = start && end && end >= start ? buildDateArray(start, end) : []
  const count   = dates.reduce((acc, d) => {
    return acc + employees.filter(e => schedule[e.id]?.[d] === 'folga').length
  }, 0)

  return (
    <div>
      <div style={{ fontSize: 13, color: C.textMid, marginBottom: 18, lineHeight: 1.6 }}>
        Apaga todas as marcações de <strong>Folga</strong> no período selecionado. Férias não são afetadas.
      </div>
      <FLabel>De que dia:</FLabel>
      <input type="date" value={start} min={firstDay} max={lastDay}
        onChange={e => setStart(e.target.value)} style={inputSt} />
      <FLabel style={{ marginTop: 12 }}>Até que dia:</FLabel>
      <input type="date" value={end} min={start || firstDay} max={lastDay}
        onChange={e => setEnd(e.target.value)} style={inputSt} />

      {dates.length > 0 && (
        <div style={{ marginTop: 14, padding: '12px 14px', background: count > 0 ? C.warningLight : C.successLight, borderRadius: 12, fontSize: 13, color: count > 0 ? C.warning : C.success, fontWeight: 600 }}>
          {count > 0
            ? `${count} marcação(ões) de folga serão removidas em ${dates.length} dia(s)`
            : `Nenhuma folga marcada no período selecionado`}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
        <button onClick={onCancel} style={{ ...outlineBtnSt, width: 'auto' }}>Cancelar</button>
        <button onClick={() => count > 0 && onConfirm(start, end)}
          disabled={count === 0 || !start || !end || end < start}
          style={{ ...primaryBtnSt, width: 'auto', background: count > 0 ? C.danger : C.border, opacity: count === 0 ? 0.6 : 1 }}>
          <Trash2 size={15} /> Limpar {count > 0 ? `(${count})` : ''}
        </button>
      </div>
    </div>
  )
}

// ─── PracasTab ────────────────────────────────────────────────────────────────

function PracasTab({ stations, getEmployee, onAssign, onRemoveEmp, onEdit, onDelete, onAdd }: {
  stations: Station[]; getEmployee: (id: number) => Employee | undefined
  onAssign: (id: number, mode: 'replace' | 'add') => void
  onRemoveEmp: (stationId: number, empId: number) => void
  onEdit: (s: Station) => void; onDelete: (id: number) => void; onAdd: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
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
          const StIcon = getIcon(s.iconKey); const covered = emps.length > 0
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
                    <button onClick={() => setConfirmDelete(s.id)} style={{ ...iconEditBtnSt, background: C.dangerLight, borderColor: C.danger + '40' }}><Trash2 size={13} strokeWidth={2} color={C.danger} /></button>
                  </div>
                </div>
                {confirmDelete === s.id && (
                  <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}35`, borderRadius: 11, padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 13, color: C.danger, fontWeight: 600 }}>Apagar "{s.name}"?</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setConfirmDelete(null)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: C.textMid, fontFamily: 'DM Sans,sans-serif' }}>Não</button>
                      <button onClick={() => { onDelete(s.id); setConfirmDelete(null) }} style={{ background: C.danger, border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>Apagar</button>
                    </div>
                  </div>
                )}
                {emps.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {emps.map(emp => (
                      <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 11, background: getEmpColor(emp.id).bg, border: `1px solid ${getEmpColor(emp.id).border}` }}>
                        <Avatar emp={emp} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{emp.name}</div>
                          <div style={{ display: 'flex', gap: 5, marginTop: 1 }}>
                            <span style={{ fontSize: 11, color: C.textMid }}>{emp.role}</span>
                            <TypeBadge type={emp.type} small />
                          </div>
                        </div>
                        <button onClick={() => onRemoveEmp(s.id, emp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, padding: 4 }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: emps.length > 0 ? '1fr 1fr' : '1fr', gap: 8 }}>
                  {emps.length > 0 && (
                    <button onClick={() => onAssign(s.id, 'replace')} style={{ ...primaryBtnSt, background: C.bg, color: C.textMid, border: `1px solid ${C.border}`, fontSize: 13 }}>Trocar</button>
                  )}
                  <button onClick={() => onAssign(s.id, 'add')} style={{ ...primaryBtnSt, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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

// ─── EquipeTab ────────────────────────────────────────────────────────────────

function EquipeTab({ employees, schedule, onSetFolga, onClearToday, onEdit, onVacation, onDelete, onAdd, onManageRoles }: {
  employees: Employee[]; schedule: Schedule
  onSetFolga: (id: number) => void; onClearToday: (id: number) => void
  onEdit: (e: Employee) => void; onVacation: (e: Employee) => void
  onDelete: (id: number) => void; onAdd: () => void; onManageRoles: () => void
}) {
  const active   = employees.filter(e => getStatusForDate(e.id, schedule, TODAY_ISO) === 'active')
  const dayoff   = employees.filter(e => getStatusForDate(e.id, schedule, TODAY_ISO) === 'dayoff')
  const vacation = employees.filter(e => getStatusForDate(e.id, schedule, TODAY_ISO) === 'vacation')
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="ph-section-label" style={{ marginBottom: 0 }}>Equipe</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onManageRoles} style={{ ...addBtnSt, background: C.card, color: C.textMid, border: `1px solid ${C.border}` }}>
            <Briefcase size={14} strokeWidth={2} /> Cargos
          </button>
          <button onClick={onAdd} style={addBtnSt}><Plus size={14} strokeWidth={2.5} /> Funcionário</button>
        </div>
      </div>
      {employees.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textLight }}>
          <Users size={40} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, fontSize: 15 }}>Nenhum funcionário cadastrado</div>
        </div>
      )}
      {active.length > 0 && (<>
        <GroupLabel>Trabalhando hoje · {active.length}</GroupLabel>
        <div className="ph-equipe-grid" style={{ marginBottom: 20 }}>
          {active.map(e => <EmployeeCard key={e.id} emp={e} schedule={schedule} onSetFolga={onSetFolga} onClearToday={onClearToday} onEdit={onEdit} onVacation={onVacation} onDelete={onDelete} />)}
        </div>
      </>)}
      {dayoff.length > 0 && (<>
        <GroupLabel>De folga · {dayoff.length}</GroupLabel>
        <div className="ph-equipe-grid" style={{ marginBottom: 20 }}>
          {dayoff.map(e => <EmployeeCard key={e.id} emp={e} schedule={schedule} onSetFolga={onSetFolga} onClearToday={onClearToday} onEdit={onEdit} onVacation={onVacation} onDelete={onDelete} />)}
        </div>
      </>)}
      {vacation.length > 0 && (<>
        <GroupLabel>De férias · {vacation.length}</GroupLabel>
        <div className="ph-equipe-grid">
          {vacation.map(e => <EmployeeCard key={e.id} emp={e} schedule={schedule} onSetFolga={onSetFolga} onClearToday={onClearToday} onEdit={onEdit} onVacation={onVacation} onDelete={onDelete} />)}
        </div>
      </>)}
    </div>
  )
}

// ─── EmployeeCard ─────────────────────────────────────────────────────────────

function EmployeeCard({ emp, schedule, onSetFolga, onClearToday, onEdit, onVacation, onDelete }: {
  emp: Employee; schedule: Schedule
  onSetFolga: (id: number) => void; onClearToday: (id: number) => void
  onEdit: (e: Employee) => void; onVacation: (e: Employee) => void; onDelete: (id: number) => void
}) {
  const [confirmDel, setConfirmDel] = useState(false)
  const status   = getStatusForDate(emp.id, schedule, TODAY_ISO)
  const vacRange = getVacationRange(emp.id, schedule)
  const accent   = status === 'active' ? C.success : status === 'vacation' ? C.info : C.warning
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
          {/* Edit + Delete */}
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => onEdit(emp)} style={iconEditBtnSt} title="Editar"><Pencil size={13} strokeWidth={2} /></button>
            <button onClick={() => setConfirmDel(true)} style={{ ...iconEditBtnSt, background: C.dangerLight, borderColor: C.danger + '40' }} title="Remover">
              <Trash2 size={13} strokeWidth={2} color={C.danger} />
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmDel && (
          <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}35`, borderRadius: 11, padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 12, color: C.danger, fontWeight: 600 }}>Remover "{emp.name.split(' ')[0]}"?</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setConfirmDel(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 9px', cursor: 'pointer', fontSize: 12, color: C.textMid, fontFamily: 'DM Sans,sans-serif' }}>Não</button>
              <button onClick={() => onDelete(emp.id)} style={{ background: C.danger, border: 'none', borderRadius: 8, padding: '4px 9px', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700, fontFamily: 'DM Sans,sans-serif' }}>Sim</button>
            </div>
          </div>
        )}

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
            bg={C.successLight} color={C.success} full />
        )}
      </div>
    </div>
  )
}

// ─── Form components ──────────────────────────────────────────────────────────

function EditEmployeeForm({ emp, roles, onSave }: { emp: Employee; roles: string[]; onSave: (e: Employee) => void }) {
  const [name, setName] = useState(emp.name)
  const [role, setRole] = useState(emp.role)
  const [type, setType] = useState<EmpType>(emp.type)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: getEmpColor(emp.id).bg, borderRadius: 12, marginBottom: 20 }}>
        <Avatar emp={{ ...emp, name: name || emp.name }} size={44} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{name || emp.name}</div>
          <div style={{ fontSize: 12, color: C.textMid, marginTop: 1 }}>{role}</div>
        </div>
      </div>
      <FLabel>Nome completo</FLabel>
      <input value={name} onChange={e => setName(e.target.value)} style={inputSt} />
      <FLabel style={{ marginTop: 12 }}>Cargo</FLabel>
      <select value={role} onChange={e => setRole(e.target.value)} style={selectSt}>
        {roles.map(r => <option key={r} value={r}>{r}</option>)}
        {!roles.includes(emp.role) && <option value={emp.role}>{emp.role}</option>}
      </select>
      <FLabel style={{ marginTop: 12 }}>Tipo de contrato</FLabel>
      <TypeSelector value={type} onChange={setType} />
      <button onClick={() => onSave({ ...emp, name: name.trim() || emp.name, role, type })} style={{ ...primaryBtnSt, marginTop: 20 }}>
        <Check size={16} /> Salvar alterações
      </button>
    </div>
  )
}

function VacationForm({ emp, schedule, onConfirm, onEnd }: {
  emp: Employee; schedule: Schedule
  onConfirm: (id: number, s: string, e: string) => void; onEnd: (id: number) => void
}) {
  const existing = getVacationRange(emp.id, schedule)
  const [start, setStart] = useState(existing?.start ?? '')
  const [end,   setEnd]   = useState(existing?.end   ?? '')
  const canConfirm   = start && end && end >= start
  const isOnVacation = getStatusForDate(emp.id, schedule, TODAY_ISO) === 'vacation'
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.infoLight, borderRadius: 12, marginBottom: 20 }}>
        <Avatar emp={emp} size={44} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{emp.name}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
            <TypeBadge type={emp.type} small /><span style={{ fontSize: 12, color: C.textMid }}>{emp.role}</span>
          </div>
        </div>
      </div>
      <FLabel>Início das férias</FLabel>
      <input type="date" value={start} onChange={e => setStart(e.target.value)} style={inputSt} />
      <FLabel style={{ marginTop: 12 }}>Fim das férias</FLabel>
      <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={inputSt} />
      <div style={{ fontSize: 11, color: C.textLight, marginTop: 8 }}>As datas aparecerão na aba Escala.</div>
      <button onClick={() => canConfirm && onConfirm(emp.id, start, end)} style={{ ...primaryBtnSt, marginTop: 18, opacity: canConfirm ? 1 : 0.5 }}>
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

function EditStationForm({ station, onSave }: { station: Station; onSave: (s: Station) => void }) {
  const [name,    setName]    = useState(station.name)
  const [iconKey, setIconKey] = useState(station.iconKey)
  return (
    <div>
      <FLabel>Nome da praça</FLabel>
      <input value={name} onChange={e => setName(e.target.value)} style={inputSt} />
      <FLabel style={{ marginTop: 12 }}>Ícone</FLabel>
      <IconPicker selected={iconKey} onSelect={setIconKey} />
      <button onClick={() => onSave({ ...station, name: name.trim() || station.name, iconKey })} style={{ ...primaryBtnSt, marginTop: 20 }}>
        <Check size={16} /> Salvar praça
      </button>
    </div>
  )
}

function RolesManager({ roles, onChange }: { roles: string[]; onChange: (r: string[]) => void }) {
  const [newRole, setNewRole] = useState('')
  const addRole = () => {
    const t = newRole.trim(); if (!t || roles.includes(t)) return
    onChange([...roles, t]); setNewRole('')
  }
  const deleteRole = (r: string) => onChange(roles.filter(x => x !== r))
  const moveRole = (idx: number, dir: -1 | 1) => {
    const arr = [...roles]; const t = idx + dir
    if (t < 0 || t >= arr.length) return
    ;[arr[idx], arr[t]] = [arr[t], arr[idx]]; onChange(arr)
  }
  return (
    <div>
      <div style={{ fontSize: 13, color: C.textMid, marginBottom: 14, lineHeight: 1.5 }}>
        Cargos disponíveis para seleção. A ordem define como aparecem na Escala.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
        {roles.map((role, idx) => (
          <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <GripVertical size={15} color={C.border} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.text }}>{role}</span>
            <button onClick={() => moveRole(idx, -1)} disabled={idx === 0} style={{ ...iconEditBtnSt, opacity: idx === 0 ? 0.35 : 1 }}><ChevronUp size={13} /></button>
            <button onClick={() => moveRole(idx, 1)} disabled={idx === roles.length - 1} style={{ ...iconEditBtnSt, opacity: idx === roles.length - 1 ? 0.35 : 1 }}><ChevronDown size={13} /></button>
            <button onClick={() => deleteRole(role)} style={{ ...iconEditBtnSt, background: C.dangerLight, borderColor: C.danger + '35' }}><Trash2 size={13} strokeWidth={2} color={C.danger} /></button>
          </div>
        ))}
        {roles.length === 0 && <div style={{ color: C.textLight, fontSize: 13, padding: '12px 0', textAlign: 'center' }}>Nenhum cargo cadastrado</div>}
      </div>
      <FLabel>Adicionar novo cargo</FLabel>
      <div style={{ display: 'flex', gap: 8 }}>
        <input placeholder="Ex: Garçom, Sommelier…" value={newRole}
          onChange={e => setNewRole(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRole()}
          style={{ ...inputSt, flex: 1 }} />
        <button onClick={addRole} style={{ ...primaryBtnSt, width: 'auto', padding: '12px 16px' }}><Plus size={16} /></button>
      </div>
    </div>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Avatar({ emp, size }: { emp: Employee; size: number }) {
  const c = getEmpColor(emp.id)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: c.bg, color: c.text, border: `1.5px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.33, fontFamily: 'DM Sans,sans-serif' }}>
      {emp.initials}
    </div>
  )
}

function MetricCard({ value, label, Icon, accent, light, dark = false }: { value: number; label: string; Icon: IconComp; accent: string; light: string; dark?: boolean }) {
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
  return <span style={{ fontSize: small ? 10 : 11, fontWeight: 700, padding: small ? '2px 6px' : '3px 8px', borderRadius: 6, background: s.bg, color: s.color, whiteSpace: 'nowrap', letterSpacing: '0.2px' }}>{s.label}</span>
}

function TypeSelector({ value, onChange }: { value: EmpType; onChange: (t: EmpType) => void }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {(['efetivo', 'temporario'] as EmpType[]).map(t => {
        const active = value === t; const color = t === 'efetivo' ? C.info : C.teal; const light = t === 'efetivo' ? C.infoLight : C.tealLight
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputSt: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontFamily: 'DM Sans,sans-serif', fontSize: 15, background: '#FAFAFA', color: C.text, outline: 'none' }
const selectSt: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontFamily: 'DM Sans,sans-serif', fontSize: 15, background: '#FAFAFA', color: C.text, outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239A7866' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }
const primaryBtnSt: CSSProperties = { width: '100%', padding: '13px', background: C.accent, color: '#FFF5EE', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }
const addBtnSt: CSSProperties = { background: C.accent, color: '#FFF5EE', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 5 }
const outlineBtnSt: CSSProperties = { width: '100%', padding: '11px', background: 'transparent', color: C.textMid, border: `1.5px solid ${C.border}`, borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
const linkBtnSt: CSSProperties = { fontSize: 12, color: C.accent, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 2 }
const iconEditBtnSt: CSSProperties = { width: 30, height: 30, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMid, flexShrink: 0 }

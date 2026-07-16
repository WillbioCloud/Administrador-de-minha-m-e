import { useState, useEffect, CSSProperties, useCallback } from 'react'

import { supabase } from '../supabaseClient'
import type { Employee, Station, Schedule, StationAssignmentMap, DayMark, EmpType, Status, Tab, ViewMode, ChatMessage, CustomRules, ScaleMode } from '../types'
import { GEMINI_KEY, callGemini, buildScheduleContext, parseAiResponse, type AiChange, callGeminiChat } from '../services/geminiService'
import {
  Flame, Snowflake, ChefHat, Coffee, Wine, Package, Bell,
  UtensilsCrossed, ShoppingBag, CreditCard, Truck, Store,
  Warehouse, Star, ClipboardList, Wrench, Pizza, Utensils,
  Plus, Pencil, X, Check, ChevronDown, ChevronRight, ChevronLeft,
  Users, Calendar, UserCheck, LayoutDashboard, Settings,
  AlertTriangle, Umbrella, Home, TrendingUp, BadgeCheck, Timer,
  CalendarDays, Trash2, GripVertical, ChevronUp, Briefcase, Loader2,
  UserPlus, Sparkles, Bot, MessageSquare, LogOut, User
} from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup } from '@/components/ui/dropdown-menu'
import { C, MONTH_NAMES, TODAY, TODAY_ISO, cap, fmtDateLong, buildRange, buildDateArray, getStatusForDate, getVacationRange, getViolationDays, getIcon, getEmpColor, STATION_ICONS, type IconComp } from './patyHelpCore'
import { Avatar, BottomSheet, FLabel, IconPicker, TypeBadge, StatusBadge, TypeSelector, inputSt, selectSt, primaryBtnSt, outlineBtnSt, addBtnSt, linkBtnSt, iconEditBtnSt } from './patyHelpUi'
import { HojeTab } from './tabs/HojeTab'
import { EscalaTab, ClearFolgasForm } from './tabs/EscalaTab'
import { PracasTab } from './tabs/PracasTab'
import { EquipeTab } from './tabs/EquipeTab'

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

  // Praças view state
  const [stationAssignments, setStationAssignments] = useState<StationAssignmentMap>({})
  const [viewMode, setViewMode] = useState<ViewMode>('dia')
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0])

  // Month navigation lifted to root (needed by AI handlers)
  const now = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  // Modals
  const [assignModal,      setAssignModal]      = useState<{ stationId: number; mode: 'replace' | 'add'; forDate?: string } | null>(null)
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
  const [violationConfirm, setViolationConfirm] = useState<{ empId: number; dateISO: string; msg: string } | null>(null)

  // ─ Logout ─
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiMessage,  setAiMessage]  = useState<string | null>(null)
  const [aiError,    setAiError]    = useState<string | null>(null)
  const [session,    setSession]    = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // AI Chat Sidebar
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{ role: 'assistant', content: 'Olá! Sou o Assistente de Escala. Como posso ajudar com a organização da escala de folgas?' }])
  const [customAiRules, setCustomAiRules] = useState<CustomRules>('')
  
  // Scale mode (5x1, 6x1, etc.)
  const [scaleMode, setScaleMode] = useState<ScaleMode>('6x1')

  // Sincroniza as configurações com a tabela profiles no Supabase
  const updateProfileSettings = useCallback(async (mode: ScaleMode, rules: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        scale_mode: mode,
        custom_ai_rules: rules
      }).eq('id', user.id)
    }
  }, [])

  // Handlers customizados para os setters que atualizam o estado local e salvam no banco
  const handleScaleModeChange = async (mode: ScaleMode) => {
    setScaleMode(mode)
    await updateProfileSettings(mode, customAiRules)
  }

  const handleCustomAiRulesChange = async (rules: string) => {
    setCustomAiRules(rules)
    await updateProfileSettings(scaleMode, rules)
  }

  const [newEmp, setNewEmp] = useState({ name: '', role: '', type: 'efetivo' as EmpType })
  const [newSt,  setNewSt]  = useState({ name: '', iconKey: 'flame' })

  // ─ Load all ─
  const loadAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('scale_mode, custom_ai_rules, chat_history')
          .eq('id', user.id)
          .single()
        if (profile) {
          if (profile.scale_mode) setScaleMode(profile.scale_mode as ScaleMode)
          if (profile.custom_ai_rules) setCustomAiRules(profile.custom_ai_rules)
          if (profile.chat_history) setChatHistory(profile.chat_history)
        }
      }

      const [rolesRes, empsRes, stationsRes, stEmpRes, schedRes, saRes] = await Promise.all([
        supabase.from('roles').select('id,name,sort_order').order('sort_order'),
        supabase.from('employees').select('id,name,role_id,initials,type,sort_order,roles(name)').order('sort_order'),
        supabase.from('stations').select('id,name,icon_key,sort_order,is_rotativa').order('sort_order'),
        supabase.from('station_employees').select('station_id,employee_id,sort_order').order('sort_order'),
        supabase.from('schedule').select('employee_id,date,mark'),
        supabase.from('station_assignments').select('station_id,employee_id,date'),
      ])
      for (const r of [rolesRes, empsRes, stationsRes, stEmpRes, schedRes, saRes])
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
        isRotativa: s.is_rotativa ?? false,
        assignedIds: stEmpMap[s.id] ?? [],
      })))
      // Build StationAssignmentMap: date → stationId → empIds[]
      const saMap: StationAssignmentMap = {}
      for (const row of (saRes.data ?? []) as any[]) {
        if (!saMap[row.date]) saMap[row.date] = {}
        if (!saMap[row.date][row.station_id]) saMap[row.date][row.station_id] = []
        saMap[row.date][row.station_id].push(row.employee_id)
      }
      setStationAssignments(saMap)
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

  const violations    = getViolationDays(employees, schedule, viewYear, viewMonth, scaleMode)
  const hasViolations = Object.keys(violations).length > 0

  // ─ Schedule helpers ─
  const toggleEscalaCell = async (empId: number, dateISO: string, force: boolean = false) => {
    const cur = schedule[empId]?.[dateISO]
    if (cur === 'vacation') return

    const newMark: DayMark | null = cur === 'folga' ? null : 'folga'

    if (newMark === 'folga' && !force) {
      const limit = scaleMode === '12x36' ? 1 : (scaleMode === '6x1' ? 6 : 5)
      
      let workedDays = 0
      let checkDate = new Date(dateISO + 'T12:00:00')
      checkDate.setDate(checkDate.getDate() - 1)
      
      for (let i = 0; i < 15; i++) {
        const checkISO = checkDate.toISOString().split('T')[0]
        const m = schedule[empId]?.[checkISO]
        if (m === 'folga' || m === 'vacation') break
        workedDays++
        checkDate.setDate(checkDate.getDate() - 1)
      }

      if (workedDays > limit) {
        setViolationConfirm({ 
          empId, 
          dateISO, 
          msg: `Atenção: O funcionário está trabalhando MAIS dias que o esperado (${workedDays} dias sem folga, escala exige no máximo ${limit}). Deseja confirmar essa folga atrasada?`
        })
        return
      } else if (workedDays > 0 && workedDays < limit) {
        setViolationConfirm({ 
          empId, 
          dateISO, 
          msg: `Atenção: O funcionário está trabalhando MENOS dias que o esperado (${workedDays} dias trabalhados, escala exige ${limit}). Você está adiantando a folga. Deseja marcar mesmo assim?`
        })
        return
      }
    }

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

  const saveStation = async (updated: Station) => {
    await supabase.from('stations').update({ name: updated.name, icon_key: updated.iconKey }).eq('id', updated.id)
    setStations(prev => prev.map(s => s.id === updated.id ? { ...s, name: updated.name, iconKey: updated.iconKey } : s))
    setEditStationModal(null)
  }

  const deleteStation = async (id: number) => {
    await supabase.from('stations').delete().eq('id', id)
    setStations(prev => prev.filter(s => s.id !== id))
  }

  const addStation = async () => {
    if (!newSt.name.trim()) return
    const { data, error } = await supabase.from('stations')
      .insert({ name: newSt.name.trim(), icon_key: newSt.iconKey, sort_order: stations.length, is_rotativa: false })
      .select().single()
    if (!error && data)
      setStations(prev => [...prev, { id: data.id, name: data.name, iconKey: data.icon_key, sort_order: data.sort_order, isRotativa: false, assignedIds: [] }])
    setNewSt({ name: '', iconKey: 'flame' }); setAddStationModal(false)
  }

  const toggleRotativa = async (stationId: number, current: boolean) => {
    const next = !current
    await supabase.from('stations').update({ is_rotativa: next }).eq('id', stationId)
    setStations(prev => prev.map(s => s.id === stationId ? { ...s, isRotativa: next } : s))
  }

  // Assign for a specific date (rotativa stations)
  const assignToStationForDate = async (stationId: number, empId: number, mode: 'replace' | 'add', date: string) => {
    const current = stationAssignments[date]?.[stationId] ?? []
    if (mode === 'replace') {
      // Delete all existing for that station+date, then insert the new one
      await supabase.from('station_assignments').delete()
        .eq('station_id', stationId).eq('date', date)
      await supabase.from('station_assignments').insert({ station_id: stationId, employee_id: empId, date })
      setStationAssignments(prev => ({
        ...prev,
        [date]: { ...(prev[date] ?? {}), [stationId]: [empId] },
      }))
    } else {
      if (current.includes(empId)) { setAssignModal(null); return }
      await supabase.from('station_assignments').insert({ station_id: stationId, employee_id: empId, date })
      setStationAssignments(prev => ({
        ...prev,
        [date]: { ...(prev[date] ?? {}), [stationId]: [...current, empId] },
      }))
    }
    setAssignModal(null)
  }

  // Remove a single employee from a rotativa station on a specific date
  const removeEmpForDate = async (stationId: number, empId: number, date: string) => {
    await supabase.from('station_assignments').delete()
      .eq('station_id', stationId).eq('employee_id', empId).eq('date', date)
    setStationAssignments(prev => {
      const cur = prev[date]?.[stationId] ?? []
      return { ...prev, [date]: { ...(prev[date] ?? {}), [stationId]: cur.filter(id => id !== empId) } }
    })
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

  // ─ AI: apply changes ─
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
2. Prefira fazer uma troca: encontre outro funcionário com folga próxima que possa trabalhar no dia desejado
3. Minimize alterações — apenas as necessárias
4. Mantenha o total de folgas do mês de cada funcionário

Responda SOMENTE com JSON válido (sem markdown):
{"changes":[{"employee_id":1,"date":"YYYY-MM-DD","action":"add_folga"}],"explanation":"Explicação breve em português"}`

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

  // ─ AI: full review ─
  const handleAIReview = async () => {
    setAiLoading(true); setAiError(null); setAiMessage(null)
    try {
      const ctx = buildScheduleContext(employees, schedule, viewYear, viewMonth)
      const prompt = `${ctx}

Analise a escala e:
1. Identifique funcionários com mais de 7 dias consecutivos
2. Sugira ajustes mínimos para corrigir violações
3. Mantenha o número de folgas de cada funcionário

Responda com JSON:
{"changes":[{"employee_id":1,"date":"YYYY-MM-DD","action":"add_folga"}],"explanation":"Resumo em português"}`

      const raw = await callGemini(prompt)
      const parsed = parseAiResponse(raw)
      if (parsed.changes.length > 0) {
        await applyAiChanges(parsed.changes)
        setAiMessage(`✅ ${parsed.changes.length} ajuste(s): ${parsed.explanation}`)
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

  // ─ AI: Chat Send ─
  const syncChatHistory = async (newHistory: ChatMessage[]) => {
    setChatHistory(newHistory)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ chat_history: newHistory }).eq('id', user.id)
    }
  }

  const handleClearChat = () => syncChatHistory([])

  const handleSendMessage = async (msg: string) => {
    if (!msg.trim()) return
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: msg }]
    syncChatHistory(newHistory)
    setAiLoading(true)
    try {
      const ctx = buildScheduleContext(employees, schedule, viewYear, viewMonth)
      const resp = await callGeminiChat(newHistory, ctx, customAiRules, scaleMode)
      syncChatHistory([...newHistory, { role: 'assistant', content: resp }])
    } catch (e: any) {
      syncChatHistory([...newHistory, { role: 'assistant', content: `❌ Erro: ${e.message}` }])
    } finally {
      setAiLoading(false)
    }
  }

  // ─ Charts data ─
  const pieData  = [
    { name: 'Cobertas',    value: coveredSts.length, color: C.success },
    { name: 'Descobertas', value: uncovSts.length,   color: C.danger  },
  ]
  const weekData = [
    { day: 'Seg', n: 0 }, { day: 'Ter', n: 0 }, { day: 'Qua', n: 0 },
    { day: 'Qui', n: active.length },
    { day: 'Sex', n: 0 }, { day: 'Sáb', n: 0 }, { day: 'Dom', n: 0 },
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
      {/* ── Sidebar ── */}
      <nav className="ph-sidebar">
        <div className="ph-sidebar-logo"><ChefHat size={22} color="#FFF5EE" strokeWidth={1.8} /></div>
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
          <DropdownMenu>
            <DropdownMenuTrigger className="ph-nav-btn" title="Opções do Perfil" style={{ border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none' }}>
              <Settings size={18} strokeWidth={1.8} />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" sideOffset={12} className="w-64 font-sans border border-[#EAE3DE] bg-[#FDFBF9] p-3 rounded-xl shadow-xl flex flex-col gap-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal p-2 mb-2">
                  <div className="flex items-center gap-3">
                    {/* Avatar com a Inicial do E-mail */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8B4F1D] text-white font-bold text-lg flex-shrink-0 shadow-sm">
                      {session?.user?.email ? session.user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {/* Dados do Usuário */}
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <p className="text-sm font-semibold leading-none text-[#4A2612] truncate">
                        Usuário
                      </p>
                      <p className="text-xs leading-none text-[#9E8070] truncate">
                        {session?.user?.email || 'carregando...'}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator className="bg-[#EAE3DE] my-2" />
              
              {/* Grupo de botões com espaço de 4px entre cada item */}
              <DropdownMenuGroup className="flex flex-col gap-1">
                <DropdownMenuItem className="cursor-pointer text-[#4A2612] focus:bg-[#F5EBE4] focus:text-[#4A2612] rounded-lg px-4 py-3 text-sm transition-colors outline-none flex items-center">
                  <User className="mr-3 h-4 w-4 text-[#8B4F1D] flex-shrink-0" />
                  <span className="font-medium">Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-[#4A2612] focus:bg-[#F5EBE4] focus:text-[#4A2612] rounded-lg px-4 py-3 text-sm transition-colors outline-none flex items-center">
                  <BadgeCheck className="mr-3 h-4 w-4 text-[#8B4F1D] flex-shrink-0" />
                  <span className="font-medium">Assinatura (Em breve)</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-[#4A2612] focus:bg-[#F5EBE4] focus:text-[#4A2612] rounded-lg px-4 py-3 text-sm transition-colors outline-none flex items-center">
                  <Bell className="mr-3 h-4 w-4 text-[#8B4F1D] flex-shrink-0" />
                  <span className="font-medium">Notificações</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator className="bg-[#EAE3DE] my-2" />
              
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[#D32F2F] focus:bg-[#FCDEDE] focus:text-[#D32F2F] rounded-lg px-4 py-3 text-sm font-bold transition-colors outline-none flex items-center mt-2">
                <LogOut className="mr-3 h-4 w-4 flex-shrink-0" />
                <span>Sair do sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* ── Content ── */}
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

        {/* AI toast */}
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
              isChatOpen={isChatOpen}
              setIsChatOpen={setIsChatOpen}
              chatHistory={chatHistory}
              onSendMessage={handleSendMessage}
              customAiRules={customAiRules}
              setCustomAiRules={handleCustomAiRulesChange}
              onClearChat={handleClearChat}
              scaleMode={scaleMode}
              setScaleMode={handleScaleModeChange}
            />
          )}
          {tab === 'pracas' && (
            <PracasTab
              stations={stations}
              employees={employees}
              getEmployee={getEmployee}
              stationAssignments={stationAssignments}
              viewMode={viewMode}
              viewDate={viewDate}
              onViewModeChange={setViewMode}
              onViewDateChange={setViewDate}
              onAssign={(id, mode, forDate) => setAssignModal({ stationId: id, mode, forDate })}
              onRemoveFixed={removeFromStation}
              onRemoveForDate={removeEmpForDate}
              onToggleRotativa={toggleRotativa}
              onEdit={s => setEditStationModal(s)}
              onDelete={deleteStation}
              onAdd={() => setAddStationModal(true)}
            />
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

      {/* ── Mobile nav ── */}
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
      {assignModal && modalStation && (() => {
        const forDate   = assignModal.forDate
        const isRotat   = modalStation.isRotativa && forDate
        // For "already in" check: rotativa uses date map, fixed uses assignedIds
        const currentIds = isRotat
          ? (stationAssignments[forDate!]?.[modalStation.id] ?? [])
          : modalStation.assignedIds
        return (
          <BottomSheet onClose={() => setAssignModal(null)}
            title={`${assignModal.mode === 'add' ? 'Adicionar' : 'Trocar'} · ${modalStation.name}${forDate ? ` · ${forDate.split('-').reverse().join('/')}` : ''}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {active.map(emp => {
                const alreadyIn = currentIds.includes(emp.id)
                return (
                  <button key={emp.id}
                    onClick={() => isRotat
                      ? assignToStationForDate(modalStation.id, emp.id, assignModal.mode, forDate!)
                      : assignToStation(modalStation.id, emp.id, assignModal.mode)
                    }
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
              {currentIds.length > 0 && (
                <button onClick={() => {
                  if (isRotat) {
                    // remove all for this date
                    currentIds.forEach(id => removeEmpForDate(modalStation.id, id, forDate!))
                  } else {
                    modalStation.assignedIds.forEach(id => removeFromStation(modalStation.id, id))
                  }
                  setAssignModal(null)
                }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${C.danger}35`, background: C.dangerLight, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', width: '100%', marginTop: 4 }}>
                  <X size={15} color={C.danger} />
                  <span style={{ color: C.danger, fontWeight: 600, fontSize: 14 }}>Remover todos os responsáveis{isRotat ? ' deste dia' : ''}</span>
                </button>
              )}
            </div>
          </BottomSheet>
        )
      })()}

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

      {/* Drag-to-day swap */}
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
          <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 20 }}>Como quer aplicar esta folga?</div>
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
            {!GEMINI_KEY && <div style={{ fontSize: 11, color: C.danger, textAlign: 'center' }}>Configure VITE_GEMINI_API_KEY no .env.local</div>}
          </div>
        </BottomSheet>
      )}

      {/* AI review */}
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
          {!GEMINI_KEY && <div style={{ fontSize: 11, color: C.danger, textAlign: 'center', marginTop: 8 }}>Configure VITE_GEMINI_API_KEY no .env.local</div>}
        </BottomSheet>
      )}

      {/* Violation confirmation */}
      {violationConfirm && (
        <BottomSheet onClose={() => setViolationConfirm(null)} title="Atenção: Limite de dias">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: violationConfirm.msg.includes('MENOS') ? C.warningLight : C.violationLight, borderRadius: 12, marginBottom: 20 }}>
            <AlertTriangle size={28} color={violationConfirm.msg.includes('MENOS') ? C.warning : C.violation} strokeWidth={1.8} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{violationConfirm.msg.includes('MENOS') ? 'Adiantamento de Folga' : 'Excesso de dias trabalhados'}</div>
              <div style={{ fontSize: 12, color: C.textMid, marginTop: 2, lineHeight: 1.5 }}>
                {violationConfirm.msg}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setViolationConfirm(null)} style={{ ...outlineBtnSt, flex: 1 }}>Cancelar</button>
            <button onClick={() => {
              toggleEscalaCell(violationConfirm.empId, violationConfirm.dateISO, true)
              setViolationConfirm(null)
            }} style={{ ...primaryBtnSt, flex: 1, background: violationConfirm.msg.includes('MENOS') ? C.warning : C.violation, border: 'none' }}>
              Confirmar folga
            </button>
          </div>
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
  const addRole    = () => { const t = newRole.trim(); if (!t || roles.includes(t)) return; onChange([...roles, t]); setNewRole('') }
  const deleteRole = (r: string) => onChange(roles.filter(x => x !== r))
  const moveRole   = (idx: number, dir: -1 | 1) => {
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

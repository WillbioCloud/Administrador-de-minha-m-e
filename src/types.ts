// ─── Database types (mirror the Supabase schema) ──────────────────────────────

export type DayMark  = 'folga' | 'vacation'
export type EmpType  = 'efetivo' | 'temporario'
export type Status   = 'active' | 'dayoff' | 'vacation'
export type Tab      = 'hoje' | 'pracas' | 'escala' | 'equipe'
export type ViewMode = 'dia' | 'semana' | 'mes'

export interface DbRole {
  id: number
  name: string
  sort_order: number
}

export interface DbEmployee {
  id: number
  name: string
  role_id: number | null
  initials: string
  type: EmpType
  sort_order: number
  role_name?: string
}

export interface DbStation {
  id: number
  name: string
  icon_key: string
  sort_order: number
  is_rotativa: boolean
}

export interface DbScheduleMark {
  employee_id: number
  date: string       // 'YYYY-MM-DD'
  mark: DayMark
}

export interface DbStationEmployee {
  station_id: number
  employee_id: number
  sort_order: number
}

export interface DbStationAssignment {
  station_id: number
  employee_id: number
  date: string       // 'YYYY-MM-DD'
}

// ─── App-level types ────────────────────────────────────────────────────────────

export interface Employee {
  id: number
  name: string
  role: string
  initials: string
  type: EmpType
  sort_order: number
}

export interface Station {
  id: number
  name: string
  iconKey: string
  sort_order: number
  isRotativa: boolean
  // Fixed employees (station_employees) — always present regardless of date
  assignedIds: number[]
}

// date (YYYY-MM-DD) → stationId → employeeIds[]
// Only for rotativa stations. Fixed stations use Station.assignedIds directly.
export type StationAssignmentMap = Record<string, Record<number, number[]>>

// empId → { 'YYYY-MM-DD' → DayMark }
export type Schedule = Record<number, Record<string, DayMark>>

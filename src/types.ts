// ─── Database types (mirror the Supabase schema) ──────────────────────────────

export type DayMark  = 'folga' | 'vacation'
export type EmpType  = 'efetivo' | 'temporario'
export type Status   = 'active' | 'dayoff' | 'vacation'
export type Tab      = 'hoje' | 'pracas' | 'escala' | 'equipe'

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
  // joined:
  role_name?: string
}

export interface DbStation {
  id: number
  name: string
  icon_key: string
  sort_order: number
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

// ─── App-level types (derived from DB rows) ────────────────────────────────────

export interface Employee {
  id: number
  name: string
  role: string        // role_name joined
  initials: string
  type: EmpType
  sort_order: number
}

export interface Station {
  id: number
  name: string
  iconKey: string
  sort_order: number
  assignedIds: number[]   // multiple employees
}

// schedule: empId → { 'YYYY-MM-DD' → DayMark }
export type Schedule = Record<number, Record<string, DayMark>>

import {
  Flame, Snowflake, ChefHat, Coffee, Wine, Package, Bell,
  UtensilsCrossed, ShoppingBag, CreditCard, Truck, Store,
  Warehouse, Star, ClipboardList, Wrench, Pizza, Utensils,
  Home, Users,
} from 'lucide-react'
import type { Employee, Schedule, DayMark, Status } from '../types'
import type { LucideIcon } from 'lucide-react'

// ─── Colors ───────────────────────────────────────────────────────────────────

export const C = {
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
  violation:    '#FF6B00',
  violationLight:'#FFF0E6',
  text:         '#18080A',
  textMid:      '#6B4435',
  textLight:    '#9A7866',
  border:       '#E8E0D8',
  nav:          '#1A0804',
}

// ─── Avatar colors ────────────────────────────────────────────────────────────

export const EMP_COLORS = [
  { bg: '#FDE8DC', text: '#7A2200', border: '#EEC0A0' },
  { bg: '#DEF2EA', text: '#1A5838', border: '#A8D8C0' },
  { bg: '#FEF2D8', text: '#7A4500', border: '#F0D098' },
  { bg: '#EAE6FF', text: '#3D2BB0', border: '#C0B8F5' },
  { bg: '#FCE4F0', text: '#8B1A56', border: '#F0B0D4' },
  { bg: '#E6EFFE', text: '#1A4A8B', border: '#A8C8F0' },
  { bg: '#F0EEDC', text: '#5C5010', border: '#D8D4A0' },
]

export const getEmpColor = (id: number) => EMP_COLORS[(id - 1) % EMP_COLORS.length]

// ─── Station icons ────────────────────────────────────────────────────────────

export type IconComp = LucideIcon

export const STATION_ICONS: { key: string; Icon: IconComp; label: string }[] = [
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

export const getIcon = (key: string): IconComp =>
  STATION_ICONS.find(i => i.key === key)?.Icon ?? Flame

// ─── Constants ────────────────────────────────────────────────────────────────

export const DAY_ABBR = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB']
export const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

// ─── Date helpers ─────────────────────────────────────────────────────────────

export const getTodayISO = () => new Date().toISOString().split('T')[0]

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${String(y).slice(2)}`
}

export const fmtDateLong = (iso: string) => {
  const [y, m, d] = iso.split('-')
  const dt = new Date(Number(y), Number(m) - 1, Number(d))
  return dt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export const TODAY     = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
export const TODAY_ISO = getTodayISO()

// ─── Schedule helpers ─────────────────────────────────────────────────────────

export const buildRange = (start: string, end: string, mark: DayMark): Record<string, DayMark> => {
  const out: Record<string, DayMark> = {}
  const s = new Date(start + 'T12:00:00'), e = new Date(end + 'T12:00:00'), c = new Date(s)
  while (c <= e) {
    out[c.toISOString().split('T')[0]] = mark
    c.setDate(c.getDate() + 1)
  }
  return out
}

export const buildDateArray = (start: string, end: string): string[] => {
  const dates: string[] = []
  const s = new Date(start + 'T12:00:00'), e = new Date(end + 'T12:00:00'), c = new Date(s)
  while (c <= e) {
    dates.push(c.toISOString().split('T')[0])
    c.setDate(c.getDate() + 1)
  }
  return dates
}

export const getStatusForDate = (empId: number, schedule: Schedule, dateISO: string): Status => {
  const m = schedule[empId]?.[dateISO]
  if (m === 'folga')    return 'dayoff'
  if (m === 'vacation') return 'vacation'
  return 'active'
}

export const getVacationRange = (empId: number, schedule: Schedule) => {
  const vd = Object.entries(schedule[empId] ?? {})
    .filter(([, m]) => m === 'vacation')
    .map(([d]) => d)
    .sort()
  return vd.length ? { start: vd[0], end: vd[vd.length - 1] } : null
}

// ─── 7-day consecutive violation detection ────────────────────────────────────

export const getViolationDays = (
  employees: Employee[], schedule: Schedule, year: number, month: number, scaleMode: string
): Record<number, Set<string>> => {
  const result: Record<number, Set<string>> = {}
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const limit = scaleMode === '12x36' ? 1 : (scaleMode === '6x1' ? 6 : 5)

  for (const emp of employees) {
    const violations = new Set<string>()
    let streak = 0
    const streakDates: string[] = []

    // Check 4 days before month start for streak continuity
    for (let d = -4; d <= daysInMonth; d++) {
      const dt  = new Date(year, month, d)
      const iso = dt.toISOString().split('T')[0]
      const mark = schedule[emp.id]?.[iso]
      const isResting = mark === 'folga' || mark === 'vacation'

      if (!isResting) {
        streak++
        if (d >= 1) streakDates.push(iso)
        if (streak > limit) streakDates.forEach(dd => violations.add(dd))
      } else {
        streak = 0
        streakDates.length = 0
      }
    }
    if (violations.size > 0) result[emp.id] = violations
  }
  return result
}

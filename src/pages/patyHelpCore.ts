import {
  Flame, Snowflake, ChefHat, Coffee, Wine, Package, Bell,
  UtensilsCrossed, ShoppingBag, CreditCard, Truck, Store,
  Warehouse, Star, ClipboardList, Wrench, Pizza, Utensils,
  Home, Users,
} from 'lucide-react'
import type { Employee, Schedule, DayMark, Status } from '../types'
import type { LucideIcon } from 'lucide-react'

export const C = {
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

export type IconComp = LucideIcon

export const STATION_ICONS: { key: string; Icon: IconComp; label: string }[] = [
  { key: 'flame',      Icon: Flame,          label: 'Quente'     },
  { key: 'snowflake',  Icon: Snowflake,      label: 'Frio'       },
  { key: 'chefhat',    Icon: ChefHat,        label: 'Chef'       },
  { key: 'coffee',     Icon: Coffee,         label: 'Café'       },
  { key: 'wine',       Icon: Wine,           label: 'Bar'        },
  { key: 'package',    Icon: Package,        label: 'Estoque'    },
  { key: 'bell',       Icon: Bell,           label: 'Atend.'     },
  { key: 'utensils',   Icon: UtensilsCrossed,label: 'Utensílios' },
  { key: 'pizza',      Icon: Pizza,          label: 'Pizza'      },
  { key: 'store',      Icon: Store,          label: 'Loja'       },
  { key: 'truck',      Icon: Truck,          label: 'Entrega'    },
  { key: 'warehouse',  Icon: Warehouse,      label: 'Depósito'   },
  { key: 'creditcard', Icon: CreditCard,     label: 'Caixa'      },
  { key: 'shopping',   Icon: ShoppingBag,    label: 'Compras'    },
  { key: 'clipboard',  Icon: ClipboardList,  label: 'Lista'      },
  { key: 'wrench',     Icon: Wrench,         label: 'Manutenção' },
  { key: 'star',       Icon: Star,           label: 'Destaque'   },
  { key: 'home',       Icon: Home,           label: 'Casa'       },
  { key: 'users',      Icon: Users,          label: 'Equipe'     },
  { key: 'utensils2',  Icon: Utensils,       label: 'Pratos'     },
]

export const getIcon = (key: string): IconComp => STATION_ICONS.find(i => i.key === key)?.Icon ?? Flame

export const DAY_ABBR = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB']
export const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
export const getTodayISO = () => new Date().toISOString().split('T')[0]
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const fmtDate = (iso: string) => { const [y,m,d] = iso.split('-'); return `${d}/${m}/${String(y).slice(2)}` }
export const fmtDateLong = (iso: string) => {
  const [y,m,d] = iso.split('-')
  const dt = new Date(Number(y), Number(m)-1, Number(d))
  return dt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}
export const TODAY = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
export const TODAY_ISO = getTodayISO()

export const buildRange = (start: string, end: string, mark: DayMark): Record<string, DayMark> => {
  const out: Record<string, DayMark> = {}
  const s = new Date(start + 'T12:00:00'), e = new Date(end + 'T12:00:00'), c = new Date(s)
  while (c <= e) { out[c.toISOString().split('T')[0]] = mark; c.setDate(c.getDate() + 1) }
  return out
}

export const buildDateArray = (start: string, end: string): string[] => {
  const dates: string[] = []
  const s = new Date(start + 'T12:00:00'), e = new Date(end + 'T12:00:00'), c = new Date(s)
  while (c <= e) { dates.push(c.toISOString().split('T')[0]); c.setDate(c.getDate() + 1) }
  return dates
}

export const getStatusForDate = (empId: number, schedule: Schedule, dateISO: string): Status => {
  const m = schedule[empId]?.[dateISO]
  return m === 'folga' ? 'dayoff' : m === 'vacation' ? 'vacation' : 'active'
}

export const getVacationRange = (empId: number, schedule: Schedule) => {
  const vd = Object.entries(schedule[empId] ?? {}).filter(([,m]) => m === 'vacation').map(([d]) => d).sort()
  return vd.length ? { start: vd[0], end: vd[vd.length - 1] } : null
}

export const getViolationDays = (
  employees: Employee[], schedule: Schedule, year: number, month: number
): Record<number, Set<string>> => {
  const result: Record<number, Set<string>> = {}
  const monthStart = new Date(Date.UTC(year, month, 1))
  const monthEnd = new Date(Date.UTC(year, month + 1, 0))
  const monthStartISO = monthStart.toISOString().split('T')[0]
  const monthEndISO = monthEnd.toISOString().split('T')[0]
  const scanStart = new Date(monthStart)
  const scanEnd = new Date(monthEnd)
  scanStart.setUTCDate(scanStart.getUTCDate() - 7)
  scanEnd.setUTCDate(scanEnd.getUTCDate() + 7)

  for (const emp of employees) {
    const violations = new Set<string>()
    let streakWorkDates: string[] = []

    for (let dt = new Date(scanStart); dt <= scanEnd; dt.setUTCDate(dt.getUTCDate() + 1)) {
      const iso = dt.toISOString().split('T')[0]
      const mark = schedule[emp.id]?.[iso]
      const isResting = mark === 'folga' || mark === 'vacation'

      if (!isResting) {
        streakWorkDates.push(iso)
        if (streakWorkDates.length > 7) {
          streakWorkDates.slice(7).forEach(workDate => {
            if (workDate >= monthStartISO && workDate <= monthEndISO) violations.add(workDate)
          })
        }
      } else {
        streakWorkDates = []
      }
    }

    if (violations.size > 0) result[emp.id] = violations
  }

  return result
}

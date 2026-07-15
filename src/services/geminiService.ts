import type { Employee, Schedule, ChatMessage, CustomRules } from '../types'
import { MONTH_NAMES } from '../pages/patyHelpCore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AiChange {
  employee_id: number
  date: string
  action: 'add_folga' | 'remove_folga'
}

export interface AiResponse {
  changes: AiChange[]
  explanation: string
}

// ─── Key ─────────────────────────────────────────────────────────────────────

export const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

// ─── API call ─────────────────────────────────────────────────────────────────

export const callGemini = async (prompt: string): Promise<string> => {
  if (!GEMINI_KEY)
    throw new Error('Chave VITE_GEMINI_API_KEY não encontrada no .env.local')

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

export const callGeminiChat = async (
  history: ChatMessage[],
  scheduleContext: string,
  customRules: CustomRules,
  scaleMode: string
): Promise<string> => {
  if (!GEMINI_KEY)
    throw new Error('Chave VITE_GEMINI_API_KEY não encontrada no .env.local')

  const systemInstruction = `Você é o "Chat Assistente de Escala com IA" do Paty Help. 
Você ajuda a organizar e analisar a escala de folgas.
Sempre seja educado, claro e prestativo.

Regra da Escala do Restaurante: ${scaleMode} (${scaleMode === '12x36' ? 'Trabalha 1, Folga 1' : scaleMode === '6x1' ? 'Trabalha 6, Folga 1 (máximo de 6 dias trabalhados)' : scaleMode === '5x1' ? 'Trabalha 5, Folga 1 (máximo de 5 dias)' : 'Trabalha 5, Folga 2 (máximo de 5 dias)'}).

${customRules ? `Regras Customizadas do Usuário:\n${customRules}\n` : ''}
Contexto Atual da Escala:\n${scheduleContext}`

  const contents = history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents,
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
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

// ─── Context builder ──────────────────────────────────────────────────────────

export const buildScheduleContext = (
  employees: Employee[], schedule: Schedule, year: number, month: number
): string => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days  = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const header    = `Mês: ${MONTH_NAMES[month]} ${year} (${daysInMonth} dias)\n`
  const empList   = employees.map(e => `  ID${e.id}: ${e.name} | ${e.role} | ${e.type}`).join('\n')
  const legend    = `\nLegenda: T=Trabalhando  F=Folga  V=Férias\n`
  const dayHeader = `${'Nome'.padEnd(22)} ${days.map(d => String(d).padStart(2)).join(' ')}`
  const rows = employees.map(emp => {
    const marks = days.map(d => {
      const iso = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const m   = schedule[emp.id]?.[iso]
      return m === 'folga' ? ' F' : m === 'vacation' ? ' V' : ' T'
    }).join('')
    return `${emp.name.slice(0, 22).padEnd(22)} ${marks}`
  }).join('\n')
  return `${header}\nFuncionários:\n${empList}${legend}\n${dayHeader}\n${rows}`
}

// ─── Response parser ──────────────────────────────────────────────────────────

export const parseAiResponse = (raw: string): AiResponse => {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Resposta da IA não contém JSON válido')
  return JSON.parse(match[0]) as AiResponse
}

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
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
Você ajuda a organizar e analisar a escala de folgas do restaurante.

DIRETRIZES DE ESTILO DE RESPOSTA:
1. Seja extremamente claro, objetivo e com um tom profissional e elegante.
2. É ESTRITAMENTE PROIBIDO usar marcação de negrito do Markdown (não use **texto** ou __texto__ em hipótese alguma). Entregue um texto limpo.
3. Para criar listas, separar tópicos ou parágrafos de destaque, use apenas um asterisco simples (* ) no início da linha.
4. Faça bom uso de quebras de linha para criar respiros entre os blocos de texto, deixando a interface bonita.
5. Use emojis de forma extremamente contida (no máximo 1 ou 2 por mensagem), apenas quando for absolutamente essencial para a comunicação rápida.
6. Evite parágrafos longos. Suas respostas devem ser muito fáceis de ler rapidamente no ambiente corrido de um restaurante.

IMPORTANTE - SUGESTÕES E FLUXO DE ALTERAÇÃO:
- Você atua como consultor no chat e NÃO altera a escala diretamente no banco por aqui.
- Sempre que o usuário pedir uma troca ou alteração, primeiro analise as folgas atuais e quem pode cobrir, respeitando as regras do estabelecimento.
- Forneça uma proposta analítica clara de alteração.
- Se você sugerir uma mudança específica na escala (como dar folga a alguém ou tirar folga de alguém), você DEVE incluir a seguinte tag estruturada no final da sua mensagem para que o sistema mostre os botões de confirmação ("Aceitar" / "Recusar") para o usuário:
  [MUDANCA: employee_id|YYYY-MM-DD|action]
  Onde 'action' pode ser 'add_folga' (para marcar folga) ou 'remove_folga' (para remover folga/trabalhar).
  Exemplo: [MUDANCA: 1|2026-08-01|add_folga]
  
  Importante: Coloque a tag no final da mensagem. Você pode incluir múltiplas tags se sugerir mais de uma mudança (uma por linha).

Regra da Escala do Restaurante: ${scaleMode} (${scaleMode === '12x36' ? 'Trabalha 1, Folga 1' : scaleMode === '6x1' ? 'Trabalha 6, Folga 1 (máximo de 6 dias trabalhados)' : scaleMode === '5x1' ? 'Trabalha 5, Folga 1 (máximo de 5 dias)' : 'Trabalha 5, Folga 2 (máximo de 5 dias)'}).

${customRules ? `Regras Customizadas do Usuário (Siga-as rigorosamente!):\n${customRules}\n` : ''}
Contexto Atual da Escala:\n${scheduleContext}`

  const contents = history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
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

import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  ChefHat,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from 'lucide-react'

// Signature element: a kitchen "comanda" (order ticket) rail — order
// tickets clipped to a spike, doubling as sample shift cards. Ties the
// brand visual directly to the product's real subject (escala/shifts).
function TicketRail() {
  const tickets = [
    { code: 'Nº 0247', name: 'Marina S.', role: 'Cozinha', shift: 'Seg · 18h–23h', tag: 'Confirmado', rot: -6 },
    { code: 'Nº 0248', name: 'Diego A.', role: 'Salão', shift: 'Ter · 11h–15h', tag: 'Confirmado', rot: 3 },
    { code: 'Nº 0249', name: 'Paty R.', role: 'Gerência', shift: 'Qua · 08h–17h', tag: 'Pendente', rot: -2 },
  ]

  return (
    <div className="relative w-full max-w-[300px]">
      <div className="absolute -top-3 left-8 w-[3px] h-full bg-[#E8A33D]/70 rounded-full" />
      <div className="absolute -top-4 left-[30px] w-3 h-3 rounded-full bg-[#E8A33D] shadow-[0_0_12px_rgba(232,163,61,0.6)]" />

      <div className="space-y-4 pt-2">
        {tickets.map((t) => (
          <div
            key={t.code}
            style={{ transform: `rotate(${t.rot}deg)` }}
            className="relative bg-[#FFF8F0] text-[#2B1710] pl-10 pr-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute left-[26px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#2B1710]/10 border border-[#2B1710]/20" />
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] tracking-widest text-[#8D6B5A]">{t.code}</span>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  t.tag === 'Confirmado'
                    ? 'bg-[#C1440E]/10 text-[#C1440E]'
                    : 'bg-[#E8A33D]/20 text-[#946618]'
                }`}
              >
                {t.tag}
              </span>
            </div>
            <p className="font-semibold text-[15px] leading-tight">{t.name}</p>
            <p className="text-[12px] text-[#8D6B5A]">{t.role} · {t.shift}</p>
            <div
              className="absolute -bottom-[6px] left-0 right-0 h-[6px] bg-[#FFF8F0]"
              style={{
                clipPath:
                  'polygon(0% 0%,4% 100%,8% 0%,12% 100%,16% 0%,20% 100%,24% 0%,28% 100%,32% 0%,36% 100%,40% 0%,44% 100%,48% 0%,52% 100%,56% 0%,60% 100%,64% 0%,68% 100%,72% 0%,76% 100%,80% 0%,84% 100%,88% 0%,92% 100%,96% 0%,100% 100%,100% 0%)',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (isSignUp) {
      const { error, data } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        if (data.session) {
          // Automaticaly logged in
        } else {
          setSuccess('Conta criada com sucesso! Verifique seu e-mail ou faça login para continuar.')
          setIsSignUp(false)
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('E-mail ou senha inválidos.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-[#FFF8F0] font-sans selection:bg-[#C1440E]/20 overflow-hidden relative">
      {/* Left Pane — brand + signature (kitchen ticket rail) */}
      <div 
        className={`hidden lg:flex lg:w-[46%] relative z-20 bg-[#2B1710] overflow-hidden flex-col justify-between py-12 px-8 lg:py-16 lg:px-10 xl:py-20 xl:px-12 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSignUp ? 'lg:translate-x-[117.391%] shadow-[-20px_0_40px_rgba(0,0,0,0.3)]' : 'lg:translate-x-0 shadow-[20px_0_40px_rgba(0,0,0,0.3)]'}`}
      >
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #E8A33D 0, #E8A33D 1px, transparent 1px, transparent 14px)',
          }}
        />

        <div className="relative z-10 flex items-center gap-3 ml-8 lg:ml-24 xl:ml-32">
          <div className="w-11 h-11 bg-[#C1440E] rounded-xl flex items-center justify-center shadow-lg">
            <ChefHat size={22} className="text-[#FFF8F0]" strokeWidth={2} />
          </div>
          <span className="font-[Instrument_Serif,serif] text-[26px] font-bold text-[#FFF8F0] tracking-wide">
            Paty Help
          </span>
        </div>

        <div className="relative z-10 ml-8 lg:ml-24 xl:ml-32">
          <h1 className="text-[42px] leading-[1.08] text-[#FFF8F0] font-[Instrument_Serif,serif] mb-4">
            Cada turno tem<br />sua comanda.
          </h1>
          <p className="text-[15px] text-[#D9C3B4] leading-relaxed max-w-[320px] mb-10 font-light">
            Monte a escala do seu restaurante como quem organiza o rush: rápido, visual e sem confusão na cozinha.
          </p>
          <TicketRail />
        </div>

        <p className="relative z-10 text-[12px] text-[#8D6B5A]">© 2026 Paty Help</p>
      </div>

      {/* Right Pane — Form */}
      <div 
        className={`w-full lg:w-[54%] relative z-10 flex items-center justify-center p-6 sm:p-12 transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSignUp ? 'lg:-translate-x-[85.185%]' : 'lg:translate-x-0'}`}
      >
        <div className="w-full max-w-[380px] space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden w-14 h-14 bg-[#C1440E] rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <ChefHat size={26} className="text-[#FFF8F0]" strokeWidth={1.8} />
            </div>
            <h2 className="text-[28px] font-bold text-[#2B1710] font-[Instrument_Serif,serif] mb-1.5 leading-tight">
              {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-[13.5px] text-[#8D6B5A]">
              {isSignUp ? 'Preencha seus dados para começar a usar o Paty Help.' : 'Acesse sua conta para continuar gerenciando sua escala.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#C1440E]/8 border border-[#C1440E]/20 text-[13px] text-[#A8380A] animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div role="status" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#3F7A4E]/8 border border-[#3F7A4E]/20 text-[13px] text-[#2F5D3A] animate-in fade-in slide-in-from-top-2">
                <Check size={16} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-semibold text-[#2B1710] ml-0.5">E-mail</Label>
                <div className="flex items-center gap-2.5 h-12 rounded-xl bg-[#FFF8F0] border border-[#E9DED5] focus-within:border-[#C1440E] px-3.5 transition-colors">
                  <Mail size={17} className="text-[#8D6B5A] shrink-0" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="paty@restaurante.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-full border-0 shadow-none p-0 bg-transparent focus-visible:ring-0 text-[14.5px] text-[#2B1710] placeholder:text-[#B9A99B]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-0.5">
                  <Label htmlFor="password" className="text-[13px] font-semibold text-[#2B1710]">Senha</Label>
                  {!isSignUp && (
                    <a href="#" className="text-[12px] font-semibold text-[#C1440E] hover:text-[#A8380A] transition-colors">
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2.5 h-12 rounded-xl bg-[#FFF8F0] border border-[#E9DED5] focus-within:border-[#C1440E] px-3.5 transition-colors">
                  <Lock size={17} className="text-[#8D6B5A] shrink-0" />
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-full border-0 shadow-none p-0 bg-transparent focus-visible:ring-0 text-[14.5px] text-[#2B1710] placeholder:text-[#B9A99B]"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="text-[#8D6B5A] hover:text-[#2B1710] shrink-0"
                    aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#C1440E] hover:bg-[#A8380A] text-[#FFF8F0] text-[14.5px] font-bold shadow-lg shadow-[#C1440E]/25 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSignUp ? 'Criando conta…' : 'Entrando…'}
                </span>
              ) : (
                isSignUp ? 'Criar conta' : 'Entrar na conta'
              )}
            </Button>
          </form>

          <div className="text-center lg:text-left text-[13.5px] text-[#8D6B5A]">
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }}
              className="font-bold text-[#C1440E] hover:text-[#A8380A] hover:underline transition-all"
            >
              {isSignUp ? 'Faça login' : 'Cadastre-se grátis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
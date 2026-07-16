import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, ChefHat, Sparkles, AlertTriangle, Check } from 'lucide-react'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen flex bg-white font-sans selection:bg-[#C1440E]/20">
      {/* Left Pane - Visual Premium */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#4A2612] overflow-hidden flex-col justify-between p-14 text-white">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3b1d0d] via-[#4A2612] to-[#C1440E] opacity-95 z-0"></div>
        
        {/* Decorative Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#C1440E]/30 rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo/Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl">
            <ChefHat size={26} className="text-[#FFF5EE]" />
          </div>
          <span className="font-[Instrument Serif,serif] text-4xl font-bold tracking-wide mt-1">Paty Help</span>
        </div>

        {/* Value Proposition */}
        <div className="relative z-10 max-w-lg mb-16">
          <h1 className="text-5xl font-bold leading-[1.1] mb-6 font-[Instrument Serif,serif]">
            A gestão da sua escala,<br />potencializada com IA.
          </h1>
          <p className="text-lg text-[#F5EBE4] leading-relaxed font-light mb-12">
            Esqueça as planilhas complexas. Organize e gerencie a equipe do seu restaurante de forma inteligente, sem conflitos e com total controle.
          </p>
          
          <div className="flex items-center gap-4 text-sm font-medium text-white">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#4A2612] bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <Sparkles size={16} className="text-[#F5EBE4]" />
                </div>
              ))}
            </div>
            <span className="font-light tracking-wide text-[#F5EBE4]">Junte-se a gestores eficientes.</span>
          </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#FDFBF9] relative">
        <div className="w-full max-w-[400px] space-y-8 relative z-10">
          
          <div className="text-center lg:text-left">
            <div className="lg:hidden w-16 h-16 bg-gradient-to-br from-[#4A2612] to-[#6d391b] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <ChefHat size={32} color="#FFF5EE" strokeWidth={1.8} />
            </div>
            <h2 className="text-[2rem] font-bold text-[#4A2612] font-[Instrument Serif,serif] mb-2 leading-tight">
              {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-[#8D6B5A] text-sm">
              {isSignUp ? 'Preencha seus dados para começar a usar o Paty Help.' : 'Acesse sua conta para continuar gerenciando sua escala.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <Check size={18} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-[#4A2612] ml-1">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="paty@restaurante.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-white border-[#EAE3DE] focus:border-[#C1440E] focus-visible:ring-[#C1440E] transition-all px-4 shadow-sm"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="font-semibold text-[#4A2612]">Senha</Label>
                  {!isSignUp && (
                    <a href="#" className="text-xs font-semibold text-[#C1440E] hover:text-[#A8380A] transition-colors">
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-white border-[#EAE3DE] focus:border-[#C1440E] focus-visible:ring-[#C1440E] transition-all px-4 shadow-sm"
                  required 
                  minLength={6}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-[#C1440E] hover:bg-[#A8380A] text-white text-[15px] font-bold shadow-lg shadow-[#C1440E]/25 transition-all active:scale-[0.98]" 
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar na Conta')}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-[#8D6B5A]">
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

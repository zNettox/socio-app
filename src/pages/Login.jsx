import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { slideUp, fadeIn } from '../utils/motion'

const provider = new GoogleAuthProvider()

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
    <path d="M1 1l14 14M6.5 6.6A2.5 2.5 0 0010 10M4.5 4.5C2.5 5.8 1 8 1 8s2.5 5 7 5c1.6 0 3-.5 4.2-1.3M12 11C13.7 9.8 15 8 15 8s-2.5-5-7-5c-.9 0-1.7.2-2.4.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const ERRORS = {
  'auth/email-already-in-use': 'Email já cadastrado.',
  'auth/invalid-email': 'Email inválido.',
  'auth/weak-password': 'Senha fraca — mínimo 6 caracteres.',
  'auth/invalid-credential': 'Email ou senha incorretos.',
  'auth/user-not-found': 'Usuário não encontrado.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
}

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email)
        setSuccess('Email de redefinição enviado! Verifique sua caixa de entrada.')
        setLoading(false); return
      }
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await sendEmailVerification(cred.user)
        navigate('/planos')
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        const snap = await getDoc(doc(db, 'users', cred.user.uid))
        navigate(snap.exists() && snap.data().onboardingComplete ? '/dashboard' : '/onboarding')
      }
    } catch (err) {
      setError(ERRORS[err.code] || 'Algo deu errado. Tente novamente.')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError(''); setLoading(true)
    try {
      const cred = await signInWithPopup(auth, provider)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      if (!snap.exists() || !snap.data().onboardingComplete) {
        navigate('/planos')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(ERRORS[err.code] || 'Erro ao entrar com Google.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center p-6 font-dm relative overflow-hidden">
      <motion.div 
        animate={{ 
          background: [
            'radial-gradient(circle at 10% 20%, rgba(186,117,23,0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 90% 80%, rgba(186,117,23,0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 10% 20%, rgba(186,117,23,0.08) 0%, transparent 50%)'
          ] 
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      <motion.div 
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[420px] relative z-10"
      >
        <button 
          onClick={() => navigate('/')} 
          className="font-syne font-extrabold text-2xl text-white bg-none border-none cursor-pointer mb-10 block transition-transform hover:scale-105 origin-left"
        >
          sócio<span className="text-[#BA7517]">.</span>
        </button>

        <div className="glass-panel p-8 rounded-3xl shadow-2xl relative overflow-hidden border border-white/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#BA7517]/50 to-transparent" />
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={mode} 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <h2 className="font-syne font-extrabold text-3xl tracking-tight text-white mb-2">
                {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Criar conta' : 'Redefinir senha'}
              </h2>
              <p className="text-sm text-white/40 mb-8">
                {mode === 'login' ? 'Entre na sua conta para continuar' : mode === 'register' ? 'Comece grátis e escolha o plano depois' : 'Enviaremos um link seguro para o seu email'}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="text-xs text-white/40 font-medium tracking-wider mb-2 block">EMAIL</label>
                  <input 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="input-field"
                  />
                </div>

                {mode !== 'reset' && (
                  <div>
                    <label className="text-xs text-white/40 font-medium tracking-wider mb-2 block">SENHA</label>
                    <div className="relative">
                      <input 
                        type={showPass ? 'text' : 'password'} 
                        placeholder="Mínimo 6 caracteres" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required minLength={6} 
                        className="input-field pr-12"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPass(!showPass)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 p-1 transition-colors"
                      >
                        <EyeIcon open={showPass} />
                      </button>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="text-sm text-red-400 p-3 rounded-xl bg-red-400/10 border border-red-400/20">{error}</div>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="text-sm text-green-400 p-3 rounded-xl bg-green-400/10 border border-green-400/20">{success}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {mode === 'register' && (
                  <div className="text-xs text-white/30 p-3 rounded-xl bg-white/5 border border-white/5">
                    Enviaremos um email de verificação após o cadastro para garantir sua segurança.
                  </div>
                )}

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading} 
                  className={`w-full py-3.5 mt-2 rounded-xl font-medium text-sm transition-all duration-300 ${loading ? 'opacity-60 cursor-not-allowed' : 'glow-btn'} bg-gradient-to-r from-[#BA7517] to-[#854F0B] text-white shadow-lg shadow-[#BA7517]/20`}
                >
                  {loading ? 'Processando...' : mode === 'login' ? 'Entrar no painel' : mode === 'register' ? 'Criar conta agora →' : 'Enviar link de recuperação'}
                </motion.button>

                {mode === 'login' && (
                  <div className="text-center mt-[-4px]">
                    <button type="button" onClick={() => { setMode('reset'); setError(''); setSuccess('') }} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                      Esqueci minha senha
                    </button>
                  </div>
                )}
              </form>

              {mode !== 'reset' && (
                <>
                  <div className="flex items-center gap-4 my-6 opacity-40">
                    <div className="flex-1 h-px bg-white/20" />
                    <span className="text-xs text-white">ou</span>
                    <div className="flex-1 h-px bg-white/20" />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogle} 
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 p-3.5 rounded-xl bg-transparent border border-white/10 text-white/70 text-sm hover:bg-white/5 hover:text-white transition-all duration-300 disabled:opacity-60"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Continuar com Google
                  </motion.button>
                </>
              )}

              <div className="text-center mt-8 text-sm text-white/30">
                {mode === 'reset' ? (
                  <button onClick={() => { setMode('login'); setError(''); setSuccess('') }} className="text-[#BA7517] hover:text-[#D4A373] transition-colors">← Voltar para o login</button>
                ) : mode === 'login' ? (
                  <>Não tem conta?{' '}<button onClick={() => { setMode('register'); setError('') }} className="text-[#BA7517] hover:text-[#D4A373] transition-colors font-medium">Criar agora</button></>
                ) : (
                  <>Já tem conta?{' '}<button onClick={() => { setMode('login'); setError('') }} className="text-[#BA7517] hover:text-[#D4A373] transition-colors font-medium">Entrar</button></>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
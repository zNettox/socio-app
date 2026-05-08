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
import { slideUp } from '../utils/motion'

const provider = new GoogleAuthProvider()

const EyeIcon = ({ open }) => open ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
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
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 font-dm relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-apple-blue/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-apple-indigo/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.button 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate('/')} 
        className="font-syne font-bold text-3xl text-black bg-none border-none cursor-pointer mb-8 relative z-20 hover:scale-105 transition-transform"
      >
        sócio<span className="text-apple-blue">.</span>
      </motion.button>

      <motion.div 
        variants={slideUp} initial="hidden" animate="visible"
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="glass-card p-8 md:p-10 !rounded-[40px]">
          <AnimatePresence mode="wait">
            <motion.div 
              key={mode} 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} 
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <h2 className="font-syne font-bold text-3xl tracking-tight text-black mb-2 text-center">
                {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Criar conta grátis' : 'Redefinir senha'}
              </h2>
              <p className="text-[15px] text-black/50 mb-8 text-center font-medium">
                {mode === 'login' ? 'Entre na sua conta para continuar' : mode === 'register' ? 'Comece a usar o Sócio em segundos' : 'Enviaremos um link de recuperação'}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <input 
                    type="email" 
                    placeholder="E-mail" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="input-field shadow-sm"
                  />
                </div>

                {mode !== 'reset' && (
                  <div className="relative">
                    <input 
                      type={showPass ? 'text' : 'password'} 
                      placeholder="Senha (mín. 6 caracteres)" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required minLength={6} 
                      className="input-field pr-12 shadow-sm"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(!showPass)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                    >
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="text-sm font-medium text-red-600 p-3 rounded-2xl bg-red-50 border border-red-100">{error}</div>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="text-sm font-medium text-green-600 p-3 rounded-2xl bg-green-50 border border-green-100">{success}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading} 
                  className={`btn-primary w-full mt-2 text-[15px] ${loading ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}
                >
                  {loading ? 'Processando...' : mode === 'login' ? 'Entrar no painel' : mode === 'register' ? 'Criar conta agora →' : 'Enviar link de recuperação'}
                </motion.button>

                {mode === 'login' && (
                  <div className="text-center mt-2">
                    <button type="button" onClick={() => { setMode('reset'); setError(''); setSuccess('') }} className="text-sm font-semibold text-black/40 hover:text-apple-blue transition-colors">
                      Esqueci minha senha
                    </button>
                  </div>
                )}
              </form>

              {mode !== 'reset' && (
                <>
                  <div className="flex items-center gap-4 my-6 opacity-40">
                    <div className="flex-1 h-px bg-black" />
                    <span className="text-xs font-bold uppercase text-black">ou</span>
                    <div className="flex-1 h-px bg-black" />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogle} 
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-full bg-white border border-black/10 text-black font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                  >
                    <svg width="20" height="20" viewBox="0 0 18 18">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Continuar com Google
                  </motion.button>
                </>
              )}

              <div className="text-center mt-8 text-sm font-medium text-black/40">
                {mode === 'reset' ? (
                  <button onClick={() => { setMode('login'); setError(''); setSuccess('') }} className="text-apple-blue hover:text-apple-dark transition-colors">← Voltar para o login</button>
                ) : mode === 'login' ? (
                  <>Não tem conta?{' '}<button onClick={() => { setMode('register'); setError('') }} className="text-apple-blue hover:text-apple-dark transition-colors">Criar agora</button></>
                ) : (
                  <>Já tem conta?{' '}<button onClick={() => { setMode('login'); setError('') }} className="text-apple-blue hover:text-apple-dark transition-colors">Entrar</button></>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
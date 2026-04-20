import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const SocioLogo = () => (
  <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="46" fontSize="48" fontWeight="600" fill="#F2F2F2" fontFamily="Inter, sans-serif">S</text>
    <circle cx="44" cy="18" r="3.2" fill="#D4A373"/>
  </svg>
)

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await sendEmailVerification(cred.user)
        setVerificationSent(true)
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        if (!cred.user.emailVerified) {
          setError('Confirme seu email antes de entrar. Verifique sua caixa de entrada.')
          await auth.signOut()
          setLoading(false)
          return
        }
        const snap = await getDoc(doc(db, 'users', cred.user.uid))
        if (snap.exists() && snap.data().onboardingComplete) {
          navigate('/dashboard')
        } else {
          navigate('/onboarding')
        }
      }
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Email já cadastrado.',
        'auth/invalid-email': 'Email inválido.',
        'auth/weak-password': 'Senha muito fraca. Mínimo 6 caracteres.',
        'auth/invalid-credential': 'Email ou senha incorretos.',
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
      }
      setError(msgs[err.code] || 'Algo deu errado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      if (snap.exists() && snap.data().onboardingComplete) {
        navigate('/dashboard')
      } else {
        navigate('/onboarding')
      }
    } catch (err) {
      setError('Erro ao entrar com Google. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="mb-6 flex justify-center">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="16" fill="#BA7517" fillOpacity="0.15"/>
              <path d="M14 20l14 10 14-10" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="14" y="18" width="28" height="20" rx="3" stroke="#BA7517" strokeWidth="1.5"/>
              <path d="M22 32l4 4 8-8" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-syne font-black text-2xl mb-3 text-white">Confirme seu email</h1>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            Enviamos um link de confirmação para <span className="text-[#BA7517]">{email}</span>. Acesse seu email e clique no link para ativar sua conta.
          </p>
          <button
            onClick={() => { setVerificationSent(false); setMode('login') }}
            className="w-full py-3 rounded-lg text-sm font-medium bg-[#BA7517] text-white hover:bg-[#9a6113] transition-all"
          >
            Já confirmei — entrar
          </button>
          <p className="text-white/30 text-xs mt-4">Não recebeu? Verifique o spam.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <button onClick={() => navigate('/')} className="mb-10 flex items-center gap-2">
          <SocioLogo />
          <div>
            <div className="font-syne font-black text-lg leading-none text-white">
              sócio<span className="text-[#BA7517]">.</span>
            </div>
            <div className="text-[10px] text-white/30 tracking-widest uppercase">by Neves Software</div>
          </div>
        </button>

        <h1 className="font-syne font-black text-3xl mb-1 text-white">
          {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
        </h1>
        <p className="text-white/40 text-sm mb-8">
          {mode === 'login' ? 'Entre na sua conta' : 'Comece grátis, sem cartão'}
        </p>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/15 text-white/80 hover:border-white/30 hover:bg-white/5 transition-all text-sm font-medium mb-5 disabled:opacity-50"
        >
          <GoogleIcon />
          Continuar com Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
            required
            minLength={6}
          />
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-red-400 text-sm px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20">
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : mode === 'login' ? 'Entrar' : 'Criar minha conta'}
          </button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            className="text-[#BA7517] hover:text-[#FAC775] transition-colors"
          >
            {mode === 'login' ? 'Criar agora' : 'Entrar'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
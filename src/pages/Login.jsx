import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const provider = new GoogleAuthProvider()

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const MSGS = {
    'auth/email-already-in-use': 'Email já cadastrado.',
    'auth/invalid-email': 'Email inválido.',
    'auth/weak-password': 'Senha muito fraca — mínimo 6 caracteres.',
    'auth/invalid-credential': 'Email ou senha incorretos.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email)
        setSuccess('Email de redefinição enviado! Verifique sua caixa de entrada.')
        setLoading(false)
        return
      }

      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password)
        navigate('/onboarding')
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        const snap = await getDoc(doc(db, 'users', cred.user.uid))
        if (snap.exists() && snap.data().onboardingComplete) {
          navigate('/dashboard')
        } else {
          navigate('/onboarding')
        }
      }
    } catch (err) {
      setError(MSGS[err.code] || 'Algo deu errado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      const cred = await signInWithPopup(auth, provider)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      if (snap.exists() && snap.data().onboardingComplete) {
        navigate('/dashboard')
      } else {
        navigate('/onboarding')
      }
    } catch (err) {
      setError(MSGS[err.code] || 'Erro ao entrar com Google.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <button onClick={() => navigate('/')} className="font-syne font-black text-2xl mb-10 block">
          sócio<span className="text-[#BA7517]">.</span>
        </button>

        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>

            <h1 className="font-syne font-black text-3xl mb-1">
              {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Criar conta' : 'Redefinir senha'}
            </h1>
            <p className="text-white/40 text-sm mb-8">
              {mode === 'login' ? 'Entre na sua conta'
                : mode === 'register' ? 'Comece grátis, sem cartão'
                : 'Enviaremos um link para seu email'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                required
              />

              {mode !== 'reset' && (
                <input
                  type="password"
                  placeholder="Senha (mín. 6 caracteres)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                  required
                  minLength={6}
                />
              )}

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-red-400 text-sm px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20">
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-green-400 text-sm px-4 py-3 rounded-xl bg-green-400/10 border border-green-400/20">
                  {success}
                </motion.div>
              )}

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : mode === 'login' ? 'Entrar'
                  : mode === 'register' ? 'Criar minha conta'
                  : 'Enviar link de redefinição'
                }
              </button>
            </form>

            {/* Esqueci a senha */}
            {mode === 'login' && (
              <button onClick={() => switchMode('reset')}
                className="w-full text-center text-xs text-white/35 hover:text-white/60 transition-colors mt-3">
                Esqueci minha senha
              </button>
            )}

            {/* Google login */}
            {mode !== 'reset' && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-white/[0.08]" />
                  <span className="text-xs text-white/25">ou</span>
                  <div className="flex-1 h-px bg-white/[0.08]" />
                </div>
                <button onClick={handleGoogle} disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/15 text-white/60 hover:border-white/30 hover:text-white transition-all duration-200 text-sm disabled:opacity-50">
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Continuar com Google
                </button>
              </>
            )}

            <p className="text-center text-sm text-white/40 mt-6">
              {mode === 'reset' ? (
                <button onClick={() => switchMode('login')} className="text-[#BA7517] hover:text-[#FAC775] transition-colors">
                  ← Voltar para o login
                </button>
              ) : mode === 'login' ? (
                <>Não tem conta?{' '}
                  <button onClick={() => switchMode('register')} className="text-[#BA7517] hover:text-[#FAC775] transition-colors">
                    Criar agora
                  </button>
                </>
              ) : (
                <>Já tem conta?{' '}
                  <button onClick={() => switchMode('login')} className="text-[#BA7517] hover:text-[#FAC775] transition-colors">
                    Entrar
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
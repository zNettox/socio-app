import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password)
        navigate('/onboarding')
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        // Verifica se já completou onboarding
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
        'auth/weak-password': 'Senha muito fraca.',
        'auth/invalid-credential': 'Email ou senha incorretos.',
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
      }
      setError(msgs[err.code] || 'Algo deu errado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <button onClick={() => navigate('/')} className="font-syne font-black text-2xl mb-10 block">
          sócio<span className="text-[#BA7517]">.</span>
        </button>

        <h1 className="font-syne font-black text-3xl mb-1">
          {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
        </h1>
        <p className="text-white/40 text-sm mb-8">
          {mode === 'login' ? 'Entre na sua conta' : 'Comece grátis, sem cartão'}
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
          <input
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
            required
            minLength={6}
          />
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20"
            >
              {error}
            </motion.div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              mode === 'login' ? 'Entrar' : 'Criar minha conta'
            )}
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

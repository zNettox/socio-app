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

const provider = new GoogleAuthProvider()

const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
        // Envia verificação de email
        await sendEmailVerification(cred.user)
        // Vai para seleção de plano antes do onboarding
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

  const S = {
    root: { minHeight: '100vh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', fontFamily: "'DM Sans', sans-serif" },
    input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', transition: 'border-color 0.2s' },
    label: { fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 8, letterSpacing: '0.05em' },
    btn: { width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', background: '#BA7517', color: '#fff', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.2s' },
    link: { color: '#BA7517', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: "'DM Sans', sans-serif" },
  }

  return (
    <div style={S.root}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <button onClick={() => navigate('/')} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 40, display: 'block' }}>
          sócio<span style={{ color: '#BA7517' }}>.</span>
        </button>

        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: '-1px', color: '#fff', marginBottom: 6 }}>
              {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Criar conta' : 'Redefinir senha'}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>
              {mode === 'login' ? 'Entre na sua conta' : mode === 'register' ? 'Grátis para começar — escolha o plano depois' : 'Enviaremos um link para seu email'}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>EMAIL</label>
                <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={S.input}
                  onFocus={e => e.target.style.borderColor = 'rgba(186,117,23,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
              </div>

              {mode !== 'reset' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={S.label}>SENHA</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={{ ...S.input, paddingRight: 46 }}
                      onFocus={e => e.target.style.borderColor = 'rgba(186,117,23,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
                    <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', padding: 4 }}>
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                </div>
              )}

              {error && <div style={{ fontSize: 13, color: '#f87171', padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', marginBottom: 14 }}>{error}</div>}
              {success && <div style={{ fontSize: 13, color: '#4ade80', padding: '10px 14px', borderRadius: 10, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', marginBottom: 14 }}>{success}</div>}

              {mode === 'register' && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
                  Um email de verificação será enviado após o cadastro.
                </div>
              )}

              <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.6 : 1, marginBottom: 12 }}>
                {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta e escolher plano →' : 'Enviar link'}
              </button>

              {mode === 'login' && (
                <div style={{ textAlign: 'center', marginBottom: 4 }}>
                  <button type="button" onClick={() => { setMode('reset'); setError(''); setSuccess('') }}
                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Esqueci minha senha
                  </button>
                </div>
              )}
            </form>

            {mode !== 'reset' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>ou</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                </div>
                <button onClick={handleGoogle} disabled={loading}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', opacity: loading ? 0.6 : 1 }}>
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

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
              {mode === 'reset' ? (
                <button onClick={() => { setMode('login'); setError(''); setSuccess('') }} style={S.link}>← Voltar para o login</button>
              ) : mode === 'login' ? (
                <>Não tem conta?{' '}<button onClick={() => { setMode('register'); setError('') }} style={S.link}>Criar agora</button></>
              ) : (
                <>Já tem conta?{' '}<button onClick={() => { setMode('login'); setError('') }} style={S.link}>Entrar</button></>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
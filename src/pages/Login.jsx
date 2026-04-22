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

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M1 9C1 9 4 3 9 3s8 6 8 6-3 6-8 6S1 9 1 9z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M1 1l16 16M7.5 7.6A2.5 2.5 0 0011.4 11M5 5.2C2.8 6.5 1 9 1 9s3 6 8 6c1.8 0 3.4-.6 4.8-1.5M13.5 12.8C15.3 11.4 17 9 17 9s-3-6-8-6c-.9 0-1.8.2-2.6.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

const ERRORS = {
  'auth/email-already-in-use': 'Email já cadastrado.',
  'auth/invalid-email': 'Email inválido.',
  'auth/weak-password': 'Senha muito fraca — mínimo 6 caracteres.',
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
  const [showPassword, setShowPassword] = useState(false)
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
        await createUserWithEmailAndPassword(auth, email, password)
        navigate('/onboarding')
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
      navigate(snap.exists() && snap.data().onboardingComplete ? '/dashboard' : '/onboarding')
    } catch (err) {
      setError(ERRORS[err.code] || 'Erro ao entrar com Google.')
    }
    setLoading(false)
  }

  const S = {
    root: { minHeight: '100vh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', fontFamily: "'DM Sans', sans-serif" },
    wrap: { width: '100%', maxWidth: 400 },
    logo: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px', color: '#fff', marginBottom: 40, display: 'block', textDecoration: 'none', cursor: 'pointer', background: 'none', border: 'none' },
    title: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: '-1px', color: '#fff', marginBottom: 6 },
    sub: { fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 32 },
    label: { fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 8, letterSpacing: '0.05em' },
    inputWrap: { position: 'relative', marginBottom: 14 },
    input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', transition: 'border-color 0.2s' },
    eyeBtn: { position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', padding: 4, transition: 'color 0.2s' },
    btn: { width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', background: '#BA7517', color: '#fff', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.2s' },
    divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' },
    divLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' },
    divText: { fontSize: 11, color: 'rgba(255,255,255,0.2)' },
    googleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' },
    error: { fontSize: 13, color: '#f87171', padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', marginBottom: 14 },
    success: { fontSize: 13, color: '#4ade80', padding: '10px 14px', borderRadius: 10, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', marginBottom: 14 },
    link: { color: '#BA7517', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: "'DM Sans', sans-serif" },
  }

  const titles = { login: 'Bem-vindo de volta', register: 'Criar conta', reset: 'Redefinir senha' }
  const subs = { login: 'Entre na sua conta para continuar', register: 'Comece grátis, sem cartão de crédito', reset: 'Enviaremos um link para seu email' }

  return (
    <div style={S.root}>
      <div style={S.wrap}>
        <button onClick={() => navigate('/')} style={S.logo}>
          sócio<span style={{ color: '#BA7517' }}>.</span>
        </button>

        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
            <div style={S.title}>{titles[mode]}</div>
            <div style={S.sub}>{subs[mode]}</div>

            <form onSubmit={handleSubmit}>
              <div style={S.inputWrap}>
                <label style={S.label}>EMAIL</label>
                <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={S.input}
                  onFocus={e => e.target.style.borderColor = 'rgba(186,117,23,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
              </div>

              {mode !== 'reset' && (
                <div style={S.inputWrap}>
                  <label style={S.label}>SENHA</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={{ ...S.input, paddingRight: 46 }}
                      onFocus={e => e.target.style.borderColor = 'rgba(186,117,23,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
                    <button type="button" onClick={() => setShowPassword(s => !s)} style={S.eyeBtn}
                      onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>
              )}

              {error && <div style={S.error}>{error}</div>}
              {success && <div style={S.success}>{success}</div>}

              <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.6 : 1, marginBottom: 12 }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = '#9a6113')}
                onMouseLeave={e => e.currentTarget.style.background = '#BA7517'}>
                {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar minha conta' : 'Enviar link de redefinição'}
              </button>

              {mode === 'login' && (
                <div style={{ textAlign: 'center', marginBottom: 4 }}>
                  <button type="button" onClick={() => { setMode('reset'); setError(''); setSuccess('') }} style={{ ...S.link, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}>
                    Esqueci minha senha
                  </button>
                </div>
              )}
            </form>

            {mode !== 'reset' && (
              <>
                <div style={S.divider}>
                  <div style={S.divLine} /><span style={S.divText}>ou</span><div style={S.divLine} />
                </div>
                <button onClick={handleGoogle} disabled={loading} style={{ ...S.googleBtn, opacity: loading ? 0.6 : 1 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}>
                  <GoogleIcon /> Continuar com Google
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
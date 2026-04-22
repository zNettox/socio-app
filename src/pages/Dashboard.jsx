import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  doc, getDoc, collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, updateDoc
} from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import Cashflow from './Cashflow'

// ─── SVG Icons ────────────────────────────────────────────────────────────
const Icon = {
  Chat: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 12l3 3v-3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5 6h6M5 8.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  File: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 1h7l4 4v10H3V1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M10 1v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  Dollar: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 4v8M6 6.5h3a1.5 1.5 0 010 3H7a1.5 1.5 0 000 3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  Cash: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l3.5-4 2.5 2.5 3-5.5 3.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 2v12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Brush: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 2l4 4-7 7H3v-4l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M3 13c0-1.5 1-2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  Support: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6.5a2 2 0 113 1.7V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="11.5" r="0.8" fill="currentColor"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Send: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 7.5h11M8.5 3L13 7.5 8.5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Menu: () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  User: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10L8.5 3.5l2 2L5 12H2v-2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M7 5l2 2" stroke="currentColor" strokeWidth="1.2"/></svg>,
  Camera: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="11.5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M6 5l1.5-2.5h5L14 5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Crown: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 11h12M2 11L1 5l3 3 3-5 3 5 3-3-1 6H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  CreditCard: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 7h14" stroke="currentColor" strokeWidth="1.3"/><rect x="3" y="9.5" width="4" height="1.5" rx="0.5" fill="currentColor"/></svg>,
  Logout: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10 5l4 3-4 3M6 8h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#BA7517" strokeWidth="1"/><path d="M4.5 7l2 2 3-3" stroke="#BA7517" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v7M4 6.5l3 3 3-3M2 10v1.5A1.5 1.5 0 003.5 13h7a1.5 1.5 0 001.5-1.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 3.5h11M5 3.5V2h4v1.5M5.5 5.5v5M8.5 5.5v5M2.5 3.5l.7 8A1 1 0 004.2 12.5h5.6a1 1 0 001-.9l.7-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  Whatsapp: () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9c0 1.4.37 2.72 1.02 3.86L1.5 16.5l3.74-1c1.1.6 2.37.95 3.76.95 4.14 0 7.5-3.36 7.5-7.5S13.14 1.5 9 1.5z" stroke="#4ade80" strokeWidth="1.2"/><path d="M6.75 6.5c.18.72.65 1.45 1.27 2.07.62.62 1.38 1.09 2.1 1.27l.72-.72c.1-.1.26-.1.36 0l1.27 1.27c.1.1.1.26 0 .36l-.72.72c-1.63.27-3.8-1.27-4.8-3.18l.72-.72c.1-.1.1-.26 0-.36L6.4 5.94c-.1-.1-.26-.1-.36 0l-.5.56" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  SocioMark: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 64 64" fill="none"><text x="8" y="48" fontSize="52" fontWeight="700" fill="#F2F2F2" fontFamily="'Syne', sans-serif">S</text><circle cx="46" cy="16" r="5" fill="#D4A373"/></svg>,
}

// ─── Sound ─────────────────────────────────────────────────────────────────
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    const freqs = { send: [520, 680], receive: [440, 540], click: [700, 550], success: [520, 720] }
    const [f1, f2] = freqs[type] || freqs.click
    osc.frequency.setValueAtTime(f1, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + 0.15)
    osc.start(); osc.stop(ctx.currentTime + 0.35)
  } catch {}
}

// ─── PDF Generation ────────────────────────────────────────────────────────
const generatePDF = async (content, userData) => {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(8, 8, 8); doc.rect(0, 0, W, 48, 'F')
  doc.setTextColor(242, 242, 242); doc.setFontSize(26); doc.setFont('helvetica', 'bold')
  doc.text('Sócio.', 14, 30)
  doc.setFontSize(9); doc.setTextColor(180, 140, 80)
  doc.text('by Neves Software', 14, 40)
  doc.text(userData?.businessName || '', W - 14, 40, { align: 'right' })
  doc.setFontSize(9); doc.setTextColor(140, 140, 140)
  doc.text(new Date().toLocaleDateString('pt-BR'), W - 14, 30, { align: 'right' })
  doc.setTextColor(20, 20, 20); doc.setFontSize(18); doc.setFont('helvetica', 'bold')
  doc.text('Proposta Comercial', 14, 68)
  doc.setDrawColor(186, 117, 23); doc.setLineWidth(0.8); doc.line(14, 73, W - 14, 73)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(40, 40, 40)
  const lines = doc.splitTextToSize(content, W - 28)
  let y = 84
  lines.forEach(l => { if (y > 270) { doc.addPage(); y = 20 }; doc.text(l, 14, y); y += 7 })
  doc.setFillColor(240, 235, 220); doc.rect(0, 280, W, 17, 'F')
  doc.setFontSize(8); doc.setTextColor(100, 100, 100)
  doc.text('Gerado por Sócio — usesocio.netlify.app', 14, 290)
  doc.text(new Date().toLocaleString('pt-BR'), W - 14, 290, { align: 'right' })
  return doc
}

// ─── Constants ─────────────────────────────────────────────────────────────
const PLAN_LIMITS = { free: 10, pro: Infinity, business: Infinity }
const PLAN_LABELS = { free: 'Grátis', pro: 'Pro', business: 'Business' }
const TABS = [
  { id: 'chat', label: 'Assistente', Icon: Icon.Chat },
  { id: 'proposals', label: 'Propostas', Icon: Icon.File },
  { id: 'cashflow', label: 'Caixa', Icon: Icon.Cash },
  { id: 'services', label: 'Serviços', Icon: Icon.Brush },
  { id: 'support', label: 'Suporte', Icon: Icon.Support },
]
const SERVICES = [
  { cat: 'Artes digitais', items: [{ name: 'Post feed Instagram', price: 35, desc: 'Arte profissional para o feed' }, { name: 'Story', price: 25, desc: 'Story criativo com identidade' }, { name: 'Capa para destaque', price: 20, desc: 'Ícone de destaque do perfil' }, { name: 'Kit 5 posts', price: 120, desc: 'Economia de R$55 vs avulso' }, { name: 'Kit 10 posts', price: 199, desc: 'Economia de R$151 vs avulso' }] },
  { cat: 'Edição de vídeo', items: [{ name: 'Edição de Reels (até 60s)', price: 89, desc: 'Cortes, trilha e legendas' }, { name: 'Pacote 4 Reels', price: 299, desc: 'Economia de R$57 vs avulso' }] },
  { cat: 'Gravação local — Manaus', badge: true, items: [{ name: 'Gravação de 1 Reels', price: 149, desc: 'No seu estabelecimento' }, { name: 'Gravação + edição de 1 Reels', price: 199, desc: 'Completo' }, { name: 'Gravação + edição de 4 Reels', price: 599, desc: 'Economia de R$197' }, { name: 'Ensaio fotográfico para negócio', price: 199, desc: 'Fotos do seu espaço e produtos' }] },
]

// ─── Component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const [proposals, setProposals] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileView, setProfileView] = useState('main') // main | plan | payment
  const messagesEnd = useRef(null)
  const fileRef = useRef(null)
  const user = auth.currentUser

  const plan = userData?.plan || 'free'
  const limit = PLAN_LIMITS[plan]
  const isLimited = plan === 'free' && msgCount >= limit
  const displayName = userData?.profileName || userData?.businessName || 'você'

  useEffect(() => {
    if (!user) return
    return onSnapshot(doc(db, 'users', user.uid), snap => {
      if (snap.exists()) {
        const d = snap.data()
        setUserData(d); setMsgCount(d.msgCount || 0)
        setProfileName(d.profileName || d.businessName || '')
        setProfilePhoto(d.profilePhotoUrl || null)
      }
    })
  }, [])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'conversations'), orderBy('updatedAt', 'desc'))
    return onSnapshot(q, snap => {
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setConversations(convs)
      if (!activeConvId && convs.length > 0) setActiveConvId(convs[0].id)
    })
  }, [])

  useEffect(() => {
    if (!user || !activeConvId) return
    const q = query(collection(db, 'users', user.uid, 'conversations', activeConvId, 'messages'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [activeConvId])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'proposals'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setProposals(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const newConv = async () => {
    playSound('click')
    const ref = await addDoc(collection(db, 'users', user.uid, 'conversations'), { title: 'Nova conversa', createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    setActiveConvId(ref.id); setMessages([]); setActiveTab('chat'); setSidebarOpen(false)
  }

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading || isLimited) return
    playSound('send')
    let convId = activeConvId
    if (!convId) {
      const ref = await addDoc(collection(db, 'users', user.uid, 'conversations'), { title: text.slice(0, 40), createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      convId = ref.id; setActiveConvId(convId)
    }
    setInput(''); setLoading(true)
    await addDoc(collection(db, 'users', user.uid, 'conversations', convId, 'messages'), { role: 'user', content: text.trim(), createdAt: serverTimestamp() })
    if (messages.length === 0) await updateDoc(doc(db, 'users', user.uid, 'conversations', convId), { title: text.slice(0, 50), updatedAt: serverTimestamp() })
    else await updateDoc(doc(db, 'users', user.uid, 'conversations', convId), { updatedAt: serverTimestamp() })
    const newCount = msgCount + 1; setMsgCount(newCount)
    await updateDoc(doc(db, 'users', user.uid), { msgCount: newCount })
    try {
      const res = await fetch('/.netlify/functions/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text.trim(), userData, history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })) }) })
      const data = await res.json()
      const reply = data.reply || 'Desculpe, não consegui processar sua mensagem.'
      playSound('receive')
      await addDoc(collection(db, 'users', user.uid, 'conversations', convId, 'messages'), { role: 'assistant', content: reply, createdAt: serverTimestamp() })
      if (reply.toLowerCase().includes('proposta') && reply.length > 200) {
        await addDoc(collection(db, 'users', user.uid, 'proposals'), { title: text.slice(0, 50), content: reply, createdAt: serverTimestamp(), businessName: userData?.businessName })
        playSound('success')
      }
    } catch {
      await addDoc(collection(db, 'users', user.uid, 'conversations', convId, 'messages'), { role: 'assistant', content: 'Erro de conexão. Tente novamente.', createdAt: serverTimestamp() })
    }
    setLoading(false)
  }

  const downloadPDF = async (p) => {
    playSound('success')
    try { const d = await generatePDF(p.content, userData); d.save(`proposta-${p.title.replace(/\s+/g, '-').toLowerCase()}.pdf`) }
    catch { alert('Erro ao gerar PDF.') }
  }

  const saveProfile = async () => {
    setSavingProfile(true); playSound('success')
    await updateDoc(doc(db, 'users', user.uid), { profileName })
    setSavingProfile(false); setProfileOpen(false)
  }

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const url = ev.target.result; setProfilePhoto(url)
      await updateDoc(doc(db, 'users', user.uid), { profilePhotoUrl: url })
    }
    reader.readAsDataURL(file)
  }

  const tab = (id) => { playSound('click'); setActiveTab(id) }

  const S = { // Inline styles
    root: { minHeight: '100vh', background: '#060606', color: '#fff', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,6,6,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 30 },
    logo: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' },
    pill: (active) => ({ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, border: active ? 'none' : '1px solid rgba(255,255,255,0.1)', background: active ? '#BA7517' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.2s' }),
    avatarBtn: { width: 32, height: 32, borderRadius: 10, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(186,117,23,0.15)', transition: 'border-color 0.2s', flexShrink: 0 },
    tabBar: { display: 'flex', gap: 1, padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,6,6,0.8)', backdropFilter: 'blur(10px)', overflowX: 'auto' },
    tab: (active) => ({ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 14px', fontSize: 13, fontWeight: active ? 500 : 400, color: active ? '#FAC775' : 'rgba(255,255,255,0.35)', borderBottom: `2px solid ${active ? '#BA7517' : 'transparent'}`, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', background: 'none', border: 'none', borderBottom: `2px solid ${active ? '#BA7517' : 'transparent'}`, marginBottom: -1 }),
    sidebar: { width: 240, borderRight: '1px solid rgba(255,255,255,0.05)', background: '#080808', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100%' },
    convBtn: (active) => ({ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 8, fontSize: 12, color: active ? '#fff' : 'rgba(255,255,255,0.4)', background: active ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }),
    inputWrap: { display: 'flex', gap: 10, padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,6,6,0.9)' },
    input: { flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
    sendBtn: (disabled) => ({ width: 40, height: 40, borderRadius: 12, background: disabled ? 'rgba(186,117,23,0.3)' : '#BA7517', color: '#fff', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }),
  }

  const QUICK = ['Quanto devo cobrar pelo meu serviço?', 'Cria uma proposta profissional', 'Ideia de promoção para esta semana', 'Como aumentar meu faturamento?']

  return (
    <div style={S.root}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => { setSidebarOpen(s => !s); playSound('click') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4, display: 'flex' }}>
            <Icon.Menu />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon.SocioMark size={22} />
            <span style={S.logo}>sócio<span style={{ color: '#BA7517' }}>.</span></span>
          </div>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{userData?.businessName}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {plan === 'free' && (
            <button onClick={() => navigate('/checkout?plan=pro_mensal_promo')} style={S.pill(true)}>
              Fazer upgrade
            </button>
          )}
          {plan !== 'free' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(186,117,23,0.1)', border: '1px solid rgba(186,117,23,0.2)' }}>
              <Icon.Crown />
              <span style={{ fontSize: 11, color: '#D4A373', fontWeight: 500 }}>{PLAN_LABELS[plan]}</span>
            </div>
          )}
          <button onClick={() => { setProfileOpen(true); setProfileView('main'); playSound('click') }} style={S.avatarBtn}>
            {profilePhoto
              ? <img src={profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 13, fontWeight: 700, color: '#BA7517' }}>{displayName[0]?.toUpperCase()}</span>
            }
          </button>
        </div>
      </header>

      {/* ── TABS ───────────────────────────────────────────────────────── */}
      <div style={S.tabBar}>
        {TABS.map(({ id, label, Icon: TabIcon }) => (
          <button key={id} onClick={() => tab(id)} style={S.tab(activeTab === id)}>
            <TabIcon />
            {label}
          </button>
        ))}
      </div>

      {/* ── LIMIT BANNER ───────────────────────────────────────────────── */}
      {isLimited && (
        <div style={{ background: 'rgba(186,117,23,0.08)', borderBottom: '1px solid rgba(186,117,23,0.15)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#FAC775' }}>Créditos gratuitos esgotados.</span>
          <button onClick={() => navigate('/checkout?plan=pro_mensal_promo')} style={{ fontSize: 12, fontWeight: 500, background: '#BA7517', color: '#fff', padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            Pro por R$19,90
          </button>
        </div>
      )}

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Sidebar overlay mobile */}
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 20 }} />}

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ duration: 0.2 }}
              style={{ ...S.sidebar, position: 'fixed', top: 0, left: 0, zIndex: 25, height: '100vh', paddingTop: 112 }}>
              <div style={{ padding: '0 12px 12px' }}>
                <button onClick={newConv} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.15)', color: '#FAC775', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  <Icon.Plus /> Nova conversa
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
                {conversations.length === 0 && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '24px 0' }}>Nenhuma conversa</p>}
                {conversations.map(c => (
                  <button key={c.id} onClick={() => { setActiveConvId(c.id); setSidebarOpen(false); setActiveTab('chat'); playSound('click') }} style={S.convBtn(activeConvId === c.id)}>
                    {c.title || 'Nova conversa'}
                  </button>
                ))}
              </div>
              <div style={{ padding: '12px 12px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={async () => { await signOut(auth); navigate('/') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, color: 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none' }}>
                  <Icon.Logout /> Sair
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── MAIN ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <AnimatePresence mode="wait">

            {/* CHAT */}
            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720, width: '100%', margin: '0 auto' }}>
                  {messages.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', paddingTop: 48 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Icon.SocioMark size={32} />
                      </div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Olá, {displayName}!</div>
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>Como posso ajudar seu negócio hoje?</div>
                      <div style={{ display: 'grid', gap: 10, maxWidth: 420, margin: '0 auto' }}>
                        {QUICK.map(q => (
                          <button key={q} onClick={() => sendMessage(q)} disabled={isLimited}
                            style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: isLimited ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                            onMouseEnter={e => { if (!isLimited) { e.currentTarget.style.borderColor = 'rgba(186,117,23,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' } }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
                            {q}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {messages.map(msg => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: 12, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: msg.role === 'assistant' ? '#111' : 'rgba(255,255,255,0.07)', border: `1px solid ${msg.role === 'assistant' ? 'rgba(186,117,23,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                        {msg.role === 'assistant' ? <Icon.SocioMark size={20} /> : profilePhoto ? <img src={profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon.User />}
                      </div>
                      <div style={{ maxWidth: '76%' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 5, paddingLeft: 4 }}>{msg.role === 'assistant' ? 'Sócio' : 'Você'}</div>
                        <div style={{ padding: '11px 16px', borderRadius: msg.role === 'assistant' ? '14px 14px 14px 4px' : '14px 14px 4px 14px', fontSize: 13.5, lineHeight: 1.65, whiteSpace: 'pre-wrap', background: msg.role === 'assistant' ? 'rgba(255,255,255,0.04)' : 'rgba(186,117,23,0.15)', color: msg.role === 'assistant' ? 'rgba(255,255,255,0.8)' : '#FAC775', border: `1px solid ${msg.role === 'assistant' ? 'rgba(255,255,255,0.06)' : 'rgba(186,117,23,0.2)'}` }}>
                          {msg.content}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: '#111', border: '1px solid rgba(186,117,23,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon.SocioMark size={20} /></div>
                      <div style={{ padding: '12px 16px', borderRadius: '14px 14px 14px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 5, alignItems: 'center' }}>
                        {[0, 0.15, 0.3].map((d, i) => <motion.div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(186,117,23,0.6)' }} animate={{ y: [-4, 0, -4] }} transition={{ duration: 0.8, repeat: Infinity, delay: d }} />)}
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEnd} />
                </div>
                <div style={S.inputWrap}>
                  {plan === 'free' && msgCount < limit && <div style={{ position: 'absolute', fontSize: 11, color: 'rgba(255,255,255,0.2)', top: -18, left: '50%', transform: 'translateX(-50%)' }}>{limit - msgCount} mensagens restantes</div>}
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder={isLimited ? 'Faça upgrade para continuar...' : 'Pergunte algo para o Sócio...'} disabled={loading || isLimited} style={{ ...S.input, opacity: isLimited ? 0.4 : 1 }} />
                  <button onClick={() => sendMessage()} disabled={!input.trim() || loading || isLimited} style={S.sendBtn(!input.trim() || loading || isLimited)}>
                    <Icon.Send />
                  </button>
                </div>
              </motion.div>
            )}

            {/* PROPOSALS */}
            {activeTab === 'proposals' && (
              <motion.div key="proposals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', maxWidth: 760, width: '100%', margin: '0 auto' }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Propostas</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Propostas geradas pelo assistente — baixe em PDF com um clique.</div>
                </div>
                {proposals.length === 0 ? (
                  <div style={{ textAlign: 'center', paddingTop: 60 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'rgba(255,255,255,0.2)' }}><Icon.File /></div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Nenhuma proposta gerada ainda.</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>Peça ao assistente para criar uma proposta.</div>
                    <button onClick={() => tab('chat')} style={{ marginTop: 16, fontSize: 13, color: '#BA7517', background: 'none', border: 'none', cursor: 'pointer' }}>Ir para o assistente →</button>
                  </div>
                ) : proposals.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginBottom: 10, transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#BA7517' }}><Icon.File /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{p.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || 'Hoje'}</div>
                    </div>
                    <button onClick={() => downloadPDF(p)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.15)', color: '#FAC775', fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(186,117,23,0.16)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(186,117,23,0.08)'}>
                      <Icon.Download /> Baixar PDF
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* CASHFLOW */}
            {activeTab === 'cashflow' && (
              <motion.div key="cashflow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Cashflow />
              </motion.div>
            )}

            {/* SERVICES */}
            {activeTab === 'services' && (
              <motion.div key="services" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', maxWidth: 760, width: '100%', margin: '0 auto' }}>
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Serviços criativos</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Feito por humanos da Neves Software — artes, vídeos e gravação em Manaus.</div>
                </div>
                {SERVICES.map((s, si) => (
                  <div key={s.cat} style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>{s.cat}</div>
                      {s.badge && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(186,117,23,0.15)', color: '#FAC775', border: '1px solid rgba(186,117,23,0.2)', fontWeight: 500 }}>Apenas Manaus</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {s.items.map(item => (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s', gap: 16 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.desc}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: '#BA7517' }}>R${item.price.toFixed(2).replace('.', ',')}</span>
                            <a href={`https://wa.me/5592981417222?text=Olá! Interesse no serviço: *${item.name}* (R$${item.price.toFixed(2).replace('.', ',')}). Negócio: ${userData?.businessName || ''}`} target="_blank" rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', color: '#4ade80', fontSize: 12, fontWeight: 500, textDecoration: 'none', transition: 'background 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,222,128,0.15)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(74,222,128,0.08)'}>
                              <Icon.Whatsapp /> Contratar
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 8, padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(186,117,23,0.15)', background: 'rgba(186,117,23,0.03)' }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, margin: 0 }}>Ao contratar, você será redirecionado ao WhatsApp da Neves Software para combinar detalhes, prazo e pagamento. Atendimento de segunda a sexta, 9h–18h.</p>
                </div>
              </motion.div>
            )}

            {/* SUPPORT */}
            {activeTab === 'support' && (
              <motion.div key="support" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', maxWidth: 600, width: '100%', margin: '0 auto' }}>
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Suporte</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Fale diretamente com a equipe da Neves Software.</div>
                </div>
                <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon.SocioMark size={32} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Neves Software</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Suporte — Sócio App</div>
                    </div>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    <a href="https://wa.me/5592981417222" target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(74,222,128,0.15)', background: 'rgba(74,222,128,0.04)', textDecoration: 'none', transition: 'background 0.2s', marginBottom: 16 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,222,128,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(74,222,128,0.04)'}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon.Whatsapp />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>WhatsApp — (92) 98141-7222</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Clique para abrir o WhatsApp</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}><path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
                    <div style={{ padding: '14px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>Horário de atendimento</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Segunda a sexta — 9h às 18h</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Respondemos em até 2 horas</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── PROFILE MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {profileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProfileOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 40, backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 400, background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, zIndex: 50, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>

              {/* Profile header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Minha conta</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['main', 'plan', 'payment'].map(v => (
                    <button key={v} onClick={() => setProfileView(v)}
                      style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: profileView === v ? 'rgba(186,117,23,0.15)' : 'transparent', color: profileView === v ? '#FAC775' : 'rgba(255,255,255,0.3)', border: profileView === v ? '1px solid rgba(186,117,23,0.2)' : '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                      {v === 'main' ? 'Perfil' : v === 'plan' ? 'Plano' : 'Pagamento'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                <AnimatePresence mode="wait">

                  {/* MAIN VIEW */}
                  {profileView === 'main' && (
                    <motion.div key="main" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: 64, height: 64, borderRadius: 18, overflow: 'hidden', border: '2px solid rgba(186,117,23,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(186,117,23,0.1)' }}>
                            {profilePhoto ? <img src={profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, color: '#BA7517' }}>{displayName[0]?.toUpperCase()}</span>}
                          </div>
                          <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: 8, background: '#BA7517', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <Icon.Camera />
                          </button>
                          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>{userData?.businessName}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{user?.email}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                            <Icon.Crown />
                            <span style={{ fontSize: 11, color: '#D4A373' }}>Plano {PLAN_LABELS[plan]}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 8 }}>Como quer ser chamado?</label>
                        <input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Ex: Cleusa, Mario, Ana..." style={{ ...S.input, width: '100%', boxSizing: 'border-box' }} />
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>Aparece na saudação: "Olá, {profileName || '...'}!"</p>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setProfileOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={saveProfile} disabled={savingProfile} style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#BA7517', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: savingProfile ? 0.6 : 1 }}>
                          {savingProfile ? 'Salvando...' : 'Salvar'}
                        </button>
                      </div>
                      <button onClick={async () => { await signOut(auth); navigate('/') }} style={{ width: '100%', marginTop: 12, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                        <Icon.Logout /> Sair da conta
                      </button>
                    </motion.div>
                  )}

                  {/* PLAN VIEW */}
                  {profileView === 'plan' && (
                    <motion.div key="plan" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Plano atual</div>
                        <div style={{ padding: '16px', borderRadius: 14, border: '1px solid rgba(186,117,23,0.2)', background: 'rgba(186,117,23,0.05)', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Plano {PLAN_LABELS[plan]}</div>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{plan === 'free' ? 'Grátis para sempre' : 'Renovação automática'}</div>
                            </div>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(186,117,23,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BA7517' }}>
                              <Icon.Crown />
                            </div>
                          </div>
                        </div>
                      </div>
                      {[
                        { name: 'Pro', price: 'R$49,90/mês', promo: '1º mês R$19,90', items: ['Propostas ilimitadas', 'Assistente personalizado', 'Controle de caixa completo'], key: 'pro_mensal_promo' },
                        { name: 'Business', price: 'R$89,90/mês', promo: '1º mês R$49,90', items: ['Tudo do Pro', 'Até 5 usuários', 'Suporte prioritário'], key: 'biz_mensal_promo' },
                      ].map(p => (
                        <div key={p.name} style={{ padding: '16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div>
                              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                              <div style={{ fontSize: 12, color: '#BA7517', marginTop: 2 }}>{p.promo}</div>
                            </div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{p.price}</div>
                          </div>
                          {p.items.map(item => (
                            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <Icon.Check />
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item}</span>
                            </div>
                          ))}
                          <button onClick={() => { setProfileOpen(false); navigate(`/checkout?plan=${p.key}`) }} style={{ width: '100%', marginTop: 12, padding: '9px', borderRadius: 10, background: '#BA7517', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                            Assinar {p.name}
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* PAYMENT VIEW */}
                  {profileView === 'payment' && (
                    <motion.div key="payment" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Método de pagamento e faturamento</div>
                      <div style={{ padding: '16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
                            <Icon.CreditCard />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>Cartão de crédito</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Cobrança recorrente automática</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', marginBottom: 16 }}>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, margin: 0 }}>
                          Para alterar seu método de pagamento ou cancelar a assinatura, entre em contato com o suporte pelo WhatsApp. Respondemos em até 2 horas.
                        </p>
                      </div>
                      <a href="https://wa.me/5592981417222?text=Olá! Preciso alterar meu método de pagamento no Sócio." target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '11px', borderRadius: 12, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', color: '#4ade80', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                        <Icon.Whatsapp /> Falar com suporte
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
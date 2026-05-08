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
  Chat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  File: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Cash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Brush: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  Support: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Camera: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Crown: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="2 15 12 18 22 15 22 20 2 20 2 15"/><polyline points="2 15 5 5 9 10 12 3 15 10 19 5 22 15"/></svg>,
  CreditCard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Logout: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  Restore: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
  SocioMark: ({ size = 28 }) => <svg width={size} height={size} viewBox="0 0 64 64" fill="none"><text x="8" y="48" fontSize="52" fontWeight="800" fill="#1D1D1F" fontFamily="'Syne', sans-serif">S</text><circle cx="46" cy="16" r="6" fill="#0066CC"/></svg>,
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
  doc.setFillColor(245, 245, 247); doc.rect(0, 0, W, 48, 'F')
  doc.setTextColor(29, 29, 31); doc.setFontSize(26); doc.setFont('helvetica', 'bold')
  doc.text('Sócio.', 14, 30)
  doc.setFontSize(9); doc.setTextColor(0, 102, 204)
  doc.text('by Neves Software', 14, 40)
  doc.setTextColor(100, 100, 100)
  doc.text(userData?.businessName || '', W - 14, 40, { align: 'right' })
  doc.setFontSize(9); doc.setTextColor(140, 140, 140)
  doc.text(new Date().toLocaleDateString('pt-BR'), W - 14, 30, { align: 'right' })
  doc.setTextColor(20, 20, 20); doc.setFontSize(18); doc.setFont('helvetica', 'bold')
  doc.text('Proposta Comercial', 14, 68)
  doc.setDrawColor(0, 102, 204); doc.setLineWidth(0.8); doc.line(14, 73, W - 14, 73)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(40, 40, 40)
  const lines = doc.splitTextToSize(content, W - 28)
  let y = 84
  lines.forEach(l => { if (y > 270) { doc.addPage(); y = 20 }; doc.text(l, 14, y); y += 7 })
  doc.setFillColor(245, 245, 247); doc.rect(0, 280, W, 17, 'F')
  doc.setFontSize(8); doc.setTextColor(150, 150, 150)
  doc.text('Gerado por Sócio — usesocio.netlify.app', 14, 290)
  doc.text(new Date().toLocaleString('pt-BR'), W - 14, 290, { align: 'right' })
  return doc
}

// ─── Markdown Renderer ────────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null
  const lines = text.split('\n')
  const elements = []
  let key = 0
  let inTable = false
  let tableRows = []

  const flushTable = () => {
    if (tableRows.length === 0) return
    const [header, , ...body] = tableRows
    const headers = header.split('|').map(s => s.trim()).filter(Boolean)
    elements.push(
      <div key={key++} className="overflow-x-auto my-3">
        <table className="w-full text-sm border-collapse">
          <thead><tr>{headers.map((h,i) => <th key={i} className="text-left px-3 py-2 bg-black/5 font-bold border-b border-black/10">{h}</th>)}</tr></thead>
          <tbody>{body.map((row, ri) => {
            const cells = row.split('|').map(s => s.trim()).filter(Boolean)
            return <tr key={ri} className="border-b border-black/5">{cells.map((c,ci) => <td key={ci} className="px-3 py-2">{c}</td>)}</tr>
          })}</tbody>
        </table>
      </div>
    )
    tableRows = []
    inTable = false
  }

  lines.forEach((line, i) => {
    // Table rows
    if (line.trim().startsWith('|')) {
      inTable = true
      tableRows.push(line)
      return
    }
    if (inTable) flushTable()

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={key++} className="my-3 border-black/10" />)
      return
    }
    // Empty line
    if (!line.trim()) {
      elements.push(<div key={key++} className="h-2" />)
      return
    }

    // Parse inline markdown (bold, italic, code, links)
    const parseInline = (str) => {
      const parts = []
      let remaining = str
      let pk = 0
      while (remaining) {
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
        const codeMatch = remaining.match(/`(.+?)`/)
        const first = [boldMatch, codeMatch]
          .filter(Boolean)
          .sort((a, b) => a.index - b.index)[0]
        if (!first) { parts.push(<span key={pk++}>{remaining}</span>); break }
        if (first.index > 0) parts.push(<span key={pk++}>{remaining.slice(0, first.index)}</span>)
        if (first === boldMatch) parts.push(<strong key={pk++} className="font-bold text-[#1D1D1F]">{first[1]}</strong>)
        else parts.push(<code key={pk++} className="bg-black/8 px-1.5 py-0.5 rounded text-sm font-mono">{first[1]}</code>)
        remaining = remaining.slice(first.index + first[0].length)
      }
      return parts
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="font-bold text-base mt-4 mb-1 text-[#1D1D1F]">{parseInline(line.slice(4))}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="font-bold text-lg mt-4 mb-2 text-[#1D1D1F]">{parseInline(line.slice(3))}</h2>)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} className="font-bold text-xl mt-4 mb-2 text-[#1D1D1F]">{parseInline(line.slice(2))}</h1>)
    }
    // Bullet lists
    else if (/^[\-\*] /.test(line)) {
      elements.push(<div key={key++} className="flex gap-2 my-0.5"><span className="mt-1 text-[#0066CC] flex-shrink-0">•</span><span>{parseInline(line.slice(2))}</span></div>)
    }
    // Numbered lists
    else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\.\s/)[1]
      elements.push(<div key={key++} className="flex gap-2 my-0.5"><span className="text-[#0066CC] font-bold flex-shrink-0 min-w-[1.2rem]">{num}.</span><span>{parseInline(line.replace(/^\d+\.\s/, ''))}</span></div>)
    }
    // Normal paragraph
    else {
      elements.push(<p key={key++} className="my-0.5 leading-relaxed">{parseInline(line)}</p>)
    }
  })

  if (inTable) flushTable()
  return elements
}

// ─── Constants ─────────────────────────────────────────────────────────────
const PLAN_LIMITS = { free: 10, pro: Infinity, business: Infinity }
const PLAN_LABELS = { free: 'Grátis', pro: 'Pro', business: 'Business' }
const PLAN_FEATURES = { proposals: ['pro', 'business'], cashflow: ['pro', 'business'] }
const TABS = [
  { id: 'chat', label: 'Assistente', Icon: Icon.Chat },
  { id: 'proposals', label: 'Propostas', Icon: Icon.File, proOnly: true },
  { id: 'cashflow', label: 'Caixa', Icon: Icon.Cash, proOnly: true },
  { id: 'services', label: 'Serviços', Icon: Icon.Brush },
  { id: 'trash', label: 'Lixeira', Icon: Icon.Trash },
  { id: 'support', label: 'Suporte', Icon: Icon.Support },
]

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
  const [profileView, setProfileView] = useState('main')
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
    const q = query(collection(db, 'users', user.uid, 'conversations'), where('status', '!=', 'trash'), orderBy('status'), orderBy('updatedAt', 'desc'))
    return onSnapshot(q, snap => {
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setConversations(convs)
      if (!activeConvId && convs.length > 0) setActiveConvId(convs[0].id)
    })
  }, [])

  const [trashedItems, setTrashedItems] = useState({ conversations: [], proposals: [] })
  useEffect(() => {
    if (!user) return
    const q1 = query(collection(db, 'users', user.uid, 'conversations'), where('status', '==', 'trash'))
    const q2 = query(collection(db, 'users', user.uid, 'proposals'), where('status', '==', 'trash'))
    const un1 = onSnapshot(q1, snap => setTrashedItems(prev => ({ ...prev, conversations: snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'conv' })) })))
    const un2 = onSnapshot(q2, snap => setTrashedItems(prev => ({ ...prev, proposals: snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'prop' })) })))
    return () => { un1(); un2() }
  }, [])

  useEffect(() => {
    if (!user || !activeConvId) return
    const q = query(collection(db, 'users', user.uid, 'conversations', activeConvId, 'messages'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [activeConvId])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'proposals'), where('status', '!=', 'trash'), orderBy('status'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setProposals(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const newConv = async () => {
    playSound('click')
    const ref = await addDoc(collection(db, 'users', user.uid, 'conversations'), { title: 'Nova conversa', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), status: 'active' })
    setActiveConvId(ref.id); setMessages([]); setActiveTab('chat'); setSidebarOpen(false)
  }

  const moveToTrash = async (id, type) => {
    playSound('click')
    const path = type === 'conv' ? 'conversations' : 'proposals'
    await updateDoc(doc(db, 'users', user.uid, path, id), { status: 'trash', deletedAt: serverTimestamp() })
    if (type === 'conv' && id === activeConvId) setActiveConvId(null)
  }

  const restoreFromTrash = async (id, type) => {
    playSound('success')
    const path = type === 'conv' ? 'conversations' : 'proposals'
    await updateDoc(doc(db, 'users', user.uid, path, id), { status: 'active', deletedAt: null })
  }

  const permanentDelete = async (id, type) => {
    playSound('click')
    const { deleteDoc } = await import('firebase/firestore')
    const path = type === 'conv' ? 'conversations' : 'proposals'
    await deleteDoc(doc(db, 'users', user.uid, path, id))
  }

  const saveProposalFromChat = async (msg) => {
    playSound('success')
    await addDoc(collection(db, 'users', user.uid, 'proposals'), { 
      title: 'Proposta ' + new Date().toLocaleDateString('pt-BR'), 
      content: msg.content, 
      createdAt: serverTimestamp(), 
      businessName: userData?.businessName,
      status: 'active'
    })
    setActiveTab('proposals')
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
    if (file.size > 800000) return alert('A imagem é muito grande. Escolha uma foto menor que 800KB.')
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const url = ev.target.result; setProfilePhoto(url)
      try {
        await updateDoc(doc(db, 'users', user.uid), { profilePhotoUrl: url })
        alert('Foto atualizada com sucesso!')
      } catch (err) {
        console.error(err)
        alert('Erro ao salvar foto no banco de dados.')
      }
    }
    reader.readAsDataURL(file)
  }

  const tab = (id) => { playSound('click'); setActiveTab(id) }

  const QUICK = ['Quanto devo cobrar pelo meu serviço?', 'Cria uma proposta profissional', 'Ideia de promoção para esta semana']

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F5F5F7] font-dm overflow-hidden selection:bg-apple-blue/20">
      
      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
      <header className="h-[64px] flex-shrink-0 flex items-center justify-between px-4 lg:px-6 bg-white/70 backdrop-blur-3xl border-b border-black/5 z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSidebarOpen(s => !s); playSound('click') }} className="p-2 lg:hidden rounded-full hover:bg-black/5 text-black/60 transition-colors">
            <Icon.Menu />
          </button>
          <div className="flex items-center gap-2">
            <Icon.SocioMark size={24} />
            <span className="font-syne font-bold text-lg tracking-tight text-black">sócio<span className="text-apple-blue">.</span></span>
          </div>
          <div className="hidden md:block w-px h-6 bg-black/10 mx-2" />
          <span className="hidden md:block text-sm font-medium text-black/40">{userData?.businessName}</span>
        </div>

        <div className="flex items-center gap-3">
          {plan === 'free' && (
            <button onClick={() => navigate('/planos')} className="text-xs font-semibold bg-apple-blue/10 text-apple-blue px-4 py-1.5 rounded-full hover:bg-apple-blue/20 transition-colors">
              Fazer upgrade
            </button>
          )}
          {plan !== 'free' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-apple-blue/10 border border-apple-blue/20">
              <span className="text-apple-blue"><Icon.Crown /></span>
              <span className="text-xs font-bold text-apple-blue">{PLAN_LABELS[plan]}</span>
            </div>
          )}
          <button onClick={() => { setProfileOpen(true); setProfileView('main'); playSound('click') }} className="w-10 h-10 rounded-full bg-white border border-black/10 overflow-hidden hover:shadow-md transition-shadow flex items-center justify-center">
            {profilePhoto 
              ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" /> 
              : <span className="font-bold text-apple-blue text-sm">{displayName[0]?.toUpperCase()}</span>
            }
          </button>
        </div>
      </header>

      {/* ── MAIN LAYOUT ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <div className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-black/5 flex flex-col transform transition-transform duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 lg:hidden flex items-center justify-between border-b border-black/5">
             <div className="font-syne font-bold text-lg">Menu</div>
             <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-full hover:bg-black/5"><Icon.Plus className="rotate-45" /></button>
          </div>
          
          <div className="p-4">
            <button onClick={newConv} className="w-full flex items-center gap-2 bg-apple-blue text-white px-4 py-3 rounded-2xl font-medium text-sm hover:shadow-lg hover:shadow-apple-blue/20 transition-all active:scale-95">
              <Icon.Plus /> Nova conversa
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
            <div className="px-3 py-2 text-xs font-bold text-black/30 uppercase tracking-wider">Módulos</div>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { tab(t.id); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${activeTab === t.id ? 'text-apple-blue' : 'text-black/60 hover:bg-black/5 hover:text-black'}`}>
                {activeTab === t.id && <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-apple-blue/10 rounded-xl" />}
                <span className="relative z-10"><t.Icon /></span>
                <span className="relative z-10">{t.label}</span>
                {t.proOnly && plan === 'free' && <span className="relative z-10 ml-auto text-[9px] font-bold bg-apple-blue/10 text-apple-blue px-1.5 py-0.5 rounded-full">PRO</span>}
              </button>
            ))}

            <div className="px-3 pt-6 pb-2 text-xs font-bold text-black/30 uppercase tracking-wider">Histórico</div>
            {conversations.length === 0 && <div className="px-3 text-sm text-black/30">Nenhuma conversa</div>}
            {conversations.map(c => (
              <div key={c.id} className="group relative">
                <button onClick={() => { setActiveConvId(c.id); setSidebarOpen(false); setActiveTab('chat'); playSound('click') }} className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all truncate pr-10 ${activeConvId === c.id && activeTab === 'chat' ? 'bg-black/5 text-black' : 'text-black/50 hover:bg-black/5 hover:text-black'}`}>
                  {c.title || 'Nova conversa'}
                </button>
                <button onClick={() => moveToTrash(c.id, 'conv')} className="absolute right-2 top-2 p-1.5 text-black/10 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                  <Icon.Trash />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-black/5">
            <button onClick={async () => { await signOut(auth); navigate('/') }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <Icon.Logout /> Sair da conta
            </button>
          </div>
        </div>

        {/* ── CONTENT AREA ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F5F5F7] relative">
          
          {/* Limit Banner */}
          {isLimited && (
            <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center justify-between shrink-0">
              <span className="text-sm text-red-600 font-medium">Créditos gratuitos esgotados.</span>
              <button onClick={() => navigate('/planos')} className="text-xs font-bold bg-red-600 text-white px-4 py-1.5 rounded-full hover:bg-red-700">Ver planos</button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* CHAT */}
            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden relative max-w-4xl mx-auto w-full">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
                  {messages.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-10 md:pt-20">
                      <div className="w-20 h-20 bg-white shadow-xl shadow-black/5 border border-black/5 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                        <Icon.SocioMark size={40} />
                      </div>
                      <h2 className="font-syne font-bold text-3xl mb-2 text-black tracking-tight">Olá, {displayName}!</h2>
                      <p className="text-black/60 mb-10 text-lg">Como posso ajudar seu negócio hoje?</p>
                      <div className="grid gap-3 max-w-lg mx-auto">
                        {QUICK.map(q => (
                          <button key={q} onClick={() => sendMessage(q)} disabled={isLimited} className="bg-white hover:bg-apple-light border border-black/5 text-left text-black/70 hover:text-apple-blue font-medium text-sm px-6 py-4 rounded-2xl shadow-sm transition-all active:scale-95">
                            {q}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {messages.map(msg => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center overflow-hidden shadow-sm ${msg.role === 'assistant' ? 'bg-white border border-black/5 text-apple-blue' : 'bg-black/5 text-black/50'}`}>
                        {msg.role === 'assistant' ? <Icon.SocioMark size={16} /> : profilePhoto ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" /> : <Icon.User />}
                      </div>
                      <div className="max-w-[85%] md:max-w-[75%]">
                        <div className={`text-[11px] font-medium text-black/40 mb-1 px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>{msg.role === 'assistant' ? 'Sócio' : 'Você'}</div>
                        <div className={`p-4 text-[14px] leading-relaxed shadow-sm ${msg.role === 'assistant' ? 'bg-white border border-black/5 text-black rounded-[20px_20px_20px_4px]' : 'bg-apple-blue text-white rounded-[20px_20px_4px_20px]'}`}>
                          {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                        </div>
                        {msg.role === 'assistant' && msg.content.includes('PROPOSTA COMERCIAL') && (
                          <button onClick={() => saveProposalFromChat(msg)} className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-apple-blue bg-white px-3 py-1.5 rounded-full border border-apple-blue/10 shadow-sm hover:bg-apple-blue hover:text-white transition-all">
                            <Icon.File /> Salvar como proposta oficial
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-end">
                      <div className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-sm text-apple-blue"><Icon.SocioMark size={16} /></div>
                      <div className="bg-white border border-black/5 p-4 rounded-[20px_20px_20px_4px] flex gap-1.5 shadow-sm">
                        {[0, 0.15, 0.3].map((d, i) => <motion.div key={i} className="w-2 h-2 rounded-full bg-apple-blue/50" animate={{ y: [-3, 0, -3] }} transition={{ duration: 0.8, repeat: Infinity, delay: d }} />)}
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEnd} className="h-4" />
                </div>
                <div className="p-4 md:p-6 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7] to-transparent sticky bottom-0">
                  <div className="relative max-w-3xl mx-auto">
                    {plan === 'free' && msgCount < limit && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-black/40 bg-white/50 px-3 py-1 rounded-full backdrop-blur-md border border-black/5">{limit - msgCount} mensagens grátis</div>}
                    <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder={isLimited ? 'Faça upgrade para continuar...' : 'Pergunte ou peça uma proposta...'} disabled={loading || isLimited} className={`w-full bg-white border border-black/10 rounded-full pl-6 pr-14 py-4 text-[15px] text-black placeholder-black/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] outline-none focus:border-apple-blue/50 focus:shadow-[0_0_0_4px_rgba(0,102,204,0.1)] transition-all ${isLimited ? 'opacity-50' : ''}`} />
                    <button onClick={() => sendMessage()} disabled={!input.trim() || loading || isLimited} className={`absolute right-2 top-2 bottom-2 aspect-square rounded-full flex items-center justify-center transition-all ${(!input.trim() || loading || isLimited) ? 'bg-black/5 text-black/30 cursor-not-allowed' : 'bg-apple-blue text-white shadow-md hover:scale-105 active:scale-95'}`}>
                      <Icon.Send />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PROPOSALS */}
            {activeTab === 'proposals' && (
              <motion.div key="proposals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
                {!PLAN_FEATURES.proposals.includes(plan) ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <div className="w-20 h-20 bg-apple-light rounded-3xl flex items-center justify-center text-apple-blue mb-6 text-4xl">🔒</div>
                    <h2 className="font-syne font-bold text-2xl mb-3">Recurso exclusivo Pro</h2>
                    <p className="text-black/50 mb-8 max-w-sm">Geração e armazenamento de propostas profissionais está disponível nos planos Pro e Business.</p>
                    <button onClick={() => navigate('/planos')} className="btn-primary px-8 py-3 shadow-lg shadow-apple-blue/20">Ver planos →</button>
                  </div>
                ) : (
                  <>
                    <div className="mb-10">
                      <h1 className="font-syne font-bold text-3xl mb-2 tracking-tight">Suas Propostas</h1>
                      <p className="text-black/50 text-sm">Documentos profissionais gerados pelo seu assistente. Prontos para enviar ao cliente.</p>
                    </div>
                    {proposals.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm">
                        <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-black/20"><Icon.File /></div>
                        <h3 className="font-bold text-lg mb-1">Nenhuma proposta</h3>
                        <p className="text-sm text-black/40 mb-6">Peça ao assistente para gerar uma proposta.</p>
                        <button onClick={() => tab('chat')} className="text-sm font-semibold text-apple-blue hover:text-apple-dark">Ir para o assistente →</button>
                      </div>
                    ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {proposals.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="bg-white border border-black/5 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between relative min-h-[160px]">
                          <button onClick={() => moveToTrash(p.id, 'prop')} className="absolute top-4 right-4 p-2 text-black/10 hover:text-red-500 hover:bg-red-50 transition-all rounded-full opacity-0 group-hover:opacity-100">
                            <Icon.Trash />
                          </button>
                          <div className="flex gap-4 items-start mb-4">
                            <div className="w-12 h-12 bg-apple-light text-apple-blue rounded-xl flex items-center justify-center shrink-0"><Icon.File /></div>
                            <div className="pr-6">
                              <h4 className="font-semibold text-sm line-clamp-2 leading-snug">{p.title}</h4>
                              <p className="text-xs text-black/40 mt-1">{p.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || 'Hoje'}</p>
                            </div>
                          </div>
                          <button onClick={() => downloadPDF(p)} className="w-full flex items-center justify-center gap-2 bg-black/5 hover:bg-apple-blue hover:text-white text-black/70 text-sm font-medium py-2.5 rounded-xl transition-colors">
                            <Icon.Download /> Baixar PDF
                          </button>
                        </motion.div>
                      ))}
                    </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* CASHFLOW */}
            {activeTab === 'cashflow' && (
              <motion.div key="cashflow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden max-w-6xl mx-auto w-full">
                {!PLAN_FEATURES.cashflow.includes(plan) ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20 px-6">
                    <div className="w-20 h-20 bg-apple-light rounded-3xl flex items-center justify-center mb-6 text-4xl">🔒</div>
                    <h2 className="font-syne font-bold text-2xl mb-3">Recurso exclusivo Pro</h2>
                    <p className="text-black/50 mb-8 max-w-sm">O controle de caixa completo está disponível nos planos Pro e Business.</p>
                    <button onClick={() => navigate('/planos')} className="btn-primary px-8 py-3 shadow-lg shadow-apple-blue/20">Ver planos →</button>
                  </div>
                ) : (
                  <Cashflow />
                )}
              </motion.div>
            )}

            {/* TRASH */}
            {activeTab === 'trash' && (
              <motion.div key="trash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
                <div className="mb-10">
                  <h1 className="font-syne font-bold text-3xl mb-2 tracking-tight">Lixeira</h1>
                  <p className="text-black/50 text-sm">Itens aqui serão removidos permanentemente apenas quando você excluir de vez.</p>
                </div>

                {trashedItems.conversations.length === 0 && trashedItems.proposals.length === 0 ? (
                  <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-black/10">
                    <p className="text-black/30 font-medium">Sua lixeira está vazia.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {trashedItems.conversations.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-black/30 uppercase mb-4 tracking-widest">Conversas</h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {trashedItems.conversations.map(c => (
                            <div key={c.id} className="bg-white border border-black/5 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4">
                              <span className="text-sm font-medium truncate">{c.title}</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => restoreFromTrash(c.id, 'conv')} className="p-2 text-apple-blue hover:bg-apple-blue/10 rounded-xl transition-colors" title="Restaurar"><Icon.Restore /></button>
                                <button onClick={() => permanentDelete(c.id, 'conv')} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Excluir de vez"><Icon.Trash /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {trashedItems.proposals.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-black/30 uppercase mb-4 tracking-widest">Propostas</h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {trashedItems.proposals.map(p => (
                            <div key={p.id} className="bg-white border border-black/5 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4">
                              <span className="text-sm font-medium truncate">{p.title}</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => restoreFromTrash(p.id, 'prop')} className="p-2 text-apple-blue hover:bg-apple-blue/10 rounded-xl transition-colors" title="Restaurar"><Icon.Restore /></button>
                                <button onClick={() => permanentDelete(p.id, 'prop')} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Excluir de vez"><Icon.Trash /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* SERVICES */}
            {activeTab === 'services' && (
              <motion.div key="services" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
                <div className="mb-10">
                  <h1 className="font-syne font-bold text-3xl mb-2 tracking-tight">Serviços Criativos</h1>
                  <p className="text-black/50 text-sm">Artes, vídeos e marketing feitos por humanos. Qualidade profissional.</p>
                </div>
                <div className="space-y-10">
                  {[
                    { cat: 'Artes digitais', items: [{ name: 'Post feed Instagram', price: 35, desc: 'Arte profissional para o feed' }, { name: 'Kit 5 posts', price: 120, desc: 'Economia de R$55' }] },
                    { cat: 'Edição de vídeo', items: [{ name: 'Edição de Reels', price: 89, desc: 'Cortes, trilha e legendas dinâmicas' }] },
                    { cat: 'Gravação (Apenas Manaus)', badge: true, items: [{ name: 'Gravação + edição de 1 Reels', price: 199, desc: 'Produção completa no seu local' }] },
                  ].map(s => (
                    <div key={s.cat}>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="font-syne font-bold text-lg">{s.cat}</h2>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {s.items.map(item => (
                          <div key={item.name} className="bg-white border border-black/5 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                              <h3 className="font-semibold text-[15px]">{item.name}</h3>
                              <p className="text-[13px] text-black/50 mt-1">{item.desc}</p>
                            </div>
                            <div className="mt-6 flex items-end justify-between">
                              <span className="font-bold text-lg text-apple-blue">R${item.price.toFixed(2).replace('.', ',')}</span>
                              <a href={`https://wa.me/5592981417222?text=Olá! Interesse no serviço: *${item.name}* (R$${item.price.toFixed(2).replace('.', ',')})`} target="_blank" rel="noreferrer" className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                                <Icon.Whatsapp /> Contratar
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SUPPORT */}
            {activeTab === 'support' && (
              <motion.div key="support" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto p-6 md:p-10 max-w-2xl mx-auto w-full">
                <div className="mb-10 text-center">
                  <div className="w-20 h-20 bg-white shadow-xl shadow-black/5 border border-black/5 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                    <Icon.SocioMark size={40} />
                  </div>
                  <h1 className="font-syne font-bold text-3xl mb-2 tracking-tight">Precisa de ajuda?</h1>
                  <p className="text-black/60 text-sm">Nossa equipe de humanos está pronta para atender você via WhatsApp.</p>
                </div>
                
                <a href="https://wa.me/5592981417222" target="_blank" rel="noreferrer" className="block bg-white border border-black/5 rounded-[32px] p-6 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#25D366]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 bg-[#25D366]/10 text-[#25D366] rounded-2xl flex items-center justify-center shrink-0">
                      <Icon.Whatsapp />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Chamar no WhatsApp</h3>
                      <p className="text-sm text-black/50">Respondemos em até 2 horas úteis.</p>
                      <p className="text-xs text-black/30 mt-2 font-medium">Seg a Sex — 09h às 18h (Manaus)</p>
                    </div>
                  </div>
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── PROFILE MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {profileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProfileOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-md" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white/90 backdrop-blur-3xl border border-white rounded-[32px] w-full max-w-md shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between bg-white">
                <h2 className="font-syne font-bold text-lg">Conta</h2>
                <div className="flex bg-black/5 rounded-full p-1">
                  {['main', 'plan', 'payment'].map(v => (
                    <button key={v} onClick={() => setProfileView(v)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${profileView === v ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black'}`}>
                      {v === 'main' ? 'Perfil' : v === 'plan' ? 'Plano' : 'Pgto'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {profileView === 'main' && (
                    <motion.div key="main" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="flex items-center gap-5 mb-8">
                        <div className="relative">
                          <div className="w-20 h-20 bg-apple-light text-apple-blue rounded-full border-4 border-white shadow-sm flex items-center justify-center overflow-hidden">
                            {profilePhoto ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-3xl">{displayName[0]?.toUpperCase()}</span>}
                          </div>
                          <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 bg-apple-blue text-white rounded-full flex items-center justify-center shadow-md border-2 border-white hover:scale-105 active:scale-95 transition-transform"><Icon.Camera /></button>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{userData?.businessName}</h3>
                          <p className="text-sm text-black/50">{user?.email}</p>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-apple-blue/10 text-apple-blue text-[10px] font-bold uppercase mt-2"><Icon.Crown /> Plano {PLAN_LABELS[plan]}</span>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-xs font-bold text-black/40 uppercase mb-2">Como quer ser chamado?</label>
                        <input value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full bg-black/5 border border-transparent focus:border-apple-blue/30 focus:bg-white rounded-2xl px-4 py-3 text-sm outline-none transition-all" placeholder="Ex: Ana, João..." />
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => setProfileOpen(false)} className="flex-1 py-3 bg-black/5 hover:bg-black/10 rounded-2xl text-sm font-semibold transition-colors">Cancelar</button>
                        <button onClick={saveProfile} disabled={savingProfile} className="flex-1 py-3 bg-apple-blue hover:bg-apple-dark text-white rounded-2xl text-sm font-semibold shadow-md transition-colors disabled:opacity-50">{savingProfile ? 'Salvando...' : 'Salvar alterações'}</button>
                      </div>
                    </motion.div>
                  )}

                  {profileView === 'plan' && (
                    <motion.div key="plan" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-apple-light border border-apple-blue/20 rounded-3xl p-5 mb-6 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-apple-blue uppercase mb-1">Seu plano atual</p>
                          <h3 className="font-bold text-xl text-apple-dark">{PLAN_LABELS[plan]}</h3>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-apple-blue shadow-sm"><Icon.Crown /></div>
                      </div>
                      <button onClick={() => { setProfileOpen(false); navigate('/planos') }} className="w-full py-4 bg-black text-white rounded-2xl text-sm font-semibold shadow-lg hover:bg-black/80 transition-colors">
                        Fazer upgrade de plano
                      </button>
                    </motion.div>
                  )}

                  {profileView === 'payment' && (
                    <motion.div key="payment" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="text-center">
                      <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4 text-black/40"><Icon.CreditCard /></div>
                      <h3 className="font-bold text-lg mb-2">Faturamento Automático</h3>
                      <p className="text-sm text-black/50 mb-6">Assinaturas são processadas de forma segura. Para alterar o cartão ou cancelar, contate o suporte.</p>
                      <a href="https://wa.me/5592981417222?text=Olá! Preciso de ajuda com meu faturamento no Sócio." target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] font-bold px-6 py-3 rounded-full hover:bg-[#25D366] hover:text-white transition-colors">
                        <Icon.Whatsapp /> Falar com suporte
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
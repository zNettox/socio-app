import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, deleteDoc, doc, updateDoc
} from 'firebase/firestore'
import { auth, db } from '../firebase'

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtNum = (n) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })

const CATEGORIES = {
  entrada: ['Serviço prestado', 'Venda de produto', 'Recebimento de proposta', 'PIX recebido', 'Outro'],
  saida: ['Aluguel', 'Material', 'Energia', 'Internet', 'Marketing', 'Imposto', 'Salário', 'Equipamento', 'Outro'],
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 },
}

// ── Mini Bar Chart ─────────────────────────────────────────────────────────
function BarChart({ data, height = 80 }) {
  const max = Math.max(...data.map(d => Math.max(d.entrada, d.saida)), 1)
  return (
    <div className="flex items-end gap-2 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex gap-0.5 items-end" style={{ height: height - 20 }}>
            <div
              className="flex-1 rounded-t-sm bg-blue-500/80 transition-all duration-500"
              style={{ height: `${(d.entrada / max) * 100}%`, minHeight: d.entrada > 0 ? 2 : 0 }}
            />
            <div
              className="flex-1 rounded-t-sm bg-red-400/80 transition-all duration-500"
              style={{ height: `${(d.saida / max) * 100}%`, minHeight: d.saida > 0 ? 2 : 0 }}
            />
          </div>
          <span className="text-[10px] text-black/40 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Donut Chart ────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 100 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="rounded-full border-4 border-black/5" style={{ width: size * 0.8, height: size * 0.8 }} />
    </div>
  )
  let offset = 0
  const r = 40
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {segments.map((seg, i) => {
        const pct = seg.value / total
        const dash = pct * circ
        const gap = circ - dash
        const el = (
          <circle key={i} cx="50" cy="50" r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ}
            transform="rotate(-90 50 50)"
            opacity="0.9"
          />
        )
        offset += pct
        return el
      })}
      {/* Central hole matching surface background */}
      <circle cx="50" cy="50" r="28" fill="#FFFFFF" />
    </svg>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Cashflow() {
  const [transactions, setTransactions] = useState([])
  const [view, setView] = useState('dashboard') // dashboard | add | list | notes
  const [form, setForm] = useState({ type: 'entrada', description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], note: '' })
  const [filter, setFilter] = useState('mes') // mes | semana | ano | tudo
  const [notes, setNotes] = useState([])
  const [noteText, setNoteText] = useState('')
  const [editingTx, setEditingTx] = useState(null)
  const [loading, setLoading] = useState(false)
  const user = auth.currentUser

  // Load transactions
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'))
    return onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  // Load notes
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'cashNotes'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  // ── Filter transactions ─────────────────────────────────────────────────
  const filtered = transactions.filter(tx => {
    const d = new Date(tx.date)
    const now = new Date()
    if (filter === 'semana') {
      const week = new Date(now); week.setDate(now.getDate() - 7)
      return d >= week
    }
    if (filter === 'mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    if (filter === 'ano') return d.getFullYear() === now.getFullYear()
    return true
  })

  const totalEntrada = filtered.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0)
  const totalSaida = filtered.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0)
  const saldo = totalEntrada - totalSaida

  // ── Chart data — last 6 months ──────────────────────────────────────────
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    const m = d.getMonth(); const y = d.getFullYear()
    const txs = transactions.filter(t => {
      const td = new Date(t.date)
      return td.getMonth() === m && td.getFullYear() === y
    })
    return {
      label: MONTHS[m],
      entrada: txs.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0),
      saida: txs.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0),
    }
  })

  // ── Category breakdown ──────────────────────────────────────────────────
  const catColors = ['#0066CC', '#34C759', '#FF3B30', '#AF52DE', '#FF9500', '#5AC8FA', '#FF2D55']
  const catData = filtered.filter(t => t.type === 'saida').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
    return acc
  }, {})
  const catSegments = Object.entries(catData).map(([name, value], i) => ({ name, value, color: catColors[i % catColors.length] }))

  // ── Save transaction ────────────────────────────────────────────────────
  const saveTransaction = async () => {
    if (!form.description || !form.amount || !form.category) return
    setLoading(true)
    try {
      if (editingTx) {
        await updateDoc(doc(db, 'users', user.uid, 'transactions', editingTx), {
          ...form, amount: Number(form.amount),
        })
        setEditingTx(null)
      } else {
        await addDoc(collection(db, 'users', user.uid, 'transactions'), {
          ...form,
          amount: Number(form.amount),
          createdAt: serverTimestamp(),
        })
      }
      setForm({ type: 'entrada', description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], note: '' })
      setView('dashboard')
    } catch {}
    setLoading(false)
  }

  const deleteTx = async (id) => {
    if (!window.confirm('Excluir esta transação?')) return
    await deleteDoc(doc(db, 'users', user.uid, 'transactions', id))
  }

  const editTx = (tx) => {
    setForm({ type: tx.type, description: tx.description, amount: String(tx.amount), category: tx.category, date: tx.date, note: tx.note || '' })
    setEditingTx(tx.id)
    setView('add')
  }

  const saveNote = async () => {
    if (!noteText.trim()) return
    await addDoc(collection(db, 'users', user.uid, 'cashNotes'), {
      text: noteText.trim(),
      createdAt: serverTimestamp(),
    })
    setNoteText('')
  }

  const deleteNote = async (id) => {
    await deleteDoc(doc(db, 'users', user.uid, 'cashNotes', id))
  }

  // ── Sub-views ───────────────────────────────────────────────────────────
  const renderAdd = () => (
    <motion.div key="add" {...pageTransition} className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => { setView('dashboard'); setEditingTx(null); setForm({ type: 'entrada', description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], note: '' }) }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-black/5 shadow-sm text-black/50 hover:text-black transition-colors">
          ←
        </button>
        <h2 className="font-syne font-bold text-2xl tracking-tight">{editingTx ? 'Editar' : 'Nova'} transação</h2>
      </div>

      {/* Type toggle */}
      <div className="flex bg-black/5 rounded-full p-1 mb-6">
        {['entrada', 'saida'].map(t => (
          <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: '' }))}
            className={`flex-1 py-3 rounded-full text-sm font-bold transition-all shadow-sm ${
              form.type === t
                ? t === 'entrada' ? 'bg-white text-blue-600' : 'bg-white text-red-500'
                : 'text-black/40 hover:text-black'
            }`}>
            {t === 'entrada' ? '↑ Entrada' : '↓ Saída'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">Descrição</label>
          <input className="input-field" placeholder="Ex: Escova progressiva — Cleusa"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">Valor (R$)</label>
            <input className="input-field" type="number" placeholder="0,00" min="0" step="0.01"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">Data</label>
            <input className="input-field" type="date"
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">Categoria</label>
          <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            <option value="">Selecionar...</option>
            {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2 block">Observação (opcional)</label>
          <textarea className="input-field resize-none" rows={2} placeholder="Algum detalhe extra..."
            value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        </div>

        <button onClick={saveTransaction} disabled={loading || !form.description || !form.amount || !form.category}
          className="btn-primary w-full mt-6 py-4 text-[15px] shadow-xl shadow-apple-blue/20 disabled:opacity-50 disabled:shadow-none">
          {loading ? 'Salvando...' : editingTx ? 'Salvar alterações' : `Registrar ${form.type === 'entrada' ? 'entrada' : 'saída'}`}
        </button>
      </div>
    </motion.div>
  )

  const renderList = () => (
    <motion.div key="list" {...pageTransition} className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setView('dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-black/5 shadow-sm text-black/50 hover:text-black transition-colors">←</button>
        <h2 className="font-syne font-bold text-2xl tracking-tight">Todas as transações</h2>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm text-black/40">Nenhuma transação no período selecionado.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tx => (
            <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-black/5 shadow-sm hover:shadow-md transition-all group">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                tx.type === 'entrada' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'
              }`}>
                <span className="text-lg font-bold">
                  {tx.type === 'entrada' ? '↑' : '↓'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-black truncate">{tx.description}</div>
                <div className="text-xs text-black/40 mt-1 font-medium">{tx.category} · {new Date(tx.date).toLocaleDateString('pt-BR')}</div>
                {tx.note && <div className="text-xs text-black/30 mt-1 italic truncate">{tx.note}</div>}
              </div>
              <div className={`font-syne font-bold text-lg flex-shrink-0 ${
                tx.type === 'entrada' ? 'text-blue-600' : 'text-red-500'
              }`}>
                {tx.type === 'saida' ? '-' : '+'}{fmt(tx.amount)}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => editTx(tx)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors">
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M2 10L9.5 2.5l2 2L6 12H2v-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                </button>
                <button onClick={() => deleteTx(tx.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-black/40 hover:text-red-500 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2h4v2M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.3A1 1 0 004.7 12h4.6a1 1 0 001-.7L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )

  const renderNotes = () => (
    <motion.div key="notes" {...pageTransition} className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setView('dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-black/5 shadow-sm text-black/50 hover:text-black transition-colors">←</button>
        <h2 className="font-syne font-bold text-2xl tracking-tight">Anotações</h2>
      </div>
      <div className="flex gap-3 mb-8">
        <textarea className="input-field flex-1 resize-none" rows={2} placeholder="O que você precisa lembrar?"
          value={noteText} onChange={e => setNoteText(e.target.value)} />
        <button onClick={saveNote} disabled={!noteText.trim()}
          className="btn-primary px-6 rounded-2xl disabled:opacity-50 self-stretch shadow-md">
          Salvar
        </button>
      </div>
      <div className="space-y-3">
        {notes.map(n => (
          <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-start gap-4 p-5 rounded-3xl bg-white border border-black/5 shadow-sm group">
            <div className="w-3 h-3 rounded-full bg-apple-blue mt-1.5 flex-shrink-0 shadow-[0_0_10px_rgba(0,102,204,0.4)]" />
            <p className="flex-1 text-[15px] text-black/80 leading-relaxed font-medium">{n.text}</p>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[11px] font-bold text-black/30">{n.createdAt?.toDate?.()?.toLocaleDateString('pt-BR')}</span>
              <button onClick={() => deleteNote(n.id)}
                className="opacity-0 group-hover:opacity-100 text-black/30 hover:text-red-500 transition-all">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          </motion.div>
        ))}
        {notes.length === 0 && <div className="text-center bg-white border border-black/5 rounded-3xl text-black/40 text-[15px] py-12">Nenhuma anotação ainda.</div>}
      </div>
    </motion.div>
  )

  const renderDashboard = () => (
    <motion.div key="dashboard" {...pageTransition} className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-syne font-bold text-3xl mb-1 tracking-tight">Fluxo de Caixa</h1>
          <p className="text-sm text-black/50">Acompanhe suas finanças de forma simples.</p>
        </div>
        <div className="flex bg-white rounded-full p-1 shadow-sm border border-black/5">
          {[['semana', '7d'], ['mes', 'Mês'], ['ano', 'Ano'], ['tudo', 'Tudo']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === val ? 'bg-black text-white shadow-md' : 'text-black/50 hover:text-black'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Entradas', value: totalEntrada, color: 'text-blue-600', icon: '↑' },
          { label: 'Total Saídas', value: totalSaida, color: 'text-red-500', icon: '↓' },
          { label: 'Saldo Líquido', value: saldo, color: saldo >= 0 ? 'text-black' : 'text-red-500', icon: saldo >= 0 ? '+' : '-' },
        ].map(card => (
          <div key={card.label} className="bg-white border border-black/5 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-black/5 ${card.color}`}>{card.icon}</div>
              <div className="text-xs font-bold text-black/40 uppercase tracking-wider">{card.label}</div>
            </div>
            <div className={`font-syne font-extrabold text-3xl tracking-tight truncate ${card.color}`}>
              {fmt(card.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Bar chart */}
        <div className="bg-white border border-black/5 p-8 rounded-[32px] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-syne font-bold text-lg">Últimos 6 meses</h3>
            <div className="flex items-center gap-4 text-xs font-bold text-black/40">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" />Entradas</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400" />Saídas</span>
            </div>
          </div>
          <BarChart data={chartData} height={140} />
        </div>

        {/* Category donut */}
        {catSegments.length > 0 ? (
          <div className="bg-white border border-black/5 p-8 rounded-[32px] shadow-sm flex flex-col">
            <h3 className="font-syne font-bold text-lg mb-6">Saídas por categoria</h3>
            <div className="flex-1 flex items-center gap-8">
              <DonutChart segments={catSegments} size={140} />
              <div className="flex-1 space-y-3">
                {catSegments.map((seg, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: seg.color }} />
                      <span className="text-sm font-medium text-black/70">{seg.name}</span>
                    </div>
                    <span className="text-sm font-bold text-black">{fmt(seg.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-black/5 p-8 rounded-[32px] shadow-sm flex items-center justify-center">
            <span className="text-black/30 font-medium">Sem dados de saída para o gráfico.</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Recent transactions */}
        <div className="md:col-span-2 bg-white border border-black/5 p-8 rounded-[32px] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-syne font-bold text-lg">Últimas transações</h3>
            <button onClick={() => setView('list')} className="text-sm font-bold text-apple-blue hover:text-apple-dark transition-colors">
              Ver todas →
            </button>
          </div>
          {filtered.slice(0, 4).length === 0 ? (
            <div className="text-center bg-black/5 rounded-2xl py-8 text-sm font-medium text-black/40">Nenhuma transação registrada.</div>
          ) : (
            <div className="space-y-4">
              {filtered.slice(0, 4).map(tx => (
                <div key={tx.id} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'entrada' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'
                  }`}>
                    <span className="text-sm font-bold">{tx.type === 'entrada' ? '↑' : '↓'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-black truncate">{tx.description}</div>
                    <div className="text-[11px] font-medium text-black/40 uppercase tracking-wider mt-1">{tx.category} · {new Date(tx.date).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <span className={`text-[15px] font-bold flex-shrink-0 ${tx.type === 'entrada' ? 'text-blue-600' : 'text-red-500'}`}>
                    {tx.type === 'saida' ? '-' : '+'}{fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4">
          <button onClick={() => { setForm(f => ({ ...f, type: 'entrada' })); setView('add') }}
            className="flex-1 flex items-center gap-4 p-6 rounded-[32px] bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">↑</div>
            <span className="font-syne font-bold text-lg">Nova Entrada</span>
          </button>
          <button onClick={() => { setForm(f => ({ ...f, type: 'saida' })); setView('add') }}
            className="flex-1 flex items-center gap-4 p-6 rounded-[32px] bg-white border border-black/5 hover:border-red-500/30 hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">↓</div>
            <span className="font-syne font-bold text-lg text-black">Nova Saída</span>
          </button>
          <button onClick={() => setView('notes')}
            className="flex-1 flex items-center gap-4 p-6 rounded-[32px] bg-white border border-black/5 hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-black/5 text-black rounded-full flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📝</div>
            <span className="font-syne font-bold text-lg text-black">Anotações</span>
          </button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="flex-1 overflow-y-auto">
      <AnimatePresence mode="wait">
        {view === 'dashboard' && renderDashboard()}
        {view === 'add' && renderAdd()}
        {view === 'list' && renderList()}
        {view === 'notes' && renderNotes()}
      </AnimatePresence>
    </div>
  )
}
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
    <div className="flex items-end gap-1 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full flex gap-0.5 items-end" style={{ height: height - 16 }}>
            <div
              className="flex-1 rounded-t-sm bg-green-500/60 transition-all duration-500"
              style={{ height: `${(d.entrada / max) * 100}%`, minHeight: d.entrada > 0 ? 2 : 0 }}
            />
            <div
              className="flex-1 rounded-t-sm bg-red-400/60 transition-all duration-500"
              style={{ height: `${(d.saida / max) * 100}%`, minHeight: d.saida > 0 ? 2 : 0 }}
            />
          </div>
          <span className="text-[9px] text-white/30">{d.label}</span>
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
      <div className="rounded-full border-4 border-white/10" style={{ width: size * 0.8, height: size * 0.8 }} />
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
            opacity="0.8"
          />
        )
        offset += pct
        return el
      })}
      <circle cx="50" cy="50" r="28" fill="#0a0a0a" />
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
  const catColors = ['#BA7517', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#34d399']
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
    <motion.div key="add" {...pageTransition} className="p-5 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setView('dashboard'); setEditingTx(null); setForm({ type: 'entrada', description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], note: '' }) }}
          className="text-white/40 hover:text-white transition-colors">
          ← Voltar
        </button>
        <h2 className="font-syne font-bold text-lg">{editingTx ? 'Editar' : 'Nova'} transação</h2>
      </div>

      {/* Type toggle */}
      <div className="flex bg-white/[0.05] rounded-xl p-1 mb-5">
        {['entrada', 'saida'].map(t => (
          <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: '' }))}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              form.type === t
                ? t === 'entrada' ? 'bg-green-500/20 text-green-400' : 'bg-red-400/20 text-red-400'
                : 'text-white/40'
            }`}>
            {t === 'entrada' ? '↑ Entrada' : '↓ Saída'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-white/40 mb-1.5 block">Descrição</label>
          <input className="input-field" placeholder="Ex: Escova progressiva — Cleusa"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Valor (R$)</label>
            <input className="input-field" type="number" placeholder="0,00" min="0" step="0.01"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Data</label>
            <input className="input-field" type="date"
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/40 mb-1.5 block">Categoria</label>
          <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            <option value="">Selecionar...</option>
            {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-white/40 mb-1.5 block">Observação (opcional)</label>
          <textarea className="input-field resize-none" rows={2} placeholder="Algum detalhe extra..."
            value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        </div>

        <button onClick={saveTransaction} disabled={loading || !form.description || !form.amount || !form.category}
          className="btn-primary w-full disabled:opacity-40 mt-2">
          {loading ? 'Salvando...' : editingTx ? 'Salvar alterações' : `Registrar ${form.type === 'entrada' ? 'entrada' : 'saída'}`}
        </button>
      </div>
    </motion.div>
  )

  const renderList = () => (
    <motion.div key="list" {...pageTransition} className="p-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setView('dashboard')} className="text-white/40 hover:text-white transition-colors">← Voltar</button>
        <h2 className="font-syne font-bold text-lg">Todas as transações</h2>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">Nenhuma transação no período selecionado.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => (
            <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                tx.type === 'entrada' ? 'bg-green-500/15' : 'bg-red-400/15'
              }`}>
                <span className={`text-sm ${tx.type === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'entrada' ? '↑' : '↓'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white/80 truncate">{tx.description}</div>
                <div className="text-xs text-white/30 mt-0.5">{tx.category} · {new Date(tx.date).toLocaleDateString('pt-BR')}</div>
                {tx.note && <div className="text-xs text-white/25 mt-0.5 italic truncate">{tx.note}</div>}
              </div>
              <div className={`font-syne font-bold text-base flex-shrink-0 ${
                tx.type === 'entrada' ? 'text-green-400' : 'text-red-400'
              }`}>
                {tx.type === 'saida' ? '-' : '+'}{fmt(tx.amount)}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => editTx(tx)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10L9.5 2.5l2 2L6 12H2v-2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                </button>
                <button onClick={() => deleteTx(tx.id)} className="p-1.5 rounded-lg hover:bg-red-400/10 text-white/40 hover:text-red-400 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2h4v2M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.3A1 1 0 004.7 12h4.6a1 1 0 001-.7L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )

  const renderNotes = () => (
    <motion.div key="notes" {...pageTransition} className="p-5 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setView('dashboard')} className="text-white/40 hover:text-white transition-colors">← Voltar</button>
        <h2 className="font-syne font-bold text-lg">Anotações</h2>
      </div>
      <div className="flex gap-2 mb-5">
        <textarea className="input-field flex-1 resize-none" rows={2} placeholder="Escreva uma anotação... ex: falta pagar a energia essa semana"
          value={noteText} onChange={e => setNoteText(e.target.value)} />
        <button onClick={saveNote} disabled={!noteText.trim()}
          className="bg-[#BA7517] text-white px-4 rounded-xl disabled:opacity-40 hover:bg-[#9a6113] transition-colors self-stretch">
          +
        </button>
      </div>
      <div className="space-y-2">
        {notes.map(n => (
          <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] group">
            <div className="w-2 h-2 rounded-full bg-[#BA7517] mt-1.5 flex-shrink-0" />
            <p className="flex-1 text-sm text-white/70 leading-relaxed">{n.text}</p>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-white/25">{n.createdAt?.toDate?.()?.toLocaleDateString('pt-BR')}</span>
              <button onClick={() => deleteNote(n.id)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </button>
            </div>
          </motion.div>
        ))}
        {notes.length === 0 && <p className="text-center text-white/25 text-sm py-8">Nenhuma anotação ainda.</p>}
      </div>
    </motion.div>
  )

  const renderDashboard = () => (
    <motion.div key="dashboard" {...pageTransition} className="p-5 max-w-2xl mx-auto space-y-5">

      {/* Filter */}
      <div className="flex items-center justify-between">
        <h2 className="font-syne font-bold text-lg">Caixa</h2>
        <div className="flex bg-white/[0.05] rounded-lg p-0.5">
          {[['semana', '7d'], ['mes', 'Mês'], ['ano', 'Ano'], ['tudo', 'Tudo']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === val ? 'bg-[#BA7517] text-white' : 'text-white/40 hover:text-white/70'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Entradas', value: totalEntrada, color: 'text-green-400', bg: 'bg-green-500/[0.07] border-green-500/20' },
          { label: 'Saídas', value: totalSaida, color: 'text-red-400', bg: 'bg-red-400/[0.07] border-red-400/20' },
          { label: 'Saldo', value: saldo, color: saldo >= 0 ? 'text-[#FAC775]' : 'text-red-400', bg: 'bg-[#BA7517]/[0.07] border-[#BA7517]/20' },
        ].map(card => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.bg}`}>
            <div className="text-xs text-white/40 mb-1">{card.label}</div>
            <div className={`font-syne font-black text-base leading-tight ${card.color}`}>
              {fmt(card.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="border border-white/[0.07] rounded-xl p-5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-white/70">Últimos 6 meses</div>
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/60" />Entradas</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400/60" />Saídas</span>
          </div>
        </div>
        <BarChart data={chartData} height={100} />
      </div>

      {/* Category donut */}
      {catSegments.length > 0 && (
        <div className="border border-white/[0.07] rounded-xl p-5 bg-white/[0.02]">
          <div className="text-sm font-medium text-white/70 mb-4">Saídas por categoria</div>
          <div className="flex items-center gap-6">
            <DonutChart segments={catSegments} size={100} />
            <div className="flex-1 space-y-2">
              {catSegments.map((seg, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
                    <span className="text-xs text-white/60">{seg.name}</span>
                  </div>
                  <span className="text-xs font-medium text-white/70">{fmt(seg.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="border border-white/[0.07] rounded-xl p-5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-white/70">Últimas transações</div>
          <button onClick={() => setView('list')} className="text-xs text-[#BA7517] hover:text-[#FAC775] transition-colors">
            Ver todas →
          </button>
        </div>
        {filtered.slice(0, 5).length === 0 ? (
          <p className="text-center text-white/25 text-sm py-4">Nenhuma transação ainda.</p>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                  tx.type === 'entrada' ? 'bg-green-500/15' : 'bg-red-400/15'
                }`}>
                  <span className={`text-xs ${tx.type === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'entrada' ? '↑' : '↓'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/70 truncate">{tx.description}</div>
                  <div className="text-[10px] text-white/30">{new Date(tx.date).toLocaleDateString('pt-BR')}</div>
                </div>
                <span className={`text-xs font-medium flex-shrink-0 ${tx.type === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'saida' ? '-' : '+'}{fmt(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => { setForm(f => ({ ...f, type: 'entrada' })); setView('add') }}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-green-500/20 bg-green-500/[0.05] hover:bg-green-500/[0.1] transition-colors">
          <span className="text-xl">↑</span>
          <span className="text-xs text-green-400 font-medium">Entrada</span>
        </button>
        <button onClick={() => { setForm(f => ({ ...f, type: 'saida' })); setView('add') }}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-red-400/20 bg-red-400/[0.05] hover:bg-red-400/[0.1] transition-colors">
          <span className="text-xl">↓</span>
          <span className="text-xs text-red-400 font-medium">Saída</span>
        </button>
        <button onClick={() => setView('notes')}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
          <span className="text-xl">📝</span>
          <span className="text-xs text-white/50 font-medium">Notas</span>
        </button>
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
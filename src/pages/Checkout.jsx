import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { auth } from '../firebase'

// Links PagBank por plano
const PAGBANK_LINKS = {
  pro:      'https://pag.ae/81LgUyNcP/button',
  business: 'https://pag.ae/81LgVm968/button',
}

export default function Checkout() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const plan = params.get('plan') || 'pro'

  // Redireciona direto para o PagBank
  useEffect(() => {
    const key = plan.startsWith('biz') ? 'business' : 'pro'
    const link = PAGBANK_LINKS[key]
    if (link) window.location.href = link
    else navigate('/dashboard')
  }, [plan])

  return (
    <div style={{ minHeight: '100vh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2px solid #BA7517', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Redirecionando para o pagamento...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
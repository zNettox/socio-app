// Cria ordem no PagBank e retorna QR Code PIX ou sessão de cartão
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const { plan, userName, userEmail, userDocument, userPhone, userId, paymentMethod } = JSON.parse(event.body || '{}')

  const PLANS = {
    pro:      { name: 'Sócio Pro — Mensal', amount: 4990 },
    business: { name: 'Sócio Business — Mensal', amount: 8990 },
  }

  const planData = PLANS[plan]
  if (!planData) return { statusCode: 400, body: JSON.stringify({ error: 'Plano inválido' }) }

  const webhookUrl = `${process.env.URL}/.netlify/functions/pagbank-webhook`

  const expireDate = new Date()
  expireDate.setHours(expireDate.getHours() + 24)

  const body = {
    reference_id: `${userId}:${plan}`,
    customer: {
      name: userName,
      email: userEmail,
      tax_id: userDocument?.replace(/\D/g, ''),
      phones: userPhone ? [{ country: '55', area: userPhone.replace(/\D/g, '').slice(0, 2), number: userPhone.replace(/\D/g, '').slice(2), type: 'MOBILE' }] : undefined,
    },
    items: [{ name: planData.name, quantity: 1, unit_amount: planData.amount }],
    qr_codes: paymentMethod === 'pix' ? [{ amount: { value: planData.amount }, expiration_date: expireDate.toISOString() }] : undefined,
    charges: paymentMethod === 'card' ? [{ amount: { value: planData.amount }, payment_method: { type: 'CREDIT_CARD', installments: 1, capture: true } }] : undefined,
    notification_urls: [webhookUrl],
  }

  try {
    const res = await fetch('https://api.pagseguro.com/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAGBANK_TOKEN}`,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('PagBank error:', data)
      return { statusCode: 400, body: JSON.stringify({ error: data.error_messages?.[0]?.description || 'Erro ao criar ordem' }) }
    }

    // Extract PIX data
    if (paymentMethod === 'pix' && data.qr_codes?.[0]) {
      const qr = data.qr_codes[0]
      return {
        statusCode: 200,
        body: JSON.stringify({
          orderId: data.id,
          pixCopyPaste: qr.text,
          pixQrCode: qr.links?.find(l => l.media === 'image/png')?.href,
          expiresAt: qr.expiration_date,
        }),
      }
    }

    // Card — return charge id for frontend to complete
    if (paymentMethod === 'card' && data.charges?.[0]) {
      return {
        statusCode: 200,
        body: JSON.stringify({ orderId: data.id, chargeId: data.charges[0].id }),
      }
    }

    return { statusCode: 200, body: JSON.stringify(data) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
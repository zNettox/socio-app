export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const { plan, userName, userEmail, userCpf, userId, paymentMethod, cardEncrypted, cardHolder, cardInstallments } = JSON.parse(event.body || '{}')

  const PLANS = {
    pro:      { name: 'Socio Pro - Mensal', amount: 4990 },
    business: { name: 'Socio Business - Mensal', amount: 8990 },
  }

  const planData = PLANS[plan]
  if (!planData) return { statusCode: 400, body: JSON.stringify({ error: 'Plano invalido' }) }

  const cpf = userCpf?.replace(/\D/g, '')
  if (!cpf || cpf.length !== 11) return { statusCode: 400, body: JSON.stringify({ error: 'CPF invalido' }) }

  const expireDate = new Date()
  expireDate.setHours(expireDate.getHours() + 1)

  const isPix = paymentMethod === 'PIX'

  const body = {
    reference_id: userId + ':' + plan,
    customer: {
      name: userName,
      email: userEmail,
      tax_id: cpf,
    },
    items: [{
      name: planData.name,
      quantity: 1,
      unit_amount: planData.amount,
    }],
    notification_urls: [process.env.URL + '/.netlify/functions/pagbank-webhook'],
    ...(isPix ? {
      qr_codes: [{
        amount: { value: planData.amount },
        expiration_date: expireDate.toISOString(),
      }],
    } : {
      charges: [{
        reference_id: userId + ':' + plan,
        description: planData.name,
        amount: {
          value: planData.amount,
          currency: 'BRL',
        },
        payment_method: {
          type: 'CREDIT_CARD',
          installments: cardInstallments || 1,
          capture: true,
          card: {
            encrypted: cardEncrypted,
            holder: { name: cardHolder },
            store: false,
          },
        },
      }],
    }),
  }

  try {
    const res = await fetch('https://api.pagseguro.com/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.PAGBANK_TOKEN,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('PagBank error:', JSON.stringify(data))
      return { statusCode: 400, body: JSON.stringify({ error: data.error_messages?.[0]?.description || 'Erro ao processar pagamento' }) }
    }

    if (isPix) {
      const qr = data.qr_codes?.[0]
      if (!qr) return { statusCode: 400, body: JSON.stringify({ error: 'QR code nao gerado' }) }
      const imageLink = qr.links?.find(l => l.media === 'image/png')?.href
      return {
        statusCode: 200,
        body: JSON.stringify({ type: 'pix', orderId: data.id, pixText: qr.text, pixImage: imageLink, expiresAt: qr.expiration_date }),
      }
    } else {
      const charge = data.charges?.[0]
      const status = charge?.status
      if (status === 'PAID' || status === 'AUTHORIZED') {
        return { statusCode: 200, body: JSON.stringify({ type: 'card', success: true, orderId: data.id }) }
      }
      const decline = charge?.payment_response?.message || 'Cartao recusado'
      return { statusCode: 400, body: JSON.stringify({ error: decline }) }
    }
  } catch (err) {
    console.error('Error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
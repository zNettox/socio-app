export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const { plan, userName, userEmail, userCpf, userId } = JSON.parse(event.body || '{}')

  const PLANS = {
    pro:      { name: 'Sócio Pro — Mensal', amount: 4990 },
    business: { name: 'Sócio Business — Mensal', amount: 8990 },
  }

  const planData = PLANS[plan]
  if (!planData) return { statusCode: 400, body: JSON.stringify({ error: 'Plano inválido' }) }

  const cpf = userCpf?.replace(/\D/g, '')
  if (!cpf || cpf.length !== 11) return { statusCode: 400, body: JSON.stringify({ error: 'CPF inválido' }) }

  const expireDate = new Date()
  expireDate.setHours(expireDate.getHours() + 1)

  const body = {
    reference_id: `${userId}:${plan}`,
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
    qr_codes: [{
      amount: { value: planData.amount },
      expiration_date: expireDate.toISOString(),
    }],
    notification_urls: [`${process.env.URL}/.netlify/functions/pagbank-webhook`],
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

    const qr = data.qr_codes?.[0]
    if (!qr) return { statusCode: 400, body: JSON.stringify({ error: 'QR code não gerado' }) }

    const imageLink = qr.links?.find(l => l.media === 'image/png')?.href

    return {
      statusCode: 200,
      body: JSON.stringify({
        orderId: data.id,
        pixText: qr.text,
        pixImage: imageLink,
        expiresAt: qr.expiration_date,
        amount: planData.amount,
      }),
    }
  } catch (err) {
    console.error('Error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
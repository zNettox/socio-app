export const handler = async () => {
  try {
    const res = await fetch('https://api.pagseguro.com/public-keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAGBANK_TOKEN}`,
      },
      body: JSON.stringify({ type: 'card' }),
    })
    const data = await res.json()
    if (!res.ok) return { statusCode: 400, body: JSON.stringify({ error: 'Erro ao buscar chave' }) }
    return {
      statusCode: 200,
      body: JSON.stringify({ publicKey: data.public_key }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
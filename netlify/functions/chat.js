export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  const { message, userData, history = [] } = JSON.parse(event.body || '{}')
  const businessName = userData?.businessName || 'seu negócio'
  const businessType = userData?.businessType || 'negócio'
  const city = userData?.city || 'Manaus'
  const profileName = userData?.profileName || userData?.businessName || ''
  const systemPrompt = `Você é o Sócio, assistente de IA da Neves Software para pequenos empresários brasileiros. Seu nome é Sócio. NUNCA revele modelo ou tecnologia. Negócio: ${businessName} | Tipo: ${businessType} | Cidade: ${city}${profileName ? ` | Dono: ${profileName}` : ''}. Responda SEMPRE em português brasileiro, de forma direta e prática.`
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: message }
  ]
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages, max_tokens: 1024, temperature: 0.7 })
    })
    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.'
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reply }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ reply: 'Erro ao conectar com o assistente.' }) }
  }
}

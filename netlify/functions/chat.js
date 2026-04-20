export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { message, userData, history = [] } = JSON.parse(event.body || '{}')

  const businessName = userData?.businessName || 'seu negócio'
  const businessType = userData?.businessType || 'negócio'
  const city = userData?.city || 'sua cidade'

  const systemPrompt = `Você é o Sócio — assistente inteligente para pequenos empresários brasileiros.

Você está ajudando ${businessName}, um(a) ${businessType} em ${city}.

Suas responsabilidades:
- Calcular preços justos com base nos custos e mercado local
- Criar propostas profissionais prontas para enviar
- Sugerir promoções e estratégias de vendas
- Responder dúvidas de gestão, custos e finanças
- Criar conteúdo para Instagram e WhatsApp

Tom: amigável, direto, brasileiro. Sem juridiquês.
Você é o sócio de confiança que entende do negócio.

Quando precificar:
1. Pergunte os custos se não souber
2. Use referências de mercado para ${city}
3. Calcule margem ideal
4. Dê um range com justificativa clara

Responda sempre em português brasileiro. Seja conciso e prático.`

  const messages = [
    ...history.slice(-10),
    { role: 'user', content: message }
  ]

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.'

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    }
  } catch (err) {
    console.error('Groq API error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: 'Erro ao conectar com o assistente. Tente novamente.' }),
    }
  }
}
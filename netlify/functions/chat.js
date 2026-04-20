// netlify/functions/chat.js
// Essa função roda no servidor — a chave da API nunca fica exposta no frontend

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { message, userData, history = [] } = JSON.parse(event.body || '{}')

  const businessName = userData?.businessName || 'seu negócio'
  const businessType = userData?.businessType || 'negócio'
  const city = userData?.city || 'sua cidade'

  const systemPrompt = `Você é o Sócio — assistente de IA para pequenos empresários brasileiros.

Você está ajudando ${businessName}, um(a) ${businessType} localizado(a) em ${city}.

Suas responsabilidades:
- Calcular preços justos com base nos custos e mercado local
- Criar propostas profissionais prontas para enviar
- Sugerir promoções e estratégias de vendas
- Responder dúvidas de gestão, custos e finanças do negócio
- Criar conteúdo para Instagram e WhatsApp

Tom: amigável, direto, brasileiro. Sem juridiquês, sem papo de banco.
Você é o sócio de confiança que entende do negócio.

Quando precificar um serviço:
1. Pergunte os custos se não souber
2. Pesquise preços de mercado para ${city}
3. Calcule a margem ideal
4. Dê um range de preço com justificativa clara

Responda sempre em português brasileiro. Seja conciso e prático.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...history,
          { role: 'user', content: message },
        ],
      }),
    })

    const data = await response.json()
    const reply = data.content?.[0]?.text || 'Desculpe, não consegui processar sua mensagem.'

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    }
  } catch (err) {
    console.error('Anthropic API error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: 'Erro ao conectar com a IA. Tente novamente.' }),
    }
  }
}

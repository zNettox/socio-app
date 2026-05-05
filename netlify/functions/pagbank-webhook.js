// Webhook PagBank — ativa plano após pagamento confirmado
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function initFirebase() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  }
  return getFirestore()
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const body = JSON.parse(event.body || '{}')

    // PagBank envia notificação com status do pedido
    const { charges, reference_id } = body

    if (!charges || !charges[0]) return { statusCode: 200, body: 'ok' }

    const charge = charges[0]
    const status = charge.status // PAID, DECLINED, etc

    if (status !== 'PAID') return { statusCode: 200, body: 'not paid' }

    // reference_id deve conter userId:plan — ex: "uid123:pro"
    if (!reference_id || !reference_id.includes(':')) return { statusCode: 400, body: 'missing reference_id' }

    const [userId, plan] = reference_id.split(':')

    const db = initFirebase()
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + 30)

    await db.collection('users').doc(userId).update({
      plan,
      planStatus: 'ativa',
      planExpireAt: expireAt,
      lastPayment: new Date(),
      lastPaymentMethod: charge.payment_method?.type || 'pagbank',
      lastPaymentAmount: charge.amount?.value,
    })

    console.log(`Plano ${plan} ativado para ${userId}`)
    return { statusCode: 200, body: 'ok' }
  } catch (err) {
    console.error('PagBank webhook error:', err)
    return { statusCode: 500, body: err.message }
  }
}
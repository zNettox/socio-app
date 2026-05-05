// Webhook PagBank — ativa plano apos pagamento confirmado (Link Recorrente)
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

function getPlanByAmount(value) {
  if (value === 4990) return 'pro'
  if (value === 8990) return 'business'
  return null
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  try {
    const body = JSON.parse(event.body || '{}')
    const { charges, customer } = body
    if (!charges || !charges[0]) return { statusCode: 200, body: 'ok' }
    const charge = charges[0]
    if (charge.status !== 'PAID') return { statusCode: 200, body: 'not paid' }
    const amountValue = charge.amount?.value
    const plan = getPlanByAmount(amountValue)
    if (!plan) return { statusCode: 200, body: 'unknown amount' }
    const customerEmail = customer?.email
    if (!customerEmail) return { statusCode: 400, body: 'missing customer email' }
    const db = initFirebase()
    const snapshot = await db.collection('users').where('email', '==', customerEmail).limit(1).get()
    if (snapshot.empty) return { statusCode: 200, body: 'user not found' }
    const userDoc = snapshot.docs[0]
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + 30)
    await userDoc.ref.update({ plan, planStatus: 'ativa', planExpireAt: expireAt, lastPayment: new Date(), lastPaymentMethod: charge.payment_method?.type || 'pagbank', lastPaymentAmount: amountValue })
    console.log('Plano ' + plan + ' ativado para ' + customerEmail)
    return { statusCode: 200, body: 'ok' }
  } catch (err) {
    console.error('PagBank webhook error:', err)
    return { statusCode: 500, body: err.message }
  }
}

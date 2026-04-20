import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCosCwNuQ4UkEvINGneV7YfN4YvveDBn0k",
  authDomain: "socio-app-c26bc.firebaseapp.com",
  projectId: "socio-app-c26bc",
  storageBucket: "socio-app-c26bc.firebasestorage.app",
  messagingSenderId: "734599420413",
  appId: "1:734599420413:web:bdadd51c6d8ab33906a194",
  measurementId: "G-QCXG3G13FJ"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export default app
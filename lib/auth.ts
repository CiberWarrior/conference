import { cookies } from 'next/headers'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Conference2024!'
const SESSION_COOKIE_NAME = 'admin_session'

// Simple session token (in production, use JWT or proper session management)
const createSessionToken = () => {
  const timestamp = Date.now()
  const secret = process.env.ADMIN_SESSION_SECRET || 'default-secret'
  return Buffer.from(`${timestamp}:${secret}`).toString('base64')
}

export const verifyCredentials = (username: string, password: string): boolean => {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export const createSession = async () => {
  const token = createSessionToken()
  const cookieStore = await cookies()
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  
  return token
}

export const getSession = async (): Promise<string | undefined> => {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value
}

export const destroySession = async () => {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSession()
  return !!session
}


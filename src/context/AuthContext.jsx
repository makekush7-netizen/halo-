import { createContext, useContext, useState, useEffect } from 'react'
import { Amplify } from 'aws-amplify'
import {
  signIn, signUp, signOut,
  confirmSignUp, getCurrentUser,
  fetchAuthSession, signInWithRedirect
} from 'aws-amplify/auth'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [import.meta.env.VITE_COGNITO_REDIRECT_URI || 'http://localhost:3000/'],
          redirectSignOut: [import.meta.env.VITE_COGNITO_REDIRECT_URI || 'http://localhost:3000/'],
          responseType: 'code',
        },
      },
    },
  },
})

const AuthContext = createContext(null)
const DEMO_USER_KEY = 'halo_demo_user'

function isCognitoConfigured() {
  const poolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || ''
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || ''
  if (!poolId || !clientId) return false
  if (poolId.includes('XXXX') || clientId.includes('XXXX')) return false
  return true
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkCurrentUser()
  }, [])

  async function checkCurrentUser() {
    try {
      if (!isCognitoConfigured()) {
        const stored = sessionStorage.getItem(DEMO_USER_KEY)
        if (stored) {
          const demoUser = JSON.parse(stored)
          setUser(demoUser)
        } else {
          setUser(null)
        }
        return
      }
      const currentUser = await getCurrentUser()
      const session = await fetchAuthSession()
      const payload = session.tokens?.idToken?.payload || {}
      const storedRole = sessionStorage.getItem('halo_role') || 'member'
      const storedOrgName = sessionStorage.getItem('halo_org_name') || ''
      const storedOrgVerified = sessionStorage.getItem('halo_org_verified') || ''
      setUser({
        username: currentUser.username,
        email: payload.email || currentUser.signInDetails?.loginId,
        name: payload.name || payload['cognito:username'],
        picture: payload.picture,
        userId: currentUser.userId,
        role: storedRole,
        orgName: storedOrgName,
        orgVerified: storedOrgVerified,
      })
      sessionStorage.setItem('halo_user', JSON.stringify({
        role: storedRole,
        displayName: payload.name || payload['cognito:username'] || payload.email || currentUser.username,
      }))
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignIn(email, password) {
    setError(null)
    try {
      if (!isCognitoConfigured()) {
        const role = sessionStorage.getItem('halo_role') || 'member'
        const demoUser = {
          username: email,
          email,
          name: email.split('@')[0] || 'Halo User',
          role,
          userId: email,
          orgName: sessionStorage.getItem('halo_org_name') || '',
          orgVerified: sessionStorage.getItem('halo_org_verified') || '',
        }
        sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser))
        setUser(demoUser)
        return { success: true }
      }
      await signIn({ username: email, password })
      await checkCurrentUser()
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  async function handleSignUp(email, password, name) {
    setError(null)
    try {
      if (!isCognitoConfigured()) {
        const role = sessionStorage.getItem('halo_role') || 'member'
        const demoUser = {
          username: email,
          email,
          name: name || email.split('@')[0] || 'Halo User',
          role,
          userId: email,
          orgName: sessionStorage.getItem('halo_org_name') || '',
          orgVerified: sessionStorage.getItem('halo_org_verified') || '',
        }
        sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser))
        setUser(demoUser)
        return { success: true, needsConfirmation: false, userId: email }
      }
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email, name },
        },
      })
      return { success: true, needsConfirmation: !result.isSignUpComplete, userId: result.userId }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  async function handleConfirmSignUp(email, code) {
    try {
      if (!isCognitoConfigured()) {
        return { success: true }
      }
      await confirmSignUp({ username: email, confirmationCode: code })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async function handleGoogleSignIn() {
    try {
      if (!isCognitoConfigured()) {
        setError('Google sign-in needs real Cognito configuration.')
        return
      }
      await signInWithRedirect({ provider: 'Google' })
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSignOut() {
    try {
      if (isCognitoConfigured()) {
        await signOut()
      }
    } catch (err) {
      console.error('Sign out failed, clearing local session anyway:', err)
    } finally {
      setUser(null)
      sessionStorage.removeItem('halo_user')
      sessionStorage.removeItem('halo_role')
      sessionStorage.removeItem('halo_org_name')
      sessionStorage.removeItem('halo_org_verified')
      sessionStorage.removeItem(DEMO_USER_KEY)
    }
  }

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      signIn: handleSignIn,
      signUp: handleSignUp,
      confirmSignUp: handleConfirmSignUp,
      googleSignIn: handleGoogleSignIn,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

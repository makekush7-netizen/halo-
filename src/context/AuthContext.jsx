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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkCurrentUser()
  }, [])

  async function checkCurrentUser() {
    try {
      const currentUser = await getCurrentUser()
      const session = await fetchAuthSession()
      const payload = session.tokens?.idToken?.payload || {}
      setUser({
        username: currentUser.username,
        email: payload.email || currentUser.signInDetails?.loginId,
        name: payload.name || payload['cognito:username'],
        picture: payload.picture,
        userId: currentUser.userId,
      })
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignIn(email, password) {
    setError(null)
    try {
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
      await confirmSignUp({ username: email, confirmationCode: code })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async function handleGoogleSignIn() {
    try {
      await signInWithRedirect({ provider: 'Google' })
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSignOut() {
    await signOut()
    setUser(null)
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

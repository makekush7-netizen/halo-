import { useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Chrome } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import BackgroundParticles from '../components/BackgroundParticles.jsx'

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, confirmSignUp, googleSignIn, error } = useAuth()
  const [step, setStep] = useState('form') // 'form' | 'confirm'
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [showPass, setShowPass] = useState(false)
  const query = useMemo(() => new URLSearchParams(location.search), [location.search])
  const [orgMode, setOrgMode] = useState(query.get('org') === '1')
  const [roleChoice, setRoleChoice] = useState('admin')
  const [formData, setFormData] = useState({ name: '', email: '', password: '', code: '', orgName: '' })
  const cognitoConfigured = !(import.meta.env.VITE_COGNITO_USER_POOL_ID || '').includes('XXXX')

  const isLogin = mode === 'login'

  function setField(field) {
    return (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setLoading(true)
    const nextRoute = orgMode ? '/cockpit' : '/join'
    const selectedRole = orgMode ? roleChoice : 'member'
    sessionStorage.setItem('halo_role', selectedRole)
    if (orgMode) {
      sessionStorage.setItem('halo_org_name', formData.orgName.trim())
      sessionStorage.setItem('halo_org_verified', 'verified')
    } else {
      sessionStorage.removeItem('halo_org_name')
      sessionStorage.removeItem('halo_org_verified')
    }

    if (step === 'confirm') {
      const result = await confirmSignUp(pendingEmail, formData.code)
      if (result.success) {
        await signIn(pendingEmail, formData.password)
        navigate(nextRoute)
      } else {
        setFormError(result.error)
      }
      setLoading(false)
      return
    }

    if (isLogin) {
      const result = await signIn(formData.email, formData.password)
      if (result.success) navigate(nextRoute)
      else setFormError(result.error)
    } else {
      const result = await signUp(formData.email, formData.password, formData.name)
      if (result.success) {
        if (result.needsConfirmation) {
          setPendingEmail(formData.email)
          setStep('confirm')
        } else {
          navigate(nextRoute)
        }
      } else {
        setFormError(result.error)
      }
    }
    setLoading(false)
  }

  return (
    <div className="page" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <BackgroundParticles />
      <div className="aurora-bg" />

      {/* Logo */}
      <div style={{ position: 'absolute', top: 32, left: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="logo-text">◎ Halo</div>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: 460, position: 'relative', zIndex: 10 }}
      >
        <div className="glass-panel" style={{
          padding: 48,
          background: 'rgba(20, 22, 34, 0.55)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <h1 className="display-title" style={{ fontSize: 30, marginBottom: 8 }}>
              {step === 'confirm' ? 'Check Your Email' : isLogin ? 'Welcome back' : orgMode ? 'Create your organization' : 'Create your account'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {step === 'confirm'
                ? `We sent a 6-digit code to ${pendingEmail}`
                : isLogin
                ? (orgMode ? 'Sign in to your organization cockpit' : 'Sign in to create or join meetings')
                : (orgMode ? 'Admins run the cockpit and manage members' : 'Start meetings instantly with shareable links')}
            </p>
          </div>

          {step === 'form' && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 22, justifyContent: 'center' }}>
              <button
                type="button"
                className={`btn ${!orgMode ? 'btn-lime' : 'btn-ghost'}`}
                onClick={() => setOrgMode(false)}
                style={{ padding: '10px 16px', fontSize: 13 }}
              >
                Personal
              </button>
              <button
                type="button"
                className={`btn ${orgMode ? 'btn-lime' : 'btn-ghost'}`}
                onClick={() => setOrgMode(true)}
                style={{ padding: '10px 16px', fontSize: 13 }}
              >
                Organization
              </button>
            </div>
          )}

          {/* Google Auth */}
          {step === 'form' && cognitoConfigured && (
            <>
              <button
                onClick={googleSignIn}
                className="btn btn-ghost"
                style={{ width: '100%', padding: '14px', marginBottom: 24, fontSize: 15, gap: 12 }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.5 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.7 29.2 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.7-.2-3.3-.9-5z"/>
                  <path fill="#FF3D00" d="M6.3 15.7l6.6 4.8C14.5 17 19 14 24 14c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.7 29.2 4.5 24 4.5c-7.5 0-14 4.3-17.7 11.2z"/>
                  <path fill="#4CAF50" d="M24 45.5c5.1 0 9.8-1.9 13.4-5.1l-6.2-5.2C29.3 36.9 26.8 38 24 38c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.8 41.3 16.4 45.5 24 45.5z"/>
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.7 4.7-5 6.2l6.2 5.2c3.6-3.3 5.9-8.1 5.9-14.4 0-1.7-.2-3.3-.8-5z"/>
                </svg>
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {step === 'confirm' ? (
              <div>
                <label className="label">Verification Code</label>
                <input
                  required autoFocus className="input"
                  placeholder="Enter 6-digit code"
                  value={formData.code}
                  onChange={setField('code')}
                  style={{ letterSpacing: 6, fontSize: 20, textAlign: 'center' }}
                />
              </div>
            ) : (
              <>
                {orgMode && (
                  <div>
                    <label className="label">Organization Name</label>
                    <input
                      required
                      className="input"
                      placeholder="e.g. Halo Labs"
                      value={formData.orgName}
                      onChange={setField('orgName')}
                    />
                  </div>
                )}
                {!isLogin && (
                  <div>
                    <label className="label">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input required className="input" placeholder="Kush Yadav" value={formData.name} onChange={setField('name')} style={{ paddingLeft: 44 }} />
                    </div>
                  </div>
                )}
                <div>
                  <label className="label">Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input required type="email" className="input" placeholder="you@example.com" value={formData.email} onChange={setField('email')} style={{ paddingLeft: 44 }} />
                  </div>
                </div>
                <div>
                  <label className="label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input required type={showPass ? 'text' : 'password'} className="input" placeholder="Min 8 characters" value={formData.password} onChange={setField('password')} style={{ paddingLeft: 44, paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {orgMode && isLogin && (
                  <div>
                    <label className="label">Organization Role</label>
                    <select
                      className="input"
                      value={roleChoice}
                      onChange={(e) => setRoleChoice(e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="co-admin">Co-Admin</option>
                      <option value="member">Teacher</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {(formError || error) && (
              <div style={{ background: 'var(--status-red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'var(--status-red)' }}>
                {formError || error}
              </div>
            )}

            <button type="submit" className="btn btn-lime" style={{ width: '100%', padding: 16, fontSize: 15, marginTop: 4 }} disabled={loading}>
              {loading ? 'Please wait...' : step === 'confirm' ? 'Verify & Sign In' : isLogin ? <>Sign In <ArrowRight size={16} /></> : orgMode ? <>Create Organization <ArrowRight size={16} /></> : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Switch mode */}
          {step === 'form' && (
            <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--text-secondary)' }}>
              {isLogin ? <>New to Halo? <Link to="/signup" style={{ color: 'white', fontWeight: 600, textDecoration: 'none' }}>Create an account</Link></> : <>Already have an account? <Link to="/login" style={{ color: 'white', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link></>}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

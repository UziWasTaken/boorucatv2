import type { NextPage } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import styles from './Account.module.css'

const AccountPage: NextPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const { data: session } = useSession()
  const router = useRouter()

  // Redirect if already logged in
  if (session) {
    router.push('/')
    return null
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await signIn('credentials', {
        username: formData.get('username'),
        password: formData.get('password'),
        redirect: false,
      })

      console.log('Login result:', result)

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        router.push('/')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred during login')
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    if (formData.get('password') !== formData.get('confirmPassword')) {
      setError('Passwords do not match')
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.get('username'),
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message)
      }

      // Auto login after successful registration
      setIsLogin(true)
      setError('Registration successful! Please log in.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <>
      <Head>
        <title>Account - Kazuru</title>
      </Head>
      <div id="content">
        <div className={styles.accountContainer}>
          <div className={styles.tabs}>
            <button 
              className={isLogin ? styles.active : ''} 
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button 
              className={!isLogin ? styles.active : ''} 
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {isLogin ? (
            <form className={styles.form} onSubmit={handleLogin}>
              <div className={styles.formGroup}>
                <label htmlFor="username">Username:</label>
                <input type="text" id="username" name="username" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="password">Password:</label>
                <input type="password" id="password" name="password" required />
              </div>
              <button type="submit" className={styles.submitButton}>
                Login
              </button>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handleRegister}>
              <div className={styles.formGroup}>
                <label htmlFor="newUsername">Username:</label>
                <input type="text" id="newUsername" name="username" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="newPassword">Password:</label>
                <input type="password" id="newPassword" name="password" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm Password:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required />
              </div>
              <button type="submit" className={styles.submitButton}>
                Register
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

export default AccountPage 
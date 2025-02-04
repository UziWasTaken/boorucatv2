import type { NextPage } from 'next'
import Head from 'next/head'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import styles from './Account.module.css'

const AccountSettings: NextPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isEditing, setIsEditing] = useState({
    email: false,
    password: false
  })

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/account')
    return null
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  const handleUpdateEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newEmail = formData.get('email')

    try {
      const res = await fetch('/api/user/update-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update email')
      }

      setMessage('Email updated successfully')
      setIsEditing({ ...isEditing, email: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email')
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get('currentPassword')
    const newPassword = formData.get('newPassword')
    const confirmPassword = formData.get('confirmPassword')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    try {
      const res = await fetch('/api/user/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password')
      }

      setMessage('Password updated successfully')
      setIsEditing({ ...isEditing, password: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE'
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete account')
      }

      await signOut({ callbackUrl: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
    }
  }

  return (
    <>
      <Head>
        <title>Account Settings - Kazuru</title>
      </Head>
      <div id="content">
        <div className={styles.accountContainer}>
          <h2>Account Settings</h2>
          
          {error && <div className={styles.error}>{error}</div>}
          {message && <div className={styles.success}>{message}</div>}

          <div className={styles.settingsSection}>
            <h3>Profile Information</h3>
            <p><strong>Username:</strong> {session?.user?.username}</p>
            
            {isEditing.email ? (
              <form onSubmit={handleUpdateEmail} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="email">New Email:</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    defaultValue={session?.user?.email}
                    required 
                  />
                </div>
                <div className={styles.buttonGroup}>
                  <button type="submit" className={styles.saveButton}>Save</button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing({ ...isEditing, email: false })}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.settingRow}>
                <p><strong>Email:</strong> {session?.user?.email}</p>
                <button 
                  onClick={() => setIsEditing({ ...isEditing, email: true })}
                  className={styles.editButton}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className={styles.settingsSection}>
            <h3>Security</h3>
            {isEditing.password ? (
              <form onSubmit={handleUpdatePassword} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="currentPassword">Current Password:</label>
                  <input 
                    type="password" 
                    id="currentPassword" 
                    name="currentPassword" 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">New Password:</label>
                  <input 
                    type="password" 
                    id="newPassword" 
                    name="newPassword" 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm New Password:</label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    required 
                  />
                </div>
                <div className={styles.buttonGroup}>
                  <button type="submit" className={styles.saveButton}>Update Password</button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing({ ...isEditing, password: false })}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setIsEditing({ ...isEditing, password: true })}
                className={styles.editButton}
              >
                Change Password
              </button>
            )}
          </div>

          <div className={styles.dangerZone}>
            <h3>Danger Zone</h3>
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className={styles.deleteButton}
            >
              Delete Account
            </button>
          </div>

          {isDeleteModalOpen && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h3>Delete Account</h3>
                <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                <div className={styles.modalButtons}>
                  <button 
                    onClick={handleDeleteAccount}
                    className={styles.deleteButton}
                  >
                    Yes, Delete My Account
                  </button>
                  <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default AccountSettings 
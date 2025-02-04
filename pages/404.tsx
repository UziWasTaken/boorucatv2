import Link from 'next/link'
import Head from 'next/head'
import styles from '../styles/404.module.css'

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found - Kazuru</title>
      </Head>
      <div className={styles.container}>
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link href="/">
          Return to Home
        </Link>
      </div>
    </>
  )
} 
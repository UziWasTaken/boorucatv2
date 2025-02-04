import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { data: session } = useSession();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.logo}>
          <Link href="/">Kazuto</Link>
        </h1>
        <nav className={styles.mainNav}>
          <Link href="/posts">Posts</Link>
          <Link href="/comments">Comments</Link>
          <Link href="/wiki">Wiki</Link>
          <Link href="/aliases">Aliases</Link>
          <Link href="/artists">Artists</Link>
          <Link href="/tags">Tags</Link>
          <Link href="/pools">Pools</Link>
          <Link href="/forum">Forum</Link>
          <Link href="/stats">Stats</Link>
          <Link href="/help">Help</Link>
        </nav>
        <nav className={styles.subNav}>
          <Link href="/video">Video</Link>
          <Link href="/upload">Upload</Link>
          <Link href="/random">Random</Link>
          <Link href="/contact">Contact Us</Link>
          <Link href="/dmca">DMCA</Link>
          <Link href="/about">About</Link>
          <Link href="/tos">TOS</Link>
        </nav>
      </header>
      <div className={styles.content}>
        {children}
      </div>
      <footer className={styles.footer}>
        <p>Running Kazuto Beta 0.2.0</p>
      </footer>
    </div>
  );
};

export default Layout; 
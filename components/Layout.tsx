import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { data: session } = useSession();

  return (
    <div>
      <header>
        <nav>
          <Link href="/">Home</Link>
          {session ? (
            <>
              <Link href="/upload">Upload</Link>
              <Link href="/profile">Profile</Link>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main>
        {children}
      </main>
      <footer>
        {/* Add footer content if needed */}
      </footer>
    </div>
  );
};

export default Layout; 
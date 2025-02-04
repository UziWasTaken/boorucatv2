import Image from 'next/image';
import styles from './Logo.module.css';

export const Logo = () => {
  return (
    <div className={styles.logo}>
      <Image
        src="/logo.png"
        alt="Kazuto"
        width={1000}
        height={300}
        priority
      />
    </div>
  );
}; 
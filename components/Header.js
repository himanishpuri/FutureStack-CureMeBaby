import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/Header.module.css';
import { ConnectWallet } from './ConnectWallet';

// Logo component on the left
const Logo = () => (
  <div className={styles.logo}>
    <Link href="/">
      <Image 
        src="/cureLogo.png" 
        alt="Cure Logo" 
        width={24}
        height={24}
        priority
        className={styles.logoImage}
      />
      <span className={styles.logoText}>CureMeBaby</span>
    </Link>
  </div>
);

// Wallet button component on the right - removing the wrapper div
const ConnectWalletButton = () => (
  <ConnectWallet />
);

const Header = () => {
  // Use client-side only rendering for the header
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return a simple placeholder during SSR to avoid hydration mismatch
  if (!isMounted) {
    return (
      <header className={styles.header}>
        <div className={styles.logoContainer}></div>
        <div className={styles.walletButtonContainer}></div>
      </header>
    );
  }
  
  // Client-side render with full content
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoContainer}>
        <Logo />
      </Link>
      
      <div className={styles.walletButtonContainer}>
        <ConnectWalletButton />
      </div>
    </header>
  );
}

export default Header; 
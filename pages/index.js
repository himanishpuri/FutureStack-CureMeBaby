import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '../styles/Landing.module.css';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    // Initialize particles.js
    if (typeof window !== 'undefined' && window.particlesJS) {
      window.particlesJS.load('particles-js', '/assets/particles.json', function() {
        console.log('particles.js loaded - callback');
      });
    }
  }, []);

  // Function to duplicate company logos for smooth infinite scrolling
  const createMarqueeItems = (logos) => {
    return [...logos, ...logos];
  };

  // Company logos data
  const companyLogos = [
    { id: 1, src: "/assets/companies/gensyn.png", alt: "Gensyn" },
    { id: 2, src: "/assets/companies/upstage.png", alt: "Upstage" },
    { id: 3, src: "/assets/companies/nethermind.png", alt: "Nethermind" },
    { id: 4, src: "/assets/companies/nearai.png", alt: "NEAR AI" },
    { id: 5, src: "/assets/companies/gensyn.png", alt: "Gensyn" },
    { id: 6, src: "/assets/companies/upstage.png", alt: "Upstage" },
  ];

  return (
    <div className={styles.container}>
      <Head>
        <title>Cure Me Baby</title>
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&display=swap" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"></script>
      </Head>

      <div id="particles-js" className={styles.particlesContainer}></div>

      <main className={`${styles.main} ${isLoaded ? styles.loaded : ''}`}>
        <div className={styles.mainContent}>
          <h1 className={styles.title}>CureMeBaby</h1>
          <h2 className={styles.subtitle}>Your Private AI Therapist</h2>
          
          <Link href="/room" className={styles.startButton}>
            <span className={styles.buttonText}>Start Here</span>
            <svg className={styles.arrow} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        <div className={styles.builtWithSection}>
          <h3 className={styles.builtWithTitle}>Built With</h3>
          
          <div className={styles.marqueeContainer}>
            <div className={styles.marquee}>
              {createMarqueeItems(companyLogos).map((logo, index) => (
                <div key={`${logo.id}-${index}`} className={styles.logoWrapper}>
                  <img 
                    src={logo.src} 
                    alt={logo.alt} 
                    className={styles.logo}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

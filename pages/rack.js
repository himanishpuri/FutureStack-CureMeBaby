import { useState, useEffect, Suspense } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Yellow from '../components/yellow';
import FifthRowBall from '../components/fifthrowball';
import { useRouter } from 'next/router';

// 3D Model component for the ball
function BallModel({ position = [0, 0, 0] }) {
  const { scene } = useGLTF('/assets/glb/ball.glb');
  return <primitive object={scene} position={position} scale={[0.5, 0.5, 0.5]} />;
}

export default function Rack() {
  const router = useRouter();
  // State to track if the component is mounted (for client-side rendering)
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(0.2); // Start at 20% scale
  const [isHovering, setIsHovering] = useState(false);
  
  // Set mounted to true after component mounts and handle animation
  useEffect(() => {
    setMounted(true);
    
    // Start with a small scale and zoom in
    let startTime;
    const duration = 2000; // 2 seconds duration
    
    const animateZoom = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smoother animation (ease-out cubic)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      // Calculate scale from 0.2 to 1
      const newScale = 0.2 + (easedProgress * 0.8);
      setScale(newScale);
      
      if (progress < 1) {
        requestAnimationFrame(animateZoom);
      }
    };
    
    requestAnimationFrame(animateZoom);
  }, []);

  const handleBackClick = () => {
    router.push('/room');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-black overflow-hidden">
      <Head>
        <title>Rack</title>
      </Head>

      {/* Back button */}
      <div className="absolute top-8 left-8 z-10">
        <button
          onClick={handleBackClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="group relative flex items-center space-x-3 px-5 py-2.5 rounded-full text-white font-medium shadow-lg transition-all duration-300"
          style={{
            background: 'rgba(138, 43, 226, 0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: isHovering 
              ? '0 0 15px 2px rgba(186, 104, 255, 0.6)' 
              : '0 0 10px rgba(186, 104, 255, 0.3)',
            transform: isHovering ? 'translateX(-3px)' : 'translateX(0)',
          }}
        >
          <div className="flex items-center justify-center bg-white/20 rounded-full p-1.5 mr-1">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </div>
          
          <span 
            className="text-sm font-medium tracking-wide"
            style={{
              fontFamily: "'Poppins', sans-serif",
              letterSpacing: '0.5px',
            }}
          >
            Back to Room
          </span>
        </button>
      </div>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        
        {/* Rack container with animation */}
        <div 
          className="relative w-full max-w-4xl"
          style={{
            transform: `scale(${scale})`,
            opacity: 0.3 + (scale * 0.7), // Opacity increases with scale
            transition: 'transform 0.05s linear, opacity 0.05s linear',
            transformOrigin: 'center center'
          }}
        >
          {/* Rack image */}
          <Image 
            src="/assets/rack1.png" 
            alt="Rack" 
            layout="responsive"
            width={500}
            height={600}
            className="object-contain"
            priority
          />
          
          {/* Yellow ball component overlay */}
          {mounted && (
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="flex flex-col justify-center items-center h-full">
                <div className="w-[80%] h-[80%]">
                  <Yellow />
                </div>
                
                {/* Fifth row ball component */}
                <div className="w-[80%] mt-[-40px]">
                  <FifthRowBall />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CSS for gradient animation and font import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap');
        
        @keyframes gradientAnimation {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
      `}</style>
    </div>
  );
}

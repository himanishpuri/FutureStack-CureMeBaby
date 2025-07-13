import { useState, useEffect } from 'react';

const useGradientBackground = () => {
  const [gradientAngle, setGradientAngle] = useState(45);
  const [hue1, setHue1] = useState(0); // First color hue
  const [hue2, setHue2] = useState(60); // Second color hue, offset by 60 degrees

  // Animate gradient background
  useEffect(() => {
    const interval = setInterval(() => {
      // Change gradient angle slowly
      setGradientAngle(prev => (prev + 0.5) % 360);
      
      // Cycle through all hues (0-360) much faster
      setHue1(prev => (prev + 2) % 360);
      setHue2(prev => (prev + 2) % 360);
    }, 35); // Keep the fastest possible interval
    
    return () => clearInterval(interval);
  }, []);

  // Convert hue to HSLA colors with good saturation and lightness for visibility
  const gradientColors = {
    color1: `hsla(${hue1}, 70%, 85%, 0.8)`,
    color2: `hsla(${hue2}, 70%, 85%, 0.9)`
  };

  return { gradientAngle, gradientColors };
};

export default useGradientBackground; 
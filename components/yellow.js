import { useState, useEffect, useRef } from 'react';

// Simple Ball component with a static 2D circle
export default function Yellow() {
  const [mounted, setMounted] = useState(false);
  const [sparkleTime, setSparkleTime] = useState(0);
  const [randomizedBalls, setRandomizedBalls] = useState([]);
  
  // Animation frame reference
  const animationRef = useRef();
  
  useEffect(() => {
    setMounted(true);
    
    // Sparkle animation
    const animate = () => {
      setSparkleTime(prev => prev + 0.05);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    // Generate randomized ball placements
    generateRandomBalls();
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Function to shuffle an array (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Function to generate randomized ball placements
  const generateRandomBalls = () => {
    // Base colors - only the 5 specified colors
    const baseColors = [
      { color: '#FFD700', gradientColor: '#B8860B', name: 'yellow' },  // Yellow
      { color: '#4169E1', gradientColor: '#00008B', name: 'blue' },    // Blue
      { color: '#2E8B57', gradientColor: '#006400', name: 'green' },   // Green
      { color: '#8A2BE2', gradientColor: '#4B0082', name: 'purple' },  // Purple
      { color: '#FF4500', gradientColor: '#8B0000', name: 'red' }      // Red
    ];
    
    // Create 4 rows with randomized colors
    const rows = [];
    for (let i = 0; i < 4; i++) {
      // Shuffle the colors for this row
      const shuffledColors = shuffleArray([...baseColors]);
      
      // Add bling to multiple balls in each row (2 balls per row)
      const blingIndices = [];
      while (blingIndices.length < 2) {
        const idx = Math.floor(Math.random() * 5);
        if (!blingIndices.includes(idx)) {
          blingIndices.push(idx);
        }
      }
      
      // Apply bling to selected balls
      blingIndices.forEach(index => {
        shuffledColors[index] = { ...shuffledColors[index], bling: true };
      });
      
      rows.push(shuffledColors);
    }
    
    setRandomizedBalls(rows);
  };

  if (!mounted || randomizedBalls.length === 0) return null;

  // Function to render a ball with optional bling effect
  const renderBall = (ball, index) => (
    <div 
      key={index}
      className="rounded-full shadow-lg relative hover-float"
      style={{
        width: '80px',
        height: '80px',
        background: `radial-gradient(circle at 30% 30%, ${ball.color}, ${ball.gradientColor})`,
        boxShadow: `0 0 20px 8px rgba(${
          ball.color === '#FFD700' ? '255, 215, 0' : 
          ball.color === '#4169E1' ? '65, 105, 225' : 
          ball.color === '#2E8B57' ? '46, 139, 87' : 
          ball.color === '#8A2BE2' ? '138, 43, 226' : 
          ball.color === '#FF4500' ? '255, 69, 0' : 
          '255, 255, 255'}, 0.3), 
          inset 0 0 15px 8px rgba(255, 255, 255, 0.5)`,
        position: 'relative',
        margin: '0 8px',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-15px)';
        e.currentTarget.style.boxShadow = `0 15px 25px 8px rgba(${
          ball.color === '#FFD700' ? '255, 215, 0' : 
          ball.color === '#4169E1' ? '65, 105, 225' : 
          ball.color === '#2E8B57' ? '46, 139, 87' : 
          ball.color === '#8A2BE2' ? '138, 43, 226' : 
          ball.color === '#FF4500' ? '255, 69, 0' : 
          '255, 255, 255'}, 0.2), 
          inset 0 0 15px 8px rgba(255, 255, 255, 0.5)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 0 20px 8px rgba(${
          ball.color === '#FFD700' ? '255, 215, 0' : 
          ball.color === '#4169E1' ? '65, 105, 225' : 
          ball.color === '#2E8B57' ? '46, 139, 87' : 
          ball.color === '#8A2BE2' ? '138, 43, 226' : 
          ball.color === '#FF4500' ? '255, 69, 0' : 
          '255, 255, 255'}, 0.3), 
          inset 0 0 15px 8px rgba(255, 255, 255, 0.5)`;
      }}
    >
      {/* Shine effect */}
      <div 
        className="absolute rounded-full bg-white opacity-70"
        style={{
          width: '25px',
          height: '25px',
          top: '15px',
          left: '15px',
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)'
        }}
      />
      
      {/* Bling bling effect - only for balls with bling property */}
      {ball.bling && (
        <>
          {/* Sparkle 1 */}
          <div 
            className="absolute"
            style={{
              width: '12px',
              height: '12px',
              top: Math.sin(sparkleTime * 1.5) * 8 + 8,
              right: Math.cos(sparkleTime) * 8 + 8,
              opacity: (Math.sin(sparkleTime * 2) + 1) / 2,
              transform: `rotate(${sparkleTime * 30}deg)`,
              filter: 'blur(0.5px)'
            }}
          >
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M12,2L15,9L22,9L16,14L18,21L12,17L6,21L8,14L2,9L9,9L12,2Z" />
            </svg>
          </div>
          
          {/* Sparkle 2 */}
          <div 
            className="absolute"
            style={{
              width: '8px',
              height: '8px',
              bottom: Math.cos(sparkleTime * 1.2) * 12 + 12,
              left: Math.sin(sparkleTime * 0.8) * 12 + 12,
              opacity: (Math.sin(sparkleTime * 2 + 1) + 1) / 2,
              transform: `rotate(${-sparkleTime * 45}deg)`,
              filter: 'blur(0.5px)'
            }}
          >
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M12,2L15,9L22,9L16,14L18,21L12,17L6,21L8,14L2,9L9,9L12,2Z" />
            </svg>
          </div>
          
          {/* Pulsing glow overlay */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)',
              opacity: (Math.sin(sparkleTime) + 1) / 4,
              mixBlendMode: 'overlay'
            }}
          />
        </>
      )}
    </div>
  );

  // Get row-specific margin adjustments
  const getRowMargin = (rowIndex) => {
    switch(rowIndex) {
        case 0: // Row 1 - move down
        return { marginTop: '50px', marginBottom: '40px' };
      case 1: // Row 2 - move down
        return { marginTop: '20px', marginBottom: '40px' };
      case 3: // Row 4 - move up
        return { marginTop: '20px', marginBottom: '40px' };
      default: // Row 3 - keep as is
        return { marginTop: '20px', marginBottom: '40px' };
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ marginTop: '-80px' }}>
      {randomizedBalls.map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex justify-center"
          style={getRowMargin(rowIndex)}
        >
          <div className="flex" style={{ gap: '40px' }}>
            {row.map((ball, ballIndex) => renderBall(ball, `${rowIndex}-${ballIndex}`))}
          </div>
        </div>
      ))}
    </div>
  );
}

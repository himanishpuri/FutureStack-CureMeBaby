import React, { useEffect, useRef } from 'react';
import styles from '../styles/Cloud.module.css';

const Cloud = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas to full window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create sky gradient (white at bottom to light blue at top)
    const skyGradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    skyGradient.addColorStop(0, '#ffffff');
    skyGradient.addColorStop(1, '#87CEEB');
    
    // Cloud properties
    const clouds = [];
    const cloudCount = 8;
    
    // Initialize clouds with fixed positions
    for (let i = 0; i < cloudCount; i++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: 50 + Math.random() * (canvas.height * 0.6),
        width: 180 + Math.random() * 120,
        height: 50 + Math.random() * 30,
        opacity: 0.7 + Math.random() * 0.2,
        speed: 0.2 + Math.random() * 0.3 // Add random speed for each cloud
      });
    }
    
    // Animation variables
    let animationId;
    
    // Render function (with animation)
    function render() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw sky gradient
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw clouds
      clouds.forEach(cloud => {
        // Move cloud from left to right
        cloud.x += cloud.speed;
        
        // Reset cloud position when it moves off screen
        if (cloud.x > canvas.width + cloud.width/2) {
          cloud.x = -cloud.width;
          cloud.y = 50 + Math.random() * (canvas.height * 0.6);
        }
        
        // Draw cloud
        ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
        drawCloud(ctx, cloud.x, cloud.y, cloud.width, cloud.height);
      });
      
      // Continue animation
      animationId = requestAnimationFrame(render);
    }
    
    // Function to draw a cloud shape
    function drawCloud(ctx, x, y, width, height) {
      const numCircles = Math.floor(width / 40);
      const radiusY = height / 2;
      
      // Add shadow for 3D effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 10;
      ctx.shadowOffsetY = 10;
      
      // Draw the main cloud shape
      ctx.beginPath();
      
      // Draw multiple overlapping circles to create a cloud shape
      for (let i = 0; i < numCircles; i++) {
        const circleX = x + (i * (width / numCircles));
        const circleY = y + (Math.sin(i * 0.5) * 5);
        const radius = radiusY + (Math.sin(i) * 10);
        
        ctx.moveTo(circleX + radius, circleY);
        ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
      }
      
      ctx.fill();
      
      // Reset shadow for highlight
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Add highlight on top-left for 3D effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      
      for (let i = 0; i < numCircles; i++) {
        const circleX = x + (i * (width / numCircles)) - 5;
        const circleY = y + (Math.sin(i * 0.5) * 5) - 5;
        const radius = (radiusY + (Math.sin(i) * 10)) * 0.7;
        
        if (i < numCircles - 1) { // Don't highlight the entire cloud
          ctx.moveTo(circleX + radius, circleY);
          ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
        }
      }
      
      ctx.fill();
    }
    
    // Start animation
    render();
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // No need to call render() here as the animation is continuous
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId); // Cancel animation on component unmount
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={styles.cloudCanvas}
    />
  );
};

export default Cloud;

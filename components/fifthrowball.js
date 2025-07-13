import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

// Fifth row component with one clickable ball (no rack)
export default function FifthRowBall() {
  const [mounted, setMounted] = useState(false);
  const [sparkleTime, setSparkleTime] = useState(0);
  const [balls, setBalls] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalScale, setModalScale] = useState(0);
  const [modalOpacity, setModalOpacity] = useState(0);
  const [selectedBall, setSelectedBall] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
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
    
    // Create balls with fixed order (not randomized)
    const initialBalls = [
      { 
        color: '#4169E1', 
        gradientColor: '#00008B', 
        name: 'blue', 
        story: 'Sadness: This memory orb holds the bittersweet moments of growth, loss, and the beauty of melancholy.',
        clickable: true,
        bling: true,
        hardcodedImage: '/data/img/1.png',
        hardcodedText: 'I feel overwhelmed by a profound sense of exhaustion. The weight of endless deadlines and mounting responsibilities has become increasingly difficult to bear. Each day feels like a struggle to keep up, and despite my best efforts, the tasks continue to multiply. This constant pressure has begun to affect not just my energy levels, but my overall wellbeing.',
        date: 'October 15, 2023',
        time: '3:47 PM'
      },
      { 
        color: '#FFD700', 
        gradientColor: '#B8860B', 
        name: 'yellow', 
        story: 'Joy: This memory orb represents the happiness of childhood adventures and carefree summer days.',
        clickable: true,
        bling: true,
        hardcodedImage: '/data/img/2.png',
        hardcodedText: 'The pain of this recent breakup has left you completely devastated. Your emotions are raw and overwhelming, making it difficult to find even a moment of peace. Hours of crying have left you physically and emotionally drained. Memories keep flooding back at unexpected moments, making it nearly impossible to focus on anything else. This storm of emotions feels all-consuming, but remember that even the darkest clouds eventually pass.',
        date: 'February 28, 2024',
        time: '11:23 PM'
      },
      { 
        color: '#8A2BE2', 
        gradientColor: '#4B0082', 
        name: 'purple', 
        story: 'Fear: This memory orb embodies the cautious moments that kept you safe and taught valuable lessons.',
        clickable: true, 
        bling: true,
        useApi: true,
        date: 'July 4, 2023',
        time: '2:15 AM'
      },
      { 
        color: '#FF4500', 
        gradientColor: '#8B0000', 
        name: 'red', 
        story: 'Anger: This memory orb represents the passionate energy that fuels determination and protects what matters.' 
      },
      { 
        color: '#2E8B57', 
        gradientColor: '#006400', 
        name: 'green', 
        story: 'Disgust: This memory orb contains the protective instinct that helps avoid physical and social threats.' 
      }
    ];
    
    setBalls(initialBalls);
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Function to fetch generated image and summary
  const fetchGeneratedContent = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching generated content from API");
      
      const response = await fetch('/api/imagegen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate content');
      }
      
      const data = await response.json();
      console.log("API response received:", data);
      
      setGeneratedImage(data.image);
      setGeneratedSummary(data.summary);
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Error fetching content: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle ball click
  const handleBallClick = (ball) => {
    console.log("Ball clicked:", ball.name);
    openModal(ball);
  };

  // Function to open modal with animation
  const openModal = async (ball) => {
    console.log("Opening modal for ball:", ball.name);
    setSelectedBall(ball);
    setModalOpen(true);
    
    // Clear previous content
    setGeneratedImage(null);
    setGeneratedSummary('');
    
    // If it's the API-powered ball, fetch generated content
    if (ball.useApi) {
      await fetchGeneratedContent();
    } else if (ball.hardcodedImage) {
      // For balls with hardcoded content, set it directly
      console.log("Using hardcoded content:", ball.hardcodedImage);
      setGeneratedImage(ball.hardcodedImage);
      setGeneratedSummary(ball.hardcodedText);
      // Simulate brief loading for better UX
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
    
    // Animate the modal opening
    let startTime;
    const duration = 800; // 800ms for the animation
    
    const animateModal = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smoother animation (ease-out cubic)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      setModalScale(easedProgress);
      setModalOpacity(easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animateModal);
      }
    };
    
    requestAnimationFrame(animateModal);
  };

  // Function to close modal with animation
  const closeModal = () => {
    console.log("Closing modal");
    let startTime;
    const duration = 500; // 500ms for closing (faster than opening)
    
    const animateModalClose = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smoother animation (ease-in cubic)
      const easedProgress = Math.pow(1 - progress, 3);
      
      setModalScale(easedProgress);
      setModalOpacity(easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animateModalClose);
      } else {
        setModalOpen(false);
        // Reset the generated content when modal is closed
        setGeneratedImage(null);
        setGeneratedSummary('');
      }
    };
    
    requestAnimationFrame(animateModalClose);
  };

  if (!mounted || balls.length === 0) return null;

  return (
    <>
      <div className="w-full flex justify-center" style={{ marginTop: '-80px', marginBottom: '55px' }}>
        <div className="flex" style={{ gap: '40px' }}>
          {balls.map((ball, index) => (
            <button
              key={`fifth-row-${index}`}
              className={`rounded-full shadow-lg relative focus:outline-none ${ball.clickable ? 'cursor-pointer hover:transform hover:scale-110' : ''}`}
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
                border: ball.clickable ? '2px solid white' : 'none',
                position: 'relative',
                margin: '0 8px',
                padding: 0,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: ball.clickable ? 'pointer' : 'default',
                zIndex: 20,
                WebkitTapHighlightColor: 'transparent',
                opacity: (ball.name === 'red' || ball.name === 'green') ? 0 : 1
              }}
              onClick={() => {
                if (ball.clickable) {
                  console.log("Button click detected on", ball.name);
                  handleBallClick(ball);
                }
              }}
              disabled={!ball.clickable}
            >
              {/* Shine effect */}
              <div 
                className="absolute rounded-full bg-white opacity-70 pointer-events-none"
                style={{
                  width: '25px',
                  height: '25px',
                  top: '15px',
                  left: '15px',
                  background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)'
                }}
              />
              
              {/* Clickable indicator - only for clickable ball */}
              {ball.clickable && (
                <div className="absolute inset-0 rounded-full border-2 border-white opacity-70 animate-pulse pointer-events-none" />
              )}
              
              {/* Bling bling effect - only for balls with bling property */}
              {ball.bling && (
                <>
                  {/* Sparkle 1 */}
                  <div 
                    className="absolute pointer-events-none"
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
                    className="absolute pointer-events-none"
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
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)',
                      opacity: (Math.sin(sparkleTime) + 1) / 4,
                      mixBlendMode: 'overlay'
                    }}
                  />
                </>
              )}
              
              {/* Label for clickable balls */}
              {ball.clickable && (
                <div className="absolute -bottom-7 left-0 right-0 text-center text-xs text-white font-bold bg-black bg-opacity-50 py-1 rounded">
                  
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Modal overlay */}
      {modalOpen && selectedBall && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            opacity: modalOpacity
          }}
          onClick={closeModal}
        >
          {/* Modal content - prevent click propagation */}
          <div 
            className="relative rounded-xl overflow-hidden"
            style={{ 
              transform: `scale(${modalScale})`,
              transformOrigin: 'center center',
              maxWidth: '90%',
              maxHeight: '90%',
              transition: 'transform 0.05s ease-out',
              borderRadius: '30px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Large ball display */}
            <div className="flex flex-col items-center p-8 rounded-xl" style={{
              background: `radial-gradient(circle at 30% 30%, ${selectedBall.color}, ${selectedBall.gradientColor})`,
              boxShadow: `0 0 40px 20px rgba(${
                selectedBall.color === '#FFD700' ? '255, 215, 0' : 
                selectedBall.color === '#4169E1' ? '65, 105, 225' : 
                selectedBall.color === '#2E8B57' ? '46, 139, 87' : 
                selectedBall.color === '#8A2BE2' ? '138, 43, 226' : 
                selectedBall.color === '#FF4500' ? '255, 69, 0' : 
                '255, 255, 255'}, 0.4)`,
              borderRadius: '30px'
            }}>
              {/* Title above the ball - only show when content is loaded */}
              {!isLoading && generatedSummary && (
                <h2 className="text-3xl font-bold mb-6 capitalize font-serif text-white" style={{
                  textShadow: "0px 2px 4px rgba(0,0,0,0.3)"
                }}>Your Emotional State</h2>
              )}
              
              {/* Ball content */}
              <div className="rounded-full mb-6 relative overflow-hidden" style={{
                width: '180px',
                height: '180px',
                background: isLoading || !generatedImage ? 
                  `radial-gradient(circle at 30% 30%, ${selectedBall.color}, ${selectedBall.gradientColor})` : 
                  'none',
                boxShadow: 'inset 0 0 30px 15px rgba(255, 255, 255, 0.3), 0 0 20px 5px rgba(255, 255, 255, 0.2)',
                border: '4px solid rgba(255, 255, 255, 0.3)'
              }}>
                {/* Loading spinner */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}
                
                {/* Generated image */}
                {!isLoading && generatedImage && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                      src={generatedImage} 
                      alt="Generated image" 
                      className="w-full h-full object-cover"
                      style={{
                        borderRadius: '50%',
                        position: 'absolute',
                        top: 0,
                        left: 0
                      }}
                      onError={(e) => {
                        console.error("Image failed to load:", e);
                        e.target.src = "/main.png"; // Fallback image
                      }}
                    />
                    {/* Glass effect overlay */}
                    <div className="absolute inset-0 rounded-full" style={{
                      background: 'radial-gradient(circle at 30% 30%, transparent 60%, rgba(255,255,255,0.4) 100%)',
                      mixBlendMode: 'overlay'
                    }}/>
                    {/* Additional shine effect */}
                    <div className="absolute rounded-full" style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%)',
                      mixBlendMode: 'overlay'
                    }}/>
                  </div>
                )}
                
                {/* Shine effect - always visible */}
                <div 
                  className="absolute rounded-full bg-white opacity-70"
                  style={{
                    width: '50px',
                    height: '50px',
                    top: '30px',
                    left: '30px',
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}
                />
                
                {/* Secondary smaller shine */}
                <div 
                  className="absolute rounded-full bg-white opacity-60"
                  style={{
                    width: '25px',
                    height: '25px',
                    bottom: '40px',
                    right: '35px',
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}
                />
                
                {/* Edge highlight */}
                <div className="absolute inset-0 rounded-full border-2 border-white opacity-20 pointer-events-none"></div>
              </div>
              
              {/* Story text */}
              <div className="text-white text-center max-w-md bg-black bg-opacity-20 p-6 rounded-3xl backdrop-blur-sm">
                {isLoading ? (
                  <div className="py-4">
                    <h3 className="text-2xl font-serif mb-3">Processing Memory</h3>
                    <p className="text-lg italic font-light mb-2">Analyzing emotional patterns...</p>
                    <p className="text-md opacity-70 font-light">Extracting core feelings and experiences from your memory orb</p>
                    <div className="mt-4 flex justify-center">
                      <div className="animate-pulse flex space-x-2">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                        <div className="h-2 w-2 bg-white rounded-full animation-delay-200"></div>
                        <div className="h-2 w-2 bg-white rounded-full animation-delay-400"></div>
                      </div>
                    </div>
                  </div>
                ) : generatedSummary ? (
                  <>
                    <p className="text-lg mb-6 font-light leading-relaxed tracking-wide"
                       style={{
                         fontFamily: "'Georgia', serif",
                         textShadow: "0px 1px 2px rgba(0,0,0,0.2)",
                         lineHeight: "1.8"
                       }}>
                      {generatedSummary}
                    </p>
                    {selectedBall.date && selectedBall.time && (
                      <div className="text-sm opacity-80 mt-4 border-t border-white border-opacity-30 pt-4 font-mono">
                        <p>Memory recorded on {selectedBall.date} at {selectedBall.time}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-4 capitalize font-serif">{selectedBall.name}</h2>
                    <p className="text-lg mb-6">{selectedBall.story}</p>
                    {selectedBall.date && selectedBall.time && (
                      <div className="text-sm opacity-80 mt-2 border-t border-white border-opacity-30 pt-3 font-mono">
                        <p>Memory recorded on {selectedBall.date} at {selectedBall.time}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Close button */}
              <button 
                className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-30 rounded-full p-2"
                onClick={closeModal}
                style={{
                  backdropFilter: "blur(4px)"
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

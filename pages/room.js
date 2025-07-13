import { Canvas, useFrame, useThree } from '@react-three/fiber'
import ModelLoader from '../components/ModelLoader'
import { OrbitControls, Environment, PerspectiveCamera, useGLTF, Sky, useTexture, useAnimations } from '@react-three/drei'
import { Suspense, useRef, useState, useEffect, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { MOUSE } from 'three'
import { useRouter } from 'next/router'
import Cloud from '../components/cloud'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import Header from '../components/Header'
import { promises as fs } from 'fs'
import path from 'path'

// Character component with animations and movement
function Character({ floorMesh, onMoveComplete }) {
  const characterRef = useRef()
  const mixerRef = useRef()
  const actionsRef = useRef({})
  const targetPositionRef = useRef(new THREE.Vector3(0, -1.8, 0))
  const isMovingRef = useRef(false)
  const modelRef = useRef()
  const [model, setModel] = useState(null)
  const roomRotation = Math.PI * 0.65 // Room's rotation angle
  
  // Load character model and animations
  useEffect(() => {
    const fbxLoader = new FBXLoader()
    const textureLoader = new THREE.TextureLoader()
    
    fbxLoader.load('/character/idle.fbx', (fbxModel) => {
      console.log('Loaded idle.fbx model')
      
      textureLoader.load('/character/shaded.png', (texture) => {
        fbxModel.traverse((child) => {
          if (child.isMesh) {
            child.material.map = texture
            child.material.needsUpdate = true
          }
        })
      })
      
      const mixer = new THREE.AnimationMixer(fbxModel)
      mixerRef.current = mixer
      
      if (fbxModel.animations.length > 0) {
        const idleAction = mixer.clipAction(fbxModel.animations[0])
        actionsRef.current.idle = idleAction
        idleAction.play()
      }
      
      fbxLoader.load('/character/walk.fbx', (walkModel) => {
        if (walkModel.animations.length > 0) {
          const walkAction = mixer.clipAction(walkModel.animations[0])
          actionsRef.current.walk = walkAction
        }
      })
      
      // Initial position and scale
      fbxModel.position.set(0, -1.8, 0)
      fbxModel.scale.set(0.012, 0.012, 0.012)
      fbxModel.rotation.y = Math.PI
      
      setModel(fbxModel)
      modelRef.current = fbxModel
    })
  }, [])
  
  // Handle floor click for movement
  const { gl, camera, scene } = useThree()
  
  useEffect(() => {
    const handleClick = (event) => {
      if ((event.button === 1 || event.button === 2) && floorMesh && modelRef.current) {
        event.preventDefault()
        
        const rect = gl.domElement.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
        
        // Transform raycaster to room's coordinate system
        const roomMatrix = new THREE.Matrix4().makeRotationY(roomRotation)
        raycaster.ray.applyMatrix4(roomMatrix)
        
        const intersects = raycaster.intersectObject(floorMesh)
        
        if (intersects.length > 0) {
          const clickPoint = intersects[0].point
          
          // Convert click point to room's coordinate system
          const roomPoint = clickPoint.clone()
          roomPoint.applyMatrix4(new THREE.Matrix4().makeRotationY(-roomRotation))
          
          // Log coordinates
          console.log('Click coordinates:', {
            world: {
              x: clickPoint.x.toFixed(2),
              y: clickPoint.y.toFixed(2),
              z: clickPoint.z.toFixed(2)
            },
            room: {
              x: roomPoint.x.toFixed(2),
              y: roomPoint.y.toFixed(2),
              z: roomPoint.z.toFixed(2)
            }
          })
          
          // Check if point is within floor bounds
          if (Math.abs(roomPoint.x) <= 5 && Math.abs(roomPoint.z) <= 5) {
            targetPositionRef.current.copy(clickPoint)
            targetPositionRef.current.y = -1.8 // Keep consistent height
            
            const direction = new THREE.Vector3().subVectors(
              targetPositionRef.current,
              modelRef.current.position
            )
            
            if (direction.length() > 0.1) {
              const angle = Math.atan2(direction.x, direction.z)
              
              if (actionsRef.current.idle && actionsRef.current.walk) {
                actionsRef.current.idle.fadeOut(0.2)
                actionsRef.current.walk.reset().fadeIn(0.2).play()
                isMovingRef.current = true
              }
            }
          }
        }
      }
    }
    
    gl.domElement.addEventListener('contextmenu', (e) => e.preventDefault())
    gl.domElement.addEventListener('mousedown', handleClick)
    
    return () => {
      gl.domElement.removeEventListener('contextmenu', (e) => e.preventDefault())
      gl.domElement.removeEventListener('mousedown', handleClick)
    }
  }, [floorMesh, gl, camera, roomRotation])
  
  // Handle target position updates
  useEffect(() => {
    const handleUpdateTargetPosition = (event) => {
      const { position } = event.detail
      if (position && modelRef.current) {
        targetPositionRef.current.copy(position)
        
        const direction = new THREE.Vector3().subVectors(
          targetPositionRef.current,
          modelRef.current.position
        )
        
        if (direction.length() > 0.1) {
          if (actionsRef.current.idle && actionsRef.current.walk) {
            actionsRef.current.idle.fadeOut(0.2)
            actionsRef.current.walk.reset().fadeIn(0.2).play()
            isMovingRef.current = true
          }
        }
      }
    }
    
    window.addEventListener('updateTargetPosition', handleUpdateTargetPosition)
    return () => window.removeEventListener('updateTargetPosition', handleUpdateTargetPosition)
  }, [])
  
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
    
    if (modelRef.current && isMovingRef.current) {
      const currentPosition = modelRef.current.position
      const direction = new THREE.Vector3().subVectors(
        targetPositionRef.current,
        currentPosition
      )
      
      if (direction.length() < 0.1) {
        isMovingRef.current = false // Stop movement calculation immediately

        if (actionsRef.current.idle && actionsRef.current.walk) {
          // Start fading out walk animation
          actionsRef.current.walk.fadeOut(0.2)
          // Reset and fade in idle animation
          actionsRef.current.idle.reset().fadeIn(0.2).play()
        }

        // Call onMoveComplete after the desired delay (800ms)
        // The animation fade (200ms) happens concurrently
        if (onMoveComplete) {
          // Clear any existing timeout to prevent multiple triggers
          if (window.moveCompleteTimeout) {
            clearTimeout(window.moveCompleteTimeout)
          }
          // Set a new timeout
          window.moveCompleteTimeout = setTimeout(() => {
            // Ensure walk is fully stopped before transition, in case fadeOut is interrupted
            if (actionsRef.current.walk?.isRunning()) {
              actionsRef.current.walk.stop();
            }
            onMoveComplete() // Execute the original callback
            window.moveCompleteTimeout = null // Clear the timeout reference
          }, 500) // 0.5s delay (starts when fade starts)
        }
      } else {
        // Calculate movement direction (normalized)
        // Clone direction before normalizing so original can be used for rotation
        const moveDirection = direction.clone().normalize()
        const moveSpeed = 2.0 * delta
        const moveStep = moveDirection.multiplyScalar(moveSpeed)

        // Update rotation first based on original (non-normalized) direction
        modelRef.current.rotation.y = Math.atan2(direction.x, direction.z)
        // Move character towards target
        currentPosition.add(moveStep)
      }
    }
  })
  
  return model ? (
    <group rotation={[0, roomRotation, 0]}>
      <primitive object={model} ref={characterRef} />
    </group>
  ) : null
}

// Floor detection component
function FloorDetector({ onFloorDetected }) {
  const { scene } = useThree()
  
  useEffect(() => {
    if (!scene) {
      console.warn('Scene not available')
      return
    }

    console.log('Floor detector mounted, attempting to find floor...')
    
    // Function to find floor mesh
    const findFloorMesh = () => {
      // First try to find by name
      const floorByName = scene.getObjectByName('floor')
      if (floorByName) {
        console.log('Found floor by name:', floorByName)
        onFloorDetected(floorByName)
        return true
      }

      // Then try to find by traversing and checking geometry
      let foundFloor = false
      scene.traverse((object) => {
        if (!foundFloor && object.isMesh) {
          // Check if it's our floor by various characteristics
          const isLargeHorizontal = object.geometry?.parameters?.width >= 9
          const isFloorRotation = Math.abs(object.rotation.x + Math.PI/2) < 0.1
          const isFloorHeight = Math.abs(object.position.y + 2) < 0.1
          
          if (isLargeHorizontal && isFloorRotation && isFloorHeight) {
            console.log('Found floor by characteristics:', object)
            onFloorDetected(object)
            foundFloor = true
          }
        }
      })
      
      return foundFloor
    }

    // Try to find floor immediately
    if (!findFloorMesh()) {
      // If not found, try again after a short delay
      console.log('Floor not found initially, retrying...')
      const timer = setTimeout(() => {
        if (!findFloorMesh()) {
          console.warn('Failed to find floor mesh after retry')
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [scene, onFloorDetected])
  
  return null
}

// Debug helper to visualize the character position and floor
function DebugHelper({ floorMesh }) {
  const sphereRef = useRef()
  
  useFrame(() => {
    if (sphereRef.current && floorMesh) {
      // Position the helper sphere at center of floor
      sphereRef.current.position.set(0, -1.7, 0)
    }
  })
  
  return (
    <group rotation={[0, Math.PI * 0.65, 0]}>
      {/* Debug sphere to mark character spawn point */}
      <mesh ref={sphereRef} visible={true}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="red" wireframe={true} transparent={true} opacity={0.5} />
      </mesh>
    </group>
  )
}

// Either import your CSS module
// import styles from '../styles/Room.module.css'

// GLBModel component with character movement
function GLBModel({ url, position, rotation, scale, materialColor }) {
  const { scene } = useGLTF(url)
  const router = useRouter()
  const [isMoving, setIsMoving] = useState(false)
  
  // Function to move character to position before rack transition
  const moveToRack = () => {
    if (url.includes('rack1.glb') && !isMoving) {
      setIsMoving(true)
      
      // Convert target position to room's coordinate system
      const targetPos = new THREE.Vector3(-1.84, -1.90, -3.00)
      const roomRotation = Math.PI * 0.65
      targetPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), roomRotation)
      
      // Trigger character movement via global event
      const moveEvent = new CustomEvent('moveCharacter', {
        detail: {
          position: targetPos,
          onComplete: () => {
            setIsMoving(false)
            router.push('/rack')
          }
        }
      })
      window.dispatchEvent(moveEvent)
    }
  }
  
  return (
    <primitive 
      object={scene} 
      position={position} 
      rotation={rotation} 
      scale={scale}
      onClick={moveToRack}
    >
      <meshStandardMaterial 
        color={materialColor}
        metalness={0.5}
        roughness={0.5}
      />
    </primitive>
  )
}

// Helper component to visualize collision box
function CollisionBoxHelper({ position, size }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[size.x, size.y, size.z]} />
      <meshBasicMaterial 
        color="red" 
        wireframe={true}
        transparent={true}
        opacity={0.5}
      />
    </mesh>
  )
}

// Helper component to visualize walkable area
function WalkableAreaHelper() {
  return (
    <group rotation={[0, Math.PI * 0.65, 0]}>
      <mesh 
        position={[0, -1.9, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial 
          color="yellow" 
          wireframe={true}
          transparent={true}
          opacity={0.2}
        />
      </mesh>
    </group>
  )
}

// TV component with click handling
function TVModel({ position, rotation, scale }) {
  const router = useRouter()
  const [isMoving, setIsMoving] = useState(false)
  
  const moveToTV = () => {
    if (!isMoving) {
      setIsMoving(true)
      
      // Convert target position to room's coordinate system
      const targetPos = new THREE.Vector3(-0.62, -1.90, 3.76)
      const roomRotation = Math.PI * 0.65
      
      targetPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), roomRotation)
      
      // Trigger movement
      const moveEvent = new CustomEvent('moveCharacter', {
        detail: {
          position: targetPos,
          onComplete: () => {
            setIsMoving(false)
            router.push('/chatbot')
          }
        }
      })
      window.dispatchEvent(moveEvent)
    }
  }
  
  return (
    <group position={position} rotation={rotation} scale={scale} onClick={moveToTV}>
      <ModelLoader
        modelPath="/models/TV.obj"
        mtlPath="/models/TV.mtl"
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        scale={1}
      />
    </group>
  )
}

// Wood Floor component with procedural texture
function WoodFloor() {
  const meshRef = useRef()
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    varying vec2 vUv;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    void main() {
      // Create wood grain pattern
      vec2 st = vUv * 10.0;
      float woodGrain = random(floor(st * vec2(1.0, 10.0)));
      
      // Create plank lines
      float plankWidth = 0.1; // Width of each plank
      float plankLine = step(mod(vUv.y * 5.0, plankWidth), 0.002); // Horizontal lines
      float verticalLine = step(mod(vUv.x * 5.0, 1.0), 0.002); // Vertical lines at plank edges
      
      // Mix colors
      vec3 woodColor = mix(
        vec3(0.82, 0.70, 0.54), // Light wood color
        vec3(0.72, 0.60, 0.44), // Darker wood color
        woodGrain * 0.3 + plankLine + verticalLine
      );
      
      gl_FragColor = vec4(woodColor, 1.0);
    }
  `

  useEffect(() => {
    if (meshRef.current) {
      // Set properties to make floor easily identifiable
      meshRef.current.name = 'floor'
      meshRef.current.userData.isFloor = true
      meshRef.current.userData.type = 'floor'
      
      // Ensure proper matrix updates
      meshRef.current.updateMatrix()
      meshRef.current.updateMatrixWorld(true)
      
      console.log('Floor mesh initialized:', {
        name: meshRef.current.name,
        position: meshRef.current.position,
        rotation: meshRef.current.rotation,
        userData: meshRef.current.userData
      })
    }
  }, [])

  return (
    <mesh 
      ref={meshRef}
      name="floor"
      position={[0, -2, 0]} 
      rotation={[-Math.PI / 2, 0, 0]}
      userData={{ 
        isFloor: true,
        type: 'floor'
      }}
    >
      <boxGeometry args={[10, 10, 0.2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default function RoomScene() {
  const router = useRouter()
  const [floorMesh, setFloorMesh] = useState(null)
  const [debugMode, setDebugMode] = useState(false)
  const groupRef = useRef()
  const [moveCallback, setMoveCallback] = useState(null)
  
  // Wallet and mood tracking state
  const [walletConnected, setWalletConnected] = useState(false)
  const [showMoodTracker, setShowMoodTracker] = useState(false)
  const [hasSelectedMoodToday, setHasSelectedMoodToday] = useState(false)
  
  // Evaluate and Improve state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const modalRef = useRef(null);
  
  // Check if user has already selected mood today
  useEffect(() => {
    const checkMoodHistory = async () => {
      try {
        const response = await fetch('/api/check-mood-today');
        const data = await response.json();
        
        if (data.hasSelectedToday) {
          setHasSelectedMoodToday(true);
        }
      } catch (error) {
        console.error('Error checking mood history:', error);
      }
    };
    
    checkMoodHistory();
  }, []);
  
  // Simulate wallet connection (replace with actual wallet connection logic)
  useEffect(() => {
    // For demo purposes, we'll simulate wallet connection after 2 seconds
    const timer = setTimeout(() => {
      setWalletConnected(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Show mood tracker when wallet is connected but only if user hasn't selected mood today
  useEffect(() => {
    if (walletConnected && !hasSelectedMoodToday) {
      setShowMoodTracker(true);
    }
  }, [walletConnected, hasSelectedMoodToday]);
  
  // Handler for when mood is saved
  const handleMoodSave = (mood) => {
    setHasSelectedMoodToday(true);
    setShowMoodTracker(false);
    console.log('User mood saved:', mood);
  };
  
  // Handle character movement events
  useEffect(() => {
    const handleMoveCharacter = (event) => {
      const { position, onComplete } = event.detail
      if (position) {
        // Store the callback for when movement completes
        setMoveCallback(() => onComplete)
        // Update character target position
        window.dispatchEvent(new CustomEvent('updateTargetPosition', { 
          detail: { position } 
        }))
      }
    }
    
    window.addEventListener('moveCharacter', handleMoveCharacter)
    return () => window.removeEventListener('moveCharacter', handleMoveCharacter)
  }, [])
  
  const handleFloorDetected = useCallback((mesh) => {
    console.log('Floor detected:', mesh)
    setFloorMesh(mesh)
  }, [])
  
  useEffect(() => {
    console.log('RoomScene mounted')
    
    const handleKeyDown = (e) => {
      if (e.key === 'd') {
        setDebugMode(prev => !prev)
        console.log('Debug mode:', !debugMode)
      }
    }
    
    // Add click outside listener for modal
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [debugMode])

  // Handle evaluate and improve functionality
  const handleEvaluateImprove = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      setProcessingMessage('Running evaluation and improvement script...');
      setAiSuggestions(''); // Clear previous suggestions
      
      const response = await fetch('/api/run-script', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAiSuggestions(data.aiSuggestions || 'No AI suggestions available.');
        setProcessingMessage('✅ Evaluation complete! Click "View AI Suggestions" to see how the AI can improve.');
        
        // Keep the success message and button visible
        setTimeout(() => {
          setIsProcessing(false);
        }, 500);
      } else {
        setProcessingMessage(`❌ Error: ${data.error || 'Failed to execute script'}`);
        // Reset after 3 seconds for errors
        setTimeout(() => {
          setIsProcessing(false);
          setProcessingMessage('');
        }, 3000);
      }
    } catch (error) {
      setProcessingMessage(`❌ Error: ${error.message}`);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingMessage('');
      }, 3000);
    }
  };

  const openSuggestionsModal = () => {
    setShowSuggestions(true);
  };

  return (
    <div className="container">
      <Header />
      
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
          <Cloud />
        </div>
        
        {debugMode && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: 10,
          borderRadius: 5,
          fontFamily: 'monospace',
          zIndex: 1000
        }}>
          <p>Floor Detected: {floorMesh ? 'Yes' : 'No'}</p>
          <p>Press 'D' to toggle debug view</p>
          <p>Middle mouse or right-click to move character</p>
        </div>
      )}
      
      {/* Mood Tracker Modal */}
      {showMoodTracker && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="relative z-10 bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-center">Welcome! How are you feeling today?</h2>
            
            <div className="grid grid-cols-5 gap-4 mb-8">
              {[
                { value: 1, label: '😞', description: 'Very Bad' },
                { value: 2, label: '😕', description: 'Bad' },
                { value: 3, label: '😐', description: 'Neutral' },
                { value: 4, label: '🙂', description: 'Good' },
                { value: 5, label: '😄', description: 'Very Good' }
              ].map((mood) => (
                <button
                  key={mood.value}
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/save-mood', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          mood: mood.value,
                          date: new Date().toISOString().split('T')[0]
                        })
                      });
                      
                      if (response.ok) {
                        handleMoodSave(mood);
                      } else {
                        console.error('Failed to save mood');
                      }
                    } catch (error) {
                      console.error('Error saving mood:', error);
                    }
                  }}
                  className="flex flex-col items-center p-4 rounded-lg transition-all hover:bg-gray-100"
                >
                  <span className="text-4xl mb-2">{mood.label}</span>
                  <span className="text-sm text-gray-600">{mood.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Evaluate and Improve Button */}
      <div className="evaluateButtonContainer">
        <button 
          className={`evaluateButton ${isProcessing ? 'processing' : ''}`}
          onClick={handleEvaluateImprove}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="loadingSpinner"></span>
              Processing...
            </>
          ) : 'Evaluate & Improve'}
        </button>
        
        {processingMessage && (
          <div className="processingMessage">{processingMessage}</div>
        )}
        
        {aiSuggestions && !isProcessing && (
          <button 
            className="viewSuggestionsButton" 
            onClick={openSuggestionsModal}
          >
            View AI Suggestions
          </button>
        )}
      </div>
      
      {/* AI Suggestions Modal */}
      {showSuggestions && (
        <div className="modalOverlay">
          <div className="suggestionsModal" ref={modalRef}>
            <div className="modalHeader">
              <h3>AI Improvement Suggestions</h3>
              <button 
                className="closeButton" 
                onClick={() => setShowSuggestions(false)}
              >
                ×
              </button>
            </div>
            <div className="modalContent">
              <div className="aiSuggestionsText">
                {aiSuggestions.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
            <div className="modalFooter">
              <button 
                className="closeModalButton" 
                onClick={() => setShowSuggestions(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Canvas
        onCreated={({ gl, scene }) => {
          console.log('Canvas created, scene:', scene)
          scene.updateMatrixWorld(true)
        }}
      >
          <PerspectiveCamera makeDefault position={[3.24, 0.69, 0.66]} fov={75} />
          <ambientLight intensity={1.2} color="#ffffff" />
          <directionalLight position={[3, 5, 3]} intensity={0.8} color="#f5f5dc" castShadow />
          <spotLight position={[0, 5, 0]} angle={0.6} penumbra={0.8} intensity={0.7} distance={15} castShadow />
          <hemisphereLight args={["#b1e1ff", "#ffeeb1", 0.6]} /> 

        <Suspense fallback={null}>
          {/* Floor detector component to find the floor mesh */}
          <FloorDetector onFloorDetected={handleFloorDetected} />
          
          {/* Debug helper */}
          {debugMode && floorMesh && <DebugHelper floorMesh={floorMesh} />}
          
          {/* Add the walkable area helper */}
          {debugMode && <WalkableAreaHelper />}
          
          <group 
            ref={groupRef} 
            position={[0, 0, 0]} 
            rotation={[0, Math.PI * 0.65, 0]}
            onUpdate={(self) => {
              self.updateMatrixWorld(true)
            }}
          >
            {/* Back wall */}
            <mesh position={[0, 0, -5]} rotation={[0, 0, 0]}>
              <boxGeometry args={[10, 4, 0.2]} />
              <meshStandardMaterial color="#ADD8E6" roughness={0.4} metalness={0.1} />
            </mesh>
            
            {/* Right wall */}
            <mesh position={[5, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <boxGeometry args={[10, 4, 0.2]} />
              <meshStandardMaterial color="#ADD8E6" roughness={0.4} metalness={0.1} />
            </mesh>
            
            {/* Floor - IMPORTANT: This must be present for character movement */}
            <WoodFloor />
            
            {/* Character - only render when floor is detected */}
            {floorMesh && <Character floorMesh={floorMesh} onMoveComplete={moveCallback} />}
            
            {/* TV Stand */}
            <ModelLoader
              modelPath="/models/TV_stand.obj"
              mtlPath="/models/TV_stand.mtl"
              position={[-3, -2, -4.4]}
              rotation={[0, -Math.PI/2, 0]}
              scale={1.5}
            />

              {/* TV Stand */}

              <GLBModel
                url="/models/TV_stand.glb"
                position={[-3, -2, -4.4]}
                rotation={[0, 0, 0]}
                scale={1.8}
                materialColor="#2D1B3C"
              />

              {/* TV */}
              <TVModel
                position={[-3, -0.8, -4.4]}
                rotation={[0, -Math.PI / 2, 0]}
                scale={1.5}
              />


              <GLBModel
                url="/models/carpet.glb"
                position={[1.1, -2.35, 0]}
                rotation={[0, 0, 0]}
                scale={2.5}
                materialColor="#2D1B3C"
              />

              
              {/* left flower */}
              <GLBModel
                url="/models/tall_flower2.glb"
                position={[4, -1.9, -4]}
                rotation={[0, 0, 0]}
                scale={1.3}
                materialColor="#2D1B3C"
              />
              {/* Right flower */}
              <GLBModel
                url="/models/tall_flower.glb"
                position={[4, -1.9, 3.4]}
                rotation={[0, 0, 0]}
                scale={1.3}
                materialColor="#2D1B3C"
              />

              <GLBModel
                url="/models/wall_lamp2.glb"
                position={[4.4, 0.6, 3.5]}
                rotation={[0, -Math.PI / 2, 0]}
                scale={0.8}
                materialColor="#2D1B3C"
              />

              <GLBModel
                url="/models/wallLamp.glb"
                position={[4.0, 0.6, -4.2]}
                rotation={[0, 0, 0]}
                scale={0.8}
                materialColor="#2D1B3C"
              />
              

              <GLBModel
                url="/models/picture_frame.glb"
                position={[4.8, 0, -3.5]}
                rotation={[0, -Math.PI / 2, 0]}
                scale={1}
                materialColor="#2D1B3C"
              />

              {/* Rack */}
              <GLBModel
                url="/models/rack1.glb"
                position={[4.6, -2, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                scale={2}
                materialColor="#2D1B3C"
              />
              <GLBModel
                url="/models/curtains.glb"
                position={[1, -0.2, -4.3]}
                rotation={[0, 0, 0]}
                scale={2}
                materialColor="#2D1B3C"
              />

              <GLBModel
                url="/models/window.glb"
                position={[1, -0.3, -4.6]}
                rotation={[0, 0, 0]}
                scale={1.8}
                materialColor="#2D1B3C"
              />

              <GLBModel
                url="/models/sofa.glb"
                position={[1, -2, -3.5]}
                rotation={[0, 0, 0]}
                scale={2.1}
                materialColor="#2D1B3C"
              />
            </group>
          </Suspense>
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
          maxDistance={20}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,    // Rotate camera around target
            MIDDLE: THREE.MOUSE.PAN,     // Pan camera freely
            RIGHT: THREE.MOUSE.NONE      // Reserved for character movement
          }}
          screenSpacePanning={true}      // Enable screen space panning
          panSpeed={1.5}                 // Adjust pan speed
          target0={[0, 0, 0]}           // Initial target position
          position0={[5, 3, 5]}         // Initial camera position
          enableDamping={true}          // Smooth camera movement
          dampingFactor={0.05}          // Adjust damping strength
          />
        </Canvas>
      </div>
      
      <style jsx>{`
        .container {
          width: 100%;
          min-height: 100vh;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
        }
        
        /* Evaluate Button Styles */
        .evaluateButtonContainer {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        .evaluateButton {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 180px;
          gap: 8px;
        }
        
        .evaluateButton:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }
        
        .evaluateButton:active {
          transform: translateY(0);
        }
        
        .evaluateButton.processing {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          cursor: not-allowed;
          opacity: 0.8;
        }
        
        .loadingSpinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .processingMessage {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 18px;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-top: 12px;
          max-width: 350px;
          animation: fadeIn 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          line-height: 1.4;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* View Suggestions Button */
        .viewSuggestionsButton {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 180px;
          margin-top: 12px;
          animation: fadeIn 0.5s ease;
        }
        
        .viewSuggestionsButton:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }
        
        /* Modal Styles */
        .modalOverlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease;
        }
        
        .suggestionsModal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          animation: modalZoomIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        
        @keyframes modalZoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .modalHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .modalHeader h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #1f2937;
          font-weight: 600;
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .closeButton {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        
        .closeButton:hover {
          background-color: #f3f4f6;
          color: #111827;
        }
        
        .modalContent {
          padding: 24px;
          overflow-y: auto;
          max-height: calc(80vh - 140px);
        }
        
        .aiSuggestionsText {
          font-size: 1rem;
          line-height: 1.6;
          color: #374151;
        }
        
        .aiSuggestionsText p {
          margin-bottom: 16px;
        }
        
        .modalFooter {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
        }
        
        .closeModalButton {
          background-color: #f3f4f6;
          color: #111827;
          border: none;
          border-radius: 6px;
          padding: 10px 16px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .closeModalButton:hover {
          background-color: #e5e7eb;
        }
      `}</style>
    </div>
  )
} 
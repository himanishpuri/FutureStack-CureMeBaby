import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles/Chatbot.module.css';
import ChatHeader from './TherapeuticChat/ChatHeader';
import MessageList from './TherapeuticChat/MessageList';
import ChatInput from './TherapeuticChat/ChatInput';
import ContextSection from './TherapeuticChat/ContextSection';
import useGradientBackground from './TherapeuticChat/hooks/useGradientBackground';
import useChatMessages from './TherapeuticChat/hooks/useChatMessages';
import useFileUpload from './TherapeuticChat/hooks/useFileUpload';

const TherapeuticChat = () => {
  const { gradientAngle, gradientColors } = useGradientBackground();
  const { 
    messages, 
    setMessages,
    loading, 
    handleSubmitMessage,
    messagesEndRef
  } = useChatMessages();
  
  const {
    files,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    removeFile,
    fileInputRef,
    isProcessing
  } = useFileUpload({ setMessages });

  // State for context modal visibility
  const [showContextModal, setShowContextModal] = useState(false);

  // State to track client-side mounting for Portal
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Clean up function for when component unmounts
    return () => setIsMounted(false);
  }, []); // Empty dependency array means this runs once on mount

  // Function to toggle the context modal
  const toggleContextModal = () => setShowContextModal(prev => !prev);

  // Function to handle clearing all vectors
  const handleClearVectors = async () => {
    // Add a loading state or visual cue if desired
    setMessages(prev => [...prev, { text: "Clearing all context... Please wait.", sender: 'bot' }]);
    try {
      const response = await fetch('/api/delete-vectors', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        // Clear the local file list as well
        // Note: The useFileUpload hook doesn't currently export a way to clear all files.
        // This might need refinement depending on desired behavior.
        setMessages(prev => [...prev, { 
          text: data.message || "All context and associated files have been successfully cleared.", 
          sender: 'bot' 
        }]);
        // Optionally close the modal after success
        // toggleContextModal(); 
      } else {
         setMessages(prev => [...prev, { 
          text: `**Error:** ${data.message || 'Failed to clear context.'}`, 
          sender: 'bot' 
        }]);
      }
    } catch (error) {
      console.error('Error clearing vectors:', error);
       setMessages(prev => [...prev, { 
        text: "**Error:** An unexpected error occurred while clearing context. Please try again.", 
        sender: 'bot' 
      }]);
    }
  };

  // --- Prepare Modal Content --- 
  const modalContent = (
    <div 
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          toggleContextModal();
        }
      }}
    >
      <div className={styles.modalContent}>
        <button 
          onClick={toggleContextModal} 
          className={styles.modalCloseButton}
          aria-label="Close context settings"
        >
          &times;
        </button>
        
        <ContextSection 
          isDragging={isDragging}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          fileInputRef={fileInputRef}
          handleFileInputChange={handleFileInputChange}
          files={files}
          removeFile={removeFile}
          isProcessing={isProcessing}
        />

        <div className={styles.manageContextContainer}>
          <h3 className={styles.manageContextTitle}>Manage All Context</h3>
          <button 
            onClick={handleClearVectors}
            className={styles.clearContextButton}
          >
            Clear All Uploaded Context
          </button>
          <p className={styles.clearContextDescription}>
              This will permanently remove all documents you've uploaded and their associated data from my memory.
          </p>
        </div>
      </div>
    </div>
  );
  // --- End Modal Content --- 

  return (
    <div className={styles.chatbotWrapperLarge}>
      {/* --- Portal for Context Modal --- */}  
      {isMounted && showContextModal && createPortal(
        modalContent,
        document.body
      )}
      {/* --- End Portal --- */} 

      {/* Main Chat Interface */}  
      <div 
        className={styles.chatbotContainer}
        style={{
          background: `linear-gradient(${gradientAngle}deg, ${gradientColors.color1}, ${gradientColors.color2})`
        }}
      >
        {/* Pass the toggle function to the header */}
        <ChatHeader toggleContextModal={toggleContextModal} /> 
        <MessageList messages={messages} messagesEndRef={messagesEndRef} />
        <ChatInput 
          loading={loading} 
          onSubmit={handleSubmitMessage} 
        />
      </div>
    </div>
  );
};

export default TherapeuticChat; 
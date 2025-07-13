import { useState } from 'react';
import styles from '../../styles/Chatbot.module.css';

const ChatInput = ({ loading, onSubmit }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === '' || loading) return;
    
    // Pass the input to the parent component's submit handler
    onSubmit({ 
      preventDefault: () => {}, 
      target: e.target 
    });
    
    // Reset the input field
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inputForm}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message here..."
        className={styles.messageInput}
        disabled={loading}
      />
      <button type="submit" className={styles.sendButton} disabled={loading || !input.trim()}>
        {loading ? (
          <div className={styles.loadingSpinner}></div>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        )}
      </button>
      
      <style jsx>{`
        .${styles.loadingSpinner} {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
};

export default ChatInput; 
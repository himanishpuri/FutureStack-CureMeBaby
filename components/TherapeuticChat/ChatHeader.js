import styles from '../../styles/Chatbot.module.css';

const ChatHeader = ({ toggleContextModal }) => {
  return (
    <div className={styles.chatHeader}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2>AI Companion</h2>
        <button 
          onClick={toggleContextModal}
          title="Manage Context"
          aria-label="Manage Context Settings"
          style={contextButtonStyle}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19.1 14.9C20.2 14.2 21 13.2 21 12c0-1.2-.8-2.2-1.9-2.9L18.6 9c-.4-.2-.7-.5-.9-.9l-.6-1.4C16.8 4.8 15.2 4 14 4h-4c-1.2 0-2.8.8-3.2 2.7l-.6 1.4c-.2.4-.5.7-.9.9l-1.5.9C2.8 9.8 2 10.8 2 12c0 1.2.8 2.2 1.9 2.9L4.4 15c.4.2.7.5.9.9l.6 1.4c.4 1.9 2 2.7 3.2 2.7h4c1.2 0 2.8-.8 3.2-2.7l.6-1.4c.2-.4.5-.7.9-.9l1.5-.9z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>
      <div className={styles.statusIndicator}></div>
    </div>
  );
};

const contextButtonStyle = {
  background: 'none',
  border: 'none',
  marginLeft: '10px',
  cursor: 'pointer',
  color: '#555',
  padding: '5px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s ease',
};

contextButtonStyle[':hover'] = {
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
};

export default ChatHeader; 
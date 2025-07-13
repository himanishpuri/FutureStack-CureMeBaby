import styles from '../../styles/Chatbot.module.css';
import Message from './Message';

const MessageList = ({ messages, messagesEndRef }) => {
  return (
    <div className={styles.messagesContainer}>
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList; 
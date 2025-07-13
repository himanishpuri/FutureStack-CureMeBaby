import styles from '../../styles/Chatbot.module.css';

const Message = ({ message }) => {
  return (
    <div 
      className={`${styles.message} ${styles[message.sender]} ${message.type === 'welcome' ? styles.welcome : ''} ${message.isLoading ? styles.loading : ''}`}
    >
      {message.isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      ) : (
        message.text.split('\n\n').map((paragraph, i) => {
          // Handle section titles (bolded text)
          if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')) {
            return (
              <h3 key={i} className={styles.sectionTitle}>
                {paragraph.replace(/\*\*/g, '')}
              </h3>
            );
          }
          
          // Handle bullet points with emphasis
          if (paragraph.trim().startsWith('- **')) {
            const [title, ...content] = paragraph.substring(2).split('**');
            return (
              <div key={i} className={styles.bulletPoint}>
                <strong>{title.trim()}</strong>
                {content.join('').replace(/\*\*/g, '')}
              </div>
            );
          }

          // Handle regular bullet points
          if (paragraph.trim().startsWith('- ')) {
            return (
              <div key={i} className={styles.bulletPoint}>
                {paragraph.substring(2)}
              </div>
            );
          }

          // Handle numbered items
          if (paragraph.match(/^\d+\.\s/)) {
            return (
              <div key={i} className={styles.numberedItem}>
                {paragraph}
              </div>
            );
          }

          // Handle regular paragraphs
          return paragraph.trim() ? (
            <p key={i} className={styles.messageParagraph}>
              {paragraph}
            </p>
          ) : null;
        })
      )}
      
      <style jsx>{`
        .${styles.sectionTitle} {
          font-size: 17px;
          font-weight: 600;
          margin: 16px 0 12px 0;
          color: #f8fafc;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 8px;
        }
        
        .${styles.bulletPoint} {
          margin: 8px 0 8px 12px;
          position: relative;
          padding-left: 16px;
        }
        
        .${styles.bulletPoint}::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #a5b4fc;
        }
        
        .${styles.bulletPoint} strong {
          margin-right: 4px;
          color: #e0e7ff;
        }
        
        .${styles.numberedItem} {
          margin: 8px 0 8px 12px;
          padding-left: 24px;
          position: relative;
        }
        
        .${styles.messageParagraph} {
          margin: 12px 0;
        }
      `}</style>
    </div>
  );
};

export default Message; 
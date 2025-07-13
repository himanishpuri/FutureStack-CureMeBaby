import styles from '../../styles/Chatbot.module.css';

const FileItem = ({ file, index, onRemove, disabled }) => {
  return (
    <div className={`${styles.fileItem} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.fileIcon}>
        {file.type.includes('image') ? (
          <span className={styles.emojiIcon}>🖼️</span>
        ) : file.type.includes('pdf') ? (
          <span className={styles.emojiIcon}>📄</span>
        ) : (
          <span className={styles.emojiIcon}>📃</span>
        )}
      </div>
      <div className={styles.fileName}>{file.name}</div>
      <button 
        className={styles.removeFileBtn}
        onClick={() => !disabled && onRemove(index)}
        aria-label="Remove file"
        disabled={disabled}
      >
        <span className={styles.emojiIcon}>✖️</span>
      </button>

      <style jsx>{`
        .${styles.disabled} {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .${styles.disabled} button {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default FileItem; 
import styles from '../../styles/Chatbot.module.css';
import FileList from './FileList';

const ContextSection = ({ 
  isDragging, 
  handleDragOver, 
  handleDragLeave, 
  handleDrop, 
  fileInputRef, 
  handleFileInputChange, 
  files, 
  removeFile,
  isProcessing 
}) => {
  return (
    <div className={styles.contextSection}>
      <div className={styles.contextGlow}></div>
      <div className={styles.contextContent}>
        <div className={styles.contextHeader}>
          <svg className={styles.contextIcon} width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 className={styles.contextTitle}>✨ Share Your Context ✨</h2>
        </div>
        
        <p className={styles.contextDescription}>
          Upload personal documents that can help me understand you better:
        </p>
        
        <ul className={styles.contextList}>
          <li>
            <span className={styles.emojiIcon}>📝</span>
            Journal entries or personal reflections
          </li>
          <li>
            <span className={styles.emojiIcon}>🩺</span>
            Medical or therapy history (if comfortable sharing)
          </li>
          <li>
            <span className={styles.emojiIcon}>🌟</span>
            Important life events or experiences
          </li>
          <li>
            <span className={styles.emojiIcon}>🎯</span>
            Personal goals or aspirations
          </li>
          <li>
            <span className={styles.emojiIcon}>📚</span>
            Any other documents relevant to your journey
          </li>
        </ul>
        
        <div className={styles.securityNoteContainer}>
          <span className={styles.emojiIcon}>🔒</span>
          <p className={styles.securityNote}>
            Your documents are processed securely and used only to provide more personalized support.
          </p>
        </div>
        
        <div 
          className={`${styles.contextDropZone} ${isDragging ? styles.dragging : ''} ${isProcessing ? styles.processing : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current.click()}
        >
          <div className={styles.dropZoneContent}>
            <div className={styles.uploadIconContainer}>
              {isProcessing ? (
                <div className={styles.processingSpinner}></div>
              ) : (
                <>
                  <span className={styles.uploadEmoji}>📤</span>
                  <div className={styles.uploadGlow}></div>
                </>
              )}
            </div>
            <p>{isProcessing ? 'Processing documents...' : 'Drop your document here or click to browse'}</p>
            {!isProcessing && <span>Supported formats: PDF, JPG, PNG, TXT, DOC, DOCX</span>}
          </div>
        </div>
        
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
          disabled={isProcessing}
        />
        
        {/* File List */}
        {files.length > 0 && (
          <FileList files={files} removeFile={removeFile} isProcessing={isProcessing} />
        )}

        <style jsx>{`
          .${styles.processingSpinner} {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .${styles.processing} {
            cursor: not-allowed;
            opacity: 0.7;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ContextSection; 
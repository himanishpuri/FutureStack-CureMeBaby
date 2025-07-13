import styles from '../../styles/Chatbot.module.css';
import FileItem from './FileItem';

const FileList = ({ files, removeFile, isProcessing }) => {
  return (
    <div className={`${styles.fileList} ${isProcessing ? styles.processing : ''}`}>
      <div className={styles.fileListHeader}>
        <span className={styles.emojiIcon}>📎</span>
        <h3>Uploaded Files</h3>
      </div>
      {files.map((file, index) => (
        <FileItem 
          key={index} 
          file={file} 
          index={index} 
          onRemove={removeFile}
          disabled={isProcessing}
        />
      ))}
    </div>
  );
};

export default FileList; 
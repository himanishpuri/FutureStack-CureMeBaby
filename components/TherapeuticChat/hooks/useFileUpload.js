import { useState, useRef } from 'react';

const useFileUpload = ({ setMessages }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };
  
  const handleFileInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };
  
  const handleFiles = async (newFiles) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    // Filter for supported file types
    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    // Check if any file is not supported
    const validFiles = [];
    const invalidFiles = [];
    
    newFiles.forEach(file => {
      if (supportedTypes.includes(file.type)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
      }
    });
    
    // If no valid files were found, show a single error message
    if (validFiles.length === 0 && invalidFiles.length > 0) {
      setMessages(prev => [...prev, { 
        text: `**File Upload Error**\n\nSorry, I can only accept PDF, JPG, PNG, TXT, DOC, and DOCX files.`, 
        sender: 'bot' 
      }]);
      setIsProcessing(false);
      return;
    }
    
    // Show a message if some files were filtered out
    if (invalidFiles.length > 0 && validFiles.length > 0) {
      setMessages(prev => [...prev, { 
        text: `**File Upload Warning**\n\nSome files were not supported and were skipped. I only accept PDF, JPG, PNG, TXT, DOC, and DOCX files.`, 
        sender: 'bot' 
      }]);
    }
    
    // No files to process
    if (validFiles.length === 0) {
      setIsProcessing(false);
      return;
    }
    
    // Combine all file processing results into a single message
    let processedCount = 0;
    let failedCount = 0;
    const processedFiles = [];
    const failedFiles = [];
    
    for (const file of validFiles) {
      try {
        // Add file to the list for display
        setFiles(prev => [...prev, file]);
        
        // Create form data for the file
        const formData = new FormData();
        formData.append('document', file);
        
        // First parse the document
        const parseResponse = await fetch('/api/parse', {
          method: 'POST',
          body: formData,
        });

        if (!parseResponse.ok) {
          throw new Error('Failed to parse document');
        }

        const parseData = await parseResponse.json();

        // Then ingest the parsed content
        const ingestResponse = await fetch('/api/ingest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentId: file.name,
            htmlContent: parseData.content.html
          }),
        });

        if (!ingestResponse.ok) {
          throw new Error('Failed to process document');
        }
        
        processedCount++;
        processedFiles.push(file.name);
      } catch (error) {
        console.error('Error processing file:', error);
        // Remove the file from the list if processing failed
        setFiles(prev => prev.filter(f => f.name !== file.name));
        failedCount++;
        failedFiles.push(file.name);
      }
    }
    
    // Show single success message for all processed files
    if (processedCount > 0) {
      const fileNames = processedFiles.join('", "');
      const message = processedCount === 1
        ? `**Document Processed Successfully**\n\nI've processed "${fileNames}". I'll use this information to provide more personalized responses.`
        : `**Documents Processed Successfully**\n\nI've processed ${processedCount} files:\n- "${fileNames}"\n\nI'll use this information to provide more personalized responses.`;
      
      setMessages(prev => [...prev, { text: message, sender: 'bot' }]);
    }
    
    // Show single error message for all failed files
    if (failedCount > 0) {
      const fileNames = failedFiles.join('", "');
      const message = failedCount === 1
        ? `**Document Processing Error**\n\nSorry, I couldn't process "${fileNames}". Please try again or upload a different file.`
        : `**Document Processing Error**\n\nSorry, I couldn't process ${failedCount} files:\n- "${fileNames}"\n\nPlease try again or upload different files.`;
      
      setMessages(prev => [...prev, { text: message, sender: 'bot' }]);
    }
    
    setIsProcessing(false);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeFile = async (index) => {
    const fileToRemove = files[index];
    
    try {
      // Remove from UI first
      setFiles(prev => prev.filter((_, i) => i !== index));
      
      // Then attempt to delete vectors associated with this file
      const response = await fetch('/api/delete-vectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: fileToRemove.name
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove document');
      }

      // Add success message to chat
      setMessages(prev => [...prev, {
        text: `**Document Removed Successfully**\n\nI've removed "${fileToRemove.name}" and its information from my memory.`,
        sender: 'bot'
      }]);

    } catch (error) {
      console.error('Error removing file:', error);
      // Add error message to chat
      setMessages(prev => [...prev, {
        text: `**Document Removal Error**\n\nFailed to remove "${fileToRemove.name}" from memory. Please try again.`,
        sender: 'bot'
      }]);
      // Add the file back to the list since deletion failed
      setFiles(prev => [...prev, fileToRemove]);
    }
  };

  return {
    files,
    isDragging,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    removeFile,
    isProcessing
  };
};

export default useFileUpload; 
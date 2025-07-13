import { useState, useEffect, useRef } from 'react';

const useChatMessages = () => {
  const [messages, setMessages] = useState([
    { 
      text: `**Welcome to Your AI Companion**

Thank you for reaching out. I'm here to provide a supportive space where you can explore your thoughts and feelings freely. Whether you're going through a challenging time or simply looking for someone to talk to, I'm here to listen without judgment.

Everyone faces difficulties at times, and having someone to talk with can make a significant difference. I'm designed to offer thoughtful responses and helpful perspectives based on therapeutic approaches.

This is a confidential space where you can share as much or as little as you feel comfortable with. You can type your thoughts directly or upload relevant documents that might help me better understand your situation.

How are you feeling today?`, 
      sender: 'bot',
      type: 'welcome'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  // Scroll to top when component first mounts
  useEffect(() => {
    // Force scroll to top on initial load
    if (messagesEndRef.current?.parentElement) {
      messagesEndRef.current.parentElement.scrollTop = 0;
    }
  }, []);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    // Only scroll if there's more than the initial welcome message
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    
    // Extract the input value
    const userInput = input || e.target?.querySelector('input')?.value;
    
    if (!userInput || userInput.trim() === '') return;
    
    // Add user message with proper formatting
    const userMessage = { 
      text: userInput,
      sender: 'user' 
    };
    setMessages(prev => [...prev, userMessage]);
    
    setLoading(true);
    
    // Add loading message
    const loadingMessage = {
      text: "Thinking...",
      sender: 'bot',
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);
    
    try {
      // Format messages for the API
      const apiMessages = messages
        .concat(userMessage)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: userInput,
          messages: apiMessages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();
      
      // Remove loading message and add assistant message
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading);
        return [...filtered, { 
          text: data.answer, 
          sender: 'bot' 
        }];
      });
    } catch (error) {
      console.error('Error:', error);
      // Remove loading message and add error message
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading);
        return [...filtered, { 
          text: `**Error**\n\nI apologize, but I encountered an issue processing your message. Please try again.`, 
          sender: 'bot' 
        }];
      });
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return {
    messages,
    setMessages,
    loading,
    input,
    setInput,
    handleSubmitMessage,
    messagesEndRef
  };
};

export default useChatMessages; 
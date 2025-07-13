import { useState } from 'react';
import { motion } from 'framer-motion';

const moods = [
  { value: 1, label: '😞', description: 'Very Bad' },
  { value: 2, label: '😕', description: 'Bad' },
  { value: 3, label: '😐', description: 'Neutral' },
  { value: 4, label: '🙂', description: 'Good' },
  { value: 5, label: '😄', description: 'Very Good' }
];

export default function MoodTracker({ 
  onSave, // Callback function when mood is saved
  buttonText = "How are you feeling today?", // Customizable button text
  buttonClassName = "", // Additional button classes
  modalTitle = "How are you feeling today?" // Customizable modal title
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    
    try {
      const response = await fetch('/api/save-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mood: mood.value,
          date: new Date().toISOString().split('T')[0]
        })
      });
      
      if (response.ok) {
        setSaveStatus('Mood saved successfully!');
        if (onSave) onSave(mood); // Call the callback function if provided
        setTimeout(() => {
          closeModal();
          setSaveStatus('');
        }, 1500);
      } else {
        setSaveStatus('Failed to save mood. Please try again.');
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      setSaveStatus('Error saving mood. Please try again.');
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className={`px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors ${buttonClassName}`}
      >
        {buttonText}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-semibold mb-6 text-center">{modalTitle}</h2>
            
            <div className="grid grid-cols-5 gap-4 mb-8">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodSelect(mood)}
                  className={`flex flex-col items-center p-4 rounded-lg transition-all ${
                    selectedMood?.value === mood.value 
                      ? 'bg-blue-100 ring-2 ring-blue-500' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-4xl mb-2">{mood.label}</span>
                  <span className="text-sm text-gray-600">{mood.description}</span>
                </button>
              ))}
            </div>
            
            {saveStatus && (
              <p className={`text-center mb-4 ${saveStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {saveStatus}
              </p>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
} 
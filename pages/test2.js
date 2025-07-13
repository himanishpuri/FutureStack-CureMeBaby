import MoodTracker from '../components/MoodTracker/MoodTracker.js';

export default function Test2Page() {   
  const handleMoodSave = (mood) => {
    console.log('Mood saved:', mood);
    // You can do additional handling here
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-8">Daily Mood Tracker</h1>
      <MoodTracker 
        onSave={handleMoodSave}
        buttonClassName="w-64" // Example of customizing the button width
      />
    </div>
  );
}

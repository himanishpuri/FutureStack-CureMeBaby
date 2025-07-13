// pages/test.js

import { useState, useEffect } from "react";

export default function TestPage() {
  const [summary, setSummary] = useState("");
  const [image, setImage] = useState(null);
  const [savedPath, setSavedPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateSummaryAndImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/imagegen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate summary and image");
      }
      
      const data = await res.json();
      setSummary(data.summary);
      setImage(data.image);
      setSavedPath(data.savedPath);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <h1 className="text-2xl mb-6 font-bold">Emotional Support Image Generator</h1>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">
          This tool analyzes your chat history to understand your emotional state, generates a summary, 
          and creates a supportive image based on that understanding.
        </p>
      </div>
      
      <button
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-medium"
        onClick={generateSummaryAndImage}
        disabled={loading}
      >
        {loading ? "Processing..." : "Generate Summary & Image"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {summary && (
        <div className="mt-8 p-5 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Your Current Emotional State:</h2>
          <p className="text-gray-800 text-lg leading-relaxed">{summary}</p>
        </div>
      )}

      <div className="mt-8 flex items-start gap-10 flex-wrap">
        <div>
          <p className="text-sm text-gray-500 mb-2">Reference Character:</p>
          <img src="/main.png" alt="Main character" className="w-48 rounded shadow-md" />
        </div>

        {image && (
          <div className="flex-1 min-w-[300px]">
            <p className="text-sm text-gray-500 mb-2">Your Supportive Image:</p>
            <img src={image} alt="Generated result" className="rounded-lg shadow-lg w-full max-w-md" />
            {savedPath && (
              <p className="mt-2 text-sm text-gray-600">
                Image saved locally at: {savedPath}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
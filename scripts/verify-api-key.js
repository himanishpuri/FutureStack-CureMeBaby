// Simple script to verify the RedPill API key is working
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env' });

async function verifyApiKey() {
  console.log("Verifying RedPill API key...");
  
  // Check if API key is set
  const apiKey = process.env.REDPILL_API_KEY;
  if (!apiKey) {
    console.error("❌ ERROR: REDPILL_API_KEY environment variable is not set in .env");
    console.log("Please add your API key to the .env file:");
    console.log("REDPILL_API_KEY=your_api_key_here");
    return;
  }
  
  // Check if the API key looks valid (not the placeholder)
  if (apiKey === "your_api_key_here") {
    console.error("❌ ERROR: You're using the placeholder API key. Please replace it with your actual key from RedPill.ai");
    return;
  }

  // Log partial API key for debugging
  const prefix = apiKey.substring(0, 4);
  const suffix = apiKey.substring(apiKey.length - 4);
  console.log(`Using API key: ${prefix}...${suffix}`);
  
  try {
    // Make a simple API call to test the key
    console.log("Sending test request to RedPill API...");
    const response = await fetch("https://api.redpill.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "phala/llama-3.3-70b-instruct",
        "messages": [
          {
            "role": "user",
            "content": "Hello, this is a test message to verify my API key is working."
          }
        ],
        "temperature": 0.7,
        "max_tokens": 5
      })
    });
    
    if (response.ok) {
      console.log("✅ SUCCESS: Your RedPill API key is valid and working!");
      const data = await response.json();
      console.log("API Response:", JSON.stringify(data, null, 2).substring(0, 300) + "...");
    } else {
      const errorData = await response.text();
      console.error(`❌ ERROR: API request failed with status ${response.status}`);
      console.error(`Error details: ${errorData}`);
      
      if (response.status === 401) {
        console.log("\nPlease check that:");
        console.log("1. You're using the correct API key from RedPill.ai");
        console.log("2. The API key is entered correctly with no spaces or quotes");
        console.log("3. Your account is active and has credits available");
      } else if (response.status === 400) {
        console.log("\nThis appears to be a bad request. Check if:");
        console.log("1. The API key format is correct (should start with 'sk-')");
        console.log("2. The model name 'phala/llama-3.3-70b-instruct' is correct and available");
      } else if (response.status >= 500) {
        console.log("\nThis appears to be a server error. You may want to:");
        console.log("1. Check RedPill.ai status page for any outages");
        console.log("2. Try again later");
      }
    }
  } catch (error) {
    console.error("❌ ERROR: Failed to connect to RedPill API:", error.message);
    console.log("\nPossible network issues:");
    console.log("1. Check your internet connection");
    console.log("2. Ensure no firewall or proxy is blocking the connection");
    console.log("3. The RedPill API endpoint might be down temporarily");
  }
}

verifyApiKey(); 
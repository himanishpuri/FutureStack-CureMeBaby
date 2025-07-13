# Evaluate & Improve Feature

This feature uses an LLM (Llama 3.3 70B) to analyze chat history and provide suggestions for improving the AI therapist responses.

## How It Works

1. When a user clicks the "Evaluate & Improve" button:
   - The system runs the `run.sh` script
   - This processes the chat history from `data/msg/chat.json`
   - The script outputs analysis to `/rl-swarm/supervisor_content.txt`

2. After processing:
   - The system calls the Phala-hosted Llama 3.3 70B model
   - The LLM analyzes the therapeutic content
   - It generates 3-5 specific, actionable improvement suggestions

3. The user can view these suggestions by clicking the "View AI Suggestions" button that appears after processing.

## Setup Instructions

1. Make sure the `run.sh` script is executable:
   ```bash
   chmod +x run.sh
   ```

2. Add your Phala/RedPill API key to the `.env.local` file:
   ```
   REDPILL_API_KEY=your_actual_api_key
   ```
   
   You can get an API key from [RedPill.ai](https://redpill.ai)

3. Ensure all dependencies are installed:
   ```bash
   npm install
   ```
   
4. Run the application:
   ```bash
   npm run dev
   ```

## How to Use

1. Have conversations with the therapeutic chatbot
2. When you want to improve the AI model, click the "Evaluate & Improve" button in the bottom right corner
3. Wait for the processing to complete
4. Click "View AI Suggestions" to see how the AI can be improved
5. Implement the suggested changes in your model or prompt engineering

## Troubleshooting

If you encounter issues:

1. Check that the `run.sh` script path is correct in `pages/api/run-script.js`
2. Verify that your Phala/RedPill API key is valid
3. Ensure the chat.json file exists and has content
4. Check that the paths to supervisor_content.txt are correct 
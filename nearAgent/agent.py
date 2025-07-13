from nearai.agents.environment import Environment
import json
import datetime
from typing import List, Dict, Any

# Therapeutic psychologist prompt - full version
THERAPEUTIC_PROMPT = """You are Mim, a highly skilled, compassionate psychologist with decades of experience in various therapeutic modalities. You are the trusted mental health professional the user is speaking with. You specialize in providing empathetic support, evidence-based guidance, and gentle therapeutic insights to individuals experiencing mental health challenges. Your approach balances warmth with expertise, always prioritizing the emotional wellbeing of the person you're helping.

VERY IMPORTANT RETRIEVAL INSTRUCTIONS:
- Always prioritize retrieved document content over general knowledge
- If the user asks about specific content they've shared (e.g., "What metaphor did I use?"), you MUST directly quote from their documents
- If the user asks about something specific that is NOT in context but might be in their documents, say "I don't see a specific metaphor for emotional pain in our current context, but I'd love to discuss this further"
- Never definitively state "I couldn't find that information" for personal details unless you're certain it's not in the context
- If you see ANY metaphors or descriptive language about emotions in the context, prioritize showing these to the user when they ask about their metaphors
- Assume the user's documents contain important personal details - make every effort to find relevant content

VERY IMPORTANT FORMATTING INSTRUCTIONS:
- Use double line breaks between paragraphs for readability
- Add bold formatting (**title**) for section headings and important concepts
- Format numbered lists with proper spacing
- Break up text into multiple paragraphs instead of long blocks
- Use bullet points for lists of suggestions or techniques
- Add clear visual structure to make your responses easy to read

When the user first messages you or provides limited information, NEVER respond that you don't have enough information. Instead:
- Warmly welcome them to the therapeutic space
- Express that you're here to support them through whatever they might be experiencing
- Gently invite them to share more about what brought them to seek support today
- Reassure them that this is a safe, confidential space for them to discuss anything on their mind

Response Structure:
1. **Empathy and Validation:** Acknowledge emotions and validate their experience
2. **Evidence-Based Guidance:** Provide clear, fact-based advice 
3. **Practical Strategies:** Offer actionable techniques
4. **Invitation for Further Conversation:** End with an invitation for deeper sharing
"""

def store_memory(env: Environment, text: str, memory_type: str = "user_message") -> None:
    """Store text in the user's memory via vector store"""
    try:
        # Format memory entry with timestamp and type
        timestamp = datetime.datetime.now().isoformat()
        memory = f"[{timestamp}] [{memory_type}] {text}"
        
        # Add to vector store memory
        env.add_system_log(f"Adding to memory: {memory[:100]}...")
        env.add_user_memory(memory)
        
        # Log success
        env.add_system_log("Successfully stored memory in vector store")
    except Exception as e:
        env.add_system_log(f"Failed to store memory: {str(e)}")

def get_vector_stores(env: Environment) -> List[str]:
    """Get list of available vector stores"""
    try:
        tool_resources = (
            json.loads(env.tool_resources.strip().replace("'", '"'))
            if isinstance(env.tool_resources, str)
            else env.tool_resources
        )
        return tool_resources.get("file-search", {}).get("vector-store-ids", [])
    except (json.JSONDecodeError, AttributeError, TypeError) as e:
        env.add_system_log(f"Error processing tool_resources: {e}")
        return []

def main(env: Environment):
    # Get the user's message
    user_query = env.get_last_message()["content"]
    
    # Store the user's message in memory
    store_memory(env, user_query, "user_message")
    
    # Get all available vector stores
    vector_stores = get_vector_stores(env)
    
    # If no specific vector store is configured, use the default memory store
    vs_id = env.env_vars.get("vs_id", "memory")
    
    # Check if the user's message indicates they're asking about personal information
    is_personal_info_query = any(term in user_query.lower() for term in 
                              ['metaphor', 'what did i say', 'what i wrote', 'remind me'])
    
    # Query vector store for relevant past conversations
    vs_results = []
    context_memory = ""
    
    try:
        # Try to query the vector store for relevant memories
        env.add_system_log(f"Querying vector store with id: {vs_id}")
        vector_results = env.query_vector_store(vs_id, user_query)
        
        if vector_results and len(vector_results) > 0:
            # Process vector results
            vs_results = [item for sublist in [vector_results] for item in sublist]
            context_memory = "\n".join(
                [f"- {result.get('chunk_text', 'No text available')}" for result in vs_results[:10]]
            )
            env.add_system_log(f"Retrieved {len(vs_results)} memory items from vector store")
        else:
            env.add_system_log("No results found in vector store")
    except Exception as e:
        env.add_system_log(f"Error querying vector store: {str(e)}")
    
    # Prepare therapeutic context based on query type
    therapeutic_context = ""
    if is_personal_info_query:
        if context_memory:
            therapeutic_context = f"The user is asking about personal details they previously shared. Here is relevant information from their previous conversations:\n{context_memory}"
        else:
            therapeutic_context = "The user is asking about personal details, but we don't have specific records of their metaphors or past writings. Respond with empathy and invite them to share more about this topic."
    else:
        if context_memory:
            therapeutic_context = f"The user is seeking therapeutic guidance. Based on their previous conversations, here is relevant context that may help you provide personalized support:\n{context_memory}"
        else:
            therapeutic_context = "The user is seeking therapeutic guidance. Respond as a compassionate therapist would, drawing on knowledge of therapeutic approaches and mental health support strategies."
    
    # Combine the therapeutic prompt with context
    full_prompt = THERAPEUTIC_PROMPT
    if therapeutic_context:
        full_prompt += f"\n\nContext for this conversation:\n{therapeutic_context}"
    
    # Generate response
    reply = env.completion([{"role": "system", "content": full_prompt}] + env.list_messages())
    
    # Store the assistant's response in memory too
    store_memory(env, reply, "assistant_response")
    
    # Send the response
    env.add_reply(reply)
    env.request_user_input()

# Entry point
main(env)


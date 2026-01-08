import Groq from 'groq-sdk';

// Get API key from environment variable
const API_KEY = process.env.REACT_APP_GROQ_API_KEY || '';

class AIService {
  private groq: Groq;

  constructor() {
 
    this.groq = new Groq({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
  }

  async chat(message: string, history: Array<{ role: string; content: string }> = []) {
    try {
      // Build messages array with system prompt and history
      const messages: any[] = [
        {
          role: 'system',
          content: `You are an intelligent AI assistant for a project management application.
        Please help users with questions about:
        - Task, board, and project management
        - Teamwork and collaboration
        - Organizing work effectively
        - Using application features

        Answer in English, concisely, politely, and helpfully.`
        },
        ...history.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: message
        }
      ];

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'Sorry, I cannot answer right now.';
    } catch (error: any) {
      console.error('Groq API Error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        type: error.type
      });
      
      if (error.message?.includes('API key') || error.status === 401) {
        throw new Error('Invalid API key');
      }

      throw new Error(`Cannot connect to AI: ${error.message || 'Please try again later'}`);
    }
  }

  async getSuggestions(context: string) {
    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `Dựa trên ngữ cảnh sau: "${context}", hãy đưa ra 3 gợi ý hữu ích cho người dùng. Trả lời ngắn gọn, mỗi gợi ý trên 1 dòng.`
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });
      
      const text = completion.choices[0]?.message?.content || '';
      return text.split('\n').filter((s: string) => s.trim()).slice(0, 3);
    } catch (error) {
      console.error('Groq Suggestions Error:', error);
      return ['Create new task', 'View project progress', 'Manage team'];
    }
  }
}

export default new AIService();

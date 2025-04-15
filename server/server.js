import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Anthropic from '@anthropic-ai/sdk';

// Set up file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Fallback for API key if not in environment
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "YOUR_ANTHROPIC_API_KEY";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Anthropic client with API key from environment variable
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Proxy endpoint to generate chord progression
app.post('/api/generate-progression', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Log the request
  console.log(`Received prompt: "${prompt}"`);
  
  try {
    const systemPrompt = `You are a music theory expert that creates chord progressions based on user requests. 
    For the given prompt, create a chord progression with the following JSON structure:
    {
      "key": "C", // The musical key (e.g., "C", "D minor", "F# major")
      "style": "jazz", // The musical style (e.g., "jazz", "rock", "pop", "blues", "folk", "classical")
      "bpm": 120, // Beats per minute (tempo)
      "bars": 4, // Number of bars in the progression
      "chords": ["Cmaj7", "Dm7", "G7", "Cmaj7"] // Array of chord names (use proper music notation)
    }
    
    Parse the user's request carefully for key, style, and tempo information. If the user doesn't specify, use appropriate defaults.
    Use proper chord notation (e.g., "Cmaj7", "D7", "Em", "F#dim").
    Create musically interesting and appropriate progressions for the requested style.
    Only return the valid JSON object with no additional text or explanation.`;

    console.log('Sending request to Anthropic API...');
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000
    });

    console.log('Received response from Anthropic API');
    
    // Extract the response text
    const responseText = message.content[0].text;
    
    try {
      // Try to parse the JSON response
      const progressionData = JSON.parse(responseText);
      console.log('Parsed progression data:', progressionData);
      return res.json(progressionData);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // If JSON parsing fails, try to extract JSON using regex
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedJson = JSON.parse(jsonMatch[0]);
        console.log('Extracted JSON with regex:', extractedJson);
        return res.json(extractedJson);
      }
      return res.status(500).json({ 
        error: 'Could not parse chord progression data from API response',
        rawResponse: responseText
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: `API request failed: ${error.message || 'Unknown error'}`
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Key available: ${Boolean(ANTHROPIC_API_KEY)}`);
});
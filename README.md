# Chord Progression Generator

An AI-powered application that generates chord progressions based on natural language descriptions. The app uses the Anthropic Claude API to create musically appropriate chord progressions, which can be previewed and downloaded as MIDI files.

## Features

- Generate chord progressions using natural language descriptions
- Specify key, style, and tempo in your request
- Preview the progression with built-in audio playback
- Download the progression as a MIDI file for use in your DAW
- Server-side API proxy to securely handle API keys

## Setup

1. Clone the repository
2. Add your Anthropic API key to the `.env` file in the project root:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```
3. Install dependencies for both client and server:
   ```
   npm run setup
   ```

## Running the Application

Start both the client and server:

```
npm run dev
```

This will start:
- The React frontend on http://localhost:5173
- The Express backend on http://localhost:3001

## Usage

1. Enter a description of the chord progression you want, like "A jazzy progression in D minor with 120 BPM"
2. Click "Generate" to create your progression
3. Use the "Preview" button to hear the progression
4. Use the "Download MIDI" button to save the progression as a MIDI file
5. Optionally, change the filename before downloading

## Example Prompts

- "A melancholic jazz progression in A minor at 90 BPM"
- "Upbeat pop progression in C major with 128 BPM"
- "Blues progression in E with a slow tempo"
- "Classical chord sequence in G minor that sounds like Bach"

## Tech Stack

- Frontend: React, TypeScript, Tone.js
- Backend: Express, Node.js
- API: Anthropic Claude API

## License

MIT
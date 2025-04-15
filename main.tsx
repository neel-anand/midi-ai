import React, { useState, useRef } from 'react';
import * as Tone from 'tone';

interface ChordProgression {
  key: string;
  style: string;
  bpm: number;
  bars: number;
  chords: string[];
}

const ChordProgressionGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [progression, setProgression] = useState<ChordProgression | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('chord-progression');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const synth = useRef<Tone.PolySynth | null>(null);
  const part = useRef<Tone.Part | null>(null);

  // Initialize Tone.js synth
  const initSynth = (): void => {
    if (!synth.current) {
      synth.current = new Tone.PolySynth(Tone.Synth).toDestination();
    }
  };

  // Process natural language prompt to generate chord progression using Anthropic API
  const generateProgression = async (): Promise<void> => {
    if (!prompt.trim()) {
      setError('Please enter a prompt first.');
      return;
    }

    if (!apiKey.trim()) {
      setShowApiKeyInput(true);
      setError('Please enter your Anthropic API key.');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      // Call Anthropic API to generate chord progression
      const progressionData = await getChordProgressionFromAnthropic(prompt, apiKey);
      setProgression(progressionData);
      setIsGenerating(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error: ${errorMessage}`);
      setIsGenerating(false);
    }
  };

  // Call Anthropic API to generate a chord progression
  const getChordProgressionFromAnthropic = async (userPrompt: string, key: string): Promise<ChordProgression> => {
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

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt
            }
          ],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response from Anthropic API');
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0]?.text) {
        throw new Error('Invalid response format from Anthropic API');
      }
      
      const progressionString = data.content[0].text;
      
      try {
        // Try to parse the JSON response
        const progressionData = JSON.parse(progressionString) as ChordProgression;
        return progressionData;
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON using regex
        const jsonMatch = progressionString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as ChordProgression;
        }
        throw new Error('Could not parse chord progression data from API response');
      }
    } catch (error) {
      console.error('API Error:', error);
      throw new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Convert roman numerals to actual chords based on key
  const romanNumeralsToChords = (numerals: string[], key: string): string[] => {
    // Major keys: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
    const majorKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Notes in each key
    const notes: Record<string, string[]> = {
      'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      'C#': ['C#', 'D#', 'F', 'F#', 'G#', 'A#', 'C'],
      'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
      'D#': ['D#', 'F', 'G', 'G#', 'A#', 'C', 'D'],
      'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
      'F': ['F', 'G', 'A', 'A#', 'C', 'D', 'E'],
      'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'F'],
      'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
      'G#': ['G#', 'A#', 'C', 'C#', 'D#', 'F', 'G'],
      'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
      'A#': ['A#', 'C', 'D', 'D#', 'F', 'G', 'A'],
      'B': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#']
    };
    
    // Parse key to handle major/minor
    let keyRoot = key.replace(/\s+minor|\s+major/, '');
    const isMinor = key.includes('minor');
    
    // Default to C if key not recognized
    if (!notes[keyRoot]) {
      keyRoot = 'C';
    }
    
    const keyNotes = notes[keyRoot];
    
    return numerals.map(numeral => {
      // Parse the roman numeral
      const isMinorChord = numeral.match(/^[iv]+$/); // lowercase numerals are minor
      const isSeventh = numeral.includes('7');
      const isMaj7 = numeral.includes('maj7');
      const isFlat = numeral.startsWith('b');
      
      // Remove modifiers to get the basic numeral
      let basicNumeral = numeral.replace(/7|maj7|b/, '');
      
      // Convert roman numeral to index (0-based)
      let index: number;
      switch (basicNumeral.toLowerCase()) {
        case 'i': index = 0; break;
        case 'ii': index = 1; break;
        case 'iii': index = 2; break;
        case 'iv': index = 3; break;
        case 'v': index = 4; break;
        case 'vi': index = 5; break;
        case 'vii': index = 6; break;
        default: index = 0;
      }
      
      // Adjust for flats
      if (isFlat) {
        // Handle flat chords - this is simplified
        const flatIndex = (index - 1 + 7) % 7;
        return keyNotes[flatIndex] + (isMinorChord ? 'm' : '') + (isSeventh ? '7' : '') + (isMaj7 ? 'maj7' : '');
      }
      
      // Create chord name
      return keyNotes[index] + (isMinorChord || (isMinor && [0, 3, 4].includes(index)) ? 'm' : '') +
             (isSeventh ? '7' : '') + (isMaj7 ? 'maj7' : '');
    });
  };

  // Play the generated chord progression
  const playProgression = async (): Promise<void> => {
    if (!progression) return;
    
    initSynth();
    
    // Stop any previous playback
    if (part.current) {
      part.current.stop();
      part.current.dispose();
    }
    
    await Tone.start();
    Tone.Transport.bpm.value = progression.bpm;
    
    const chordNotes = progression.chords.map(chord => {
      return chordToNotes(chord);
    });
    
    const events: { time: number; notes: string[]; duration: string }[] = [];
    const barDuration = 4; // 4 beats per bar in 4/4 time
    const totalBeats = progression.bars * barDuration;
    const beatsPerChord = totalBeats / chordNotes.length;
    
    chordNotes.forEach((notes, index) => {
      events.push({
        time: index * beatsPerChord,
        notes,
        duration: beatsPerChord + 'n'
      });
    });
    
    part.current = new Tone.Part((time, value) => {
      synth.current?.triggerAttackRelease(value.notes, value.duration, time);
    }, events).start(0);
    
    Tone.Transport.start();
    setIsPlaying(true);
    
    // Stop after playing through once
    Tone.Transport.scheduleOnce(() => {
      Tone.Transport.stop();
      setIsPlaying(false);
    }, progression.bars * barDuration * 60 / progression.bpm);
  };

  // Stop playback
  const stopPlayback = (): void => {
    if (part.current) {
      part.current.stop();
      Tone.Transport.stop();
      setIsPlaying(false);
    }
  };

  // Convert chord names to actual notes
  const chordToNotes = (chordName: string): string[] => {
    const chordMap: Record<string, string[]> = {
      // Major chords
      'C': ['C3', 'E3', 'G3'],
      'C#': ['C#3', 'F3', 'G#3'],
      'Db': ['Db3', 'F3', 'Ab3'],
      'D': ['D3', 'F#3', 'A3'],
      'D#': ['D#3', 'G3', 'A#3'],
      'Eb': ['Eb3', 'G3', 'Bb3'],
      'E': ['E3', 'G#3', 'B3'],
      'F': ['F3', 'A3', 'C4'],
      'F#': ['F#3', 'A#3', 'C#4'],
      'Gb': ['Gb3', 'Bb3', 'Db4'],
      'G': ['G3', 'B3', 'D4'],
      'G#': ['G#3', 'C4', 'D#4'],
      'Ab': ['Ab3', 'C4', 'Eb4'],
      'A': ['A3', 'C#4', 'E4'],
      'A#': ['A#3', 'D4', 'F4'],
      'Bb': ['Bb3', 'D4', 'F4'],
      'B': ['B3', 'D#4', 'F#4'],
      
      // Minor chords
      'Cm': ['C3', 'Eb3', 'G3'],
      'C#m': ['C#3', 'E3', 'G#3'],
      'Dbm': ['Db3', 'E3', 'Ab3'],
      'Dm': ['D3', 'F3', 'A3'],
      'D#m': ['D#3', 'F#3', 'A#3'],
      'Ebm': ['Eb3', 'Gb3', 'Bb3'],
      'Em': ['E3', 'G3', 'B3'],
      'Fm': ['F3', 'Ab3', 'C4'],
      'F#m': ['F#3', 'A3', 'C#4'],
      'Gbm': ['Gb3', 'A3', 'Db4'],
      'Gm': ['G3', 'Bb3', 'D4'],
      'G#m': ['G#3', 'B3', 'D#4'],
      'Abm': ['Ab3', 'B3', 'Eb4'],
      'Am': ['A3', 'C4', 'E4'],
      'A#m': ['A#3', 'C#4', 'F4'],
      'Bbm': ['Bb3', 'Db4', 'F4'],
      'Bm': ['B3', 'D4', 'F#4'],
      
      // Dominant 7th chords
      'C7': ['C3', 'E3', 'G3', 'Bb3'],
      'C#7': ['C#3', 'F3', 'G#3', 'B3'],
      'D7': ['D3', 'F#3', 'A3', 'C4'],
      'D#7': ['D#3', 'G3', 'A#3', 'C#4'],
      'E7': ['E3', 'G#3', 'B3', 'D4'],
      'F7': ['F3', 'A3', 'C4', 'Eb4'],
      'F#7': ['F#3', 'A#3', 'C#4', 'E4'],
      'G7': ['G3', 'B3', 'D4', 'F4'],
      'G#7': ['G#3', 'C4', 'D#4', 'F#4'],
      'A7': ['A3', 'C#4', 'E4', 'G4'],
      'A#7': ['A#3', 'D4', 'F4', 'G#4'],
      'B7': ['B3', 'D#4', 'F#4', 'A4'],
      
      // Major 7th chords
      'Cmaj7': ['C3', 'E3', 'G3', 'B3'],
      'C#maj7': ['C#3', 'F3', 'G#3', 'C4'],
      'Dmaj7': ['D3', 'F#3', 'A3', 'C#4'],
      'D#maj7': ['D#3', 'G3', 'A#3', 'D4'],
      'Emaj7': ['E3', 'G#3', 'B3', 'D#4'],
      'Fmaj7': ['F3', 'A3', 'C4', 'E4'],
      'F#maj7': ['F#3', 'A#3', 'C#4', 'F4'],
      'Gmaj7': ['G3', 'B3', 'D4', 'F#4'],
      'G#maj7': ['G#3', 'C4', 'D#4', 'G4'],
      'Amaj7': ['A3', 'C#4', 'E4', 'G#4'],
      'A#maj7': ['A#3', 'D4', 'F4', 'A4'],
      'Bmaj7': ['B3', 'D#4', 'F#4', 'A#4'],
      
      // Minor 7th chords
      'Cm7': ['C3', 'Eb3', 'G3', 'Bb3'],
      'C#m7': ['C#3', 'E3', 'G#3', 'B3'],
      'Dm7': ['D3', 'F3', 'A3', 'C4'],
      'D#m7': ['D#3', 'F#3', 'A#3', 'C#4'],
      'Em7': ['E3', 'G3', 'B3', 'D4'],
      'Fm7': ['F3', 'Ab3', 'C4', 'Eb4'],
      'F#m7': ['F#3', 'A3', 'C#4', 'E4'],
      'Gm7': ['G3', 'Bb3', 'D4', 'F4'],
      'G#m7': ['G#3', 'B3', 'D#4', 'F#4'],
      'Am7': ['A3', 'C4', 'E4', 'G4'],
      'A#m7': ['A#3', 'C#4', 'F4', 'G#4'],
      'Bm7': ['B3', 'D4', 'F#4', 'A4']
    };
    
    // If chord not found in map, return a C major as fallback
    return chordMap[chordName] || ['C3', 'E3', 'G3'];
  };

  // Create and download MIDI file
  const downloadMidi = (): void => {
    if (!progression) return;
    
    // Create MIDI data
    const midi = createMidiFile();
    
    // Create download link
    const blob = new Blob([midi], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName || 'chord-progression'}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Create MIDI file data
  const createMidiFile = (): Uint8Array => {
    if (!progression) {
      return new Uint8Array();
    }
    
    // MIDI file header (MThd)
    const header = [
      0x4D, 0x54, 0x68, 0x64, // "MThd"
      0x00, 0x00, 0x00, 0x06, // Header length
      0x00, 0x01, // Format 1
      0x00, 0x01, // One track
      0x01, 0x00  // Division (256 ticks per beat)
    ];
    
    // MIDI track header (MTrk)
    const trackHeader = [
      0x4D, 0x54, 0x72, 0x6B // "MTrk"
    ];
    
    // Create events array
    const events: number[] = [];
    
    // Set tempo
    const microsecondsPerBeat = Math.floor(60000000 / progression.bpm);
    events.push(
      0x00, // Delta time
      0xFF, 0x51, 0x03, // Tempo meta event
      (microsecondsPerBeat >> 16) & 0xFF,
      (microsecondsPerBeat >> 8) & 0xFF,
      microsecondsPerBeat & 0xFF
    );
    
    // Set time signature
    events.push(
      0x00, // Delta time
      0xFF, 0x58, 0x04, // Time signature meta event
      0x04, // Numerator
      0x02, // Denominator (2^2 = 4)
      0x18, // Clocks per metronome click
      0x08  // 32nd notes per quarter note
    );
    
    // Set instrument (piano)
    events.push(
      0x00, // Delta time
      0xC0, 0x00 // Program change, piano
    );
    
    // Add notes for each chord
    const ticksPerBeat = 256;
    const beatsPerChord = (progression.bars * 4) / progression.chords.length;
    const ticksPerChord = Math.floor(beatsPerChord * ticksPerBeat);
    
    progression.chords.forEach(chord => {
      const notes = chordToNotes(chord);
      
      // Note on events
      notes.forEach(note => {
        const midiNote = noteToMidiNumber(note);
        events.push(
          0x00, // Delta time (all notes start together)
          0x90, // Note on, channel 0
          midiNote, // Note number
          0x64  // Velocity (100)
        );
      });
      
      // Note off events
      notes.forEach((note, index) => {
        const midiNote = noteToMidiNumber(note);
        const deltaTime = index === 0 ? ticksPerChord : 0;
        
        // Encode delta time (variable length)
        const encodedDelta = encodeVariableLength(deltaTime);
        events.push(...encodedDelta);
        
        events.push(
          0x80, // Note off, channel 0
          midiNote, // Note number
          0x40  // Velocity (64)
        );
      });
    });
    
    // End of track
    events.push(
      0x00, // Delta time
      0xFF, 0x2F, 0x00 // End of track meta event
    );
    
    // Calculate track length
    const trackDataLength = events.length;
    const trackLengthBytes = [
      (trackDataLength >> 24) & 0xFF,
      (trackDataLength >> 16) & 0xFF,
      (trackDataLength >> 8) & 0xFF,
      trackDataLength & 0xFF
    ];
    
    // Combine all parts into a Uint8Array
    const midiData = new Uint8Array([
      ...header,
      ...trackHeader,
      ...trackLengthBytes,
      ...events
    ]);
    
    return midiData;
  };
  
  // Convert note name to MIDI note number
  const noteToMidiNumber = (noteName: string): number => {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1,
      'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 
      'F': 5, 'F#': 6, 'Gb': 6,
      'G': 7, 'G#': 8, 'Ab': 8,
      'A': 9, 'A#': 10, 'Bb': 10,
      'B': 11
    };
    
    // Extract note and octave
    const noteMatch = noteName.match(/^([A-G][b#]?)(\d+)$/);
    if (!noteMatch) return 60; // Default to middle C if format is invalid
    
    const note = noteMatch[1];
    const octave = parseInt(noteMatch[2]);
    
    const noteIndex = noteMap[note];
    if (noteIndex === undefined) return 60; // Default to middle C if note is invalid
    
    return noteIndex + (octave + 1) * 12;
  };
  
  // Encode a number as a variable-length quantity (MIDI delta times)
  const encodeVariableLength = (value: number): number[] => {
    if (value === 0) return [0];
    
    const result: number[] = [];
    let v = value;
    
    while (v > 0) {
      let byte = v & 0x7F;
      v >>= 7;
      if (v > 0) byte |= 0x80;
      result.unshift(byte);
    }
    
    return result;
  };

  return (
    <div className="flex flex-col items-center p-6 max-w-3xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Chord Progression Generator</h1>
      
      <div className="w-full mb-6">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Describe what kind of chord progression you want
        </label>
        <div className="flex">
          <input
            type="text"
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'A jazzy progression in D minor with 120 BPM'"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={generateProgression}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      </div>
      
      {/* API Key input section */}
      <div className={`w-full mb-6 transition-all duration-300 ${showApiKeyInput ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your Anthropic API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-api..."
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-xs text-gray-500">
            Your API key is used only for this request and not stored on our servers.
          </p>
        </div>
      </div>
      
      {progression && (
        <div className="w-full bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-medium mb-2 text-gray-800">Generated Progression</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p><span className="font-medium">Key:</span> {progression.key}</p>
              <p><span className="font-medium">Style:</span> {progression.style}</p>
              <p><span className="font-medium">Tempo:</span> {progression.bpm} BPM</p>
              <p><span className="font-medium">Chords:</span> {progression.chords.join(' - ')}</p>
            </div>
            
            <div className="flex flex-col sm:items-end gap-2">
              <div className="flex gap-2">
                <button
                  onClick={isPlaying ? stopPlayback : playProgression}
                  className={`px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isPlaying 
                      ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isPlaying ? 'Stop' : 'Preview'}
                </button>
                
                <button
                  onClick={downloadMidi}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Download MIDI
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <label htmlFor="fileName" className="text-sm text-gray-600">
                  File name:
                </label>
                <input
                  type="text"
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">.mid</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full text-gray-600 text-sm">
        <h3 className="font-medium mb-1">Usage Tips:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Specify key: "in C major" or "in F# minor"</li>
          <li>Include style: "jazz", "rock", "pop", "blues", "folk", "classical"</li>
          <li>Set tempo: "120 BPM" or use "slow", "medium tempo", "fast"</li>
          <li>Example: "A melancholic jazz progression in D minor at 90 BPM"</li>
        </ul>
      </div>
    </div>
  );
};

export default ChordProgressionGenerator;
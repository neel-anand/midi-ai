import React, { useState, useRef } from 'react';
import * as Tone from 'tone';

interface ChordProgression {
  key: string;
  style: string;
  bpm: number;
  bars: number;
  chords: string[];
}

// Simple CSS styles for the component without Tailwind
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '1.5rem',
    maxWidth: '48rem',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#1f2937'
  },
  section: {
    width: '100%',
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem'
  },
  inputContainer: {
    display: 'flex'
  },
  input: {
    flexGrow: 1,
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem 0 0 0.375rem',
    outline: 'none'
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '0 0.375rem 0.375rem 0',
    border: 'none',
    cursor: 'pointer'
  },
  errorText: {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: '#dc2626'
  },
  progressionContainer: {
    width: '100%',
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '0.5rem',
    marginBottom: '1.5rem'
  },
  progressionTitle: {
    fontSize: '1.25rem',
    fontWeight: '500',
    marginBottom: '0.5rem',
    color: '#1f2937'
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem'
  },
  flexCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem'
  },
  propertyLabel: {
    fontWeight: '500'
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem'
  },
  previewButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer'
  },
  stopButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#4b5563',
    color: 'white',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer'
  },
  downloadButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer'
  },
  fileNameInput: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
    outline: 'none'
  },
  tipsContainer: {
    width: '100%',
    fontSize: '0.875rem',
    color: '#4b5563'
  },
  tipsList: {
    paddingLeft: '1.25rem',
    listStyleType: 'disc' as const
  }
};

const ChordProgressionGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [progression, setProgression] = useState<ChordProgression | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('chord-progression');
  const synth = useRef<Tone.PolySynth | null>(null);
  const part = useRef<Tone.Part | null>(null);

  // Server URL - adjust this if your server runs on a different port
  const serverUrl = 'http://localhost:3001';

  // Initialize Tone.js synth
  const initSynth = (): void => {
    if (!synth.current) {
      synth.current = new Tone.PolySynth(Tone.Synth).toDestination();
    }
  };

  // Process natural language prompt to generate chord progression using our server-side proxy
  const generateProgression = async (): Promise<void> => {
    if (!prompt.trim()) {
      setError('Please enter a prompt first.');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      // Call our server-side proxy
      const response = await fetch(`${serverUrl}/api/generate-progression`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from server');
      }

      const progressionData = await response.json();
      setProgression(progressionData);
      setIsGenerating(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error: ${errorMessage}`);
      setIsGenerating(false);
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

  // Create MIDI file data
  const createMidiFile = (): Uint8Array => {
    if (!progression) {
      return new Uint8Array();
    }
    
    // Using standard MIDI file format
    // MThd + <length of header data> + <format> + <number of tracks> + <division>
    const header = [
      0x4D, 0x54, 0x68, 0x64, // "MThd"
      0x00, 0x00, 0x00, 0x06, // Header length (always 6 bytes)
      0x00, 0x00, // Format 0 (single track)
      0x00, 0x01, // One track
      0x01, 0xE0  // Division: 480 ticks per quarter note
    ];
    
    // Prepare all events for the track
    const events: number[] = [];
    
    // Set tempo (in microseconds per quarter note)
    const microsecondsPerBeat = Math.round(60000000 / progression.bpm);
    events.push(
      0x00, // Delta time (immediate)
      0xFF, 0x51, 0x03, // Tempo meta event
      (microsecondsPerBeat >> 16) & 0xFF,
      (microsecondsPerBeat >> 8) & 0xFF,
      microsecondsPerBeat & 0xFF
    );
    
    // Set time signature (4/4)
    events.push(
      0x00, // Delta time
      0xFF, 0x58, 0x04, // Time signature meta event
      0x04, // Numerator (4)
      0x02, // Denominator (4 = 2^2)
      0x18, // Clocks per metronome click (24)
      0x08  // 32nd notes per quarter note (8)
    );
    
    // Set track name
    const trackName = `${progression.style} in ${progression.key}`;
    events.push(
      0x00, // Delta time
      0xFF, 0x03, trackName.length, // Track name meta event
      ...trackName.split('').map(c => c.charCodeAt(0)) // Track name as bytes
    );
    
    // Set instrument to Acoustic Grand Piano (program 0)
    events.push(
      0x00, // Delta time
      0xC0, 0x00 // Program change, channel 0, program 0 (Piano)
    );
    
    // Calculate timing
    const ticksPerBeat = 480; // Standard MIDI resolution
    const beatsPerChord = progression.bars * 4 / progression.chords.length;
    const ticksPerChord = Math.round(beatsPerChord * ticksPerBeat);
    
    // Add each chord
    let currentTime = 0;
    
    progression.chords.forEach((chord, index) => {
      const notes = chordToNotes(chord);
      const midiNotes = notes.map(noteToMidiNumber);
      
      // All notes in chord start simultaneously
      midiNotes.forEach(note => {
        events.push(
          0x00, // Delta time (all notes in a chord start together)
          0x90, // Note On, channel 0
          note,  // Note number
          0x50   // Velocity (moderate)
        );
      });
      
      // All notes in chord end simultaneously, but the next chord starts after ticksPerChord
      midiNotes.forEach((note, noteIndex) => {
        // For the first note of each chord, we include the delta time until the next chord
        // For other notes, we use delta time 0 since they stop at the same time
        if (noteIndex === 0) {
          // Add the delta time
          const encodedDelta = encodeVariableLength(ticksPerChord);
          encodedDelta.forEach(byte => events.push(byte));
        } else {
          events.push(0x00); // No delay between note-offs in the same chord
        }
        
        events.push(
          0x80, // Note Off, channel 0
          note,  // Note number
          0x40   // Release velocity (does not really matter)
        );
      });
    });
    
    // End of track marker
    events.push(
      0x00, // Delta time
      0xFF, 0x2F, 0x00 // End of track meta event
    );
    
    // Create track chunk
    const trackHeader = [
      0x4D, 0x54, 0x72, 0x6B, // "MTrk"
      (events.length >> 24) & 0xFF,
      (events.length >> 16) & 0xFF,
      (events.length >> 8) & 0xFF,
      events.length & 0xFF   // Track length in bytes
    ];
    
    // Combine everything into a single array
    const midiData = new Uint8Array([
      ...header,
      ...trackHeader,
      ...events
    ]);
    
    return midiData;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Chord Progression Generator</h1>
      
      <div style={styles.section}>
        <label style={styles.label} htmlFor="prompt">
          Describe what kind of chord progression you want
        </label>
        <div style={styles.inputContainer}>
          <input
            style={styles.input}
            type="text"
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'A jazzy progression in D minor with 120 BPM'"
          />
          <button
            style={{
              ...styles.button,
              opacity: isGenerating ? 0.7 : 1
            }}
            onClick={generateProgression}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
        {error && <p style={styles.errorText}>{error}</p>}
      </div>
      
      {progression && (
        <div style={styles.progressionContainer}>
          <h2 style={styles.progressionTitle}>Generated Progression</h2>
          <div style={styles.flexRow}>
            <div>
              <p><span style={styles.propertyLabel}>Key:</span> {progression.key}</p>
              <p><span style={styles.propertyLabel}>Style:</span> {progression.style}</p>
              <p><span style={styles.propertyLabel}>Tempo:</span> {progression.bpm} BPM</p>
              <p><span style={styles.propertyLabel}>Chords:</span> {progression.chords.join(' - ')}</p>
            </div>
            
            <div style={styles.flexCol}>
              <div style={styles.buttonGroup}>
                <button
                  onClick={isPlaying ? stopPlayback : playProgression}
                  style={isPlaying ? styles.stopButton : styles.previewButton}
                >
                  {isPlaying ? 'Stop' : 'Preview'}
                </button>
                
                <button
                  onClick={downloadMidi}
                  style={styles.downloadButton}
                >
                  Download MIDI
                </button>
              </div>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <label style={{fontSize: '0.875rem', color: '#4b5563'}}>
                  File name:
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  style={styles.fileNameInput}
                />
                <span style={{fontSize: '0.875rem', color: '#4b5563'}}>.mid</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div style={styles.tipsContainer}>
        <h3 style={{fontWeight: '500', marginBottom: '0.25rem'}}>Usage Tips:</h3>
        <ul style={styles.tipsList}>
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
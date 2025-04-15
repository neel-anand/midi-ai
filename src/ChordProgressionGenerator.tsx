import React, { useState, useRef } from 'react';
import * as Tone from 'tone';

interface ChordProgression {
  key: string;
  style: string;
  bpm: number;
  bars: number;
  chords: string[];
}

// Modern CSS styles for the component
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '2rem',
    width: '100vw',
    minHeight: '100vh',
    margin: '0',
    backgroundColor: '#0f172a', // Very dark blue background
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%), radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)', // Gradient background with subtle light spots
    color: '#f3f4f6', // Light text
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: '700',
    marginBottom: '2rem',
    background: 'linear-gradient(90deg, #3b82f6, #10b981)', // Blue to green gradient
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    textAlign: 'center' as const
  },
  section: {
    width: '100%',
    maxWidth: '56rem',
    marginBottom: '2rem',
    backdropFilter: 'blur(8px)',
    padding: '1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  label: {
    display: 'block',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#a5b4fc', // Light indigo
    marginBottom: '0.75rem',
    letterSpacing: '0.025em'
  },
  inputContainer: {
    display: 'flex',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  },
  input: {
    flexGrow: 1,
    padding: '0.75rem 1.25rem',
    border: 'none',
    borderRadius: '0.5rem 0 0 0.5rem',
    outline: 'none',
    backgroundColor: '#1f2937', // Darker shade
    color: '#f9fafb', // Light text
    fontSize: '1rem',
    transition: 'all 0.2s ease'
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6', // Blue
    color: 'white',
    borderRadius: '0 0.5rem 0.5rem 0',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
  },
  errorText: {
    marginTop: '0.75rem',
    fontSize: '0.875rem',
    color: '#ef4444',
    padding: '0.5rem',
    borderRadius: '0.25rem',
    backgroundColor: 'rgba(239, 68, 68, 0.1)'
  },
  progressionContainer: {
    width: '100%',
    maxWidth: '56rem',
    backgroundColor: 'rgba(31, 41, 55, 0.7)', // Darker with transparency
    padding: '1.5rem',
    borderRadius: '0.75rem',
    marginBottom: '2rem',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(75, 85, 99, 0.2)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
  },
  progressionTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#a5b4fc', // Light indigo
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    flexWrap: 'wrap' as const
  },
  flexCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem'
  },
  propertyLabel: {
    fontWeight: '500',
    color: '#a5b4fc', // Light indigo
    letterSpacing: '0.025em',
    marginRight: '0.5rem'
  },
  propertyValue: {
    fontWeight: '400',
    color: '#f3f4f6' // Light gray
  },
  chordsList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginTop: '0.5rem'
  },
  chordPill: {
    padding: '0.35rem 0.75rem',
    borderRadius: '2rem',
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue with transparency
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#93c5fd', // Light blue
    fontSize: '0.875rem',
    fontWeight: '500',
    letterSpacing: '0.025em'
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1rem'
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer'
  },
  previewButton: {
    backgroundColor: '#10b981', // Green
    color: 'white',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  previewButtonHover: {
    backgroundColor: '#059669', // Darker green
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
  },
  stopButton: {
    backgroundColor: '#6b7280', // Gray
    color: 'white',
    boxShadow: '0 2px 8px rgba(107, 114, 128, 0.3)',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  stopButtonHover: {
    backgroundColor: '#4b5563', // Darker gray
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(107, 114, 128, 0.4)'
  },
  downloadButton: {
    backgroundColor: '#3b82f6', // Blue
    color: 'white',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  downloadButtonHover: {
    backgroundColor: '#2563eb', // Darker blue
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
  },
  fileNameInput: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    border: 'none',
    borderRadius: '0.375rem',
    backgroundColor: '#1f2937', // Darker shade
    color: '#f9fafb',
    outline: 'none',
    transition: 'all 0.2s ease'
  },
  fileInputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem'
  },
  fileNameLabel: {
    fontSize: '0.875rem',
    color: '#9ca3af' // Gray
  },
  fileExtension: {
    fontSize: '0.875rem',
    color: '#9ca3af' // Gray
  },
  tipsContainer: {
    width: '100%',
    maxWidth: '56rem',
    fontSize: '0.875rem',
    color: '#9ca3af', // Gray
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    padding: '1.25rem',
    borderRadius: '0.75rem',
    borderLeft: '4px solid #3b82f6' // Blue accent
  },
  tipsTitle: {
    fontWeight: '600',
    fontSize: '1rem',
    marginBottom: '0.75rem',
    color: '#a5b4fc', // Light indigo
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  tipsList: {
    paddingLeft: '1.25rem',
    listStyleType: 'disc' as const,
    lineHeight: '1.6'
  },
  tipItem: {
    marginBottom: '0.5rem'
  }
};

const ChordProgressionGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [progression, setProgression] = useState<ChordProgression | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('chord-progression');
  const [hoverStates, setHoverStates] = useState({
    preview: false,
    download: false,
    generate: false
  });
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
      'Cb': ['B3', 'D#4', 'F#4'], // Enharmonic with B
      
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
      'Cbm': ['B3', 'D4', 'F#4'], // Enharmonic with Bm
      
      // Dominant 7th chords
      'C7': ['C3', 'E3', 'G3', 'Bb3'],
      'C#7': ['C#3', 'F3', 'G#3', 'B3'],
      'Db7': ['Db3', 'F3', 'Ab3', 'B3'], // Enharmonic with C#7
      'D7': ['D3', 'F#3', 'A3', 'C4'],
      'D#7': ['D#3', 'G3', 'A#3', 'C#4'],
      'Eb7': ['Eb3', 'G3', 'Bb3', 'Db4'], // Enharmonic with D#7
      'E7': ['E3', 'G#3', 'B3', 'D4'],
      'F7': ['F3', 'A3', 'C4', 'Eb4'],
      'F#7': ['F#3', 'A#3', 'C#4', 'E4'],
      'Gb7': ['Gb3', 'Bb3', 'Db4', 'E4'], // Enharmonic with F#7
      'G7': ['G3', 'B3', 'D4', 'F4'],
      'G#7': ['G#3', 'C4', 'D#4', 'F#4'],
      'Ab7': ['Ab3', 'C4', 'Eb4', 'Gb4'], // Enharmonic with G#7
      'A7': ['A3', 'C#4', 'E4', 'G4'],
      'A#7': ['A#3', 'D4', 'F4', 'G#4'],
      'Bb7': ['Bb3', 'D4', 'F4', 'Ab4'], // Enharmonic with A#7
      'B7': ['B3', 'D#4', 'F#4', 'A4'],
      'Cb7': ['B3', 'D#4', 'F#4', 'A4'], // Enharmonic with B7
      
      // Major 7th chords
      'Cmaj7': ['C3', 'E3', 'G3', 'B3'],
      'C#maj7': ['C#3', 'F3', 'G#3', 'C4'],
      'Dbmaj7': ['Db3', 'F3', 'Ab3', 'C4'], // Enharmonic with C#maj7
      'Dmaj7': ['D3', 'F#3', 'A3', 'C#4'],
      'D#maj7': ['D#3', 'G3', 'A#3', 'D4'],
      'Ebmaj7': ['Eb3', 'G3', 'Bb3', 'D4'], // Enharmonic with D#maj7
      'Emaj7': ['E3', 'G#3', 'B3', 'D#4'],
      'Fmaj7': ['F3', 'A3', 'C4', 'E4'],
      'F#maj7': ['F#3', 'A#3', 'C#4', 'F4'],
      'Gbmaj7': ['Gb3', 'Bb3', 'Db4', 'F4'], // Enharmonic with F#maj7
      'Gmaj7': ['G3', 'B3', 'D4', 'F#4'],
      'G#maj7': ['G#3', 'C4', 'D#4', 'G4'],
      'Abmaj7': ['Ab3', 'C4', 'Eb4', 'G4'], // Enharmonic with G#maj7
      'Amaj7': ['A3', 'C#4', 'E4', 'G#4'],
      'A#maj7': ['A#3', 'D4', 'F4', 'A4'],
      'Bbmaj7': ['Bb3', 'D4', 'F4', 'A4'], // Enharmonic with A#maj7
      'Bmaj7': ['B3', 'D#4', 'F#4', 'A#4'],
      'Cbmaj7': ['B3', 'D#4', 'F#4', 'A#4'], // Enharmonic with Bmaj7
      
      // Minor 7th chords
      'Cm7': ['C3', 'Eb3', 'G3', 'Bb3'],
      'C#m7': ['C#3', 'E3', 'G#3', 'B3'],
      'Dbm7': ['Db3', 'E3', 'Ab3', 'B3'], // Enharmonic with C#m7
      'Dm7': ['D3', 'F3', 'A3', 'C4'],
      'D#m7': ['D#3', 'F#3', 'A#3', 'C#4'],
      'Ebm7': ['Eb3', 'Gb3', 'Bb3', 'Db4'], // Enharmonic with D#m7
      'Em7': ['E3', 'G3', 'B3', 'D4'],
      'Fm7': ['F3', 'Ab3', 'C4', 'Eb4'],
      'F#m7': ['F#3', 'A3', 'C#4', 'E4'],
      'Gbm7': ['Gb3', 'A3', 'Db4', 'E4'], // Enharmonic with F#m7
      'Gm7': ['G3', 'Bb3', 'D4', 'F4'],
      'G#m7': ['G#3', 'B3', 'D#4', 'F#4'],
      'Abm7': ['Ab3', 'B3', 'Eb4', 'Gb4'], // Enharmonic with G#m7
      'Am7': ['A3', 'C4', 'E4', 'G4'],
      'A#m7': ['A#3', 'C#4', 'F4', 'G#4'],
      'Bbm7': ['Bb3', 'Db4', 'F4', 'Ab4'], // Enharmonic with A#m7
      'Bm7': ['B3', 'D4', 'F#4', 'A4'],
      'Cbm7': ['B3', 'D4', 'F#4', 'A4'], // Enharmonic with Bm7
      
      // Diminished chords (common in jazz and classical)
      'Cdim': ['C3', 'Eb3', 'Gb3'],
      'C#dim': ['C#3', 'E3', 'G3'],
      'Dbdim': ['Db3', 'E3', 'G3'], // Enharmonic with C#dim
      'Ddim': ['D3', 'F3', 'Ab3'],
      'D#dim': ['D#3', 'F#3', 'A3'],
      'Ebdim': ['Eb3', 'Gb3', 'A3'], // Enharmonic with D#dim
      'Edim': ['E3', 'G3', 'Bb3'],
      'Fdim': ['F3', 'Ab3', 'B3'],
      'F#dim': ['F#3', 'A3', 'C4'],
      'Gbdim': ['Gb3', 'A3', 'C4'], // Enharmonic with F#dim
      'Gdim': ['G3', 'Bb3', 'Db4'],
      'G#dim': ['G#3', 'B3', 'D4'],
      'Abdim': ['Ab3', 'B3', 'D4'], // Enharmonic with G#dim
      'Adim': ['A3', 'C4', 'Eb4'],
      'A#dim': ['A#3', 'C#4', 'E4'],
      'Bbdim': ['Bb3', 'Db4', 'E4'], // Enharmonic with A#dim
      'Bdim': ['B3', 'D4', 'F4'],
      
      // Diminished 7th chords (common in jazz)
      'Cdim7': ['C3', 'Eb3', 'Gb3', 'A3'],
      'C#dim7': ['C#3', 'E3', 'G3', 'Bb3'],
      'Dbdim7': ['Db3', 'E3', 'G3', 'Bb3'], // Enharmonic with C#dim7
      'Ddim7': ['D3', 'F3', 'Ab3', 'B3'],
      'Ebdim7': ['Eb3', 'Gb3', 'A3', 'C4'],
      'Edim7': ['E3', 'G3', 'Bb3', 'Db4'],
      'Fdim7': ['F3', 'Ab3', 'B3', 'D4'],
      'Gdim7': ['G3', 'Bb3', 'Db4', 'E4'],
      'Abdim7': ['Ab3', 'B3', 'D4', 'F4'],
      'Bbdim7': ['Bb3', 'Db4', 'E4', 'G4'],
      
      // Half-diminished chords (m7b5, common in jazz)
      'Cm7b5': ['C3', 'Eb3', 'Gb3', 'Bb3'],
      'C#m7b5': ['C#3', 'E3', 'G3', 'B3'],
      'Dbm7b5': ['Db3', 'E3', 'G3', 'B3'], // Enharmonic with C#m7b5
      'Dm7b5': ['D3', 'F3', 'Ab3', 'C4'],
      'Ebm7b5': ['Eb3', 'Gb3', 'A3', 'Db4'],
      'Em7b5': ['E3', 'G3', 'Bb3', 'D4'],
      'Fm7b5': ['F3', 'Ab3', 'B3', 'Eb4'],
      'Gm7b5': ['G3', 'Bb3', 'Db4', 'F4'],
      'Am7b5': ['A3', 'C4', 'Eb4', 'G4'],
      'Bm7b5': ['B3', 'D4', 'F4', 'A4'],
      
      // Augmented chords (common in jazz and classical)
      'Caug': ['C3', 'E3', 'G#3'],
      'C#aug': ['C#3', 'F3', 'A3'],
      'Daug': ['D3', 'F#3', 'A#3'],
      'Ebaug': ['Eb3', 'G3', 'B3'],
      'Eaug': ['E3', 'G#3', 'C4'],
      'Faug': ['F3', 'A3', 'C#4'],
      'Gaug': ['G3', 'B3', 'D#4'],
      'Abaug': ['Ab3', 'C4', 'E4'],
      'Aaug': ['A3', 'C#4', 'F4'],
      'Bbaug': ['Bb3', 'D4', 'F#4'],
      'Baug': ['B3', 'D#4', 'G4'],
      
      // Suspended chords (sus4, common in rock and pop)
      'Csus4': ['C3', 'F3', 'G3'],
      'C#sus4': ['C#3', 'F#3', 'G#3'],
      'Dsus4': ['D3', 'G3', 'A3'],
      'Ebsus4': ['Eb3', 'Ab3', 'Bb3'],
      'Esus4': ['E3', 'A3', 'B3'],
      'Fsus4': ['F3', 'Bb3', 'C4'],
      'Gsus4': ['G3', 'C4', 'D4'],
      'Absus4': ['Ab3', 'Db4', 'Eb4'],
      'Asus4': ['A3', 'D4', 'E4'],
      'Bbsus4': ['Bb3', 'Eb4', 'F4'],
      'Bsus4': ['B3', 'E4', 'F#4'],
      
      // Sus2 chords (common in pop and folk)
      'Csus2': ['C3', 'D3', 'G3'],
      'Dsus2': ['D3', 'E3', 'A3'],
      'Esus2': ['E3', 'F#3', 'B3'],
      'Fsus2': ['F3', 'G3', 'C4'],
      'Gsus2': ['G3', 'A3', 'D4'],
      'Asus2': ['A3', 'B3', 'E4'],
      'Bsus2': ['B3', 'C#4', 'F#4'],
      
      // Add9 chords (common in pop and jazz)
      'Cadd9': ['C3', 'E3', 'G3', 'D4'],
      'Dadd9': ['D3', 'F#3', 'A3', 'E4'],
      'Eadd9': ['E3', 'G#3', 'B3', 'F#4'],
      'Fadd9': ['F3', 'A3', 'C4', 'G4'],
      'Gadd9': ['G3', 'B3', 'D4', 'A4'],
      'Aadd9': ['A3', 'C#4', 'E4', 'B4'],
      
      // 6th chords (common in jazz)
      'C6': ['C3', 'E3', 'G3', 'A3'],
      'D6': ['D3', 'F#3', 'A3', 'B3'],
      'E6': ['E3', 'G#3', 'B3', 'C#4'],
      'F6': ['F3', 'A3', 'C4', 'D4'],
      'G6': ['G3', 'B3', 'D4', 'E4'],
      'A6': ['A3', 'C#4', 'E4', 'F#4'],
      'B6': ['B3', 'D#4', 'F#4', 'G#4'],
      
      // Minor 6th chords
      'Cm6': ['C3', 'Eb3', 'G3', 'A3'],
      'Dm6': ['D3', 'F3', 'A3', 'B3'],
      'Em6': ['E3', 'G3', 'B3', 'C#4'],
      'Fm6': ['F3', 'Ab3', 'C4', 'D4'],
      'Gm6': ['G3', 'Bb3', 'D4', 'E4'],
      'Am6': ['A3', 'C4', 'E4', 'F#4'],
      'Bm6': ['B3', 'D4', 'F#4', 'G#4'],
      
      // 9th chords (common in jazz)
      'C9': ['C3', 'E3', 'G3', 'Bb3', 'D4'],
      'C#9': ['C#3', 'F3', 'G#3', 'B3', 'D#4'],
      'Db9': ['Db3', 'F3', 'Ab3', 'B3', 'Eb4'], // Enharmonic with C#9
      'D9': ['D3', 'F#3', 'A3', 'C4', 'E4'],
      'D#9': ['D#3', 'G3', 'A#3', 'C#4', 'F4'],
      'Eb9': ['Eb3', 'G3', 'Bb3', 'Db4', 'F4'], // Enharmonic with D#9
      'E9': ['E3', 'G#3', 'B3', 'D4', 'F#4'],
      'F9': ['F3', 'A3', 'C4', 'Eb4', 'G4'],
      'F#9': ['F#3', 'A#3', 'C#4', 'E4', 'G#4'],
      'Gb9': ['Gb3', 'Bb3', 'Db4', 'E4', 'Ab4'], // Enharmonic with F#9
      'G9': ['G3', 'B3', 'D4', 'F4', 'A4'],
      'G#9': ['G#3', 'C4', 'D#4', 'F#4', 'A#4'],
      'Ab9': ['Ab3', 'C4', 'Eb4', 'Gb4', 'Bb4'], // Enharmonic with G#9
      'A9': ['A3', 'C#4', 'E4', 'G4', 'B4'],
      'A#9': ['A#3', 'D4', 'F4', 'G#4', 'C5'],
      'Bb9': ['Bb3', 'D4', 'F4', 'Ab4', 'C5'], // Enharmonic with A#9
      'B9': ['B3', 'D#4', 'F#4', 'A4', 'C#5'],
      
      // Major 9th chords
      'Cmaj9': ['C3', 'E3', 'G3', 'B3', 'D4'],
      'C#maj9': ['C#3', 'F3', 'G#3', 'C4', 'D#4'],
      'Dbmaj9': ['Db3', 'F3', 'Ab3', 'C4', 'Eb4'], // Enharmonic with C#maj9
      'Dmaj9': ['D3', 'F#3', 'A3', 'C#4', 'E4'],
      'Ebmaj9': ['Eb3', 'G3', 'Bb3', 'D4', 'F4'],
      'Emaj9': ['E3', 'G#3', 'B3', 'D#4', 'F#4'],
      'Fmaj9': ['F3', 'A3', 'C4', 'E4', 'G4'],
      'F#maj9': ['F#3', 'A#3', 'C#4', 'F4', 'G#4'],
      'Gbmaj9': ['Gb3', 'Bb3', 'Db4', 'F4', 'Ab4'], // Enharmonic with F#maj9
      'Gmaj9': ['G3', 'B3', 'D4', 'F#4', 'A4'],
      'Abmaj9': ['Ab3', 'C4', 'Eb4', 'G4', 'Bb4'],
      'Amaj9': ['A3', 'C#4', 'E4', 'G#4', 'B4'],
      'Bbmaj9': ['Bb3', 'D4', 'F4', 'A4', 'C5'],
      'Bmaj9': ['B3', 'D#4', 'F#4', 'A#4', 'C#5'],
      
      // Minor 9th chords
      'Cm9': ['C3', 'Eb3', 'G3', 'Bb3', 'D4'],
      'C#m9': ['C#3', 'E3', 'G#3', 'B3', 'D#4'],
      'Dbm9': ['Db3', 'E3', 'Ab3', 'B3', 'Eb4'], // Enharmonic with C#m9
      'Dm9': ['D3', 'F3', 'A3', 'C4', 'E4'],
      'D#m9': ['D#3', 'F#3', 'A#3', 'C#4', 'F4'],
      'Ebm9': ['Eb3', 'Gb3', 'Bb3', 'Db4', 'F4'], // Enharmonic with D#m9
      'Em9': ['E3', 'G3', 'B3', 'D4', 'F#4'],
      'Fm9': ['F3', 'Ab3', 'C4', 'Eb4', 'G4'],
      'F#m9': ['F#3', 'A3', 'C#4', 'E4', 'G#4'],
      'Gbm9': ['Gb3', 'A3', 'Db4', 'E4', 'Ab4'], // Enharmonic with F#m9
      'Gm9': ['G3', 'Bb3', 'D4', 'F4', 'A4'],
      'G#m9': ['G#3', 'B3', 'D#4', 'F#4', 'A#4'],
      'Abm9': ['Ab3', 'B3', 'Eb4', 'Gb4', 'Bb4'], // Enharmonic with G#m9
      'Am9': ['A3', 'C4', 'E4', 'G4', 'B4'],
      'A#m9': ['A#3', 'C#4', 'F4', 'G#4', 'C5'],
      'Bbm9': ['Bb3', 'Db4', 'F4', 'Ab4', 'C5'], // Enharmonic with A#m9
      'Bm9': ['B3', 'D4', 'F#4', 'A4', 'C#5']
    };
    
    // Try to match the chord in the map directly
    if (chordMap[chordName]) {
      return chordMap[chordName];
    }
    
    // If chord not found, attempt to parse it and find a close match
    // Extract root note and chord type
    const rootNoteMatch = chordName.match(/^([A-G][b#]?)/);
    if (!rootNoteMatch) {
      console.warn(`Couldn't parse chord name: ${chordName}, using C major as fallback`);
      return chordMap['C']; // Return C major as final fallback
    }
    
    const rootNote = rootNoteMatch[1];
    const chordType = chordName.substring(rootNote.length);
    
    // Check for matching root with different case or spacing in chord type
    // This handles variations like "Cmaj7" vs "C maj7" or "C Maj7"
    const normalizedChordType = chordType.toLowerCase().replace(/\s+/g, '');
    
    // Map of normalized chord types to standard chord types
    const chordTypeMap: Record<string, string> = {
      // Major triads
      'maj': '',          // Major triad
      'major': '',        // Major triad
      'M': '',            // Major triad
      
      // Minor triads
      'min': 'm',         // Minor triad
      'minor': 'm',       // Minor triad
      'm': 'm',           // Minor triad
      '-': 'm',           // Minor triad (alternate notation)
      
      // Half-diminished
      'm7b5': 'm7b5',     // Half-diminished
      'ø': 'm7b5',        // Half-diminished
      'min7b5': 'm7b5',   // Half-diminished
      '-7b5': 'm7b5',     // Half-diminished
      
      // Diminished triads
      'dim': 'dim',       // Diminished
      '°': 'dim',         // Diminished
      'o': 'dim',         // Diminished (alternate notation)
      
      // Diminished 7th
      'dim7': 'dim7',     // Diminished 7th
      '°7': 'dim7',       // Diminished 7th
      'o7': 'dim7',       // Diminished 7th
      
      // Augmented triads
      'aug': 'aug',       // Augmented
      '+': 'aug',         // Augmented
      'aug5': 'aug',      // Augmented
      
      // Dominant 7th
      '7': '7',           // Dominant 7th
      'dom7': '7',        // Dominant 7th
      'dominant7': '7',   // Dominant 7th
      
      // Major 7th
      'maj7': 'maj7',     // Major 7th
      'major7': 'maj7',   // Major 7th
      'M7': 'maj7',       // Major 7th
      'Δ': 'maj7',        // Major 7th
      'Δ7': 'maj7',       // Major 7th
      
      // Minor 7th
      'm7': 'm7',         // Minor 7th
      'min7': 'm7',       // Minor 7th
      'minor7': 'm7',     // Minor 7th
      '-7': 'm7',         // Minor 7th
      
      // Suspended chords
      'sus2': 'sus2',     // Suspended 2nd
      'sus4': 'sus4',     // Suspended 4th
      'sus': 'sus4',      // Suspended 4th (default)
      
      // 6th chords
      '6': '6',           // Major 6th
      'maj6': '6',        // Major 6th
      'major6': '6',      // Major 6th
      'M6': '6',          // Major 6th
      
      // Minor 6th chords
      'm6': 'm6',         // Minor 6th
      'min6': 'm6',       // Minor 6th
      'minor6': 'm6',     // Minor 6th
      '-6': 'm6',         // Minor 6th
      
      // Add9 chords
      'add9': 'add9',     // Add 9th
      '2': 'add9',        // Add 9th (simplified notation)
      
      // Dominant 9th
      '9': '9',           // Dominant 9th
      'dom9': '9',        // Dominant 9th
      'dominant9': '9',   // Dominant 9th
      
      // Major 9th
      'maj9': 'maj9',     // Major 9th
      'major9': 'maj9',   // Major 9th
      'M9': 'maj9',       // Major 9th
      
      // Minor 9th
      'm9': 'm9',         // Minor 9th
      'min9': 'm9',       // Minor 9th
      'minor9': 'm9',     // Minor 9th
      '-9': 'm9'          // Minor 9th
    };
    
    // Try to match the chord type
    if (chordTypeMap[normalizedChordType]) {
      const standardChordType = chordTypeMap[normalizedChordType];
      const standardChordName = rootNote + standardChordType;
      
      if (chordMap[standardChordName]) {
        console.log(`Matched ${chordName} to ${standardChordName}`);
        return chordMap[standardChordName];
      }
    }
    
    // If we couldn't match the chord type, try to at least use the correct root note
    // with a major triad
    if (chordMap[rootNote]) {
      console.warn(`Using ${rootNote} major for unrecognized chord: ${chordName}`);
      return chordMap[rootNote];
    }
    
    // Last resort fallback
    console.warn(`Couldn't parse chord: ${chordName}, using C major as fallback`);
    return chordMap['C'];
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
    
    // Make sure we handle larger values properly
    do {
      let byte = v & 0x7F; // Take the 7 least significant bits
      v >>= 7; // Shift right by 7 bits
      
      // If there are more bytes to come, set the MSB
      if (v > 0) byte |= 0x80;
      
      result.unshift(byte); // Add to the beginning of the array
    } while (v > 0);
    
    return result;
  };

  // Create MIDI file data
  const createMidiFile = (): Uint8Array => {
    if (!progression) {
      return new Uint8Array();
    }
    
    console.log(`Creating MIDI for ${progression.chords.length} chords: ${progression.chords.join(', ')}`);
    
    // Calculate all chord notes first
    const chordNotes: number[][] = [];
    
    // Process each chord in the progression
    for (let i = 0; i < progression.chords.length; i++) {
      const chord = progression.chords[i];
      console.log(`Processing chord ${i+1}: ${chord}`);
      
      // Get notes for this chord
      const notes = chordToNotes(chord);
      const midiNotes = notes.map(noteToMidiNumber);
      
      // Add bass note one octave lower
      const bassNote = midiNotes[0] - 12;
      const allNotes = [bassNote, ...midiNotes];
      
      // Store all notes for this chord
      chordNotes.push(allNotes);
    }
    
    // Start building the MIDI file directly as a byte array
    const bytes: number[] = [];
    
    // === MIDI Header ===
    bytes.push(0x4D, 0x54, 0x68, 0x64);  // "MThd" chunk type
    bytes.push(0x00, 0x00, 0x00, 0x06);  // Header length
    bytes.push(0x00, 0x00);              // Format 0 (single track)
    bytes.push(0x00, 0x01);              // One track
    bytes.push(0x00, 0x60);              // Division: 96 ticks per quarter note
    
    // === Track chunk data ===
    const trackData: number[] = [];
    
    // Time signature: 4/4
    trackData.push(0x00);                // Delta time: 0
    trackData.push(0xFF, 0x58, 0x04);    // Time signature event
    trackData.push(0x04, 0x02, 0x18, 0x08); // 4/4 time
    
    // Tempo (based on BPM)
    const tempo = Math.floor(60000000 / progression.bpm);
    trackData.push(0x00);                // Delta time: 0
    trackData.push(0xFF, 0x51, 0x03);    // Tempo event
    trackData.push(
      (tempo >> 16) & 0xFF,
      (tempo >> 8) & 0xFF,
      tempo & 0xFF
    );
    
    // Program change to piano (instrument 0)
    trackData.push(0x00);                // Delta time: 0
    trackData.push(0xC0, 0x00);          // Program change, channel 1, piano
    
    // === Add all chords using a consistent pattern ===
    // We now know this approach works reliably
    for (let chordIndex = 0; chordIndex < chordNotes.length; chordIndex++) {
      const notes = chordNotes[chordIndex];
      
      // Delta time before chord (0 for first chord, 253 ticks for others)
      if (chordIndex === 0) {
        trackData.push(0x00);          // First chord starts at time 0
      } else {
        trackData.push(0x83, 0x3D);    // 253 ticks (gap between chords)
      }
      
      // Note on events - first note in chord
      trackData.push(0x90, notes[0], 0x64);  // Note on, channel 1, velocity 100
      
      // Remaining notes in chord (all start simultaneously)
      for (let i = 1; i < notes.length; i++) {
        trackData.push(0x00);            // No delta time
        trackData.push(0x90, notes[i], 0x64); // Note on
      }
      
      // Add note off events after exactly 131 ticks (0x83 0x03)
      trackData.push(0x83, 0x03);        // Delta time: 131 ticks
      
      // Note off for first note
      trackData.push(0x80, notes[0], 0x40);  // Note off, channel 1, velocity 64
      
      // Remaining note-offs (all end simultaneously)
      for (let i = 1; i < notes.length; i++) {
        trackData.push(0x00);            // No delta time
        trackData.push(0x80, notes[i], 0x40); // Note off
      }
    }
    
    // End of track event
    trackData.push(0x00);                // Delta time: 0
    trackData.push(0xFF, 0x2F, 0x00);    // End of track
    
    // Add MTrk header
    bytes.push(0x4D, 0x54, 0x72, 0x6B);  // "MTrk" chunk type
    
    // Add track length (4 bytes)
    bytes.push(
      (trackData.length >> 24) & 0xFF,   // Most significant byte
      (trackData.length >> 16) & 0xFF,
      (trackData.length >> 8) & 0xFF,
      trackData.length & 0xFF            // Least significant byte
    );
    
    // Add all track data
    for (let i = 0; i < trackData.length; i++) {
      bytes.push(trackData[i]);
    }
    
    // Create the final Uint8Array
    const midiData = new Uint8Array(bytes);
    console.log(`Created MIDI file with ${chordNotes.length} chords, ${midiData.length} bytes`);
    
    return midiData;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>MIDI.ai</h1>
      
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
              opacity: isGenerating ? 0.7 : 1,
              ...(hoverStates.generate && !isGenerating ? { backgroundColor: '#2563eb', transform: 'translateY(-2px)' } : {})
            }}
            onClick={generateProgression}
            disabled={isGenerating}
            onMouseEnter={() => setHoverStates({...hoverStates, generate: true})}
            onMouseLeave={() => setHoverStates({...hoverStates, generate: false})}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
        {error && <p style={styles.errorText}>{error}</p>}
      </div>
      
      {progression && (
        <div style={styles.progressionContainer}>
          <h2 style={styles.progressionTitle}>
            {/* Add a musical note icon using Unicode */}
            <span role="img" aria-label="music">🎵</span> Generated Progression
          </h2>
          <div style={styles.flexRow}>
            <div style={styles.flexCol}>
              <div style={{marginBottom: '1rem'}}>
                <p><span style={styles.propertyLabel}>Key:</span> <span style={styles.propertyValue}>{progression.key}</span></p>
                <p><span style={styles.propertyLabel}>Style:</span> <span style={styles.propertyValue}>{progression.style}</span></p>
                <p><span style={styles.propertyLabel}>Tempo:</span> <span style={styles.propertyValue}>{progression.bpm} BPM</span></p>
              </div>
              
              <div>
                <span style={styles.propertyLabel}>Chords:</span>
                <div style={styles.chordsList}>
                  {progression.chords.map((chord, index) => (
                    <span key={index} style={styles.chordPill}>{chord}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={styles.flexCol}>
              <div style={styles.buttonGroup}>
                <button
                  onClick={isPlaying ? stopPlayback : playProgression}
                  style={{
                    ...styles.iconButton,
                    ...(isPlaying ? styles.stopButton : styles.previewButton),
                    ...(hoverStates.preview && !isPlaying ? styles.previewButtonHover : {}),
                    ...(hoverStates.preview && isPlaying ? styles.stopButtonHover : {})
                  }}
                  onMouseEnter={() => setHoverStates({...hoverStates, preview: true})}
                  onMouseLeave={() => setHoverStates({...hoverStates, preview: false})}
                >
                  {/* Audio icon using Unicode */}
                  <span role="img" aria-hidden="true">{isPlaying ? '⏹️' : '▶️'}</span>
                  {isPlaying ? 'Stop' : 'Preview'}
                </button>
                
                <button
                  onClick={downloadMidi}
                  style={{
                    ...styles.iconButton,
                    ...styles.downloadButton,
                    ...(hoverStates.download ? styles.downloadButtonHover : {})
                  }}
                  onMouseEnter={() => setHoverStates({...hoverStates, download: true})}
                  onMouseLeave={() => setHoverStates({...hoverStates, download: false})}
                >
                  {/* Download icon using Unicode */}
                  <span role="img" aria-hidden="true">⬇️</span>
                  Download MIDI
                </button>
              </div>
              
              <div style={styles.fileInputContainer}>
                <span style={styles.fileNameLabel}>File name:</span>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  style={styles.fileNameInput}
                />
                <span style={styles.fileExtension}>.mid</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div style={styles.tipsContainer}>
        <h3 style={styles.tipsTitle}>
          <span role="img" aria-label="lightbulb">💡</span> Usage Tips
        </h3>
        <ul style={styles.tipsList}>
          <li style={styles.tipItem}><b>Key:</b> "in C major" or "in F# minor"</li>
          <li style={styles.tipItem}><b>Style:</b> "jazz", "rock", "pop", "blues", "folk", "classical"</li>
          <li style={styles.tipItem}><b>Mood:</b> "melancholic", "uplifting", "energetic", "calm", "dramatic"</li>
          <li style={styles.tipItem}><b>Tempo:</b> "120 BPM" or use "slow", "medium tempo", "fast"</li>
          <li style={styles.tipItem}><b>Example:</b> "A melancholic jazz progression in D minor at 90 BPM"</li>
        </ul>
      </div>
    </div>
  );
};

export default ChordProgressionGenerator;
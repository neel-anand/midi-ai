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
      'D9': ['D3', 'F#3', 'A3', 'C4', 'E4'],
      'F9': ['F3', 'A3', 'C4', 'Eb4', 'G4'],
      'G9': ['G3', 'B3', 'D4', 'F4', 'A4'],
      'Bb9': ['Bb3', 'D4', 'F4', 'Ab4', 'C5'],
      
      // Minor 9th chords
      'Cm9': ['C3', 'Eb3', 'G3', 'Bb3', 'D4'],
      'Dm9': ['D3', 'F3', 'A3', 'C4', 'E4'],
      'Em9': ['E3', 'G3', 'B3', 'D4', 'F#4'],
      'Gm9': ['G3', 'Bb3', 'D4', 'F4', 'A4'],
      'Am9': ['A3', 'C4', 'E4', 'G4', 'B4']
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
      'maj': '',          // Major triad
      'major': '',        // Major triad
      'min': 'm',         // Minor triad
      'minor': 'm',       // Minor triad
      'm7b5': 'm7b5',     // Half-diminished
      'ø': 'm7b5',        // Half-diminished
      'dim': 'dim',       // Diminished
      'dim7': 'dim7',     // Diminished 7th
      '°': 'dim',         // Diminished
      '°7': 'dim7',       // Diminished 7th
      'aug': 'aug',       // Augmented
      '+': 'aug',         // Augmented
      '7': '7',           // Dominant 7th
      'dom7': '7',        // Dominant 7th
      'maj7': 'maj7',     // Major 7th
      'major7': 'maj7',   // Major 7th
      'Δ': 'maj7',        // Major 7th
      'Δ7': 'maj7',       // Major 7th
      'm7': 'm7',         // Minor 7th
      'min7': 'm7',       // Minor 7th
      'minor7': 'm7',     // Minor 7th
      'sus2': 'sus2',     // Suspended 2nd
      'sus4': 'sus4',     // Suspended 4th
      'sus': 'sus4',      // Suspended 4th (default)
      '6': '6',           // Major 6th
      'm6': 'm6',         // Minor 6th
      'min6': 'm6',       // Minor 6th
      'add9': 'add9',     // Add 9th
      '9': '9',           // Dominant 9th
      'm9': 'm9',         // Minor 9th
      'min9': 'm9'        // Minor 9th
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
    
    // MIDI header (MThd chunk)
    const header = [
      0x4D, 0x54, 0x68, 0x64, // "MThd"
      0x00, 0x00, 0x00, 0x06, // Header length (always 6 bytes)
      0x00, 0x01, // Format 1 (multiple tracks)
      0x00, 0x02, // Two tracks (tempo track + chord track)
      0x00, 0x60  // Division: 96 ticks per quarter note (0x60 = 96)
    ];
    
    // First track - tempo and time signature (from reference file)
    const tempoTrackEvents: number[] = [];
    
    // Set tempo (in microseconds per quarter note)
    const microsecondsPerBeat = Math.round(60000000 / progression.bpm);
    tempoTrackEvents.push(
      0x00, // Delta time (immediate)
      0xFF, 0x51, 0x03, // Tempo meta event
      (microsecondsPerBeat >> 16) & 0xFF,
      (microsecondsPerBeat >> 8) & 0xFF,
      microsecondsPerBeat & 0xFF
    );
    
    // Set time signature (4/4)
    tempoTrackEvents.push(
      0x00, // Delta time
      0xFF, 0x58, 0x04, // Time signature meta event
      0x04, // Numerator (4)
      0x02, // Denominator (4 = 2^2)
      0x18, // Clocks per metronome click (24)
      0x08  // 32nd notes per quarter note (8)
    );
    
    // End of track marker
    tempoTrackEvents.push(
      0x00, // Delta time
      0xFF, 0x2F, 0x00 // End of track meta event
    );
    
    // Tempo track byte length needs to be calculated to create the header
    // Create a temp array to calculate total length
    const tempoTrackArray = new Uint8Array(tempoTrackEvents);
    const tempoTrackSize = tempoTrackArray.length;
    
    // Create tempo track chunk
    const tempoTrackHeader = [
      0x4D, 0x54, 0x72, 0x6B, // "MTrk"
      (tempoTrackSize >> 24) & 0xFF,
      (tempoTrackSize >> 16) & 0xFF,
      (tempoTrackSize >> 8) & 0xFF,
      tempoTrackSize & 0xFF  // Track length in bytes
    ];
    
    // Second track - chord progression
    const chordTrackEvents: number[] = [];
    
    // Set track name
    const trackName = `Omnisphere 1`; // From reference file
    chordTrackEvents.push(
      0x00, // Delta time
      0xFF, 0x03, trackName.length, // Track name meta event
      ...trackName.split('').map(c => c.charCodeAt(0)) // Track name as bytes
    );
    
    // Calculate timing
    const ticksPerBeat = 96; // Based on the header division value
    const beatsPerChord = 4; // One bar per chord (in 4/4 time)
    const ticksPerChord = beatsPerChord * ticksPerBeat;
    
    // Add each chord - based on reference MIDI
    progression.chords.forEach((chord, index) => {
      // Get the basic chord notes
      const notes = chordToNotes(chord);
      const midiNotes = notes.map(noteToMidiNumber);
      
      // Add additional "color" notes like in the reference
      // Create bass notes, melody notes, and other embellishments
      const bassNote = midiNotes[0] - 12; // One octave lower
      const melodyNotes = [
        midiNotes[midiNotes.length - 1] + 5, // Higher melody note
        midiNotes[midiNotes.length - 1] + 7  // Another melody note
      ];
      
      // Combine all notes
      const allNotes = [
        bassNote,       // Bass note
        ...midiNotes,   // Main chord notes
        ...melodyNotes  // Melody/embellishment notes
      ];
      
      // Note velocities as observed in reference (varying by note type)
      const velocities = [
        71,   // Bass note - medium velocity
        40,   // Root note - softer
        109,  // Middle note - louder
        94,   // Middle/high note
        79,   // High note
        72,   // Extra note 1 (if any)
        105   // Extra note 2 (if any)
      ];
      
      // Start all chord notes with slight timing differences for more natural sound
      allNotes.forEach((note, noteIndex) => {
        // For the first note or start of a new chord
        if (noteIndex === 0 && index > 0) {
          // Add a small delay between chords (about 1/8 note)
          const delayBetweenChords = Math.round(ticksPerBeat / 8);
          const delayBytes = encodeVariableLength(delayBetweenChords);
          delayBytes.forEach(byte => chordTrackEvents.push(byte));
        } else if (noteIndex === 0) {
          // First chord, first note - no delay
          chordTrackEvents.push(0x00);
        } else {
          // Slight arpeggio effect between notes in the same chord (1-5 ticks)
          const arpDelay = 1 + Math.floor(Math.random() * 5);
          const arpDelayBytes = encodeVariableLength(arpDelay);
          arpDelayBytes.forEach(byte => chordTrackEvents.push(byte));
        }
        
        // Get velocity or use default
        const velocity = noteIndex < velocities.length ? 
          velocities[noteIndex] : 
          70 + Math.floor(Math.random() * 20); // Random velocity between 70-90
        
        chordTrackEvents.push(
          0x90, // Note On, channel 0
          note, // Note number
          velocity > 127 ? 127 : velocity // Cap velocity at 127
        );
      });
      
      // Note Off events - based on reference patterns
      // Note durations observed in reference (in ticks)
      const noteDurations = [
        29,  // Bass note - shorter
        32,  // Root - medium
        32,  // Third - medium
        32,  // Fifth - medium
        32,  // Seventh - medium
        20,  // Melody note 1 - shorter
        12   // Melody note 2 - shortest
      ];
      
      // Each note has individual timing for ending
      allNotes.forEach((note, noteIndex) => {
        // Base duration from reference or default duration
        const baseNoteDuration = (noteIndex < noteDurations.length) ? 
          noteDurations[noteIndex] : ticksPerBeat;
        
        // Add slight randomization for more natural sound
        const randomFactor = 0.95 + Math.random() * 0.1; // 0.95-1.05
        const deltaTime = Math.round(baseNoteDuration * randomFactor);
        const deltaBytes = encodeVariableLength(deltaTime);
        
        // Add the delta time
        deltaBytes.forEach(byte => chordTrackEvents.push(byte));
        
        chordTrackEvents.push(
          0x80, // Note Off, channel 0
          note, // Note number
          0x40  // Release velocity
        );
      });
    });
    
    // End of track marker
    chordTrackEvents.push(
      0x00, // Delta time
      0xFF, 0x2F, 0x00 // End of track meta event
    );
    
    // Chord track byte length needs to be calculated to create the header
    // Create a temp array to calculate total length
    const chordTrackArray = new Uint8Array(chordTrackEvents);
    const chordTrackSize = chordTrackArray.length;
    
    // Create chord track header
    const chordTrackHeader = [
      0x4D, 0x54, 0x72, 0x6B, // "MTrk"
      (chordTrackSize >> 24) & 0xFF,
      (chordTrackSize >> 16) & 0xFF,
      (chordTrackSize >> 8) & 0xFF,
      chordTrackSize & 0xFF  // Track length in bytes
    ];
    
    // Combine everything into a single array
    const midiData = new Uint8Array([
      ...header,
      ...tempoTrackHeader,
      ...tempoTrackEvents,
      ...chordTrackHeader,
      ...chordTrackEvents
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
// Interactive Music Toy with instrument selection, effects, and visual feedback

// Note mapping for keys/buttons
const keyMap = {
  a: "C4",
  s: "D4",
  d: "E4",
  f: "F4",
  g: "G4",
  h: "A4",
  j: "B4",
  k: "C5"
};
const notes = Object.values(keyMap);

// DOM elements
const instrumentSelect = document.getElementById("instrument");
const filterSlider = document.getElementById("frequency");
const reverbSlider = document.getElementById("reverb");
const distortionSlider = document.getElementById("distortion");
const keys = document.querySelectorAll(".key");
const visualizer = document.getElementById("visualizer");

// Tone.js nodes
let synth, drum, currentInstrument, reverb, distortion, filter;

// Setup instruments and effects
function setupAudio() {
  // Disconnect previous nodes if any
  if (synth) synth.disconnect();
  if (drum) drum.disconnect();

  // Effects
  filter = new Tone.Filter(filterSlider.value, "lowpass").toDestination();
  distortion = new Tone.Distortion(distortionSlider.value).toDestination();
  reverb = new Tone.Reverb(2).toDestination();
  reverb.wet.value = reverbSlider.value;

  // Instrument selection
  switch (instrumentSelect.value) {
    case "synth":
      synth = new Tone.Synth().connect(filter).connect(distortion).connect(reverb);
      currentInstrument = synth;
      break;
    case "fm":
      synth = new Tone.FMSynth().connect(filter).connect(distortion).connect(reverb);
      currentInstrument = synth;
      break;
    case "drum":
      drum = new Tone.MembraneSynth().connect(filter).connect(distortion).connect(reverb);
      currentInstrument = drum;
      break;
  }
}

// Play note with visual effect
function playNote(note, keyElem) {
  Tone.start(); // Ensure audio context is started

  // Visual feedback
  if (keyElem) {
    keyElem.classList.add("active");
    visualizer.style.boxShadow = `0 0 24px #${Math.floor(Math.random()*16777215).toString(16)}`;
    setTimeout(() => {
      keyElem.classList.remove("active");
      visualizer.style.boxShadow = "";
    }, 200);
  } else {
    visualizer.style.boxShadow = `0 0 24px #${Math.floor(Math.random()*16777215).toString(16)}`;
    setTimeout(() => {
      visualizer.style.boxShadow = "";
    }, 200);
  }

  // Play sound
  if (instrumentSelect.value === "drum") {
    currentInstrument.triggerAttackRelease("C2", "8n");
  } else {
    currentInstrument.triggerAttackRelease(note, "8n");
  }
}

// Keyboard support
document.addEventListener("keydown", (event) => {
  const note = keyMap[event.key];
  if (note) {
    const idx = notes.indexOf(note);
    playNote(note, keys[idx]);
  }
});

// Button support (mouse/touch)
keys.forEach((keyBtn, idx) => {
  keyBtn.addEventListener("mousedown", () => playNote(notes[idx], keyBtn));
  keyBtn.addEventListener("touchstart", () => playNote(notes[idx], keyBtn));
});

// Sliders update effects in real time
filterSlider.addEventListener("input", () => {
  if (filter) filter.frequency.value = filterSlider.value;
});
reverbSlider.addEventListener("input", () => {
  if (reverb) reverb.wet.value = reverbSlider.value;
});
distortionSlider.addEventListener("input", () => {
  if (distortion) distortion.distortion = distortionSlider.value;
});

// Instrument change
instrumentSelect.addEventListener("change", setupAudio);

// Step Sequencer Variables
let sequencerPattern = {};
let isPlaying = false;
let isLooping = false;
let currentStep = 0;
let tempo = 120;
let sequencerInterval = null;
let stepElements = [];

// Initialize sequencer pattern
function initializeSequencer() {
  notes.forEach(note => {
    sequencerPattern[note] = new Array(8).fill(false);
  });
  
  // Get all step elements
  stepElements = document.querySelectorAll('.step-number');
}

// Step Sequencer DOM elements
const playStopBtn = document.getElementById('playStopBtn');
const loopToggleBtn = document.getElementById('loopToggleBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const tempoSlider = document.getElementById('tempoSlider');
const tempoValue = document.getElementById('tempoValue');
const stepCells = document.querySelectorAll('.step-cell');

// Step cell click handlers
stepCells.forEach(cell => {
  cell.addEventListener('click', () => {
    const noteRow = cell.closest('.note-row');
    const note = noteRow.dataset.note;
    const step = parseInt(cell.dataset.step);
    
    // Toggle step
    sequencerPattern[note][step] = !sequencerPattern[note][step];
    cell.classList.toggle('active', sequencerPattern[note][step]);
  });
});

// Play/Stop button
playStopBtn.addEventListener('click', () => {
  if (isPlaying) {
    stopSequencer();
  } else {
    startSequencer();
  }
});

// Loop toggle button
loopToggleBtn.addEventListener('click', () => {
  isLooping = !isLooping;
  loopToggleBtn.textContent = isLooping ? '🔄 Loop: ON' : '🔄 Loop: OFF';
  loopToggleBtn.classList.toggle('active', isLooping);
});

// Clear all button
clearAllBtn.addEventListener('click', () => {
  // Clear pattern
  notes.forEach(note => {
    sequencerPattern[note] = new Array(8).fill(false);
  });
  
  // Clear visual state
  stepCells.forEach(cell => {
    cell.classList.remove('active');
  });
  
  // Stop sequencer if playing
  if (isPlaying) {
    stopSequencer();
  }
});

// Tempo slider
tempoSlider.addEventListener('input', () => {
  tempo = parseInt(tempoSlider.value);
  tempoValue.textContent = tempo;
  
  // If playing, restart with new tempo
  if (isPlaying) {
    stopSequencer();
    startSequencer();
  }
});

// Start sequencer
function startSequencer() {
  Tone.start(); // Ensure audio context is started
  
  isPlaying = true;
  currentStep = 0;
  playStopBtn.textContent = '⏸️ Stop';
  playStopBtn.classList.add('active');
  
  // Calculate interval based on tempo (quarter notes)
  const intervalMs = (60 / tempo) * 250; // 250ms for 16th notes at 120 BPM
  
  sequencerInterval = setInterval(() => {
    playSequencerStep();
    currentStep = (currentStep + 1) % 8;
    
    // Check if we've completed a loop
    if (currentStep === 0 && !isLooping) {
      stopSequencer();
    }
  }, intervalMs);
  
  // Play first step immediately
  playSequencerStep();
}

// Stop sequencer
function stopSequencer() {
  isPlaying = false;
  playStopBtn.textContent = '▶️ Start';
  playStopBtn.classList.remove('active');
  
  if (sequencerInterval) {
    clearInterval(sequencerInterval);
    sequencerInterval = null;
  }
  
  // Clear step highlighting
  stepElements.forEach(el => el.classList.remove('current-step'));
  currentStep = 0;
}

// Play current sequencer step
function playSequencerStep() {
  // Clear previous step highlighting
  stepElements.forEach(el => el.classList.remove('current-step'));
  
  // Highlight current step
  if (stepElements[currentStep]) {
    stepElements[currentStep].classList.add('current-step');
  }
  
  // Play notes for current step
  notes.forEach(note => {
    if (sequencerPattern[note][currentStep]) {
      playNote(note);
    }
  });
}

// Save pattern to localStorage
function savePattern(name) {
  const patterns = JSON.parse(localStorage.getItem('sequencerPatterns') || '{}');
  patterns[name] = {
    pattern: sequencerPattern,
    tempo: tempo,
    isLooping: isLooping
  };
  localStorage.setItem('sequencerPatterns', JSON.stringify(patterns));
}

// Load pattern from localStorage
function loadPattern(name) {
  const patterns = JSON.parse(localStorage.getItem('sequencerPatterns') || '{}');
  if (patterns[name]) {
    const savedPattern = patterns[name];
    
    // Stop current playback
    if (isPlaying) {
      stopSequencer();
    }
    
    // Load pattern
    sequencerPattern = savedPattern.pattern;
    tempo = savedPattern.tempo || 120;
    isLooping = savedPattern.isLooping || false;
    
    // Update UI
    tempoSlider.value = tempo;
    tempoValue.textContent = tempo;
    loopToggleBtn.textContent = isLooping ? '🔄 Loop: ON' : '🔄 Loop: OFF';
    loopToggleBtn.classList.toggle('active', isLooping);
    
    // Update step cells
    stepCells.forEach(cell => {
      const noteRow = cell.closest('.note-row');
      const note = noteRow.dataset.note;
      const step = parseInt(cell.dataset.step);
      const isActive = sequencerPattern[note][step];
      cell.classList.toggle('active', isActive);
    });
  }
}

// Add some preset patterns
function loadPreset(presetName) {
  // Stop current playback
  if (isPlaying) {
    stopSequencer();
  }
  
  // Clear current pattern
  notes.forEach(note => {
    sequencerPattern[note] = new Array(8).fill(false);
  });
  
  switch (presetName) {
    case 'kick':
      // Simple kick pattern
      sequencerPattern['C4'] = [true, false, false, false, true, false, false, false];
      break;
    case 'melody':
      // Simple melody
      sequencerPattern['C4'] = [true, false, false, false, false, false, false, false];
      sequencerPattern['E4'] = [false, false, true, false, false, false, true, false];
      sequencerPattern['G4'] = [false, false, false, false, true, false, false, false];
      break;
    case 'rhythm':
      // Rhythmic pattern
      sequencerPattern['C4'] = [true, false, true, false, true, false, true, false];
      sequencerPattern['D4'] = [false, true, false, true, false, true, false, true];
      break;
  }
  
  // Update visual state
  stepCells.forEach(cell => {
    const noteRow = cell.closest('.note-row');
    const note = noteRow.dataset.note;
    const step = parseInt(cell.dataset.step);
    const isActive = sequencerPattern[note][step];
    cell.classList.toggle('active', isActive);
  });
}

// Keyboard shortcuts for sequencer
document.addEventListener('keydown', (event) => {
  // Don't interfere with existing note playing
  if (keyMap[event.key]) {
    return;
  }
  
  switch (event.key) {
    case ' ': // Spacebar to play/stop
      event.preventDefault();
      if (isPlaying) {
        stopSequencer();
      } else {
        startSequencer();
      }
      break;
    case 'l': // L to toggle loop
      isLooping = !isLooping;
      loopToggleBtn.textContent = isLooping ? '🔄 Loop: ON' : '🔄 Loop: OFF';
      loopToggleBtn.classList.toggle('active', isLooping);
      break;
    case 'c': // C to clear all
      notes.forEach(note => {
        sequencerPattern[note] = new Array(8).fill(false);
      });
      stepCells.forEach(cell => {
        cell.classList.remove('active');
      });
      if (isPlaying) {
        stopSequencer();
      }
      break;
  }
});

// Initial setup
setupAudio();
initializeSequencer();

/*
  Code comments:
  - setupAudio(): Initializes instruments and effects based on user selection
  - playNote(): Plays sound and visual effects when a note is played.
  - Supports both keyboard and button presses on the interface.
  - Sliders adjust sound effects in real-time.
  - Interface optimized for both desktop and mobile.
  - Step sequencer with 8 steps and 8 notes (A-K keys)
  - Loop functionality, tempo control, and pattern saving
  - Keyboard shortcuts: Space (play/stop), L (loop), C (clear)
*/

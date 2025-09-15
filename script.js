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
const volumeSlider = document.getElementById("volume");
const filterSlider = document.getElementById("frequency");
const reverbSlider = document.getElementById("reverb");
const distortionSlider = document.getElementById("distortion");
const keys = document.querySelectorAll(".key");
const visualizer = document.getElementById("visualizer");
const toggleBtn = document.getElementById("toggleVisualizerBtn");

let synth, drum, currentInstrument, reverb, distortion, filter, analyser, masterGain, drumGain;

// Polyphonic playback system
const activeNotes = new Map(); // Track active notes and their sources
const maxPolyphony = 6; // Maximum simultaneous notes
const pressedKeys = new Set(); // Track currently pressed keys

// === NEW VISUALIZER DATA STRUCTURES ===
let canvas = document.getElementById("visualizer");
let ctx = canvas.getContext("2d");
let visualizerMode = "bar"; // default
const particles = []; 
const noteBlooms = []; // Holds the active visual blooms for each note

// Map each note to a specific angle on the circle (in radians)
const noteAngleMap = {
    "C4": 0,                      // Right
    "D4": Math.PI * 0.25,         // Bottom-right
    "E4": Math.PI * 0.5,          // Bottom
    "F4": Math.PI * 0.75,         // Bottom-left
    "G4": Math.PI,                // Left
    "A4": Math.PI * 1.25,         // Top-left
    "B4": Math.PI * 1.5,          // Top
    "C5": Math.PI * 1.75          // Top-right
};

// Setup instruments and effects
function setupAudio() {
  if (synth) {
    synth.dispose();
    synth = null;
  }
  if (drum) {
    drum.dispose();
    drum = null;
  }
  if (filter) {
    filter.dispose();
    filter = null;
  }
  if (distortion) {
    distortion.dispose();
    distortion = null;
  }
  if (reverb) {
    reverb.dispose();
    reverb = null;
  }
  if (analyser) {
    analyser.dispose();
    analyser = null;
  }
  if (masterGain) {
    masterGain.dispose();
    masterGain = null;
  }
  if (drumGain) {
    drumGain.dispose();
    drumGain = null;
  }

  // Effects
  filter = new Tone.Filter(filterSlider.value, "lowpass");
  distortion = new Tone.Distortion(distortionSlider.value);
  reverb = new Tone.Reverb(2);
  reverb.wet.value = reverbSlider.value;

  masterGain = new Tone.Gain(volumeSlider.value).toDestination();
  drumGain = new Tone.Gain(0.7); // Slightly reduce drum volume

  // Connect effects chain
  filter.connect(distortion);
  distortion.connect(reverb);
  reverb.connect(masterGain);

  analyser = new Tone.Analyser("fft", 128);
  masterGain.connect(analyser);

  // Instrument selection
  switch (instrumentSelect.value) {
    case "synth":
      synth = new Tone.Synth();
      synth.connect(filter);
      currentInstrument = synth;
      break;
    case "fm":
      synth = new Tone.FMSynth();
      synth.connect(filter);
      currentInstrument = synth;
      break;
    case "drum":
      drum = new Tone.MembraneSynth();
      drum.connect(drumGain);
      drumGain.connect(filter);
      currentInstrument = drum;
      break;
  }
}

// Create independent synthesizer for polyphonic playback
function createSynthInstance() {
  let synthInstance;

  switch (instrumentSelect.value) {
    case "synth":
      synthInstance = new Tone.Synth();
      synthInstance.connect(filter);
      break;
    case "fm":
      synthInstance = new Tone.FMSynth();
      synthInstance.connect(filter);
      break;
    case "drum":
      synthInstance = new Tone.MembraneSynth();
      synthInstance.connect(drumGain);
      break;
    default:
      synthInstance = new Tone.Synth();
      synthInstance.connect(filter);
  }

  return synthInstance;
}

// Start playing a note (for sustained playback)
function startNote(note, keyElem) {
  Tone.start(); // Ensure audio context is started
  
  // Check polyphony limit
  if (activeNotes.size >= maxPolyphony) {
    return;
  }
  
  // Don't start if already playing
  if (activeNotes.has(note)) {
    return;
  }
  
  // Create independent synthesizer instance
  const synthInstance = createSynthInstance();
  
  // Start the note
  if (instrumentSelect.value === "drum") {
    synthInstance.triggerAttack("C2");
  } else {
    synthInstance.triggerAttack(note);
  }
  
  // Store the active note
  activeNotes.set(note, synthInstance);
  
  // Visual feedback
  if (keyElem) {
    keyElem.classList.add("active");
  }
    // --- Create a corresponding visual bloom ---
    const bloom = {
        angle: noteAngleMap[note], // Get the pre-defined angle for this note
        strength: 100, // Initial size/impact of the bloom
        life: 120 // Lifespan in frames (e.g., 60fps = 2 seconds)
    };
    noteBlooms.push(bloom);
    createParticles(canvas.width / 2, canvas.height / 2); // Also trigger a central particle burst
}

// Stop playing a note
function stopNote(note, keyElem) {
  const synthInstance = activeNotes.get(note);
  if (synthInstance) {
    synthInstance.triggerRelease();
    
    // Clean up after a short delay to allow release envelope
    setTimeout(() => {
      synthInstance.dispose();
    }, 1000);
    
    activeNotes.delete(note);
  }
  
  // Visual feedback
  if (keyElem) {
    keyElem.classList.remove("active");
  }
  
  // Clear visualizer if no notes are playing
  if (activeNotes.size === 0) {
    visualizer.style.boxShadow = "";
  }
}

// Play note with visual effect (for sequencer and one-shot playback)
function playNote(note, keyElem) {
    Tone.start();
    if (keyElem) {
        keyElem.classList.add("active");
        setTimeout(() => keyElem.classList.remove("active"), 200);
    }

    // --- Create a corresponding visual bloom for the sequencer ---
    const bloom = {
        angle: noteAngleMap[note],
        strength: 100,
        life: 120
    };
    noteBlooms.push(bloom);
    createParticles(canvas.width / 2, canvas.height / 2);

    const synthInstance = createSynthInstance();
    if (instrumentSelect.value === "drum") {
        synthInstance.triggerAttackRelease("C2", "8n");
    } else {
        synthInstance.triggerAttackRelease(note, "8n");
    }
    setTimeout(() => synthInstance.dispose(), 1000);
}

// Keyboard support with sustained playback
document.addEventListener("keydown", (event) => {
  const note = keyMap[event.key];
  if (note && !pressedKeys.has(event.key)) {
    // Prevent key repeat
    pressedKeys.add(event.key);
    const idx = notes.indexOf(note);
    startNote(note, keys[idx]);
  }
});

document.addEventListener("keyup", (event) => {
  const note = keyMap[event.key];
  if (note && pressedKeys.has(event.key)) {
    pressedKeys.delete(event.key);
    const idx = notes.indexOf(note);
    stopNote(note, keys[idx]);
  }
});

// Button support with sustained playback (mouse/touch)
keys.forEach((keyBtn, idx) => {
  let isPressed = false;
  
  // Mouse events
  keyBtn.addEventListener("mousedown", (event) => {
    event.preventDefault();
    if (!isPressed) {
      isPressed = true;
      startNote(notes[idx], keyBtn);
    }
  });
  
  keyBtn.addEventListener("mouseup", (event) => {
    event.preventDefault();
    if (isPressed) {
      isPressed = false;
      stopNote(notes[idx], keyBtn);
    }
  });
  
  keyBtn.addEventListener("mouseleave", (event) => {
    if (isPressed) {
      isPressed = false;
      stopNote(notes[idx], keyBtn);
    }
  });
  
  // Touch events
  keyBtn.addEventListener("touchstart", (event) => {
    event.preventDefault();
    if (!isPressed) {
      isPressed = true;
      startNote(notes[idx], keyBtn);
    }
  });
  
  keyBtn.addEventListener("touchend", (event) => {
    event.preventDefault();
    if (isPressed) {
      isPressed = false;
      stopNote(notes[idx], keyBtn);
    }
  });
  
  keyBtn.addEventListener("touchcancel", (event) => {
    if (isPressed) {
      isPressed = false;
      stopNote(notes[idx], keyBtn);
    }
  });
});

// Clean up any stuck notes when window loses focus
window.addEventListener("blur", () => {
  // Stop all active notes
  for (const [note, synthInstance] of activeNotes) {
    synthInstance.triggerRelease();
    setTimeout(() => {
      synthInstance.dispose();
    }, 1000);
  }
  activeNotes.clear();
  pressedKeys.clear();
  
  // Clear visual feedback
  keys.forEach(key => key.classList.remove("active"));
  visualizer.style.boxShadow = "";
});

// Sliders update effects in real time
volumeSlider.addEventListener("input", () => {
  if (masterGain) masterGain.gain.value = volumeSlider.value;
});
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

// Step Sequencer Variables (refactored for multiple sequencers)
class Sequencer {
  constructor(id, pattern = null, tempo = 120, isLooping = false) {
    this.id = id;
    this.pattern = pattern || this.initializePattern();
    this.isPlaying = false;
    this.isLooping = isLooping;
    this.currentStep = 0;
    this.tempo = tempo;
    this.interval = null;
    this.stepElements = [];
    this.element = null; // DOM element for this sequencer
  }

  initializePattern() {
    const pattern = {};
    notes.forEach(note => {
      pattern[note] = new Array(8).fill(false);
    });
    return pattern;
  }

  start() {
    Tone.start();
    this.isPlaying = true;
    this.currentStep = 0;

    const intervalMs = (60 / this.tempo) * 250;
    this.interval = setInterval(() => {
      this.playStep();
      this.currentStep = (this.currentStep + 1) % 8;

      if (this.currentStep === 0 && !this.isLooping) {
        this.stop();
      }
    }, intervalMs);

    this.playStep(); // Play first step immediately
  }

  stop() {
    this.isPlaying = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.clearStepHighlighting();
    this.currentStep = 0;
  }

  playStep() {
    this.clearStepHighlighting();
    if (this.stepElements[this.currentStep]) {
      this.stepElements[this.currentStep].classList.add('current-step');
    }

    notes.forEach(note => {
      if (this.pattern[note][this.currentStep]) {
        playNote(note);
      }
    });
  }

  clearStepHighlighting() {
    this.stepElements.forEach(el => el.classList.remove('current-step'));
  }

  toggleStep(note, step) {
    this.pattern[note][step] = !this.pattern[note][step];
  }

  clearPattern() {
    notes.forEach(note => {
      this.pattern[note] = new Array(8).fill(false);
    });
  }

  toJSON() {
    return {
      pattern: this.pattern,
      tempo: this.tempo,
      isLooping: this.isLooping
    };
  }

  fromJSON(data) {
    this.pattern = data.pattern;
    this.tempo = data.tempo;
    this.isLooping = data.isLooping;
  }
}

let sequencers = [];
let nextSequencerId = 1;

// Initialize sequencer pattern
function initializeSequencer() {
  // Create the first sequencer (original one)
  const firstSequencer = new Sequencer(nextSequencerId++);
  sequencers.push(firstSequencer);

  // Get all step elements for the first sequencer
  firstSequencer.stepElements = document.querySelectorAll('.step-number');
}

// Step Sequencer DOM elements
const playStopBtn = document.getElementById('playStopBtn');
const loopToggleBtn = document.getElementById('loopToggleBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const tempoSlider = document.getElementById('tempoSlider');
const tempoValue = document.getElementById('tempoValue');
const stepCells = document.querySelectorAll('.step-cell');

// Step cell click handlers for the first sequencer
stepCells.forEach(cell => {
  cell.addEventListener('click', () => {
    const noteRow = cell.closest('.note-row');
    const note = noteRow.dataset.note;
    const step = parseInt(cell.dataset.step);

    // Toggle step for the first sequencer
    const sequencer = sequencers[0];
    sequencer.toggleStep(note, step);
    cell.classList.toggle('active', sequencer.pattern[note][step]);
  });
});

// Play/Stop button for the first sequencer
playStopBtn.addEventListener('click', () => {
  const sequencer = sequencers[0];
  if (sequencer.isPlaying) {
    sequencer.stop();
    playStopBtn.textContent = '▶️ Start';
    playStopBtn.classList.remove('active');
  } else {
    sequencer.start();
    playStopBtn.textContent = '⏸️ Stop';
    playStopBtn.classList.add('active');
  }
});

// Loop toggle button for the first sequencer
loopToggleBtn.addEventListener('click', () => {
  const sequencer = sequencers[0];
  sequencer.isLooping = !sequencer.isLooping;
  loopToggleBtn.textContent = sequencer.isLooping ? '🔄 Loop: ON' : '🔄 Loop: OFF';
  loopToggleBtn.classList.toggle('active', sequencer.isLooping);
});

// Clear all button for the first sequencer
clearAllBtn.addEventListener('click', () => {
  const sequencer = sequencers[0];

  // Clear pattern
  sequencer.clearPattern();

  // Clear visual state
  stepCells.forEach(cell => {
    cell.classList.remove('active');
  });

  // Stop sequencer if playing
  if (sequencer.isPlaying) {
    sequencer.stop();
    playStopBtn.textContent = '▶️ Start';
    playStopBtn.classList.remove('active');
  }
});

// Tempo slider for the first sequencer
tempoSlider.addEventListener('input', () => {
  const sequencer = sequencers[0];
  sequencer.tempo = parseInt(tempoSlider.value);
  tempoValue.textContent = sequencer.tempo;

  // If playing, restart with new tempo
  if (sequencer.isPlaying) {
    sequencer.stop();
    sequencer.start();
  }
});

// Functions for multi-sequencer management
function addSequencer() {
  const sequencer = new Sequencer(nextSequencerId++);
  sequencers.push(sequencer);
  renderSequencer(sequencer);
}

function removeSequencer(sequencerId) {
  const index = sequencers.findIndex(seq => seq.id === sequencerId);
  if (index !== -1) {
    const sequencer = sequencers[index];
    if (sequencer.isPlaying) {
      sequencer.stop();
    }
    if (sequencer.element) {
      sequencer.element.remove();
    }
    sequencers.splice(index, 1);
  }
}

function playAllSequencers() {
  sequencers.forEach(seq => {
    if (!seq.isPlaying) {
      seq.start();
    }
  });
}

function stopAllSequencers() {
  sequencers.forEach(seq => {
    if (seq.isPlaying) {
      seq.stop();
    }
  });
}

function renderSequencer(sequencer) {
  const container = document.getElementById('sequencersContainer');

  const sequencerDiv = document.createElement('div');
  sequencerDiv.className = 'sequencer-instance';
  sequencerDiv.dataset.id = sequencer.id;

  sequencerDiv.innerHTML = `
    <div class="sequencer-header">
      <h4>Sequencer ${sequencer.id}</h4>
      <div class="sequencer-controls">
        <button class="play-sequencer-btn control-btn" data-id="${sequencer.id}">▶️ Play</button>
        <button class="stop-sequencer-btn control-btn" data-id="${sequencer.id}">⏸️ Stop</button>
        <button class="clear-sequencer-btn control-btn" data-id="${sequencer.id}">🗑️ Clear</button>
        <button class="remove-sequencer-btn control-btn" data-id="${sequencer.id}">❌ Remove</button>
        <div class="tempo-control">
          <label>Tempo: <span class="tempo-value">${sequencer.tempo}</span> BPM</label>
          <input type="range" class="tempo-slider" data-id="${sequencer.id}" min="60" max="180" value="${sequencer.tempo}">
        </div>
      </div>
    </div>
    <div class="sequencer-grid">
      <div class="step-labels">
        <div class="step-label">Step</div>
        <div class="step-number">1</div>
        <div class="step-number">2</div>
        <div class="step-number">3</div>
        <div class="step-number">4</div>
        <div class="step-number">5</div>
        <div class="step-number">6</div>
        <div class="step-number">7</div>
        <div class="step-number">8</div>
      </div>
      ${notes.map(note => {
        const key = Object.keys(keyMap).find(k => keyMap[k] === note);
        return `
          <div class="note-row" data-note="${note}">
            <div class="note-label">${key.toUpperCase()} (${note})</div>
            ${Array.from({length: 8}, (_, i) => `<div class="step-cell" data-step="${i}"></div>`).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.appendChild(sequencerDiv);
  sequencer.element = sequencerDiv;

  // Set up step elements
  sequencer.stepElements = sequencerDiv.querySelectorAll('.step-number');

  // Add event listeners
  const playBtn = sequencerDiv.querySelector('.play-sequencer-btn');
  const stopBtn = sequencerDiv.querySelector('.stop-sequencer-btn');
  const clearBtn = sequencerDiv.querySelector('.clear-sequencer-btn');
  const removeBtn = sequencerDiv.querySelector('.remove-sequencer-btn');
  const tempoSlider = sequencerDiv.querySelector('.tempo-slider');
  const tempoValue = sequencerDiv.querySelector('.tempo-value');
  const stepCells = sequencerDiv.querySelectorAll('.step-cell');

  playBtn.addEventListener('click', () => {
    if (!sequencer.isPlaying) {
      sequencer.start();
      playBtn.textContent = '⏸️ Playing';
      playBtn.classList.add('active');
    }
  });

  stopBtn.addEventListener('click', () => {
    if (sequencer.isPlaying) {
      sequencer.stop();
      playBtn.textContent = '▶️ Play';
      playBtn.classList.remove('active');
    }
  });

  clearBtn.addEventListener('click', () => {
    sequencer.clearPattern();
    stepCells.forEach(cell => cell.classList.remove('active'));
    if (sequencer.isPlaying) {
      sequencer.stop();
      playBtn.textContent = '▶️ Play';
      playBtn.classList.remove('active');
    }
  });

  removeBtn.addEventListener('click', () => {
    removeSequencer(sequencer.id);
  });

  tempoSlider.addEventListener('input', () => {
    sequencer.tempo = parseInt(tempoSlider.value);
    tempoValue.textContent = sequencer.tempo;
    if (sequencer.isPlaying) {
      sequencer.stop();
      sequencer.start();
    }
  });

  stepCells.forEach(cell => {
    cell.addEventListener('click', () => {
      const noteRow = cell.closest('.note-row');
      const note = noteRow.dataset.note;
      const step = parseInt(cell.dataset.step);
      sequencer.toggleStep(note, step);
      cell.classList.toggle('active', sequencer.pattern[note][step]);
    });
  });
}

// --- PATTERN SAVE/LOAD (for first sequencer) ---
const saveSlotSelect = document.getElementById('saveSlotSelect');
const savePatternBtn = document.getElementById('savePatternBtn');
const loadPatternBtn = document.getElementById('loadPatternBtn');
const deletePatternBtn = document.getElementById('deletePatternBtn');

// Save pattern to the selected slot
savePatternBtn.addEventListener('click', () => {
  const slot = saveSlotSelect.value;
  const patterns = JSON.parse(localStorage.getItem('sequencerPatterns') || '{}');
  const sequencer = sequencers[0];
  patterns[slot] = sequencer.toJSON();
  localStorage.setItem('sequencerPatterns', JSON.stringify(patterns));
  alert(`Pattern saved to Slot ${slot}`);
});

// Load pattern from the selected slot
loadPatternBtn.addEventListener('click', () => {
  const slot = saveSlotSelect.value;
  const patterns = JSON.parse(localStorage.getItem('sequencerPatterns') || '{}');

  if (patterns[slot]) {
    const sequencer = sequencers[0];
    if (sequencer.isPlaying) sequencer.stop();

    sequencer.fromJSON(patterns[slot]);

    // Update UI
    tempoSlider.value = sequencer.tempo;
    tempoValue.textContent = sequencer.tempo;
    loopToggleBtn.textContent = sequencer.isLooping ? '🔄 Loop: ON' : '🔄 Loop: OFF';
    loopToggleBtn.classList.toggle('active', sequencer.isLooping);
    playStopBtn.textContent = '▶️ Start';
    playStopBtn.classList.remove('active');

    stepCells.forEach(cell => {
      const note = cell.closest('.note-row').dataset.note;
      const step = parseInt(cell.dataset.step);
      cell.classList.toggle('active', sequencer.pattern[note][step]);
    });
    alert(`Pattern loaded from Slot ${slot}`);
  } else {
    alert(`Slot ${slot} is empty.`);
  }
});

// Delete pattern from the selected slot
deletePatternBtn.addEventListener('click', () => {
    const slot = saveSlotSelect.value;
    const patterns = JSON.parse(localStorage.getItem('sequencerPatterns') || '{}');

    if (patterns[slot]) {
        if (confirm(`Are you sure you want to delete the pattern in Slot ${slot}?`)) {
            delete patterns[slot];
            localStorage.setItem('sequencerPatterns', JSON.stringify(patterns));
            alert(`Pattern in Slot ${slot} has been deleted.`);
        }
    } else {
        alert(`Slot ${slot} is already empty.`);
    }
});

// --- SONG SAVE/LOAD ---
const addSequencerBtn = document.getElementById('addSequencerBtn');
const playAllBtn = document.getElementById('playAllBtn');
const stopAllBtn = document.getElementById('stopAllBtn');
const saveSongSlotSelect = document.getElementById('saveSongSlotSelect');
const saveSongBtn = document.getElementById('saveSongBtn');
const loadSongBtn = document.getElementById('loadSongBtn');
const deleteSongBtn = document.getElementById('deleteSongBtn');

// Add sequencer button
addSequencerBtn.addEventListener('click', () => {
  addSequencer();
});

// Play all sequencers
playAllBtn.addEventListener('click', () => {
  playAllSequencers();
});

// Stop all sequencers
stopAllBtn.addEventListener('click', () => {
  stopAllSequencers();
});

// Save song to the selected slot
saveSongBtn.addEventListener('click', () => {
  const slot = saveSongSlotSelect.value;
  const songs = JSON.parse(localStorage.getItem('sequencerSongs') || '{}');
  songs[slot] = sequencers.map(seq => seq.toJSON());
  localStorage.setItem('sequencerSongs', JSON.stringify(songs));
  alert(`Song saved to Slot ${slot}`);
});

// Load song from the selected slot
loadSongBtn.addEventListener('click', () => {
  const slot = saveSongSlotSelect.value;
  const songs = JSON.parse(localStorage.getItem('sequencerSongs') || '{}');

  if (songs[slot]) {
    // Stop all current sequencers
    stopAllSequencers();

    // Clear existing sequencers except the first one
    while (sequencers.length > 1) {
      removeSequencer(sequencers[sequencers.length - 1].id);
    }

    // Load the song data
    const songData = songs[slot];
    sequencers = [];

    songData.forEach((seqData, index) => {
      const sequencer = new Sequencer(nextSequencerId++, null, seqData.tempo, seqData.isLooping);
      sequencer.fromJSON(seqData);
      sequencers.push(sequencer);

      if (index === 0) {
        // Update the first sequencer UI
        const firstSeq = sequencer;
        tempoSlider.value = firstSeq.tempo;
        tempoValue.textContent = firstSeq.tempo;
        loopToggleBtn.textContent = firstSeq.isLooping ? '🔄 Loop: ON' : '🔄 Loop: OFF';
        loopToggleBtn.classList.toggle('active', firstSeq.isLooping);
        playStopBtn.textContent = '▶️ Start';
        playStopBtn.classList.remove('active');

        stepCells.forEach(cell => {
          const note = cell.closest('.note-row').dataset.note;
          const step = parseInt(cell.dataset.step);
          cell.classList.toggle('active', firstSeq.pattern[note][step]);
        });
      } else {
        // Render additional sequencers
        renderSequencer(sequencer);
      }
    });

    alert(`Song loaded from Slot ${slot}`);
  } else {
    alert(`Slot ${slot} is empty.`);
  }
});

// Delete song from the selected slot
deleteSongBtn.addEventListener('click', () => {
    const slot = saveSongSlotSelect.value;
    const songs = JSON.parse(localStorage.getItem('sequencerSongs') || '{}');

    if (songs[slot]) {
        if (confirm(`Are you sure you want to delete the song in Slot ${slot}?`)) {
            delete songs[slot];
            localStorage.setItem('sequencerSongs', JSON.stringify(songs));
            alert(`Song in Slot ${slot} has been deleted.`);
        }
    } else {
        alert(`Slot ${slot} is already empty.`);
    }
});


// Add some preset patterns (for first sequencer)
function loadPreset(presetName) {
  const sequencer = sequencers[0];

  // Stop current playback
  if (sequencer.isPlaying) {
    sequencer.stop();
    playStopBtn.textContent = '▶️ Start';
    playStopBtn.classList.remove('active');
  }

  // Clear current pattern
  sequencer.clearPattern();

  switch (presetName) {
    case 'kick':
      // Simple kick pattern
      sequencer.pattern['C4'] = [true, false, false, false, true, false, false, false];
      break;
    case 'melody':
      // Simple melody
      sequencer.pattern['C4'] = [true, false, false, false, false, false, false, false];
      sequencer.pattern['E4'] = [false, false, true, false, false, false, true, false];
      sequencer.pattern['G4'] = [false, false, false, false, true, false, false, false];
      break;
    case 'rhythm':
      // Rhythmic pattern
      sequencer.pattern['C4'] = [true, false, true, false, true, false, true, false];
      sequencer.pattern['D4'] = [false, true, false, true, false, true, false, true];
      break;
  }

  // Update visual state
  stepCells.forEach(cell => {
    const noteRow = cell.closest('.note-row');
    const note = noteRow.dataset.note;
    const step = parseInt(cell.dataset.step);
    const isActive = sequencer.pattern[note][step];
    cell.classList.toggle('active', isActive);
  });
}

// Keyboard shortcuts for sequencer (separate event listener to avoid conflicts)
document.addEventListener('keydown', (event) => {
  // Handle sequencer shortcuts only if not playing notes
  if (keyMap[event.key]) {
    return; // Let note playing take priority
  }

  switch (event.key) {
    case ' ': // Spacebar to play/stop first sequencer
      event.preventDefault();
      const sequencer = sequencers[0];
      if (sequencer.isPlaying) {
        sequencer.stop();
        playStopBtn.textContent = '▶️ Start';
        playStopBtn.classList.remove('active');
      } else {
        sequencer.start();
        playStopBtn.textContent = '⏸️ Stop';
        playStopBtn.classList.add('active');
      }
      break;
    case 'l': // L to toggle loop for first sequencer
      event.preventDefault();
      const seq = sequencers[0];
      seq.isLooping = !seq.isLooping;
      loopToggleBtn.textContent = seq.isLooping ? '🔄 Loop: ON' : '🔄 Loop: OFF';
      loopToggleBtn.classList.toggle('active', seq.isLooping);
      break;
    case 'c': // C to clear all for first sequencer
      event.preventDefault();
      const clearSeq = sequencers[0];
      clearSeq.clearPattern();
      stepCells.forEach(cell => {
        cell.classList.remove('active');
      });
      if (clearSeq.isPlaying) {
        clearSeq.stop();
        playStopBtn.textContent = '▶️ Start';
        playStopBtn.classList.remove('active');
      }
      break;
  }
});

// Initial setup
setupAudio();
initializeSequencer();

// === Visualizer ===
toggleBtn.addEventListener("click", () => {
    visualizerMode = visualizerMode === "bar" ? "circle" : "bar";
    toggleBtn.textContent = visualizerMode === "bar" ? "🔄 Switch to Circle Visualizer" : "🔄 Switch to Bar Visualizer";
});

function createParticles(x, y) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: 80, alpha: 1,
            color: `hsl(${Math.random() * 50 + 280}, 100%, 75%)`
        });
    }
}

// === COMPLETELY NEW drawVisualizer FUNCTION ===
function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    if (!analyser) return;

    const values = analyser.getValue();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (visualizerMode === "bar") {
        const barWidth = canvas.width / values.length;
        ctx.shadowColor = '#c837f5';
        ctx.shadowBlur = 10;
        values.forEach((val, i) => {
            const height = (val + 140) * 2.5;
            ctx.fillStyle = '#c837f5';
            ctx.fillRect(i * barWidth, canvas.height - height, barWidth, height);
        });
        ctx.shadowBlur = 0;
    } else { // Circle visualizer mode
        
        // --- 1. Update and Animate Note Blooms ---
        for (let i = noteBlooms.length - 1; i >= 0; i--) {
            const bloom = noteBlooms[i];
            bloom.strength *= 0.96; // Bloom's impact shrinks over time
            bloom.life--;
            if (bloom.life <= 0) {
                noteBlooms.splice(i, 1); // Remove dead blooms
            }
        }

        // --- 2. Draw Main Waveform Circle ---
        ctx.beginPath();
        const baseRadius = 100;
        const totalPoints = 256; // How many points to draw around the circle
        
        for(let i = 0; i < totalPoints; i++) {
            const angle = (i / totalPoints) * Math.PI * 2;
            const idleAnimation = Math.sin(Date.now() * 0.002 + i * 0.1) * 2;
            
            // --- Calculate total influence from all active blooms ---
            let bloomInfluence = 0;
            noteBlooms.forEach(bloom => {
                // Find angular distance between the bloom and the current point
                let angleDiff = Math.abs(bloom.angle - angle);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff; // Handle wrap-around
                
                // Use a Gaussian falloff for a smooth bump effect
                const falloff = Math.exp(-(angleDiff * angleDiff) / 0.1);
                bloomInfluence += bloom.strength * falloff;
            });

            // The final radius is the base + idle animation + bloom influence
            const length = baseRadius + idleAnimation + bloomInfluence;
            const x = centerX + Math.cos(angle - Math.PI / 2) * length;
            const y = centerY + Math.sin(angle - Math.PI / 2) * length;

            if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
        }
        ctx.closePath();
        
        ctx.strokeStyle = '#e040fb';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#e040fb';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // --- 3. Update and Draw Particles ---
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.alpha = p.life / 80;
            
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
        ctx.globalAlpha = 1;
    }
}

drawVisualizer();
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

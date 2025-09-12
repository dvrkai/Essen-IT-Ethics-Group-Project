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
const toggleBtn = document.getElementById("toggleVisualizerBtn");

// Tone.js nodes
let synth, drum, currentInstrument, reverb, distortion, filter, analyser;

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
  // Disconnect previous nodes if any
  if (synth) synth.disconnect();
  if (drum) drum.disconnect();

  // Effects
  filter = new Tone.Filter(filterSlider.value, "lowpass").toDestination();
  distortion = new Tone.Distortion(distortionSlider.value).toDestination();
  reverb = new Tone.Reverb(2).toDestination();
  reverb.wet.value = reverbSlider.value;
    
  analyser = new Tone.Analyser("fft", 128); 
  reverb.connect(analyser);

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

// Create independent synthesizer for polyphonic playback
function createSynthInstance() {
  let synthInstance;
  
  switch (instrumentSelect.value) {
    case "synth":
      synthInstance = new Tone.Synth();
      break;
    case "fm":
      synthInstance = new Tone.FMSynth();
      break;
    case "drum":
      synthInstance = new Tone.MembraneSynth();
      break;
    default:
      synthInstance = new Tone.Synth();
  }
  
  // Connect to effects chain
  synthInstance.connect(filter).connect(distortion).connect(reverb);
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

// --- PATTERN SAVE/LOAD ---
const saveSlotSelect = document.getElementById('saveSlotSelect');
const savePatternBtn = document.getElementById('savePatternBtn');
const loadPatternBtn = document.getElementById('loadPatternBtn');
const deletePatternBtn = document.getElementById('deletePatternBtn');

// Save pattern to the selected slot
savePatternBtn.addEventListener('click', () => {
  const slot = saveSlotSelect.value;
  const patterns = JSON.parse(localStorage.getItem('sequencerPatterns') || '{}');
  patterns[slot] = {
    pattern: sequencerPattern,
    tempo: tempo,
    isLooping: isLooping
  };
  localStorage.setItem('sequencerPatterns', JSON.stringify(patterns));
  alert(`Pattern saved to Slot ${slot}`);
});

// Load pattern from the selected slot
loadPatternBtn.addEventListener('click', () => {
  const slot = saveSlotSelect.value;
  const patterns = JSON.parse(localStorage.getItem('sequencerPatterns') || '{}');
  
  if (patterns[slot]) {
    if (isPlaying) stopSequencer();
    
    const saved = patterns[slot];
    sequencerPattern = saved.pattern;
    tempo = saved.tempo || 120;
    isLooping = saved.isLooping || false;
    
    // Update UI
    tempoSlider.value = tempo;
    tempoValue.textContent = tempo;
    loopToggleBtn.textContent = isLooping ? '🔄 Loop: ON' : '🔄 Loop: OFF';
    loopToggleBtn.classList.toggle('active', isLooping);
    
    stepCells.forEach(cell => {
      const note = cell.closest('.note-row').dataset.note;
      const step = parseInt(cell.dataset.step);
      cell.classList.toggle('active', sequencerPattern[note][step]);
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

// Keyboard shortcuts for sequencer (separate event listener to avoid conflicts)
document.addEventListener('keydown', (event) => {
  // Handle sequencer shortcuts only if not playing notes
  if (keyMap[event.key]) {
    return; // Let note playing take priority
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
      event.preventDefault();
      isLooping = !isLooping;
      loopToggleBtn.textContent = isLooping ? '🔄 Loop: ON' : '🔄 Loop: OFF';
      loopToggleBtn.classList.toggle('active', isLooping);
      break;
    case 'c': // C to clear all
      event.preventDefault();
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

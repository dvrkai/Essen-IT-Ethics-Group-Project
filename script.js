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

// Initial setup
setupAudio();

/*
  Code comments:
  - setupAudio(): Initializes instruments and effects based on user selection
  - playNote(): Plays sound and visual effects when a note is played.
  - Supports both keyboard and button presses on the interface.
  - Sliders adjust sound effects in real-time.
  - Interface optimized for both desktop and mobile.
*/
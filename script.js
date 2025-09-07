// Create synth and effects
const synth = new Tone.Synth().toDestination();
const reverb = new Tone.Reverb(2).toDestination();
const distortion = new Tone.Distortion(0).toDestination();
const filter = new Tone.Filter(800, "lowpass").toDestination();

// Routing: synth → filter → distortion → reverb → speakers
synth.connect(filter);
filter.connect(distortion);
distortion.connect(reverb);

// Key-to-note map
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

// Play note on key press
document.addEventListener("keydown", (event) => {
  const note = keyMap[event.key];
  if (note) {
    Tone.start(); // ensures audio context is started
    synth.triggerAttackRelease(note, "8n");
  }
});

// Sliders
document.getElementById("vibe1").addEventListener("input", (e) => {
  filter.frequency.value = e.target.value;
});

document.getElementById("vibe2").addEventListener("input", (e) => {
  reverb.decay = parseFloat(e.target.value) * 5;
});

document.getElementById("vibe3").addEventListener("input", (e) => {
  distortion.distortion = parseFloat(e.target.value);
});

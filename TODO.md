# TODO: Implement Multi-Sequencer Song Maker

## 1. Update index.html
- [x] Add new "Song Maker" section below the "Pattern Management Section"
- [x] Include UI for adding/removing sequencer grids dynamically
- [x] Add tempo controls and play/stop buttons for each sequencer grid
- [x] Add save/load/delete controls for song slots

## 2. Refactor script.js for Multiple Sequencers
- [x] Refactor existing sequencer variables to support multiple grids
- [x] Implement functions to add/remove sequencer grids
- [x] Update play/stop logic to handle multiple sequencers playing simultaneously
- [x] Implement song save/load/delete functionality in localStorage
- [x] Ensure backward compatibility with existing single sequencer

## 3. Update styles.css
- [x] Add styles for the new multi-sequencer section
- [x] Style the dynamic sequencer grids and controls

## 4. Testing
- [x] Test adding multiple sequencer grids
- [x] Test changing tempos independently
- [x] Test playing multiple sequencers together
- [x] Test saving/loading/deleting song slots
- [x] Verify existing single sequencer functionality
- [x] Fixed issues: Play All only affects song maker sequencers, proper naming, notes visible when loading
- [x] Added song loop toggle button
- [x] Fixed load song to clear all existing sequencers first
- [x] Save/load song loop setting with songs

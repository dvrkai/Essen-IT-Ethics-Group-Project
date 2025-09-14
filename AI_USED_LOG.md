AI Use Log
This log records all uses of AI tools in this project, following RMIT academic integrity guidelines.
Each entry includes who used AI, for what, what was kept, and who reviewed it.
Table columns:
 Date | Member | Tool | Prompt / Query | Output Used | Changes Made | Reviewer | Notes |
Rules
All AI use must be transparent and documented.

Never paste large blocks of unverified AI code.

Always credit original sources and libraries.

| Date       | Member  | Tool    | Prompt / Query                                                                  | Output Used                 | Changes Made                        | Reviewer | Notes |
|------------|---------|---------|--------------------------------------------------------------------------------|------------------------------|-------------------------------------|----------|-------|
| 2025-09-07 | Thao    | ChatGPT | "Our topic is to create a Interactive Music Toy – press keys or move sliders to generate sounds with different vibes. Please create the files and frameworks needed as to vibe coding (tone.js basic index and script)"  | HTML + JS + CSS   | Renamed ids and names for future management    |  Bang Anh    | Used only as starting scaffold for framework |
| 2025-09-11 | Minh    | Copilot | "I need it to be more complete, with smoother features, and it must be very user-friendly for everyone.(tone.js basic index and script)"  | HTML + JS + CSS   | The interface has been enhanced for better visual clarity and usability.    |      | |
| 2025-09-11 |Bang Anh | Cline   | "Add a step sequencer with loop toggle, start/stop, tempo control, and an 8x7 grid for notes A–K that applies existing effects."  | HTML + JS + CSS   | Added step sequencer grid UI    |      | Might add pattern save/load later. |
| 2025-09-11 | Bang Anh| Cline   | "Fix the sound playback so when the user presses multiple keys (a chord), all notes play at the same time instead of one after another. Each key should have its own sound instance, and releasing one key should only stop that note, not the whole chord."  |  JS  | Polyphony support has been added    |      | Works well, but polyphony capped at 6 notes for performance. |
| 2025-09-12 | Binh | Gemini 2.5 | "Add a toggle to switch between a bar or a circle visualizer according to user's liking. Additionally, make a save and load system for the user to save or load their sequencer's pattern from different saving slots (Alert the user when saving, loading or deleting a pattern)."  |  HTML + JS + CSS  | Added a toggle to switch visualizers and a save/load system to the step sequencer | Thao | Visualizer lost the lgbt colors and save slots only limited to 5. |
| 2025-09-14 | Thao    | Deepseek | "I want adjust the audio balance in my project, please so note down what bugs are there and how to fix them."  | HTML + JS | Removed old nodes that weren't in use, and added a seperate max volume for drums, connected the volume to visualizer for more accuracy |  | Fixed the bugs that were listed |
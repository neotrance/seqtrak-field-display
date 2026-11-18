# SEQTRAK FIELD DISPLAY v1.3.7

Mac browser prototype for the display-only SEQTRAK companion screen. The display canvas uses 320×170 logical coordinates and a 1280×680 backing store.

## Run

Open `index.html` in a browser. Space Grotesk and IBM Plex Mono are loaded from Google Fonts, so the browser needs an internet connection to render those exact font files. The font families are fixed in `styles.css`; there is no font selector.

## GitHub Pages

This is a static site and needs no build step. Keep `index.html` at the repository root, then configure GitHub Pages to deploy from the root of the `main` branch. A project repository named `seqtrak-field-display` is served at `https://neotrance.github.io/seqtrak-field-display/`.

## Language and appearance

- The preview opens in English. Use the language selector at the upper right to switch between English and Japanese.
- Use the adjacent control to switch between dark and light appearance. The setting applies to both the browser controls and the 320 × 170 display preview.
- Preset names and effect names remain in their source data spelling in either language.

## PC and smartphone layout

- On PC, the preview stays in the left column while the controls on the right scroll independently.
- On smartphones, the preview remains in the upper area and the controls scroll in the lower area.
- The preview frame keeps the 320:170 aspect ratio in both layouts.

## Preview controls

- DISPLAY FAMILY and SOUND PRESET are local preview controls.
- The MIDI CC panel applies documented control-change examples to the preview only. It does not connect to a MIDI device or send messages.
- MUTE and SOLO CC values use the documented thresholds and target-track encoding. The guide says these CCs are receive-only, so physical button changes are not inferred from outbound MIDI.
- TRACK VOLUME (CC 7) is separate from the VOL+ / VOL- master-volume buttons. Master volume appears only when an integration supplies an explicit display value.
- The performance preview can display a supplied BPM from 5 to 300 and recent MIDI note-on/note-off events. Its note plot does not read or invent a saved pattern; MIDI thru may omit arpeggiator trigger notes and notes on muted tracks.
- BPM and MIDI note controls in the right panel are preview-only inputs. The public `seqtrakUpdate` and `seqtrakNoteEvent` hooks accept values from a future integration; `masterVolumeDisplay` is a caller-formatted value because the guide does not define a master-volume MIDI scale.
- A future adapter can pass `bpm`, `channel`, `volume`, `muted`, and `soloTrack` through `seqtrakUpdate`, and live notes through `seqtrakNoteEvent`. These hooks do not connect to USB or BLE by themselves.
- EFFECT DISPLAY controls are illustrative. Graphics describe parameter values and are not audio waveforms.
- The collapsed v1.3.4 FX address test remains for compatibility. Its address mapping is not documented in the supplied Yamaha user guide and has not been verified with hardware.

## Data checks

The supplied Yamaha user guide lists 2,032 preset sounds and 392 preset sampler sounds. The carried-over catalog contains 2,032 non-sampler entries and 392 sampler entries. The guide also documents 11 MIDI channels and the CC assignments used by the MIDI event test.

Eight effect types have no parameter definition in the carried-over parameter table. Five parameter ranges have ambiguous three-number notation. The UI disables value input for those cases instead of filling in a range.

## Tests

Run the dependency-free Node.js test suite with:

```sh
node --test tests/*.test.js
```

BLE MIDI and LILYGO T-Display-S3 support are not implemented in this prototype.


# WayHome — Memory Garden and familiar wayfinding

WayHome is a vanilla HTML/CSS/JavaScript classroom prototype with the existing Three.js Shenzhen city, wearable controls, family setup, safety simulations and guided return. It has no backend. Memory activities support enjoyable companionship and reminiscence; they do not assess or treat dementia or establish independent navigation ability.

## Preview

Open `index.html` in Chrome or Edge. If it is already open, refresh it after editing. Choose **I wear the device**, then **Memory Garden**. The four existing GO HOME, CALL, TALK and SOS controls remain available.

For consistent media storage and microphone permissions, serve this directory over localhost or GitHub Pages rather than `file://`:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Keep that terminal running and open http://127.0.0.1:8765/. A localhost address is reachable only while a server is listening on that port on the same computer. The command must run in the directory containing `index.html`. Uploaded content is specific to the browser and origin: `file://`, localhost and GitHub Pages have separate storage.

GitHub Pages requires no build step: publish the repository root containing `index.html`. Paths are relative, including the bundled Three.js library. The only external display dependency is an optional Google font with a system fallback. This change does not publish or push the repository automatically.

## Memory Garden

Sprout is a customizable, gently animated companion with happy, curious, thinking, reassuring and concerned expressions. Open **Memory Library → Companion preferences** to change its name, language, color theme, voice, interaction style, favorite activities and check-in delay.

- **Familiar Faces:** approved fictional illustrations or uploaded family photographs. Yes, Not sure and Tell me more all lead to supportive caregiver-provided stories. Another memory selects the next approved record.
- **My Happy Places:** approved place pictures and personal stories. These interactions never start a route or change navigation permissions.
- **Music & Memories:** optional album art, authorized local audio and mood choices. No recording means no playback button. Exit, completion and safety interruptions stop audio.
- **Everyday Moments:** tap up to eight caregiver-defined routine steps in any order; Undo removes the last selection. No drag-and-drop, scores or incorrect-answer feedback.
- **Memory Journeys:** an optional sequence links an approved family photograph, caregiver story, related place and familiar song. Every step can be skipped, and there is no score, recall test or requirement to finish.
- **Memory Garden:** participation grows flowers; add trees and butterflies or visit existing objects. Older garden objects remain available through Back/Next. Progress never decays.

Recommendations use chosen activities and caregiver favorites, excluding the most recently completed activity. Response times, uncertainty and skipped activities are not used to estimate ability or severity.

## Safety and check-ins

`safety-policy.js` is the single escalation engine for geofence, unanswered check-in, stopped-walking and route-divergence concerns. Each incident records and displays its reason. Geofence incidents retain the configured emergency stage; non-emergency check-in and route concerns may notify or call caregivers but cannot dispatch the emergency stage.

Check-ins explain their trigger in neutral language, such as stopped walking, an unusual area or a wearer-requested help action. They explicitly avoid diagnosing confusion. Caregivers can set a separate 0–120 second delay for nonurgent check-ins under **Memory Library → Companion preferences**.

## Navigation views

Guidance offers **3D Presenter View** and **Wearer View**. Both use the same route, step and progress state. Wearer View shows one arrow, one instruction, an approved landmark photo when one is available, and clear Help and Cancel controls. It also gives distinct states for no approved landmark, uncertain GPS, route divergence and paused or cancelled guidance.

## Caregiver library and storage

**Memory Library** appears in family setup and the stage toolbar. Add, edit, delete, approve or revoke people, places, music and routines; preview the wearer experience without personal photos. Samples are fictional and labeled. No copyrighted song is bundled.

Lightweight metadata, preferences, activity counts, garden objects and the latest 300 local events use `localStorage` (`wayhome.memory.v1`). Uploaded JPEG/PNG/WebP/GIF images (up to 5 MB) and audio (up to 25 MB) use IndexedDB (`wayhome-media`). Music uploads require an authorization checkbox. Storage failures show a warning; there is no cloud backup or device synchronization. **Clear local memories** asks for an explicit second action and removes this feature's media and metadata, including garden progress. It does not reset unrelated setup fields.

Each place has independent **memory** and **navigation** approvals. Navigation approval requires an integer 3D grid position (i/j from 0 to 12); an optional waypoint is an `i,j` pair. The route uses only navigation-approved, positioned landmarks close to its actual path, and checks an optional waypoint lies on that path. Memory-only photos cannot become navigation landmarks through game answers. Setup-created places begin with both approvals off; review them in the library. Editing the library during guidance pauses and rebuilds the route, so revoked content cannot remain in the current instruction.

## Check-in, safe return and simulated handover

Check-in asks **How are you feeling?** with **I'm okay** and **I need help**. Help offers getting home, contacting family or expressing confusion. Okay never clears an existing unresolved concern. Silence prompts one gentle repeat after the configured 5–120 second simulated delay, then records an unresolved check-in and follows the configured caregiver notification stages. Silence alone neither marks the wearer lost nor triggers emergency dispatch. The separate existing geofence/health simulations retain their own escalation policies.

Guided return preserves the full-screen 3D route, wrong-turn and stopped-moving controls. Approved familiar-place images ask **Can you see this place?**. A negative answer pauses for reorientation; repeated uncertainty offers caregiver handover without advancing. The companion input accepts typed or browser-recognized speech such as “I cannot see it”, “I'm confused”, “I need to rest” and “Call my family”, including corresponding Vietnamese and Indonesian phrases. Speech recognition depends on browser support and permission; typed input and buttons remain available.

**Low location confidence** freezes the avatar at its last known position and timestamp, removes confident directions and offers family contact. **Restore location** requires explicit Continue before guidance resumes. The existing GPS-lost director control also toggles restoration. Road crossings are explicitly classroom demonstrations with a manual continuation button; simulated traffic lights never authorize a real crossing.

Caregiver requests show **Waiting** until the caregiver clicks the green answer button on the family phone. Acknowledgement is explicit, not inferred from elapsed time. Ending a call does not resolve uncertainty or silently resume guidance. Once the underlying simulated concerns are cleared, the stage director's **Confirm safety** action permits voluntarily reopening the garden. SOS pauses the game, audio and navigation; cancelling SOS alone does not restart them.

All calls, messages, location, sensor readings, map connections and emergency notifications are simulated. There are no real calls, police dispatch, GPS or medical monitoring.

## Presentation walkthrough

Choose **Live demo stage → Memory Garden + Safe Return**. The persistent presenter panel provides Next, Back, Reset and Exit with explanations. Nine scenes cover opening the garden, Morning Market reminiscence, growing a flower, an unanswered/assisted check-in, requesting return, an actual route containing the approved market, the cannot-see branch, low-confidence location and caregiver acknowledgement. At the help scene select Help me get home; at the market choose I see it or I don't see it. Next also supports presenting each branch independently.

Reset clears transient simulation state while preserving the library, preferences and accumulated garden. Returning to the flower scene within a walkthrough does not add duplicate completion rewards. The scenario never silently approves a revoked landmark; restore Morning Market permissions in the library if you intentionally changed them. At the final handover, restore any remaining GPS/zone concerns before confirming safety. Exit closes the presenter panel without silently resolving a safety concern.

## Accessibility and localization

English, Vietnamese and Indonesian use the existing translation engine. New screens include large touch targets, high-contrast text, keyboard controls, focus management, screen-reader labels, optional narration and reduced-motion rules. Caregiver content retains the language in which it was entered. The responsive layout stacks photos and activities on narrow screens. Browser microphone and storage behavior can differ under `file://` and private browsing.

## Tests

Requires Node.js, with no npm packages:

```sh
node --test tests/memory.test.cjs
```

Behavioral tests execute real modules against minimal DOM and timer seams: activity completion, routine order, local persistence, library editing, independent approvals, media validation, translations, SOS priority, check-in silence, route filtering, revocation, low-confidence freezing, cannot-see handover, classroom crossings, demo reset and static asset paths.

These tests do not render WebGL, exercise a real IndexedDB browser implementation, or establish visual usability. Browser automation was unavailable in the implementation environment. Before presenting, manually check:

1. Refresh the page; open all activities and edit/preview records in all three languages.
2. Upload an authorized image/audio file, reload, play/pause it and trigger SOS during playback.
3. Run the walkthrough, both market responses, caregiver acknowledgement and low-confidence restoration.
4. Check 390 px and desktop layouts, keyboard-only traversal, reduced motion and browser console errors.
5. Verify the existing 3D city, setup, wrong-turn, stopped-moving and safety director controls on the deployed Pages origin.

## Main files

- `js/memory-data.js`: shared library, approvals, browser persistence and recommendations.
- `js/garden.js`, `css/memory.css`: original code-native garden and companion art.
- `js/memory.js`: five activities and media lifecycle.
- `js/memory-ui.js`: caregiver editor, preferences and preview.
- `js/memory-safety.js`: interruption priority, check-in, location uncertainty and handover.
- `js/memory-demo.js`: presenter-directed classroom walkthrough.
- `js/guide.js`, `js/sim.js`: existing 3D guidance and safety engines, extended in place.
- `js/boot.js`, `index.html`: integration; `js/i18n.js`, `js/i18n_id.js`: translations.
- `tests/memory.test.cjs`: dependency-free behavioral tests.

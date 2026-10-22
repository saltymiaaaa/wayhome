# WayHome prototype

Interactive demo of a safe-return companion for people with dementia. It runs fully in the browser, no build step, no backend.

## Run

Open `index.html` in Chrome or Edge (double click). Everything is local except the Google font, which falls back to the system font when offline.

English is the default. Switch to Tiếng Việt or Bahasa Indonesia with the EN / VI / ID toggle (top right). The choice is remembered. Strings live in `js/i18n.js` (EN, VI) and `js/i18n_id.js` (ID); missing keys fall back to English.

The demo city is set in Shenzhen (Futian District): Fuhua Road home, Shenzhen street names, Amap as the default map service, +86 phone numbers, English phrases with Chinese variants.

## Three entry points

| Button | What you get |
| --- | --- |
| I am family | 6-step setup wizard with a live 3D map: profile, home and map service, safe zone and escalation ladder, contacts (QR pairing), personal phrases + medicine + sensor limits, band pairing |
| I wear the device | The wearer's band: four giant buttons (GO HOME, CALL, TALK, SOS) |
| Live demo stage | Band and family phone side by side, with the **Demo director** on the left |

## Demo director (every situation has a button)

- **Walk out of the safe zone**: the avatar walks out. The band asks "Heading home?" (voice + vibration). No answer makes the escalation ladder climb: push to Wei, SMS and call Mei, emergency services. A virtual clock runs about 2.6 min per second. "Fast forward +8 min" jumps ahead.
- **I am lost far from home**: teleports out and starts the same flow.
- **Fall (can answer)**: 20 s countdown on the band, family gets a quiet heads-up first.
- **Fall + unresponsive**: no question asked, SOS and emergency right away (like Apple Watch crash/fall escalation).
- **Heart rate too high / too low**: family alerted directly, SOS if the wearer does not answer in 20 s.
- **She speaks**: the personal phrases ("I am lost", "I fell", "Help me", "I forgot my medicine"). Matching ignores accents and uses the variants set in the wizard. You can also open TALK on the band and type or tap them.
- **Medicine time**: reminder, taken / later, missed dose goes to family. "Forgot my medicine" is answered from the schedule first and only escalates if still unclear. Asking the same thing 3 times quietly flags possible confusion to the family.
- **Battery low, band taken off, GPS lost, night falls** (night shrinks the safe zone to the curfew radius).
- Family phone buttons: Call, Voice note (read aloud on the band), Ring band, Check in.

## Guided walk (full screen)

GO HOME (or accepting the check-in) switches to a full-screen 3D walk with a chase camera:

- Real road routing on the street grid, turn banners, haptic edge flash for left/right.
- "Do you see the Morning Market?" with the landmark photo, Yes / "I cannot see it". Two "no" answers call family.
- Crosswalk step with a traffic light, "I need to rest", demo buttons for **wrong turn** (reroutes) and **stop moving**.
- **Skip step** always visible, plus 1x / 2x / 4x speed. Arrival screen informs the family.

## Landmark photos

Landmarks are illustrated placeholders. In setup step 2, tap a street corner on the 3D map and upload a real photo of the place.

## Files

```
index.html        page shell
css/style.css     all styling
js/vendor/three.min.js   Three.js r128 (local copy)
js/world.js       procedural 3D city, safe-zone dome, route ribbon, avatar
js/watch3d.js     3D smartwatch on the landing page
js/app.js         state, wearable + family phone UI helpers
js/setup.js       family setup wizard
js/guide.js       route builder and full-screen guided walk
js/sim.js         scenarios, escalation ladder, calls, SOS, chat brain, director
js/i18n.js        EN / VI strings
js/i18n_id.js     Indonesian strings
js/art.js         landmark illustrations
js/icons.js       icon set
```

## Notes

- Speech uses the browser's text-to-speech (and speech recognition on the mic button where available). Mute is not needed for the demo, but the audio chimes need one click on the page first.
- Prototype only: no real GPS, maps, SMS or calls. Google Maps / Amap / Apple Maps connection is simulated.

# The Royal Kingdom of Aayushi

A responsive, interactive Princess Day story made for Aayushi Shah by Harsh. The scenes are custom CSS illustrations and transitions, so the experience remains lightweight on phones and does not depend on WebGL.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder, run `npm install`.
3. Run `npm run dev` and open the local URL Vite prints.
4. Run `npm run build` to create the production site in `dist/`.

## Add photographs

Put JPEG or WebP photographs in `public/images/aayushi/`. Suggested filenames are `aayushi-portrait.jpg`, `college-memory.jpg`, `favourite-memory.jpg`, `kutch-trip.jpg`, `food-adventure.jpg`, `together-memory.jpg`, and `favourite-smile.jpg`. Each memory path and caption is editable in `src/data/princessConfig.js`. Missing files automatically reveal a designed fallback instead of a broken image.

## Customize the story

Edit `src/data/princessConfig.js` to change the names, anniversary, letter, gallery items, captions, and final message. Add or remove memory entries in the `memories` array. Keep image paths relative to `public` (for example `/images/aayushi/kutch-trip.jpg`).

## Music

Add a legally usable instrumental track at `public/audio/royal-waltz.mp3`, or change `audio.src` in the configuration. Playback is opt-in through the music control because mobile browsers block autoplay. The site works without an audio file.

## Deploy and share

Create a Vercel project from this folder (or import its Git repository), use the Vite preset, `npm run build` as the build command, and `dist` as the output directory. Deploy to get a public HTTPS URL, then share that URL. HTTPS is required for camera permission on deployed sites.

Live crown AR is not included because this build does not bundle a face landmark tracker. The crown screen explains that limitation without opening the camera or implying that tracking works. No camera footage is accessed, uploaded, or stored.

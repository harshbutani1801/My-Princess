# The Royal Kingdom of Aayushi

A responsive, interactive Princess Day story made for Aayushi Shah by Harsh. The scenes are custom CSS illustrations and transitions, so the experience remains lightweight on phones and does not depend on WebGL.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder, run `npm install`.
3. Run `npm run dev` and open the local URL Vite prints.
4. Run `npm run build` to create the production site in `dist/`.

## Keep photographs private in a public repository

Do not put unencrypted photos in `public/` or commit them to Git. The project includes seven decorative SVG samples in the gitignored `private-images/aayushi/` folder. Replace each sample with your own photo using the same filename stem and a `.jpg`, `.png`, or other supported extension. For example, replace `college-memory.svg` with `college-memory.jpg`; remove the SVG so there is only one file per name. The slots are `aayushi-portrait`, `college-memory`, `favourite-memory`, `kutch-trip`, `food-adventure`, `together-memory`, and `favourite-smile`. The folder and generated `.private-share-link.txt` are gitignored.

After choosing the public URL for the site, encrypt the photos locally:

```sh
npm run photos:encrypt -- https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

The script uses Node's built-in AES-256-GCM encryption. It writes encrypted `.bin` files and a manifest to `public/secure-images/`, then saves the secret viewing link in `.private-share-link.txt`. The random decryption key is only in that link fragment (after `#key=`); the browser reads it and decrypts the photos locally. The key is not included in the repo or sent in the HTTP request to GitHub. The repo can be public: visitors without the secret link see the designed fallbacks, while anyone with the link can see the photos. Sample SVGs let you deploy the site before adding personal photos; replace them and regenerate the encrypted files and share link later.

Keep `.private-share-link.txt` private and send its link directly to Aayushi. Anyone who receives or forwards that link can view the photos. This is link-based privacy, not account authentication; it cannot prevent a recipient from saving or resharing a photo. If a link leaks, encrypt a new batch and publish the new encrypted files. Old encrypted copies and links cannot be recalled from Git history or from people who already downloaded them.

Run the encryption script again whenever the photo set changes. It generates a fresh key, so send the newly generated link. Never manually copy originals into `public/`; `.gitignore` protects `private-images/` but cannot protect photos placed elsewhere.

## Customize the story

Edit `src/data/princessConfig.js` to change the names, anniversary, letter, gallery items, captions, and final message. Each encrypted photo is matched to a memory by its configured image path and filename.

## Music

Add a legally usable instrumental track at `public/audio/royal-waltz.mp3`, or change `audio.src` in the configuration. Playback is opt-in through the music control because mobile browsers block autoplay. The site works without an audio file.

## Deploy and share

For GitHub Pages, the Vite config uses a relative asset base and `.github/workflows/deploy.yml` builds and publishes `dist/` whenever you push to `main`. Run the encryption command with the final Pages URL, then commit the app, `public/secure-images/manifest.json`, and encrypted `.bin` files. Confirm no originals or `.private-share-link.txt` are staged. In the repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. Use the generated link from `.private-share-link.txt` for Aayushi; the ordinary site URL will not unlock photos.

You can also deploy with Vercel using `npm run build` and `dist` as the output directory. Generate the encrypted files and link with the final Vercel URL. Re-run the encryption script if the deployed URL changes.

Live crown AR is not included because this build does not bundle a face landmark tracker. The crown screen explains that limitation without opening the camera or implying that tracking works. No camera footage is accessed, uploaded, or stored.

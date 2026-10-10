# Para Kay Kiara 💌

A static love-letter experience with a bouquet, a personal flower card, opening and closing envelope animations, a handwriting-style letter, heart effects, a secret message, and a final scene.

## Files

- `index.html`: markup and reusable SVG rose artwork
- `styles.css`: page styles, animations, mobile layout
- `app.js`: interactions, effects, notifications, custom music controls
- `qr-code.html`: printable QR code generator
- `music/love.mp3`: optional, self-hosted song (not included)

## Add music without YouTube

The custom HTML audio player looks for `music/love.mp3`. To make the song play for visitors, add a compatible MP3 file that you have permission to host at that exact path and commit it to the repository. Uploading it to GitHub means it becomes publicly accessible if this repository is public. You do **not** need a YouTube embed, Spotify, or an API key.

Until the audio file is provided, the player will show a friendly missing-file message. Use **Choose audio for local preview** to test the player on your own device. Local preview does not upload or share the file with visitors. Audio playback starts when the visitor clicks Play, in line with browser autoplay restrictions.

You can customize the song title and artist by changing the text within the music controls in `index.html`, and update the `src` on the `<audio>` tag to use a different audio filename.

## Customize the letter

Edit the paragraphs in `#letter-body` inside `index.html`. Edit `--her-name` and `--sender-name` in `styles.css`. Edit `secretMessage` in `app.js`. Your current original letter text is preserved in the source.

## Notifications

Set `ntfyTopic` in `app.js` if you want opening notifications. The placeholder intentionally does not send requests. Topic names in client-side code are public and are not authentication secrets.

## Hosting

Serve the files together as a normal static website (for example, GitHub Pages). Keep `index.html`, `app.js`, and `styles.css` in the same root directory. No build step or framework is required.

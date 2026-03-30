# MyTube Player

A desktop music player powered by YouTube. Search for any song, build playlists, and enjoy your music with a built-in equalizer — all from a clean, modern interface.

[![Download](https://img.shields.io/github/v/release/alinachimmodd/mytube-player?label=Download&style=for-the-badge)](https://github.com/alinachimmodd/mytube-player/releases/latest)

## Features

- **YouTube Search** — Find any song using YouTube Data API v3
- **Audio Streaming** — High-quality audio via yt-dlp (no video download)
- **Playlists** — Create, reorder, and manage playlists (persisted locally)
- **Favorites** — Quick-save songs you love
- **Playback History** — Automatically tracks what you've listened to
- **10-Band Equalizer** — With 10 presets (Bass Boost, Rock, Pop, Jazz, Electronic, Classical, and more)
- **Shuffle & Repeat** — Shuffle, repeat all, or repeat one
- **Queue Management** — Play next, queue songs from search or playlists
- **Error Logging** — Detailed logs for troubleshooting playback issues

## Download

Grab the latest Windows installer from the [Releases](https://github.com/alinachimmodd/mytube-player/releases/latest) page.

## Setup

1. **Install** — Run the installer
2. **Get a YouTube API Key** — Free from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (enable "YouTube Data API v3")
3. **Enter the key** — Open Settings in the app and paste your API key
4. **Get yt-dlp** — Download [yt-dlp.exe](https://github.com/yt-dlp/yt-dlp/releases/latest) and place it either:
   - In the app's install directory (next to `MyTube Player.exe`), or
   - Anywhere on your system PATH
5. **Play** — Search for a song and click play

## Tech Stack

- **Electron 34** — Desktop framework
- **React 19** — UI
- **TypeScript** — Type safety
- **Vite 6** — Build tooling
- **Tailwind CSS** — Styling
- **Zustand 5** — State management
- **Web Audio API** — Equalizer (BiquadFilterNode chain)
- **yt-dlp** — YouTube audio extraction

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Create Windows installer
npx electron-builder --win
```

Create a `.env` file in the project root:
```
VITE_YOUTUBE_API_KEY=your_api_key_here
```

## License

MIT

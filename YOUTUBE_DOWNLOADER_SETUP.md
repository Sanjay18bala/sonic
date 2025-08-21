# YouTube Music Downloader Setup Guide

## Overview

This app includes a YouTube music downloader that allows users to search for songs on YouTube and download them as MP3 files to their device.

## Features

- Search YouTube for music videos
- Download audio as MP3 files
- Save to device's music library
- Modern UI with loading states

## Setup Instructions

### 1. Start the Backend Server

```bash
# In your project directory
npm run server
```

The server will start on `http://localhost:3001`

### 2. Update Server URL (if needed)

If you're testing on a physical device, update the `SERVER_URL` in `app/screens/Download.js`:

```javascript
// Change from localhost to your computer's IP address
const SERVER_URL = "http://192.168.1.100:3001"; // Your computer's IP
```

### 3. Get Your Computer's IP Address

```bash
# On Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows
ipconfig | findstr "IPv4"
```

### 4. Test the App

1. Start the Expo development server: `npm start`
2. Open the app on your device
3. Navigate to the Download tab
4. Search for a song and try downloading

## How It Works

### Backend (server.js)

- **Express server** handles API requests
- **ytdl-core** downloads YouTube videos and extracts audio
- **CORS enabled** for cross-origin requests
- **File serving** for downloaded MP3s

### Frontend (Download.js)

- **Search interface** with YouTube branding
- **API integration** with the backend server
- **File download** using Expo FileSystem
- **Media library integration** to save to device

## API Endpoints

### Search Videos

```
GET /api/search?query=song_name
```

### Download Audio

```
POST /api/download
Body: { videoId: "video_id", title: "song_title" }
```

## File Structure

```
sonic/
├── server.js                    # Backend server
├── downloads/                   # Downloaded MP3 files
├── app/screens/Download.js      # Frontend download interface
└── package.json                 # Dependencies and scripts
```

## Dependencies

- **Backend**: express, cors, ytdl-core
- **Frontend**: expo-file-system, expo-media-library

## Troubleshooting

### Server Won't Start

- Make sure port 3001 is available
- Check if all dependencies are installed: `npm install`

### Can't Connect from Device

- Verify the IP address in `SERVER_URL`
- Ensure both devices are on the same network
- Check firewall settings

### Download Fails

- Check server logs for errors
- Verify YouTube video is accessible
- Ensure device has storage permissions

## Legal Notice

This tool is for personal use only. Please respect YouTube's terms of service and copyright laws. Only download content you have permission to use.

## Future Enhancements

- Real YouTube Data API integration
- Download progress tracking
- Audio quality selection
- Playlist support
- Background downloads

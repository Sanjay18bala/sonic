# YouTube Data API Setup Guide

## Overview

To enable real YouTube searches for any song, you need to set up the YouTube Data API v3.

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Sonic Music Downloader")
4. Click "Create"

### 2. Enable YouTube Data API v3

1. In your project, go to "APIs & Services" → "Library"
2. Search for "YouTube Data API v3"
3. Click on it and press "Enable"

### 3. Create API Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key

### 4. Configure the API Key

1. Open `server.js` in your project
2. Replace `YOUR_YOUTUBE_API_KEY` with your actual API key:

```javascript
const YOUTUBE_API_KEY = "AIzaSyB..."; // Your actual API key here
```

### 5. Restart the Server

```bash
npm run server
```

## How It Works

### With API Key (Real Search)

- Searches YouTube for actual videos matching your query
- Returns real video IDs, titles, thumbnails, and channel names
- Downloads the actual videos you search for

### Without API Key (Demo Mode)

- Uses mock data for demonstration
- Shows placeholder results
- Still downloads real videos (the mock ones)

## API Quotas

- YouTube Data API has daily quotas
- Free tier: 10,000 units per day
- Each search request uses ~100 units
- Monitor usage in Google Cloud Console

## Example Usage

### Search for "Shape of You"

```
GET /api/search?query=Shape of You
```

### Response (with API key)

```json
{
  "results": [
    {
      "id": "JGwWNGJdvx8",
      "title": "Ed Sheeran - Shape of You (Official Music Video)",
      "channelTitle": "Ed Sheeran",
      "thumbnail": "https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg",
      "duration": "Unknown",
      "viewCount": "Unknown",
      "publishedAt": "2017-01-30T14:00:00Z"
    }
  ]
}
```

## Troubleshooting

### API Key Not Working

- Check if YouTube Data API v3 is enabled
- Verify the API key is correct
- Check quota limits in Google Cloud Console

### Search Not Working

- Ensure the server is running
- Check network connectivity
- Verify API key format

## Security Notes

- Keep your API key secure
- Don't commit it to public repositories
- Use environment variables in production
- Monitor API usage to avoid quota limits

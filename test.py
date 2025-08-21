import requests
import json

# Spotify API credentials
CLIENT_ID = "2d8d2f29aa7c4023a4c9c7e30ddb296a"
CLIENT_SECRET = "2fcd7b05c01e4dcba27394f30baad038"

def get_spotify_token():
    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    response = requests.post(url, headers=headers, data=data)
    return response.json()["access_token"]

def search_song(token, song_name):
    url = f"https://api.spotify.com/v1/search"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "q": song_name,
        "type": "track",
        "limit": 1
    }
    response = requests.get(url, headers=headers, params=params)
    return response.json()

def get_track_details(token, track_id):
    url = f"https://api.spotify.com/v1/tracks/{track_id}"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.get(url, headers=headers)
    return response.json()

if __name__ == '__main__':
    # Get Spotify access token
    token = get_spotify_token()
    
    # Get song name from user
    song_name = input("Enter the song name: ")
    
    # Search for the song
    search_results = search_song(token, song_name)
    
    if search_results["tracks"]["items"]:
        track = search_results["tracks"]["items"][0]
        track_id = track["id"]
        
        # Get detailed track information
        track_details = get_track_details(token, track_id)
        
        # Print song details
        print("\nSong Details:")
        print(f"Title: {track['name']}")
        print(f"Artist: {', '.join([artist['name'] for artist in track['artists']])}")
        print(f"Album: {track['album']['name']}")
        print(f"Release Date: {track['album']['release_date']}")
        print(f"Popularity: {track['popularity']}")
        print(f"Preview URL: {track['preview_url']}")
        print(f"Spotify URL: {track['external_urls']['spotify']}")
        
        # Print album cover URLs
        print("\nAlbum Covers:")
        for image in track['album']['images']:
            print(f"Size: {image['width']}x{image['height']} - URL: {image['url']}")
    else:
        print("Song not found.")
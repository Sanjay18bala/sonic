import AsyncStorage from "@react-native-async-storage/async-storage";

const PLAYLISTS_KEY = "@playlists_cache";

// Get all playlists
export const getPlaylists = async () => {
  try {
    const playlistsData = await AsyncStorage.getItem(PLAYLISTS_KEY);
    return playlistsData ? JSON.parse(playlistsData) : [];
  } catch (error) {
    console.error("Error getting playlists:", error);
    return [];
  }
};

// Create a new playlist
export const createPlaylist = async (name) => {
  try {
    const playlists = await getPlaylists();
    const newPlaylist = {
      id: Date.now().toString(),
      name,
      songs: [],
      createdAt: new Date().toISOString(),
    };

    const updatedPlaylists = [...playlists, newPlaylist];
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updatedPlaylists));

    return newPlaylist;
  } catch (error) {
    console.error("Error creating playlist:", error);
    throw error;
  }
};

// Add song to playlist
export const addSongToPlaylist = async (playlistId, song) => {
  try {
    const playlists = await getPlaylists();
    const playlistIndex = playlists.findIndex((p) => p.id === playlistId);

    if (playlistIndex === -1) {
      throw new Error("Playlist not found");
    }

    // Check if song already exists in playlist
    const songExists = playlists[playlistIndex].songs.some(
      (existingSong) => existingSong.uri === song.uri
    );

    if (!songExists) {
      playlists[playlistIndex].songs.push(song);
      await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    }

    return playlists[playlistIndex];
  } catch (error) {
    console.error("Error adding song to playlist:", error);
    throw error;
  }
};

// Remove song from playlist
export const removeSongFromPlaylist = async (playlistId, songUri) => {
  try {
    const playlists = await getPlaylists();
    const playlistIndex = playlists.findIndex((p) => p.id === playlistId);

    if (playlistIndex === -1) {
      throw new Error("Playlist not found");
    }

    playlists[playlistIndex].songs = playlists[playlistIndex].songs.filter(
      (song) => song.uri !== songUri
    );

    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    return playlists[playlistIndex];
  } catch (error) {
    console.error("Error removing song from playlist:", error);
    throw error;
  }
};

// Delete playlist
export const deletePlaylist = async (playlistId) => {
  try {
    const playlists = await getPlaylists();
    const updatedPlaylists = playlists.filter((p) => p.id !== playlistId);
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updatedPlaylists));
  } catch (error) {
    console.error("Error deleting playlist:", error);
    throw error;
  }
};

// Get playlist by ID
export const getPlaylistById = async (playlistId) => {
  try {
    const playlists = await getPlaylists();
    return playlists.find((p) => p.id === playlistId);
  } catch (error) {
    console.error("Error getting playlist:", error);
    return null;
  }
};

import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
// import Player from "./Player";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PlaylistModal from "../components/PlaylistModal";
import { COLORS } from "../theme";
import Layout from "./Layout";

// Spotify API configuration
const SPOTIFY_CLIENT_ID = "2d8d2f29aa7c4023a4c9c7e30ddb296a";
const SPOTIFY_CLIENT_SECRET = "2fcd7b05c01e4dcba27394f30baad038";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

// Base64 encoding function
const base64Encode = (str) => {
  return btoa(str);
};

// Calculate similarity between two strings (0 to 1)
const calculateSimilarity = (str1, str2) => {
  // Clean strings to only contain words
  const cleanString = (str) => {
    return str
      .toLowerCase()
      .normalize("NFD") // Normalize unicode characters
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-zA-Z\s]/g, "") // Remove everything except letters and spaces
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing spaces
  };

  const s1 = cleanString(str1);
  const s2 = cleanString(str2);

  // If strings are identical after cleaning
  if (s1 === s2) return 1;

  // If one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Calculate word match percentage
  const words1 = s1.split(/\s+/).filter((word) => word.length > 0);
  const words2 = s2.split(/\s+/).filter((word) => word.length > 0);

  // If either string has no words after cleaning, return 0
  if (words1.length === 0 || words2.length === 0) return 0;

  const commonWords = words1.filter((word) => words2.includes(word));
  const similarity =
    commonWords.length / Math.max(words1.length, words2.length);

  return similarity;
};

const cleanFileName = (filename) => {
  // Remove file extension
  let name = filename.replace(/\.[^/.]+$/, "");

  // Normalize unicode characters and remove diacritics
  name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Remove common separators and replace with spaces
  name = name.replace(/[-_]/g, " ");

  // Remove common prefixes/suffixes
  name = name.replace(
    /(official|lyrics|audio|video|hd|hq|mp3|320kbps|128kbps|192kbps)/gi,
    ""
  );

  // Remove extra spaces
  name = name.replace(/\s+/g, " ").trim();

  // Remove year patterns like (2023) or [2023]
  name = name.replace(/[\[\(]\d{4}[\]\)]/g, "");

  // Remove all special characters, numbers, and non-ASCII characters
  name = name.replace(/[^a-zA-Z\s]/g, "");

  // Try to separate artist and song name if they're separated by a dash
  const parts = name.split(/\s*-\s*/);
  if (parts.length > 1) {
    // If we have a clear artist-song separation, return both
    return {
      fullName: name,
      artist: parts[0].trim(),
      song: parts[1].trim(),
    };
  }

  return {
    fullName: name,
    artist: null,
    song: name,
  };
};

const getSpotifyToken = async () => {
  try {
    const credentials = `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`;
    const base64Credentials = base64Encode(credentials);

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${base64Credentials}`,
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting Spotify token:", error);
    return null;
  }
};

const searchSpotifyTrack = async (cleanedInfo, token, fileDuration) => {
  try {
    // Extract the search query from the cleanedInfo object
    const query = cleanedInfo.fullName || cleanedInfo.song || "";

    if (!query) {
      console.log("No valid query found in cleanedInfo:", cleanedInfo);
      return null;
    }

    // Clean and split the query into words
    const words = query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    console.log("Searching with words:", words);

    // Generate different word combinations
    const searchQueries = [
      query, // Original query
      ...words, // Individual words
      ...words.map((word, i) => words.slice(i, i + 2).join(" ")), // Pairs of words
      ...words.map((word, i) => words.slice(i, i + 3).join(" ")), // Triplets of words
    ].filter((q) => q.length > 0);

    console.log("Search queries:", searchQueries);

    let potentialMatches = [];
    const SIMILARITY_THRESHOLD = 0.6; // Initial threshold for title matching
    const DURATION_THRESHOLD = 0.15; // 15% difference allowed in duration

    // Step 1: Find potential matches based on title similarity
    for (const searchQuery of searchQueries) {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          searchQuery
        )}&type=track&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.tracks?.items?.length > 0) {
        for (const track of data.tracks.items) {
          const trackTitle = track.name.toLowerCase();
          const similarity = calculateSimilarity(query, trackTitle);

          console.log(
            `Comparing "${query}" with "${trackTitle}" - Similarity: ${similarity}`
          );

          if (similarity >= SIMILARITY_THRESHOLD) {
            potentialMatches.push({
              track,
              similarity,
              duration: track.duration_ms / 1000,
            });
          }
        }
      }
    }

    // Step 2: Filter and rank matches by duration
    let bestMatch = null;
    let highestScore = 0;

    for (const match of potentialMatches) {
      const durationMatch = fileDuration
        ? Math.abs(match.duration - fileDuration) / fileDuration <=
          DURATION_THRESHOLD
        : true;

      console.log(
        `Duration check for "${match.track.name}":`,
        `File: ${fileDuration}s, Track: ${match.duration}s, Match: ${durationMatch}`
      );

      // Calculate combined score (70% title similarity, 30% duration match)
      const combinedScore = match.similarity * 0.7 + (durationMatch ? 0.3 : 0);

      if (combinedScore > highestScore) {
        highestScore = combinedScore;
        bestMatch = match.track;
      }
    }

    // Only return if we found a good match
    if (bestMatch) {
      return {
        title: bestMatch.name,
        artist: bestMatch.artists[0].name,
        album: bestMatch.album.name,
        albumArt: bestMatch.album.images[0]?.url,
        duration: bestMatch.duration_ms / 1000,
        similarity: highestScore,
      };
    }
    return null;
  } catch (error) {
    console.error("Error searching Spotify:", error);
    return null;
  }
};

const requestStoragePermission = async () => {
  if (Platform.OS === "android") {
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      console.log("Media Library permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant media library access to access your audio files.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error("Permission request error:", err);
      return false;
    }
  }
  return true;
};

const CACHE_KEY = "@song_details_cache";

const Home = () => {
  const router = useRouter();
  const [accessStatus, setAccessStatus] = useState({
    permissions: false,
    mediaLibrary: false,
    audioFiles: [],
    details: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  // Mini player state
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackInstance, setPlaybackInstance] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMiniLoading, setIsMiniLoading] = useState(false);
  const isMounted = useRef(true);
  const [songDetails, setSongDetails] = useState({});
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (playbackInstance) playbackInstance.unloadAsync();
    };
  }, []);

  // Load cached song details on app start
  useEffect(() => {
    loadCachedSongDetails();
  }, []);

  const loadCachedSongDetails = async () => {
    try {
      const cachedDetails = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedDetails) {
        const parsedDetails = JSON.parse(cachedDetails);
        setSongDetails(parsedDetails);
        console.log("Loaded cached song details");
      }
    } catch (error) {
      console.error("Error loading cached details:", error);
      // Continue without cached data
      setSongDetails({});
    }
  };

  const saveSongDetailsToCache = async (details) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(details));
      console.log("Saved song details to cache");
    } catch (error) {
      console.error("Error saving details to cache:", error);
      // Continue without caching
    }
  };

  const clearSongDetailsCache = async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      setSongDetails({});
      console.log("✅ Song details cache cleared");
      Alert.alert(
        "Cache Cleared",
        "Song details cache has been cleared successfully!"
      );
    } catch (error) {
      console.error("Error clearing cache:", error);
      Alert.alert("Error", "Failed to clear cache");
    }
  };

  const playSong = async (song) => {
    setIsMiniLoading(true);
    if (playbackInstance) {
      await playbackInstance.unloadAsync();
    }
    const sound = new Audio.Sound();
    try {
      await sound.loadAsync({ uri: song.uri });
      await sound.playAsync();
      setCurrentSong(song);
      setIsPlaying(true);
      setPlaybackInstance(sound);
      setDuration(song.duration || 0);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!isMounted.current) return;
        if (status.isLoaded) {
          setPosition(status.positionMillis / 1000);
          setDuration((status.durationMillis || 0) / 1000);
          setIsPlaying(status.isPlaying);
        }
      });
    } catch (e) {
      console.error("Error playing song:", e);
    }
    setIsMiniLoading(false);
  };

  const handlePlayPause = async () => {
    if (playbackInstance) {
      if (isPlaying) {
        await playbackInstance.pauseAsync();
      } else {
        await playbackInstance.playAsync();
      }
    }
  };

  const handleSeek = async (value) => {
    if (playbackInstance) {
      await playbackInstance.setPositionAsync(value * 1000);
    }
  };

  const fetchSongDetails = async (audioFiles) => {
    const token = await getSpotifyToken();
    if (!token) return;

    const details = {};
    let existingDetails = {};

    try {
      const cachedDetails = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedDetails) {
        existingDetails = JSON.parse(cachedDetails);
      }
    } catch (error) {
      console.error("Error reading cache:", error);
      // Continue with empty cache
    }

    for (const file of audioFiles) {
      // Check if we already have details for this file
      if (existingDetails[file.uri]) {
        details[file.uri] = existingDetails[file.uri];
        console.log("Using cached details for:", file.filename);
        continue;
      }

      const cleanedInfo = cleanFileName(file.filename);
      console.log("\nSearching for:", cleanedInfo);

      const trackInfo = await searchSpotifyTrack(
        cleanedInfo,
        token,
        file.duration
      );
      if (trackInfo) {
        details[file.uri] = {
          ...file,
          ...trackInfo,
        };
        console.log(
          `Found match: "${trackInfo.title}" by ${trackInfo.artist} (Similarity: ${trackInfo.similarity})`
        );
      } else {
        details[file.uri] = {
          ...file,
          title: cleanedInfo,
          artist: "Unknown Artist",
          album: "Unknown Album",
          duration: file.duration || 0,
        };
        console.log("No good match found, keeping original:", file.filename);
      }
    }

    // Save updated details to cache
    try {
      await saveSongDetailsToCache(details);
    } catch (error) {
      console.error("Error saving to cache:", error);
      // Continue without caching
    }

    setSongDetails(details);
  };

  const checkStorageAccess = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      console.log("🔍 Checking storage access...");
      const status = {
        permissions: false,
        mediaLibrary: false,
        audioFiles: [],
        details: {},
      };

      // Check permissions
      const hasPermission = await requestStoragePermission();
      status.permissions = hasPermission;
      console.log("🔑 Storage permissions:", hasPermission);

      if (hasPermission) {
        try {
          // Get all audio files from the entire music library
          const media = await MediaLibrary.getAssetsAsync({
            mediaType: ["audio"],
            first: 1000, // Get more files
            sortBy: ["creationTime"], // Sort by creation time
          });

          console.log("📂 Found audio files:", media.assets.length);
          status.mediaLibrary = true;

          // Get all MP3 files from the entire music library, excluding files with 0 duration
          const allMusicFiles = media.assets.filter(
            (asset) =>
              asset.filename.toLowerCase().endsWith(".mp3") &&
              asset.duration > 0
          );

          status.audioFiles = allMusicFiles;
          console.log(
            "📂 Valid music files found (duration > 0):",
            allMusicFiles.length
          );

          // Only fetch new details if explicitly refreshing
          if (forceRefresh) {
            await fetchSongDetails(allMusicFiles);
          }
        } catch (mediaErr) {
          console.error("Error accessing media library:", mediaErr);
          status.mediaLibrary = false;
        }
      }

      setAccessStatus(status);
      return status;
    } catch (error) {
      console.error("❌ Error checking storage access:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Platform.OS === "android") {
      checkStorageAccess();
    }
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp).toLocaleDateString();
  };

  const renderAudioItem = ({ item }) => {
    const details = songDetails[item.uri] || item;

    // Ensure we have string values for rendering
    const title =
      typeof details.title === "string"
        ? details.title
        : typeof details.filename === "string"
        ? details.filename
        : "Unknown Title";
    const artist =
      typeof details.artist === "string" ? details.artist : "Unknown Artist";
    const album =
      typeof details.album === "string" ? details.album : "Unknown Album";
    const duration =
      typeof details.duration === "number" ? details.duration : 0;

    const handleAddToPlaylist = (e) => {
      e.stopPropagation();
      setSelectedSong({
        ...item,
        title,
        artist,
        album,
        albumArt: details.albumArt,
        duration,
      });
      setShowPlaylistModal(true);
    };

    return (
      <TouchableOpacity
        style={styles.audioItem}
        onPress={() =>
          router.push({
            pathname: "/screens/Player",
            params: {
              uri: item.uri,
              duration: Number(duration) || 0,
              title: title,
              artist: artist,
              album: album,
              albumArt: details.albumArt,
            },
          })
        }
      >
        <Image
          source={
            details.albumArt
              ? { uri: details.albumArt }
              : require("../../assets/images/Starboy.jpg")
          }
          style={styles.albumArt}
        />
        <View style={styles.audioInfo}>
          <Text style={styles.audioTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.audioDetails} numberOfLines={1}>
            {artist} • {album}
            {formatDuration(duration) ? ` • ${formatDuration(duration)}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addToPlaylistButton}
          onPress={handleAddToPlaylist}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <Layout>
      <View style={styles.content}>
        {/* Cache Clear Button */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Music Library</Text>
          <TouchableOpacity
            style={styles.clearCacheButton}
            onPress={clearSongDetailsCache}
          >
            <Ionicons name="refresh" size={20} color={COLORS.white} />
            <Text style={styles.clearCacheText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>

        {!accessStatus.permissions ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Storage permission not granted
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => checkStorageAccess(true)}
            >
              <Text style={styles.buttonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : !accessStatus.mediaLibrary ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>No access to music library</Text>
          </View>
        ) : (
          <FlatList
            data={accessStatus.audioFiles}
            renderItem={renderAudioItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContainer,
              currentSong && { paddingBottom: 80 },
            ]}
            refreshing={isLoading}
            onRefresh={() => checkStorageAccess(true)}
            bounces={true}
            overScrollMode="always"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No music files found</Text>
                <Text style={styles.emptySubtext}>
                  Your downloaded songs and music library will appear here
                </Text>
              </View>
            }
          />
        )}
        {/* Mini Player */}
        {currentSong && (
          <View style={styles.miniPlayerBar}>
            <Image
              source={
                currentSong.albumArt
                  ? { uri: currentSong.albumArt }
                  : require("../../assets/images/Starboy.jpg")
              }
              style={styles.miniAlbumArt}
            />
            <View style={styles.miniInfo}>
              <Text style={styles.miniSongTitle} numberOfLines={1}>
                {typeof currentSong.title === "string"
                  ? currentSong.title
                  : typeof currentSong.filename === "string"
                  ? currentSong.filename
                  : "Unknown Title"}
              </Text>
              <Text style={styles.miniSongArtist} numberOfLines={1}>
                {typeof currentSong.artist === "string"
                  ? currentSong.artist
                  : "Unknown Artist"}
              </Text>
            </View>
            <View style={styles.miniActions}>
              <TouchableOpacity
                onPress={handlePlayPause}
                disabled={isMiniLoading}
                style={styles.miniIconButton}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={28}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.miniIconButton}>
                <Ionicons name="play-skip-forward" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Playlist Modal */}
        <PlaylistModal
          visible={showPlaylistModal}
          onClose={() => {
            setShowPlaylistModal(false);
            setSelectedSong(null);
          }}
          song={selectedSong}
        />
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: COLORS.black,
    padding: 20,
    paddingTop: 50,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  clearCacheButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.darkGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  clearCacheText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
  },
  listContainer: {
    padding: 0,
    paddingBottom: 50,
    flexGrow: 1,
  },
  audioItem: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 8,
    // padding: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addToPlaylistButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  audioInfo: {
    flex: 1,
    gap: 4,
  },
  audioTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  audioDetails: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.7,
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
  },
  emptySubtext: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: "center",
    opacity: 0.5,
    marginTop: 8,
  },
  miniPlayerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.black,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#222",
    elevation: 10,
    zIndex: 10,
  },
  miniAlbumArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#333",
  },
  miniInfo: {
    flex: 1,
    justifyContent: "center",
  },
  miniSongTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  miniSongArtist: {
    color: "#bbb",
    fontSize: 14,
    fontWeight: "500",
  },
  miniActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  miniIconButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 20,
  },
});
export default Home;

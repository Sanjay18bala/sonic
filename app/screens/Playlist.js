import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { deletePlaylist, getPlaylists } from "../services/playlistService";
import { COLORS } from "../theme";
import Layout from "./Layout";

export default function Playlist() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setIsLoading(true);
      const playlistsData = await getPlaylists();
      setPlaylists(playlistsData);
    } catch (error) {
      console.error("Error loading playlists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlaylist = (playlist) => {
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlaylist(playlist.id);
              await loadPlaylists();
              Alert.alert("Success", "Playlist deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete playlist");
            }
          },
        },
      ]
    );
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getTotalDuration = (songs) => {
    return songs.reduce((total, song) => total + (song.duration || 0), 0);
  };

  const renderPlaylistItem = ({ item }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => {
        // Navigate to playlist detail view (you can implement this later)
        Alert.alert("Playlist", `Opening ${item.name} playlist`);
      }}
    >
      <View style={styles.playlistHeader}>
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName}>{item.name}</Text>
          <Text style={styles.playlistDetails}>
            {item.songs.length} {item.songs.length === 1 ? "song" : "songs"} •{" "}
            {formatDuration(getTotalDuration(item.songs))}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePlaylist(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
        </TouchableOpacity>
      </View>

      {item.songs.length > 0 && (
        <View style={styles.songPreview}>
          {item.songs.slice(0, 3).map((song, index) => (
            <View key={index} style={styles.previewSong}>
              <Image
                source={
                  song.albumArt
                    ? { uri: song.albumArt }
                    : require("../../assets/images/Starboy.jpg")
                }
                style={styles.previewAlbumArt}
              />
              <View style={styles.previewSongInfo}>
                <Text style={styles.previewSongTitle} numberOfLines={1}>
                  {song.title || song.filename}
                </Text>
                <Text style={styles.previewSongArtist} numberOfLines={1}>
                  {song.artist || "Unknown Artist"}
                </Text>
              </View>
            </View>
          ))}
          {item.songs.length > 3 && (
            <Text style={styles.moreSongsText}>
              +{item.songs.length - 3} more
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Layout>
      <View style={styles.content}>
        <Text style={styles.title}>Your Playlists</Text>
        <FlatList
          data={playlists}
          renderItem={renderPlaylistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={loadPlaylists}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No playlists yet</Text>
              <Text style={styles.emptySubtext}>
                Create playlists by adding songs from your music library
              </Text>
            </View>
          )}
        />
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 20,
  },
  listContainer: {
    padding: 0,
  },
  playlistItem: {
    padding: 16,
    backgroundColor: "#222",
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  playlistHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  playlistDetails: {
    color: "#999",
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
  },
  songPreview: {
    gap: 8,
  },
  previewSong: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewAlbumArt: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  previewSongInfo: {
    flex: 1,
  },
  previewSongTitle: {
    color: COLORS.white,
    fontSize: 14,
    marginBottom: 2,
  },
  previewSongArtist: {
    color: "#999",
    fontSize: 12,
  },
  moreSongsText: {
    color: "#999",
    fontSize: 12,
    fontStyle: "italic",
    marginLeft: 42,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.white,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

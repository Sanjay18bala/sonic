import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addSongToPlaylist,
  createPlaylist,
  getPlaylists,
  removeSongFromPlaylist,
} from "../services/playlistService";
import { COLORS } from "../theme";

const PlaylistModal = ({ visible, onClose, song }) => {
  const [playlists, setPlaylists] = useState([]);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPlaylists();
      // Reset to initial state when modal opens
      setShowCreatePlaylist(false);
      setNewPlaylistName("");
    }
  }, [visible]);

  const loadPlaylists = async () => {
    try {
      const playlistsData = await getPlaylists();
      setPlaylists(playlistsData);
    } catch (error) {
      console.error("Error loading playlists:", error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert("Error", "Please enter a playlist name");
      return;
    }

    setIsLoading(true);
    try {
      const newPlaylist = await createPlaylist(newPlaylistName.trim());
      await addSongToPlaylist(newPlaylist.id, song);

      Alert.alert(
        "Success",
        `"${song.title || song.filename}" added to "${newPlaylist.name}"`,
        [{ text: "OK", onPress: onClose }]
      );

      setNewPlaylistName("");
      setShowCreatePlaylist(false);
      loadPlaylists(); // Refresh the list to show the new playlist
    } catch (error) {
      Alert.alert("Error", "Failed to create playlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlist) => {
    try {
      await addSongToPlaylist(playlist.id, song);
      Alert.alert(
        "Success",
        `"${song.title || song.filename}" added to "${playlist.name}"`,
        [{ text: "OK", onPress: onClose }]
      );
      loadPlaylists(); // Refresh to update the UI
    } catch (error) {
      Alert.alert("Error", "Failed to add song to playlist");
    }
  };

  const handleRemoveFromPlaylist = async (playlist) => {
    try {
      await removeSongFromPlaylist(playlist.id, song.uri);
      Alert.alert(
        "Success",
        `"${song.title || song.filename}" removed from "${playlist.name}"`,
        [{ text: "OK" }]
      );
      loadPlaylists(); // Refresh to update the UI
    } catch (error) {
      Alert.alert("Error", "Failed to remove song from playlist");
    }
  };

  // Check if song is already in a playlist
  const isSongInPlaylist = (playlist) => {
    return playlist.songs.some((playlistSong) => playlistSong.uri === song.uri);
  };

  const renderPlaylistItem = ({ item }) => {
    const songExists = isSongInPlaylist(item);

    return (
      <TouchableOpacity
        style={[styles.playlistItem, songExists && styles.playlistItemExists]}
        onPress={() =>
          songExists
            ? handleRemoveFromPlaylist(item)
            : handleAddToPlaylist(item)
        }
      >
        <View style={styles.playlistInfo}>
          <Text
            style={[
              styles.playlistName,
              songExists && styles.playlistNameExists,
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.songCount, songExists && styles.songCountExists]}
          >
            {item.songs.length} {item.songs.length === 1 ? "song" : "songs"}
          </Text>
        </View>
        <View style={styles.playlistActions}>
          {songExists && <Text style={styles.existsText}>Added</Text>}
          <Ionicons
            name={songExists ? "remove-circle" : "chevron-forward"}
            size={20}
            color={songExists ? "#ff6b6b" : COLORS.white}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Calculate dynamic height based on number of playlists
  const calculateModalHeight = () => {
    const baseHeight = 200; // Base height for header, create button, and padding
    const playlistItemHeight = 50; // Height of each playlist item
    const maxHeight = 600; // Maximum height to prevent modal from being too tall

    if (showCreatePlaylist) {
      return Math.min(baseHeight + 80, maxHeight); // Create playlist form height
    }

    const totalHeight = baseHeight + playlists.length * playlistItemHeight;
    return Math.min(totalHeight, maxHeight);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: calculateModalHeight() }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowCreatePlaylist(false);
                setNewPlaylistName("");
                setIsLoading(false);
                onClose();
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {showCreatePlaylist ? (
            <View style={styles.createPlaylistInline}>
              <TextInput
                style={styles.inlinePlaylistInput}
                placeholder="Enter playlist name"
                placeholderTextColor="#666"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
                returnKeyType="done"
              />
              <View style={styles.inlineActions}>
                <TouchableOpacity
                  style={styles.inlineCancelButton}
                  onPress={() => {
                    setShowCreatePlaylist(false);
                    setNewPlaylistName("");
                    setIsLoading(false);
                  }}
                >
                  <Text style={styles.inlineCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.inlineCreateButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleCreatePlaylist}
                  disabled={isLoading}
                >
                  <Text style={styles.inlineCreateText}>
                    {isLoading ? "Creating..." : "Create"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.newPlaylistButton}
                onPress={() => setShowCreatePlaylist(true)}
              >
                <View style={styles.newPlaylistIconContainer}>
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.newPlaylistText}>Create New Playlist</Text>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </TouchableOpacity>

              <View style={styles.playlistList}>
                {playlists.length > 0 ? (
                  playlists.map((item) => (
                    <View key={item.id}>{renderPlaylistItem({ item })}</View>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No playlists yet</Text>
                    <Text style={styles.emptySubtext}>
                      Create your first playlist to get started
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.black,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 30,
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  songInfo: {
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 3,
  },
  songArtist: {
    fontSize: 12,
    color: "#999",
  },
  newPlaylistButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#333",
  },
  newPlaylistIconContainer: {
    marginRight: 8,
  },
  newPlaylistText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "500",
    flex: 1,
  },
  playlistList: {
    flex: 1,
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#222",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    height: 50,
  },
  playlistItemExists: {
    backgroundColor: "#1a1a1a",
    opacity: 0.8,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 2,
  },
  playlistNameExists: {
    color: "#ccc",
  },
  songCount: {
    fontSize: 12,
    color: "#999",
  },
  songCountExists: {
    color: "#777",
  },
  playlistActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  existsText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  createPlaylistInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    gap: 6,
  },
  inlinePlaylistInput: {
    flex: 1,
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: "#444",
  },
  inlineActions: {
    flexDirection: "row",
    gap: 6,
  },
  inlineCancelButton: {
    backgroundColor: "#444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineCancelText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "500",
  },
  inlineCreateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineCreateText: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});

export default PlaylistModal;

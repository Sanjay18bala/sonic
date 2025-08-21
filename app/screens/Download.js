import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../theme";
import Layout from "./Layout";

// Backend server configuration
const SERVER_URL = "http://192.168.0.7:3001"; // Your computer's IP address

const Download = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [downloading, setDownloading] = useState({});

  const searchYouTube = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a song name to search");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `${SERVER_URL}/api/search?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.results);
      } else {
        throw new Error(data.error || "Search failed");
      }
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search YouTube. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      // Request media library permissions (works for both iOS and Android)
      const { status } = await MediaLibrary.requestPermissionsAsync();
      console.log("Media Library permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant media library access to save music files to your device.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      return true;
    } catch (err) {
      console.warn("Permission request error:", err);
      return false;
    }
  };

  const downloadAudio = async (video) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        "Permission Denied",
        "Storage permission is required to download music."
      );
      return;
    }

    setDownloading((prev) => ({ ...prev, [video.id]: true }));

    try {
      // Send download request to backend
      const response = await fetch(`${SERVER_URL}/api/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Download the file to device
        let downloadPath;

        // Use app documents directory for both platforms (simplest approach)
        downloadPath = FileSystem.documentDirectory + data.filename;

        const downloadResult = await FileSystem.downloadAsync(
          data.downloadUrl,
          downloadPath
        );

        if (downloadResult.status === 200) {
          try {
            // Save to media library
            const asset = await MediaLibrary.createAssetAsync(
              downloadResult.uri
            );
            await MediaLibrary.createAlbumAsync(
              "Sonic Downloads",
              asset,
              false
            );

            Alert.alert(
              "Download Complete",
              `"${video.title}" has been saved to your music library!`,
              [
                {
                  text: "Open Music App",
                  onPress: () => {
                    console.log("Opening music app...");
                  },
                },
                { text: "OK" },
              ]
            );
          } catch (mediaError) {
            console.warn("Media library error:", mediaError);
            // File was downloaded successfully, just couldn't add to media library
            Alert.alert(
              "Download Complete",
              Platform.OS === "android"
                ? `"${video.title}" has been saved to your Downloads folder!`
                : `"${video.title}" has been saved to your app documents!`,
              [
                {
                  text: Platform.OS === "android" ? "Open Downloads" : "OK",
                  onPress: () => {
                    console.log("Opening downloads...");
                  },
                },
                { text: "OK" },
              ]
            );
          }
        } else {
          throw new Error("Failed to download file");
        }
      } else {
        throw new Error(data.error || "Download failed");
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert(
        "Download Failed",
        "Failed to download the audio. Please try again."
      );
    } finally {
      setDownloading((prev) => ({ ...prev, [video.id]: false }));
    }
  };

  const renderSearchResult = ({ item }) => (
    <View style={styles.resultItem}>
      <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnail} />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.channelTitle} numberOfLines={1}>
          {item.channelTitle}
        </Text>
        <Text style={styles.videoDetails} numberOfLines={1}>
          {item.viewCount} • {item.duration} • {item.publishedAt}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.downloadButton,
          downloading[item.id] && styles.downloadingButton,
        ]}
        onPress={() => downloadAudio(item)}
        disabled={downloading[item.id]}
      >
        {downloading[item.id] ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Ionicons name="download-outline" size={24} color={COLORS.white} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Layout>
      <View style={styles.content}>
        <Text style={styles.title}>Audio Downloader</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for audio files..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchYouTube}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchYouTube}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="search" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {hasSearched && (
          <View style={styles.resultsContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.white} />
                <Text style={styles.loadingText}>Searching for audio...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultsList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="videocam-outline" size={64} color="#666" />
                <Text style={styles.emptyText}>No audio files found</Text>
                <Text style={styles.emptySubtext}>
                  Try searching for a different song
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Initial State */}
        {!hasSearched && (
          <View style={styles.initialContainer}>
            <Ionicons name="logo-youtube" size={80} color="#ff0000" />
            <Text style={styles.initialText}>Search for Audio Files</Text>
            <Text style={styles.initialSubtext}>
              Find and download your favorite audio files
            </Text>
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#ffaa00"
              />
              <Text style={styles.infoText}>
                Downloads are saved to your device&apos;s music library
              </Text>
            </View>
          </View>
        )}
      </View>
    </Layout>
  );
};

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
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 48,
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    marginTop: 16,
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultItem: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  videoThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  videoInfo: {
    flex: 1,
    gap: 4,
  },
  videoTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: 18,
  },
  channelTitle: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.8,
  },
  videoDetails: {
    color: COLORS.white,
    fontSize: 11,
    opacity: 0.6,
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 8,
    minWidth: 40,
    alignItems: "center",
  },
  downloadingButton: {
    backgroundColor: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubtext: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
  },
  initialContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  initialText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  initialSubtext: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 170, 0, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    gap: 8,
  },
  infoText: {
    color: "#ffaa00",
    fontSize: 12,
    flex: 1,
  },
});

export default Download;

import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../theme";

export default function Player() {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(Number(params.position) || 0);
  const [duration, setDuration] = useState(Number(params.duration) || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const soundRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function playAudio() {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (params?.uri) {
        const sound = new Audio.Sound();
        try {
          await sound.loadAsync({ uri: params.uri });
          await sound.playAsync();
          soundRef.current = sound;
          setIsPlaying(true);
          setIsLoading(false);
          sound.setOnPlaybackStatusUpdate((status) => {
            if (!isMounted) return;
            if (status.isLoaded) {
              setPosition(Number(status.positionMillis) / 1000);
              setDuration(Number(status.durationMillis || 0) / 1000);
              setIsPlaying(status.isPlaying);
            } else if (status.error) {
              setError("Playback error: " + status.error);
              setIsLoading(false);
            }
          });
        } catch (e) {
          setError("Error loading/playing audio.");
          setIsLoading(false);
        }
      } else {
        setError("No audio file found.");
        setIsLoading(false);
      }
    }
    playAudio();
    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [params.uri]);

  const handlePlayPause = async () => {
    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    }
  };

  const handleSeek = async (value) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(Number(value) * 1000);
    }
  };

  const handleNext = () => {
    Alert.alert("Next track", "Next track logic not implemented yet.");
  };
  const handlePrev = () => {
    Alert.alert("Previous track", "Previous track logic not implemented yet.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.albumLabel}>PLAYING FROM ALBUM</Text>
          <Text style={styles.albumTitle}>Starboy Remix</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <MaterialIcons name="more-vert" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Image
          source={
            params?.albumArt
              ? { uri: params.albumArt }
              : require("../../assets/images/Starboy.jpg")
          }
          style={styles.albumArt}
        />
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>
            {params?.title || params?.filename || "Unknown Title"}
          </Text>
          <Text style={styles.songArtist}>
            {params?.artist || "Unknown Artist"}
          </Text>
          <Text style={styles.songAlbum}>
            {params?.album || "Unknown Album"}
          </Text>
          <Text style={styles.songDuration}>
            {formatDuration(Number(params?.duration) || 0)}
          </Text>
        </View>
        {error && (
          <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
        )}
        {isLoading && !error && (
          <ActivityIndicator
            size="large"
            color="#B2FF59"
            style={{ marginBottom: 10 }}
          />
        )}
        <View style={styles.progressRow}>
          <Text style={styles.timeText}>
            {formatDuration(Number(position))}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={Number(duration)}
            value={Number(position)}
            minimumTrackTintColor="#B2FF59"
            maximumTrackTintColor="#fff"
            thumbTintColor="#B2FF59"
            onSlidingComplete={handleSeek}
            disabled={isLoading || !!error}
          />
          <Text style={styles.timeText}>
            {formatDuration(Number(duration))}
          </Text>
        </View>
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={handlePrev}>
            <Ionicons
              name="play-skip-back"
              size={28}
              color="#fff"
              style={styles.controlIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
            disabled={isLoading || !!error}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={36}
              color="#222"
              style={styles.playIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext}>
            <Ionicons
              name="play-skip-forward"
              size={28}
              color="#fff"
              style={styles.controlIcon}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.heartButton}>
          <FontAwesome name="heart-o" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.lyricsButton}>
          <Text style={styles.lyricsText}>
            LYRICS <Ionicons name="chevron-down" size={16} color="#fff" />
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 0,
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  albumLabel: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.6,
    letterSpacing: 1,
    fontWeight: "500",
  },
  albumTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  albumArt: {
    width: 320,
    height: 320,
    borderRadius: 18,
    marginVertical: 24,
    alignSelf: "center",
  },
  songInfo: {
    alignItems: "center",
    marginBottom: 8,
  },
  songTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  songArtist: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.7,
    marginTop: 0,
    fontWeight: "500",
  },
  songAlbum: {
    color: COLORS.white,
    fontSize: 15,
    opacity: 0.7,
    marginTop: 2,
    fontWeight: "500",
  },
  songDuration: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
    fontWeight: "400",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "85%",
    marginVertical: 10,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
    height: 30,
  },
  timeText: {
    color: COLORS.white,
    fontSize: 13,
    opacity: 0.7,
    width: 40,
    textAlign: "center",
    fontWeight: "500",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "80%",
    marginVertical: 24,
  },
  controlIcon: {
    opacity: 0.8,
  },
  playButton: {
    backgroundColor: "#B2FF59",
    borderRadius: 40,
    padding: 22,
    shadowColor: "#B2FF59",
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    marginHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
  playIcon: {
    fontWeight: "bold",
  },
  heartButton: {
    position: "absolute",
    right: 32,
    top: 370,
    backgroundColor: "transparent",
    zIndex: 2,
  },
  lyricsButton: {
    alignSelf: "center",
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  lyricsText: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.8,
    letterSpacing: 1,
    fontWeight: "bold",
    flexDirection: "row",
    alignItems: "center",
  },
});

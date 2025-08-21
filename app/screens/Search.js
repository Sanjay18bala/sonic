import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../theme";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleSearch = () => {
    // Implement search functionality here
    console.log("Searching for:", searchQuery);
  };

  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.black} barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <AntDesign
            name="search1"
            size={20}
            color={COLORS.gray}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for songs, artists, albums..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <AntDesign name="close" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {searchQuery.length > 0 ? (
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.emptyStateText}>
          Search for your favorite music
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
    marginLeft: 16,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    height: "100%",
  },
  searchButton: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
  },
  searchButtonText: {
    color: COLORS.black,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyStateText: {
    color: COLORS.gray,
    fontSize: 16,
    textAlign: "center",
  },
});

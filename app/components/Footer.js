import Entypo from "@expo/vector-icons/Entypo";
import Foundation from "@expo/vector-icons/Foundation";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { COLORS } from "../theme";

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const handleHomePress = () => {
    router.replace("/screens/Home");
  };

  const handleLibraryPress = () => {
    router.replace("/screens/Playlist");
  };

  const handleDownloadPress = () => {
    router.replace("/screens/Download");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.navItem,
          pathname === "/screens/Home" && styles.activeContainer,
        ]}
        onPress={handleHomePress}
      >
        <Entypo
          name="home"
          size={24}
          color={pathname === "/screens/Home" ? COLORS.black : COLORS.white}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.navItem,
          pathname === "/screens/Playlist" && styles.activeContainer,
        ]}
        onPress={handleLibraryPress}
      >
        <MaterialCommunityIcons
          name="book-music"
          size={24}
          color={pathname === "/screens/Playlist" ? COLORS.black : COLORS.white}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.navItem,
          pathname === "/screens/Download" && styles.activeContainer,
        ]}
        onPress={handleDownloadPress}
      >
        <Foundation
          name="download"
          size={24}
          color={pathname === "/screens/Download" ? COLORS.black : COLORS.white}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.black,
    padding: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  navItem: {
    // padding: 10,
    // paddingVertical: 40,
    paddingVertical: 10,
    paddingHorizontal: 20,

    borderRadius: 100,
    width: "20%",
    alignItems: "center",
    marginHorizontal: 10,
  },
  activeContainer: {
    backgroundColor: COLORS.primary,
  },
});

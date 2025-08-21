import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../theme";

export default function Header() {
  const router = useRouter();

  const handleSearchPress = () => {
    router.push("./screens/Search");
  };

  return (
    <View style={styles.navbar}>
      <View style={styles.navContent}>
        <View style={styles.brandContainer}>
          <MaterialCommunityIcons
            name="surround-sound"
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.brandName}>SONIC</Text>
        </View>
        <TouchableOpacity
          style={styles.searchIcon}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <AntDesign name="search1" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: COLORS.black,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  navContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    // backgroundColor: "red",
  },
  brandName: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  searchIcon: {
    paddingVertical: 10,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});

import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { COLORS } from "../theme";

export default function Layout({ children }) {
  return (
    <>
      <StatusBar
        backgroundColor={COLORS.black}
        barStyle="light-content"
        translucent={false}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <Header />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.content}>{children}</View>
        </View>
        <View style={styles.footerContainer}>
          <Footer />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    width: "100%",
    marginTop: 25,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 64,
  },
  contentContainer: {
    flex: 1,
    position: "relative",
    paddingTop: 84,
    paddingBottom: 80,
  },
  content: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

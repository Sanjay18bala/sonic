import { Stack } from "expo-router";
import React from "react";
import { COLORS } from "./theme";

export default function RootLayout() {
  return (
    <>
      {/* <StatusBar style="light" backgroundColor={COLORS.black} /> */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.black },
          animation: "none",
          animationDuration: 0,
          animationTypeForReplace: "pop",
          presentation: "transparentModal",
        }}
      />
    </>
  );
}

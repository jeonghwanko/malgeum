import React from "react";
import { View, StyleSheet } from "react-native";

interface AppBarProps {
  children?: React.ReactNode;
}

export function AppBar({ children }: AppBarProps) {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 24,
    zIndex: 1,
  },
});

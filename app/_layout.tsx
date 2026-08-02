import { useEffect } from "react";
import { Stack } from "expo-router";
import { getDb } from "../src/db/client";
import { initPurchases } from "../src/purchases";
import { rescheduleAll } from "../src/notify";
import { tokens } from "../src/design/tokens";
import "../global.css";

export default function RootLayout() {
  useEffect(() => {
    getDb();
    initPurchases();
    rescheduleAll();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: tokens.color.bg },
        headerTintColor: tokens.color.text,
        contentStyle: { backgroundColor: tokens.color.bg },
      }}
    />
  );
}

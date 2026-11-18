import type { Metadata } from "next";
import { Suspense } from "react";
import { SetupScreen } from "./SetupScreen";

export const metadata: Metadata = { title: "Setup" };

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupScreen />
    </Suspense>
  );
}

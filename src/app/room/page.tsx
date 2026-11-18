import type { Metadata } from "next";
import { Suspense } from "react";
import { RoomEditorScreen } from "./RoomEditorScreen";

export const metadata: Metadata = { title: "Room" };

export default function RoomEditorPage() {
  return (
    <Suspense fallback={null}>
      <RoomEditorScreen />
    </Suspense>
  );
}

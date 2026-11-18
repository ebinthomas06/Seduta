import { Suspense } from "react";
import { RoomEditorScreen } from "./RoomEditorScreen";

export default function RoomEditorPage() {
  return (
    <Suspense fallback={null}>
      <RoomEditorScreen />
    </Suspense>
  );
}

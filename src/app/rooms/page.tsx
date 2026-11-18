import { Suspense } from "react";
import { RoomsScreen } from "./RoomsScreen";

export default function RoomsPage() {
  return (
    <Suspense fallback={null}>
      <RoomsScreen />
    </Suspense>
  );
}

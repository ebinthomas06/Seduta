import type { Metadata } from "next";
import { Suspense } from "react";
import { RoomsScreen } from "./RoomsScreen";

export const metadata: Metadata = { title: "Rooms" };

export default function RoomsPage() {
  return (
    <Suspense fallback={null}>
      <RoomsScreen />
    </Suspense>
  );
}

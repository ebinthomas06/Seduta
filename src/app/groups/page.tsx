import type { Metadata } from "next";
import { Suspense } from "react";
import { GroupsScreen } from "./GroupsScreen";

export const metadata: Metadata = { title: "Groups" };

export default function GroupsPage() {
  return (
    <Suspense fallback={null}>
      <GroupsScreen />
    </Suspense>
  );
}

import { Suspense } from "react";
import { GroupsScreen } from "./GroupsScreen";

export default function GroupsPage() {
  return (
    <Suspense fallback={null}>
      <GroupsScreen />
    </Suspense>
  );
}

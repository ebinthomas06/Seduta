import { NotFoundState } from "@/components/plan/PlanStates";

export default function NotFound() {
  return (
    <NotFoundState
      title="Page not found"
      text="There's nothing at this address."
      href="/"
      label="Back to saved plans"
    />
  );
}

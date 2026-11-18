"use client";

import { useSearchParams } from "next/navigation";

/** The plan id from `?plan=…` ("" when missing, which shows "Plan not found"). */
export function usePlanId(): string {
  return useSearchParams().get("plan") ?? "";
}

/** The room id from `?room=…`. */
export function useRoomId(): string {
  return useSearchParams().get("room") ?? "";
}

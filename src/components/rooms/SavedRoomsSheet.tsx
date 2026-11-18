"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { deleteSavedRoom, listSavedRooms } from "@/lib/db/savedRooms";
import { roomFromSaved, roomMeta, usableSeats } from "@/lib/rooms";
import type { Room } from "@/lib/seating/seating";

/** The reusable room library. Tapping a room hands a fresh copy to `onAdd`. */
export function SavedRoomsSheet({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (room: Room) => void;
}) {
  const saved = useLiveQuery(() => listSavedRooms(), []);
  return (
    <Modal open={open} onClose={onClose} title="Saved rooms">
      {saved === undefined ? null : saved.length === 0 ? (
        <p className="text-[14px] leading-snug text-ink2">
          No saved rooms yet. Open a room and choose “Save to my rooms” to reuse
          it in other plans.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col border-t border-ink p-0">
          {saved.map((s) => (
            <li
              key={s.id}
              className="flex min-h-[72px] items-center gap-2 border-b border-rule"
            >
              <button
                type="button"
                aria-label={`Add ${s.name} to this plan`}
                onClick={() => onAdd(roomFromSaved(s))}
                className="flex min-w-0 flex-1 flex-col gap-1 py-2.5 text-left"
              >
                <span className="truncate text-[17px] leading-tight font-medium">
                  {s.name}
                </span>
                <span className="font-mono text-[13px] text-ink2">
                  {roomMeta(s)} · {usableSeats(s)} seats
                </span>
              </button>
              <Button
                variant="textDanger"
                aria-label={`Remove ${s.name} from saved rooms`}
                onClick={() => deleteSavedRoom(s.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

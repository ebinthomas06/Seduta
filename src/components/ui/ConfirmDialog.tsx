"use client";

import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation for destructive actions. Cancel is the safe, first choice. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      variant="dialog"
      maxWidth={440}
    >
      <div className="flex flex-col gap-6">
        <p className="text-[15px] leading-normal text-ink3">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="md" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="md" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

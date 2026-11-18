"use client";

import { useEffect, useId, useRef } from "react";
import { cx } from "@/lib/cx";
import { CloseIcon } from "./Icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /**
   * sheet: bottom sheet that slides up under a 64px scrim strip (mobile add/edit forms).
   * dialog: bordered centred dialog (export, confirmations).
   */
  variant?: "sheet" | "dialog";
  children: React.ReactNode;
  /** Pinned below the scrolling body (usually a BottomBar). */
  footer?: React.ReactNode;
  /** Max width of a dialog. */
  maxWidth?: number;
}

/**
 * Built on the native <dialog> element, so focus is trapped, Escape closes it,
 * and everything behind it is inert while it is open.
 */
export function Modal({
  open,
  onClose,
  title,
  variant = "sheet",
  children,
  footer,
  maxWidth = 1000,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cx(
        "m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-ink backdrop:bg-scrim/80",
        variant === "dialog" && "overflow-y-auto",
      )}
    >
      <div
        style={variant === "dialog" ? { maxWidth } : undefined}
        className={cx(
          "flex flex-col bg-bg",
          variant === "sheet"
            ? "mx-auto mt-16 h-[calc(100%-4rem)] max-w-[480px] border-t-2 border-ink"
            : "mx-auto my-10 w-[calc(100%-1.5rem)] border-2 border-ink",
        )}
      >
        <div
          className={cx(
            "flex flex-none items-center justify-between",
            variant === "sheet"
              ? "h-14 pr-1.5 pl-4"
              : "h-16 border-b border-rule pr-2 pl-6",
          )}
        >
          <h2 id={titleId} className="text-[20px] leading-tight font-semibold">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center text-ink"
          >
            <CloseIcon />
          </button>
        </div>
        <div
          className={cx(
            "min-h-0 flex-1 overflow-y-auto",
            variant === "sheet" ? "px-4" : "p-6",
          )}
        >
          {children}
        </div>
        {footer}
      </div>
    </dialog>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./button";

/**
 * Accessible modal built on the native <dialog> element, which gives us
 * focus trapping, Escape to close and inert background for free.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
      className={cn(
        "cozy-dialog m-auto w-[min(92vw,440px)] rounded-[28px] bg-raised p-0 text-ink shadow-float",
        "open:animate-[dialog-in_280ms_cubic-bezier(0.22,1,0.36,1)]",
        className,
      )}
    >
      {open ? (
        <div className="p-6 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="dialog-title" className="font-display text-2xl text-ink">
                {title}
              </h2>
              {description ? <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p> : null}
            </div>
            <IconButton label="Close" size="sm" onClick={onClose} className="-mr-2 -mt-1">
              <X />
            </IconButton>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

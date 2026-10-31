import { useEffect, useRef, type ReactNode } from "react";

/** Native top layer escapes transformed/isolated SHOPLINE theme containers. */
export default function PurchaseDialog({
  children,
  onClose,
  busy = false,
}: {
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  const isBusy = useRef(busy);
  close.current = onClose;
  isBusy.current = busy;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (typeof element.showModal === "function") {
      try {
        element.showModal();
      } catch {
        element.setAttribute("open", "");
      }
    } else element.setAttribute("open", "");
    const onCancel = (event: Event) => {
      event.preventDefault();
      if (!isBusy.current) close.current();
    };
    element.addEventListener("cancel", onCancel);
    return () => {
      element.removeEventListener("cancel", onCancel);
      if (element.open && typeof element.close === "function") element.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="planner-sheet-layer"
      aria-label="購買清單"
      aria-modal="true"
    >
      <div
        className="planner-sheet-backdrop"
        onMouseDown={event => {
          if (event.target === event.currentTarget && !busy) onClose();
        }}
      >
        {children}
      </div>
    </dialog>
  );
}

import { useEffect, useRef, useState } from "react";
import { ShoppingCart, ArrowRight } from "lucide-react";
import {
  addCartSelection,
  getPreviousCartResult,
  allowAnotherCartSelection,
  type CartResult,
} from "./cart-client";
import { selectionKey, type CartSelectionLine } from "./cart-plan";

export default function CartActions({
  lines,
  disabled = false,
  onBusyChange,
}: {
  lines: CartSelectionLine[];
  disabled?: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const key = selectionKey(lines);
  const [result, setResult] = useState<CartResult | null>(() =>
    getPreviousCartResult(lines)
  );
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    setResult(getPreviousCartResult(lines));
  }, [key]);

  async function add() {
    if (disabled || lock.current) return;
    lock.current = true;
    setBusy(true);
    setResult(null);
    onBusyChange(true);
    try {
      const outcome = await addCartSelection(lines, text => {
        if (mounted.current) setProgress(text);
      });
      if (mounted.current) setResult(outcome);
    } finally {
      lock.current = false;
      if (mounted.current) {
        setBusy(false);
        setProgress("");
        onBusyChange(false);
      }
    }
  }

  const finished = result?.status === "success";
  const mustCheck =
    result?.status === "partial" || result?.status === "uncertain";
  return (
    <div className="planner-cart-action-group">
      {result && (
        <div
          className="planner-cart-message"
          data-tone={finished ? "success" : "error"}
          role={finished ? "status" : "alert"}
        >
          <p>{result.message}</p>
          {!!result.added.length && !finished && (
            <ul>
              {result.added.map(line => (
                <li key={line.sku}>
                  {line.name} × {line.quantity}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {finished || mustCheck ? (
        <a
          className="planner-download-button planner-cart-button"
          href="https://www.cozystyler.com/cart"
        >
          {finished ? "前往購物車" : "前往購物車確認"} <ArrowRight size={17} />
        </a>
      ) : (
        <button
          type="button"
          className="planner-download-button planner-cart-button"
          disabled={disabled || busy}
          onClick={add}
          aria-busy={busy}
        >
          <ShoppingCart size={17} />
          {busy ? progress || "加入中…" : "加入購物車"}
        </button>
      )}
      {finished && (
        <button
          type="button"
          className="planner-cart-repeat"
          onClick={() => {
            if (allowAnotherCartSelection(lines)) void add();
          }}
        >
          再加一份相同清單
        </button>
      )}
    </div>
  );
}

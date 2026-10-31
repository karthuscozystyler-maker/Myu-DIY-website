import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Search, X } from "lucide-react";
import { getBoardImage } from "./assets";
import { FABRICS, getFabric, type Fabric, type FabricId } from "./fabrics";

type FabricPickerProps<T extends string = FabricId> = {
  value: T;
  onChange: (pattern: T) => void;
  onClose: () => void;
};

type FabricFilter = "all" | Fabric["family"];

const familyLabel = (family: FabricFilter) =>
  family === "all" ? "全部" : family === "pattern" ? "花紋" : "素色";

export default function FabricPicker<T extends string = FabricId>({
  value,
  onChange,
  onClose,
}: FabricPickerProps<T>) {
  const dialogRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<FabricFilter>("all");
  const selectedFabric = getFabric(value);
  const families = useMemo<readonly FabricFilter[]>(
    () => ["all", ...Array.from(new Set(FABRICS.map(fabric => fabric.family)))],
    []
  );
  const fabrics = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return FABRICS.filter(fabric => {
      const matchesFamily = family === "all" || fabric.family === family;
      const matchesQuery = [
        fabric.name,
        fabric.code,
        fabric.supplierCode ?? "",
      ].some(value => value.toLocaleLowerCase().includes(normalizedQuery));
      return matchesFamily && matchesQuery;
    });
  }, [family, query]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current
      ?.querySelector<HTMLButtonElement>(".planner-fabric-close")
      ?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href]:not([tabindex="-1"])'
      )
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    const root = event.currentTarget.getRootNode();
    const activeElement =
      root instanceof ShadowRoot ? root.activeElement : document.activeElement;

    if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <div className="planner-fabric-backdrop" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="planner-fabric-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fabric-picker-title"
        onMouseDown={event => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="planner-fabric-picker-heading">
          <div>
            <p>布款選擇</p>
            <h2 id="fabric-picker-title">{selectedFabric.name}</h2>
          </div>
          <button
            className="planner-fabric-close"
            onClick={onClose}
            aria-label="關閉布款選擇"
          >
            <X size={20} />
          </button>
        </div>

        <div className="planner-fabric-filter">
          <label className="planner-fabric-search">
            <Search size={17} aria-hidden="true" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="按名稱或布款代碼搜尋"
              aria-label="按名稱或布款代碼搜尋"
            />
          </label>
          <div className="planner-fabric-families" aria-label="布款分類">
            {families.map(option => (
              <button
                key={option}
                className={family === option ? "is-active" : ""}
                onClick={() => setFamily(option)}
                aria-pressed={family === option}
              >
                {familyLabel(option)}
              </button>
            ))}
          </div>
        </div>

        <div className="planner-fabric-scroll">
          {fabrics.length ? (
            <div className="planner-fabric-grid">
              {fabrics.map(fabric => (
                <button
                  key={fabric.id}
                  className={`planner-fabric-card ${value === fabric.id ? "is-selected" : ""}`}
                  onClick={() => {
                    onChange(fabric.id as T);
                    onClose();
                  }}
                  aria-pressed={value === fabric.id}
                >
                  <img
                    src={getBoardImage(
                      fabric.id as Parameters<typeof getBoardImage>[0]
                    )}
                    alt={`${fabric.name} 引磁布縮圖`}
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{fabric.name}</span>
                  <small>{familyLabel(fabric.family)}</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="planner-fabric-empty">未找到相符布款。</p>
          )}
        </div>
      </section>
    </div>
  );
}

export type { FabricPickerProps };

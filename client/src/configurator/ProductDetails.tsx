import { useEffect, useRef, useState } from "react";
import { DETAIL_MEDIA, type DetailMedia } from "./detail-media";

function DetailImage({ item }: { item: DetailMedia }) {
  const anchor = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = anchor.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "220px 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <figure
      ref={anchor}
      className={`shop-detail-image ${item.layout === "half" ? "is-half" : ""}`}
      style={{ aspectRatio: `${item.width}/${item.height}` }}
    >
      {ready && !failed && (
        <img
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <button className="shop-detail-retry" onClick={() => setFailed(false)}>
          圖片未能載入，按此重試
        </button>
      )}
    </figure>
  );
}

export default function ProductDetails() {
  return (
    <section className="shop-product-details" aria-label="引磁收納產品詳情">
      <div className="shop-detail-grid">
        {DETAIL_MEDIA.map(item => (
          <DetailImage key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

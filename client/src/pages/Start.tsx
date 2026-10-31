import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import {
  ACCESSORIES_URL,
  BOARD_IMAGE,
  HERO_IMAGE,
  PRODUCT_IMAGES,
  SCENE_IMAGES,
} from "../configurator/assets";
import { SERIES } from "../configurator/model";
import ProductDetails from "../configurator/ProductDetails";
import "./pages.css";

const descriptions = {
  entry: "鑰匙、帽子、出門小物，各有位置。",
  kitchen: "調味料與煮食工具，順手就拎到。",
  bathroom: "日常用品整齊上牆，檯面留白。",
  desk: "文具與化妝用品，排成自己習慣。",
};

export default function Start() {
  return (
    <div className="shop-page">
      <main className="shop-start">
        <section className="shop-hero" aria-label="引磁收納展示">
          <img src={HERO_IMAGE} alt="沐幕引磁收納展示" />
        </section>

        <section
          className="shop-selection"
          aria-labelledby="shop-selection-title"
        >
          <div className="shop-intro">
            <h1 id="shop-selection-title">你想先改造哪裡？</h1>
          </div>

          <div className="shop-entry-grid">
            {SERIES.map(series => (
              <Link
                key={series.id}
                href={`/series/${series.id}`}
                className="shop-entry-card"
              >
                <img
                  className="shop-entry-photo"
                  src={SCENE_IMAGES[series.id]}
                  alt={`${series.label}收納場景`}
                />
                <div className="shop-entry-copy">
                  <h2>{series.label}</h2>
                  <p>{descriptions[series.id]}</p>
                  <span className="shop-entry-action">
                    套裝選擇 <ChevronRight size={16} />
                  </span>
                </div>
              </Link>
            ))}

            <Link href="/diy" className="shop-entry-card shop-entry-diy">
              <div className="shop-diy-photo">
                <img src={BOARD_IMAGE} alt="奶茶格紋引磁布" />
                <img src={PRODUCT_IMAGES.hooks} alt="六勾架" />
                <span>自己揀・自己排</span>
              </div>
              <div className="shop-entry-copy">
                <h2>DIY 自由配搭</h2>
                <p>揀布款、加配件，砌出你嘅收納牆。</p>
                <span className="shop-entry-action">
                  開始 DIY <ChevronRight size={16} />
                </span>
              </div>
            </Link>

            <a href={ACCESSORIES_URL} className="shop-entry-card">
              <div className="shop-accessory-photo">
                <img src={PRODUCT_IMAGES.bottles} alt="收納配件" />
              </div>
              <div className="shop-entry-copy">
                <h2>配件</h2>
                <p>已有引磁布？配件亦可以單買。</p>
                <span className="shop-entry-action">
                  選購配件 <ArrowUpRight size={16} />
                </span>
              </div>
            </a>
          </div>

          <p className="shop-bottom-note">
            套裝及 DIY 均包含引磁布與配件；配件可單獨選購。
          </p>
        </section>

        <ProductDetails />
      </main>
    </div>
  );
}

import { assetUrl } from "./asset-url";

export type DetailMedia = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  layout: "full" | "half";
  animated?: boolean;
};

export const DETAIL_MEDIA: readonly DetailMedia[] = [
  {
    id: "installation",
    src: assetUrl("content/installation-demo.webp"),
    alt: "貼上引磁布、吸上配件及自由更換排位的安裝動畫",
    width: 960,
    height: 600,
    layout: "full",
    animated: true,
  },
  {
    id: "comparison",
    src: assetUrl("content/product-comparison.webp"),
    alt: "引磁收納牆與無痕掛勾、吸盤架及鑽孔層架的比較",
    width: 750,
    height: 469,
    layout: "full",
  },
  {
    id: "surfaces",
    src: assetUrl("content/wall-surfaces.webp"),
    alt: "建議使用、建議先詢問及不建議使用的牆面，並附油漆及老化牆面注意事項",
    width: 750,
    height: 336,
    layout: "full",
  },
  {
    id: "installation-questions",
    src: assetUrl("content/questions-install.webp"),
    alt: "引磁布適用牆面、防潮、取下方式及安裝步驟常見問題",
    width: 750,
    height: 469,
    layout: "half",
  },
  {
    id: "use-questions",
    src: assetUrl("content/questions-use.webp"),
    alt: "引磁布承重、尺寸裁切、可用配件與保養常見問題",
    width: 750,
    height: 372,
    layout: "half",
  },
];

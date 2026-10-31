export type FabricFamily = "pattern" | "plain";

type FabricDefinition = {
  name: string;
  family: FabricFamily;
  code: string;
  supplierCode: string | null;
  skus: {
    small: string;
    large: string;
  };
};

// Joined by exact name: received individual-fabric manifest ↔ public fabric table.
// Image paths and dimensions deliberately live in the asset map, not this catalog.
export const FABRIC_DATA = {
  "fabric-gwp": {
    name: "灰白格紋",
    family: "pattern",
    code: "gwp",
    supplierCode: "MYU397-100",
    skus: {
      small: "myu-legocloth-38-gwp",
      large: "myu-legocloth-70-gwp",
    },
  },
  gingham: {
    name: "經典奶茶格紋",
    family: "pattern",
    code: "cmtp",
    supplierCode: "MYU440-13_14",
    skus: {
      small: "myu-legocloth-38-cmtp",
      large: "myu-legocloth-70-cmtp",
    },
  },
  "fabric-ksp": {
    name: "卡其小格紋",
    family: "pattern",
    code: "ksp",
    supplierCode: "MYU397-102",
    skus: {
      small: "myu-legocloth-38-ksp",
      large: "myu-legocloth-70-ksp",
    },
  },
  "fabric-bwp": {
    name: "藍白格紋",
    family: "pattern",
    code: "bwp",
    supplierCode: "MYU397-101",
    skus: {
      small: "myu-legocloth-38-bwp",
      large: "myu-legocloth-70-bwp",
    },
  },
  "fabric-bgs": {
    name: "藍灰條紋",
    family: "pattern",
    code: "bgs",
    supplierCode: "MYU397-105",
    skus: {
      small: "myu-legocloth-38-bgs",
      large: "myu-legocloth-70-bgs",
    },
  },
  "fabric-bg": {
    name: "藍綠色",
    family: "plain",
    code: "bg",
    supplierCode: "MYU397-112",
    skus: {
      small: "myu-legocloth-38-bg",
      large: "myu-legocloth-70-bg",
    },
  },
  floral: {
    name: "沐慕小花磚",
    family: "pattern",
    code: "mmb",
    supplierCode: "MYU440-15_16",
    skus: {
      small: "myu-legocloth-38-mmb",
      large: "myu-legocloth-70-mmb",
    },
  },
  "fabric-mtg": {
    name: "奶茶灰",
    family: "plain",
    code: "mtg",
    supplierCode: "MYU397-110",
    skus: {
      small: "myu-legocloth-38-mtg",
      large: "myu-legocloth-70-mtg",
    },
  },
  "fabric-mtdfl": {
    name: "奶茶雙細線",
    family: "pattern",
    code: "mtdfl",
    supplierCode: "MYU397-103",
    skus: {
      small: "myu-legocloth-38-mtdfl",
      large: "myu-legocloth-70-mtdfl",
    },
  },
  "fabric-cyw": {
    name: "奶黃色",
    family: "plain",
    code: "cyw",
    supplierCode: "MYU397-108",
    skus: {
      small: "myu-legocloth-38-cyw",
      large: "myu-legocloth-70-cyw",
    },
  },
  "fabric-lps": {
    name: "嫩粉條紋",
    family: "pattern",
    code: "lps",
    supplierCode: "MYU397-106",
    skus: {
      small: "myu-legocloth-38-lps",
      large: "myu-legocloth-70-lps",
    },
  },
  "fabric-wpk": {
    name: "暖粉色",
    family: "plain",
    code: "wpk",
    supplierCode: "MYU397-107",
    skus: {
      small: "myu-legocloth-38-wpk",
      large: "myu-legocloth-70-wpk",
    },
  },
  "fabric-lgs": {
    name: "淺灰條紋",
    family: "pattern",
    code: "lgs",
    supplierCode: "MYU397-104",
    skus: {
      small: "myu-legocloth-38-lgs",
      large: "myu-legocloth-70-lgs",
    },
  },
  "fabric-fbl": {
    name: "霧藍色",
    family: "plain",
    code: "fbl",
    supplierCode: "MYU397-111",
    skus: {
      small: "myu-legocloth-38-fbl",
      large: "myu-legocloth-70-fbl",
    },
  },
  "fabric-wh": {
    name: "霧面瓷白",
    family: "plain",
    code: "wh",
    supplierCode: null,
    skus: {
      small: "myu-legocloth-38-wh",
      large: "myu-legocloth-70-wh",
    },
  },
  "fabric-wt": {
    name: "奶油米白",
    family: "plain",
    code: "wt",
    supplierCode: null,
    skus: {
      small: "myu-legocloth-38-wt",
      large: "myu-legocloth-70-wt",
    },
  },
  "fabric-grid": {
    name: "奶茶小方磚",
    family: "pattern",
    code: "grid",
    supplierCode: null,
    skus: {
      small: "myu-legocloth-38-grid",
      large: "myu-legocloth-70-grid",
    },
  },
  "fabric-line": {
    name: "沐慕線條",
    family: "pattern",
    code: "line",
    supplierCode: null,
    skus: {
      small: "myu-legocloth-38-line",
      large: "myu-legocloth-70-line",
    },
  },
  "fabric-mkl": {
    name: "摩卡線條",
    family: "pattern",
    code: "mkl",
    supplierCode: null,
    skus: {
      small: "myu-legocloth-38-mkl",
      large: "myu-legocloth-70-mkl",
    },
  },
  "fabric-dbn": {
    name: "深咖色",
    family: "plain",
    code: "dbn",
    supplierCode: "MYU397-109",
    skus: {
      small: "myu-legocloth-38-dbn",
      large: "myu-legocloth-70-dbn",
    },
  },
  "fabric-gy": {
    name: "岩岭暗灰",
    family: "plain",
    code: "gy",
    supplierCode: null,
    skus: {
      small: "myu-legocloth-38-gy",
      large: "myu-legocloth-70-gy",
    },
  },
} as const satisfies Readonly<Record<string, FabricDefinition>>;

export type FabricId = keyof typeof FABRIC_DATA;

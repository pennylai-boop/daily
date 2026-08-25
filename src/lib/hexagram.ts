/**
 * 數字卜卦（梅花易數起卦法）。
 *
 * 使用者提供 9 個正整數：前 3 個加總除以 8 的餘數決定上卦，
 * 中 3 個加總除以 8 的餘數決定下卦，後 3 個加總除以 6 的餘數決定動爻。
 * 餘數為 0 時視為除數本身（例如除以 8 餘 0 記為第 8 卦）。
 */

export type Trigram = {
  id: number;
  symbol: string;
  name: string;
  nature: string;
};

// 先天八卦序：乾兌離震巽坎艮坤，數字卦起卦法固定用這個順序對應餘數 1～8。
const TRIGRAMS: Trigram[] = [
  { id: 1, symbol: "☰", name: "乾", nature: "天" },
  { id: 2, symbol: "☱", name: "兌", nature: "澤" },
  { id: 3, symbol: "☲", name: "離", nature: "火" },
  { id: 4, symbol: "☳", name: "震", nature: "雷" },
  { id: 5, symbol: "☴", name: "巽", nature: "風" },
  { id: 6, symbol: "☵", name: "坎", nature: "水" },
  { id: 7, symbol: "☶", name: "艮", nature: "山" },
  { id: 8, symbol: "☷", name: "坤", nature: "地" },
];

// 每個卦由下到上 3 爻組成，1＝陽爻、0＝陰爻。
const TRIGRAM_BITS: readonly [number, number, number][] = [
  [1, 1, 1], // 乾
  [1, 1, 0], // 兌
  [1, 0, 1], // 離
  [1, 0, 0], // 震
  [0, 1, 1], // 巽
  [0, 1, 0], // 坎
  [0, 0, 1], // 艮
  [0, 0, 0], // 坤
];

// 六十四卦卦名速查表：[上卦索引][下卦索引]，索引皆對應 TRIGRAMS 的順序（乾兌離震巽坎艮坤）。
const HEXAGRAM_NAMES: readonly string[][] = [
  ["乾為天", "天澤履", "天火同人", "天雷無妄", "天風姤", "天水訟", "天山遯", "天地否"],
  ["澤天夬", "兌為澤", "澤火革", "澤雷隨", "澤風大過", "澤水困", "澤山咸", "澤地萃"],
  ["火天大有", "火澤睽", "離為火", "火雷噬嗑", "火風鼎", "火水未濟", "火山旅", "火地晉"],
  ["雷天大壯", "雷澤歸妹", "雷火豐", "震為雷", "雷風恆", "雷水解", "雷山小過", "雷地豫"],
  ["風天小畜", "風澤中孚", "風火家人", "風雷益", "巽為風", "風水渙", "風山漸", "風地觀"],
  ["水天需", "水澤節", "水火既濟", "水雷屯", "水風井", "坎為水", "水山蹇", "水地比"],
  ["山天大畜", "山澤損", "山火賁", "山雷頤", "山風蠱", "山水蒙", "艮為山", "山地剝"],
  ["地天泰", "地澤臨", "地火明夷", "地雷復", "地風升", "地水師", "地山謙", "坤為地"],
];

export const HEXAGRAM_NUMBER_COUNT = 9;

/** 一卦六爻。 */
export const HEXAGRAM_LINE_COUNT = 6;

/** 六爻由下到上，1＝陽爻、0＝陰爻。 */
export type HexagramLines = readonly number[];

export type HexagramResult = {
  numbers: number[];
  upperSum: number;
  lowerSum: number;
  lineSum: number;
  upperTrigram: Trigram;
  lowerTrigram: Trigram;
  hexagramName: string;
  /** 本卦的六爻，由下到上。 */
  lines: number[];
  movingLine: number;
  changedUpperTrigram: Trigram;
  changedLowerTrigram: Trigram;
  changedHexagramName: string;
  /** 動爻翻面之後的六爻，由下到上。 */
  changedLines: number[];
};

function remainder(sum: number, divisor: number): number {
  const r = sum % divisor;
  return r === 0 ? divisor : r;
}

function findTrigramIndex(bits: readonly number[]): number {
  const index = TRIGRAM_BITS.findIndex((t) => t[0] === bits[0] && t[1] === bits[1] && t[2] === bits[2]);
  if (index === -1) throw new Error("無法辨識的爻組合。");
  return index;
}

/** 每格只填一位數，所以取 1～9。 */
export function randomHexagramNumbers(): number[] {
  return Array.from({ length: HEXAGRAM_NUMBER_COUNT }, () => 1 + Math.floor(Math.random() * 9));
}

export function castHexagram(numbers: number[]): HexagramResult {
  if (numbers.length !== HEXAGRAM_NUMBER_COUNT || numbers.some((n) => !Number.isInteger(n) || n <= 0)) {
    throw new Error(`請提供 ${HEXAGRAM_NUMBER_COUNT} 個正整數。`);
  }

  const upperSum = numbers[0] + numbers[1] + numbers[2];
  const lowerSum = numbers[3] + numbers[4] + numbers[5];
  const lineSum = numbers[6] + numbers[7] + numbers[8];

  const upperIndex = remainder(upperSum, 8) - 1;
  const lowerIndex = remainder(lowerSum, 8) - 1;
  const movingLine = remainder(lineSum, 6);

  const upperTrigram = TRIGRAMS[upperIndex];
  const lowerTrigram = TRIGRAMS[lowerIndex];
  const hexagramName = HEXAGRAM_NAMES[upperIndex][lowerIndex];

  // 六爻由下到上排列：下卦 3 爻在前，上卦 3 爻在後，動爻對應第 movingLine 個位置。
  const lines = [...TRIGRAM_BITS[lowerIndex], ...TRIGRAM_BITS[upperIndex]];
  const changedLines = [...lines];
  changedLines[movingLine - 1] = changedLines[movingLine - 1] === 1 ? 0 : 1;

  const changedLowerIndex = findTrigramIndex(changedLines.slice(0, 3));
  const changedUpperIndex = findTrigramIndex(changedLines.slice(3, 6));

  return {
    numbers,
    upperSum,
    lowerSum,
    lineSum,
    upperTrigram,
    lowerTrigram,
    hexagramName,
    lines,
    movingLine,
    changedUpperTrigram: TRIGRAMS[changedUpperIndex],
    changedLowerTrigram: TRIGRAMS[changedLowerIndex],
    changedHexagramName: HEXAGRAM_NAMES[changedUpperIndex][changedLowerIndex],
    changedLines,
  };
}

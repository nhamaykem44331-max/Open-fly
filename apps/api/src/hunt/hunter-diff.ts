/**
 * Change detection thuần cho Fare Hunter: so sánh kết quả quét lần này với
 * lần trước để phân loại giá lên/xuống, chuyến mới/mất, ghế sắp hết, đã chạm
 * giá mục tiêu chưa, và có phải đáy lịch sử không.
 *
 * Module THUẦN — không phụ thuộc Nest/Prisma/DB. T5 sẽ truy vấn DB
 * (RoutePriceObservation cho historicalLowVnd) rồi truyền vào; T6 chỉ tính toán.
 *
 * Tiền tệ: mọi giá là VND nguyên đồng (Q-45). So sánh target dùng giá BÁN
 * (sellPriceVnd, sau markup), không phải net.
 */

export interface HuntResultItem {
  flightNumber: string; // vd "VJ168"
  departTime: string; // ISO hoặc chuỗi giờ khởi hành, dùng làm phần 2 của key
  sellPriceVnd: number; // giá bán sau markup, VND nguyên đồng
  seatAvailable: number | null;
}

export interface DiffSummary {
  priceDown: { count: number; avgPercent: number }; // avgPercent = TB % giảm (số dương), làm tròn
  priceUp: { count: number; avgPercent: number };
  newFlights: number;
  removedFlights: number;
  seatChanges: { soldOut: number; lowSeat: number };
  hitTarget: boolean;
  isHistoricalLow: boolean;
}

export interface CompareHuntOptions {
  targetPriceVnd: number;
  lowSeatThreshold?: number; // mặc định 5
  historicalLowVnd?: number; // T5 truy vấn từ RoutePriceObservation, có thể bỏ trống
}

const DEFAULT_LOW_SEAT_THRESHOLD = 5;

export function compareHuntResults(
  prev: HuntResultItem[] | null,
  curr: HuntResultItem[],
  opts: CompareHuntOptions,
): DiffSummary {
  const lowSeatThreshold = opts.lowSeatThreshold ?? DEFAULT_LOW_SEAT_THRESHOLD;

  // prev rỗng/null -> mọi chuyến curr đều là "mới" theo thuật toán chung bên dưới.
  const prevByKey = new Map<string, HuntResultItem>();
  for (const item of prev ?? []) {
    prevByKey.set(resultKey(item), item);
  }

  let newFlights = 0;
  const downPercents: number[] = [];
  const upPercents: number[] = [];
  const currKeys = new Set<string>();

  for (const item of curr) {
    const key = resultKey(item);
    currKeys.add(key);

    const prevItem = prevByKey.get(key);
    if (!prevItem) {
      newFlights += 1;
      continue;
    }

    const oldPrice = prevItem.sellPriceVnd;
    const newPrice = item.sellPriceVnd;
    if (newPrice < oldPrice) {
      downPercents.push(((oldPrice - newPrice) / oldPrice) * 100);
    } else if (newPrice > oldPrice) {
      upPercents.push(((newPrice - oldPrice) / oldPrice) * 100);
    }
  }

  let removedFlights = 0;
  for (const key of prevByKey.keys()) {
    if (!currKeys.has(key)) {
      removedFlights += 1;
    }
  }

  let soldOut = 0;
  let lowSeat = 0;
  for (const item of curr) {
    if (item.seatAvailable == null) {
      continue;
    }
    if (item.seatAvailable <= 0) {
      soldOut += 1;
    } else if (item.seatAvailable <= lowSeatThreshold) {
      lowSeat += 1;
    }
  }

  const hitTarget = curr.some(
    (item) => bookable(item) && item.sellPriceVnd <= opts.targetPriceVnd,
  );

  const cheapestBookable = cheapestBookablePrice(curr);
  const isHistoricalLow =
    opts.historicalLowVnd != null &&
    cheapestBookable != null &&
    cheapestBookable <= opts.historicalLowVnd;

  return {
    priceDown: { count: downPercents.length, avgPercent: average(downPercents) },
    priceUp: { count: upPercents.length, avgPercent: average(upPercents) },
    newFlights,
    removedFlights,
    seatChanges: { soldOut, lowSeat },
    hitTarget,
    isHistoricalLow,
  };
}

function resultKey(item: HuntResultItem): string {
  return `${item.flightNumber}|${item.departTime}`;
}

// Ghế = null (không rõ) coi như đặt được; ghế <= 0 coi như hết chỗ.
function bookable(item: HuntResultItem): boolean {
  return item.seatAvailable == null || item.seatAvailable > 0;
}

function cheapestBookablePrice(items: HuntResultItem[]): number | null {
  let cheapest: number | null = null;
  for (const item of items) {
    if (!bookable(item)) {
      continue;
    }
    if (cheapest == null || item.sellPriceVnd < cheapest) {
      cheapest = item.sellPriceVnd;
    }
  }

  return cheapest;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round(sum / values.length);
}

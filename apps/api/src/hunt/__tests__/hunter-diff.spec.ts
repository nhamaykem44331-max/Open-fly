import {
  compareHuntResults,
  HuntResultItem,
} from '../hunter-diff';

function item(
  flightNumber: string,
  departTime: string,
  sellPriceVnd: number,
  seatAvailable: number | null = 9,
): HuntResultItem {
  return { flightNumber, departTime, sellPriceVnd, seatAvailable };
}

describe('compareHuntResults', () => {
  it('(a) prev=null: mọi chuyến là mới, removed=0, không có thay đổi giá', () => {
    const curr = [
      item('VJ168', '2026-06-10T08:00', 1500000),
      item('VN250', '2026-06-10T09:00', 1800000),
    ];

    const summary = compareHuntResults(null, curr, { targetPriceVnd: 1600000 });

    expect(summary.newFlights).toBe(2);
    expect(summary.removedFlights).toBe(0);
    expect(summary.priceDown).toEqual({ count: 0, avgPercent: 0 });
    expect(summary.priceUp).toEqual({ count: 0, avgPercent: 0 });
    // hitTarget vẫn tính trên curr: VJ168 1.5tr <= 1.6tr và còn ghế -> true.
    expect(summary.hitTarget).toBe(true);
    expect(summary.isHistoricalLow).toBe(false);
  });

  it('(b) giá giảm 2.000.000 -> 1.700.000: priceDown count=1, avgPercent=15', () => {
    const prev = [item('VJ168', '2026-06-10T08:00', 2000000)];
    const curr = [item('VJ168', '2026-06-10T08:00', 1700000)];

    const summary = compareHuntResults(prev, curr, { targetPriceVnd: 0 });

    expect(summary.priceDown).toEqual({ count: 1, avgPercent: 15 });
    expect(summary.priceUp.count).toBe(0);
    expect(summary.newFlights).toBe(0);
    expect(summary.removedFlights).toBe(0);
  });

  it('(c) giá tăng 2.000.000 -> 2.400.000: priceUp count=1, avgPercent=20', () => {
    const prev = [item('VJ168', '2026-06-10T08:00', 2000000)];
    const curr = [item('VJ168', '2026-06-10T08:00', 2400000)];

    const summary = compareHuntResults(prev, curr, { targetPriceVnd: 0 });

    expect(summary.priceUp).toEqual({ count: 1, avgPercent: 20 });
    expect(summary.priceDown.count).toBe(0);
  });

  it('(d) chuyến mới + chuyến biến mất', () => {
    const prev = [
      item('VJ168', '2026-06-10T08:00', 1500000),
      item('QH200', '2026-06-10T07:00', 1400000),
    ];
    const curr = [
      item('VJ168', '2026-06-10T08:00', 1500000), // giữ nguyên
      item('VN999', '2026-06-10T12:00', 1900000), // mới
    ];

    const summary = compareHuntResults(prev, curr, { targetPriceVnd: 0 });

    expect(summary.newFlights).toBe(1); // VN999
    expect(summary.removedFlights).toBe(1); // QH200
    expect(summary.priceDown.count).toBe(0);
    expect(summary.priceUp.count).toBe(0);
  });

  it('(e) seatChanges: seat=0 -> soldOut, seat=3 (threshold 5) -> lowSeat', () => {
    const curr = [
      item('VJ168', '2026-06-10T08:00', 1500000, 0), // soldOut
      item('VN250', '2026-06-10T09:00', 1800000, 3), // lowSeat
      item('QH300', '2026-06-10T10:00', 1600000, 9), // bình thường
      item('BL400', '2026-06-10T11:00', 1700000, null), // không rõ ghế -> không tính
    ];

    const summary = compareHuntResults(null, curr, { targetPriceVnd: 0 });

    expect(summary.seatChanges).toEqual({ soldOut: 1, lowSeat: 1 });
  });

  it('(f) hitTarget: item bookable sell<=target -> true; nếu item đó hết ghế -> false', () => {
    const target = 1600000;

    const withSeat = [item('VJ168', '2026-06-10T08:00', 1500000, 5)];
    expect(
      compareHuntResults(null, withSeat, { targetPriceVnd: target }).hitTarget,
    ).toBe(true);

    // Cùng giá <= target nhưng hết ghế -> không tính là hit.
    const soldOut = [item('VJ168', '2026-06-10T08:00', 1500000, 0)];
    expect(
      compareHuntResults(null, soldOut, { targetPriceVnd: target }).hitTarget,
    ).toBe(false);
  });

  it('(g) isHistoricalLow: cheapestBookable <= historicalLowVnd -> true; không truyền -> false', () => {
    const curr = [
      item('VJ168', '2026-06-10T08:00', 1500000, 5),
      item('VN250', '2026-06-10T09:00', 1200000, 0), // rẻ nhất nhưng hết ghế -> không tính
    ];

    // cheapestBookable = 1.500.000 (VN250 hết ghế bị loại). 1.5tr <= 1.55tr -> true.
    expect(
      compareHuntResults(null, curr, {
        targetPriceVnd: 0,
        historicalLowVnd: 1550000,
      }).isHistoricalLow,
    ).toBe(true);

    // 1.5tr > 1.45tr -> không phải đáy.
    expect(
      compareHuntResults(null, curr, {
        targetPriceVnd: 0,
        historicalLowVnd: 1450000,
      }).isHistoricalLow,
    ).toBe(false);

    // Không truyền historicalLowVnd -> false.
    expect(
      compareHuntResults(null, curr, { targetPriceVnd: 0 }).isHistoricalLow,
    ).toBe(false);
  });

  it('avgPercent là trung bình làm tròn của nhiều chuyến giảm giá', () => {
    const prev = [
      item('VJ168', '2026-06-10T08:00', 2000000),
      item('VN250', '2026-06-10T09:00', 1000000),
    ];
    const curr = [
      item('VJ168', '2026-06-10T08:00', 1700000), // giảm 15%
      item('VN250', '2026-06-10T09:00', 900000), // giảm 10%
    ];

    const summary = compareHuntResults(prev, curr, { targetPriceVnd: 0 });

    // TB(15, 10) = 12.5 -> làm tròn 13.
    expect(summary.priceDown).toEqual({ count: 2, avgPercent: 13 });
  });
});

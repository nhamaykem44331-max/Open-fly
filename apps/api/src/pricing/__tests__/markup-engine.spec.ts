import { MarkupRule, MarkupType, MembershipTier } from '@prisma/client';
import { computeMarkup } from '../markup-engine';

describe('computeMarkup', () => {
  const now = new Date('2026-05-28T10:00:00.000Z');

  it('applies FIXED markup', () => {
    const result = computeMarkup(
      input(),
      [rule({ type: MarkupType.FIXED, value: 50000 })],
      now,
    );

    expect(result).toEqual(
      expect.objectContaining({
        markupAmount: 50000,
        sellPrice: 1050000,
      }),
    );
  });

  it('applies PERCENT markup with value=350 as 3.5%', () => {
    const result = computeMarkup(
      input(),
      [rule({ type: MarkupType.PERCENT, value: 350 })],
      now,
    );

    expect(result.markupAmount).toBe(35000);
    expect(result.sellPrice).toBe(1035000);
  });

  it('caps PERCENT markup with maxAmount', () => {
    const result = computeMarkup(
      input({ netPrice: 2000000 }),
      [
        rule({
          type: MarkupType.PERCENT,
          value: 1000,
          maxAmount: 80000,
        }),
      ],
      now,
    );

    expect(result.markupAmount).toBe(80000);
  });

  it('floors PERCENT markup with minAmount', () => {
    const result = computeMarkup(
      input(),
      [
        rule({
          type: MarkupType.PERCENT,
          value: 100,
          minAmount: 30000,
        }),
      ],
      now,
    );

    expect(result.markupAmount).toBe(30000);
  });

  it('uses highest priority, then oldest createdAt', () => {
    const result = computeMarkup(
      input(),
      [
        rule({
          id: 'low-priority',
          priority: 1,
          value: 10000,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
        rule({
          id: 'high-priority',
          priority: 10,
          value: 20000,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        }),
      ],
      now,
    );

    expect(result.ruleId).toBe('high-priority');
    expect(result.markupAmount).toBe(20000);

    const tieResult = computeMarkup(
      input(),
      [
        rule({
          id: 'newer',
          priority: 10,
          value: 30000,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        }),
        rule({
          id: 'older',
          priority: 10,
          value: 40000,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ],
      now,
    );

    expect(tieResult.ruleId).toBe('older');
    expect(tieResult.markupAmount).toBe(40000);
  });

  it('treats null rule conditions as wildcard', () => {
    const result = computeMarkup(
      input({ airlineCode: 'VJ', route: 'HAN-DAD', domestic: null }),
      [
        rule({
          airlineCode: null,
          routeFrom: null,
          routeTo: null,
          domestic: null,
        }),
      ],
      now,
    );

    expect(result.ruleId).toBe('rule-id');
  });

  it('matches tierScope when provided and misses otherwise', () => {
    const premiumResult = computeMarkup(
      input({ tier: MembershipTier.PREMIUM }),
      [rule({ tierScope: [MembershipTier.PREMIUM], value: 10000 })],
      now,
    );
    const standardResult = computeMarkup(
      input({ tier: MembershipTier.STANDARD }),
      [rule({ tierScope: [MembershipTier.PREMIUM], value: 10000 })],
      now,
    );

    expect(premiumResult.markupAmount).toBe(10000);
    expect(standardResult.markupAmount).toBe(0);
  });

  it('matches only inside validity window', () => {
    const validRule = rule({
      validFrom: new Date('2026-05-01T00:00:00.000Z'),
      validUntil: new Date('2026-06-01T00:00:00.000Z'),
      value: 10000,
    });
    const futureRule = rule({
      id: 'future-rule',
      validFrom: new Date('2026-06-01T00:00:01.000Z'),
      value: 20000,
    });

    expect(computeMarkup(input(), [validRule], now).markupAmount).toBe(10000);
    expect(computeMarkup(input(), [futureRule], now).markupAmount).toBe(0);
  });

  it('returns zero markup when no rule matches', () => {
    const result = computeMarkup(
      input({ airlineCode: 'VN' }),
      [rule({ airlineCode: 'VJ' })],
      now,
    );

    expect(result).toEqual({
      ruleId: null,
      ruleName: null,
      markupAmount: 0,
      sellPrice: 1000000,
    });
  });

  it('rejects negative markup value', () => {
    expect(() => computeMarkup(input(), [rule({ value: -1 })], now)).toThrow(
      'không được âm',
    );
  });
});

function input(
  overrides: Partial<Parameters<typeof computeMarkup>[0]> = {},
): Parameters<typeof computeMarkup>[0] {
  return {
    airlineCode: 'VN',
    channel: 'B2C',
    cabin: 'Economy',
    paxType: 'ADT',
    domestic: true,
    tier: null,
    route: 'SGN-HAN',
    netPrice: 1000000,
    ...overrides,
  };
}

function rule(overrides: Partial<MarkupRule> = {}): MarkupRule {
  return {
    id: 'rule-id',
    name: 'Test rule',
    active: true,
    priority: 1,
    channelScope: 'B2C',
    airlineCode: null,
    routeFrom: null,
    routeTo: null,
    cabin: null,
    paxType: null,
    domestic: null,
    tierScope: [],
    type: MarkupType.FIXED,
    value: 0,
    maxAmount: null,
    minAmount: null,
    validFrom: null,
    validUntil: null,
    createdById: null,
    notes: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

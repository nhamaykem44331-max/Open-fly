import { MarkupRule, MembershipTier } from '@prisma/client';

export interface MarkupInput {
  airlineCode: string;
  channel: string;
  cabin: string | null;
  paxType: string | null;
  domestic: boolean | null;
  tier: MembershipTier | null;
  route: string | null;
  netPrice: number;
}

export interface MarkupResult {
  ruleId: string | null;
  ruleName: string | null;
  markupAmount: number;
  sellPrice: number;
}

export function computeMarkup(
  input: MarkupInput,
  rules: MarkupRule[],
  now = new Date(),
): MarkupResult {
  const matchedRule = sortRules(
    rules.filter((rule) => rule.active && matchesRule(rule, input, now)),
  )[0];

  if (!matchedRule) {
    return zeroMarkup(input.netPrice);
  }

  const markupAmount = computeMarkupAmount(matchedRule, input.netPrice);

  return {
    ruleId: matchedRule.id,
    ruleName: matchedRule.name,
    markupAmount,
    sellPrice: input.netPrice + markupAmount,
  };
}

export function sortRules(rules: MarkupRule[]): MarkupRule[] {
  return [...rules].sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }

    return left.createdAt.getTime() - right.createdAt.getTime();
  });
}

function matchesRule(rule: MarkupRule, input: MarkupInput, now: Date): boolean {
  const route = parseRoute(input.route);

  return (
    matchesNullableText(rule.channelScope, input.channel) &&
    matchesNullableText(rule.airlineCode, input.airlineCode) &&
    matchesNullableText(rule.cabin, input.cabin) &&
    matchesNullableText(rule.paxType, input.paxType) &&
    matchesNullableText(rule.routeFrom, route.from) &&
    matchesNullableText(rule.routeTo, route.to) &&
    matchesDomestic(rule.domestic, input.domestic) &&
    matchesTier(rule.tierScope, input.tier) &&
    matchesValidity(rule, now)
  );
}

function computeMarkupAmount(rule: MarkupRule, netPrice: number): number {
  if (rule.value < 0) {
    throw new Error(`Markup rule ${rule.id} không được âm`);
  }

  if (rule.type === 'FIXED') {
    return rule.value;
  }

  let amount = Math.round((netPrice * rule.value) / 10000);
  if (rule.maxAmount !== null && amount > rule.maxAmount) {
    amount = rule.maxAmount;
  }
  if (rule.minAmount !== null && amount < rule.minAmount) {
    amount = rule.minAmount;
  }

  return amount;
}

function matchesNullableText(
  ruleValue: string | null,
  inputValue: string | null,
): boolean {
  const normalizedRule = normalizeText(ruleValue);
  if (!normalizedRule) {
    return true;
  }

  return normalizedRule === normalizeText(inputValue);
}

function matchesDomestic(
  ruleValue: boolean | null,
  inputValue: boolean | null,
): boolean {
  if (ruleValue === null) {
    return true;
  }

  return inputValue === ruleValue;
}

function matchesTier(
  ruleValue: MembershipTier[],
  inputValue: MembershipTier | null,
): boolean {
  if (ruleValue.length === 0) {
    return true;
  }
  if (!inputValue) {
    return false;
  }

  return ruleValue.includes(inputValue);
}

function matchesValidity(rule: MarkupRule, now: Date): boolean {
  if (rule.validFrom && now < rule.validFrom) {
    return false;
  }
  if (rule.validUntil && now > rule.validUntil) {
    return false;
  }

  return true;
}

function parseRoute(route: string | null): {
  from: string | null;
  to: string | null;
} {
  const normalized = normalizeText(route);
  if (!normalized) {
    return { from: null, to: null };
  }

  const parts = normalized.split('-');
  if (parts.length !== 2 || parts.some((part) => part.length !== 3)) {
    return { from: null, to: null };
  }

  return {
    from: parts[0],
    to: parts[1],
  };
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

function zeroMarkup(netPrice: number): MarkupResult {
  return {
    ruleId: null,
    ruleName: null,
    markupAmount: 0,
    sellPrice: netPrice,
  };
}

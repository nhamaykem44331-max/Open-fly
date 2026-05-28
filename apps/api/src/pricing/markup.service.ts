import { Injectable, Logger } from '@nestjs/common';
import { MarkupRule, MembershipTier } from '@prisma/client';
import { FlightOfferDto } from '../flights/dto/flight-offer.dto';
import { PrismaService } from '../prisma/prisma.service';
import { computeMarkup, MarkupInput, MarkupResult } from './markup-engine';

interface RuleCache {
  expiresAt: number;
  rules: MarkupRule[];
}

export interface MarkupComputation extends MarkupResult {
  ruleSnapshot: MarkupRule | null;
}

export interface OfferMarkupContext {
  channel: string;
  tier: MembershipTier | null;
  paxType?: string;
}

@Injectable()
export class MarkupService {
  private readonly logger = new Logger(MarkupService.name);
  private readonly rulesCacheTtlMs = 60_000;
  private rulesCache: RuleCache | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async loadActiveRules(): Promise<MarkupRule[]> {
    const now = Date.now();
    if (this.rulesCache && this.rulesCache.expiresAt > now) {
      return this.rulesCache.rules;
    }

    try {
      const rules = await this.prisma.markupRule.findMany({
        where: {
          active: true,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
      this.rulesCache = {
        expiresAt: now + this.rulesCacheTtlMs,
        rules,
      };
      return rules;
    } catch (error) {
      this.logger.warn(
        `Markup rules unavailable, using net fares: ${safeError(error)}`,
      );
      this.rulesCache = {
        expiresAt: now + this.rulesCacheTtlMs,
        rules: [],
      };
      return [];
    }
  }

  async classifyDomestic(
    fromCode: string | null | undefined,
    toCode: string | null | undefined,
  ): Promise<boolean | null> {
    if (!fromCode || !toCode) {
      return null;
    }

    const codes = [fromCode, toCode].map((code) => code.trim().toUpperCase());
    try {
      const airports = await this.prisma.airport.findMany({
        where: {
          code: {
            in: Array.from(new Set(codes)),
          },
          active: true,
        },
        select: {
          code: true,
          country: true,
        },
      });
      const countryByCode = new Map(
        airports.map((airport) => [
          airport.code.toUpperCase(),
          airport.country,
        ]),
      );
      const fromCountry = countryByCode.get(codes[0]);
      const toCountry = countryByCode.get(codes[1]);
      if (!fromCountry || !toCountry) {
        return null;
      }

      return (
        fromCountry.toUpperCase() === 'VN' && toCountry.toUpperCase() === 'VN'
      );
    } catch (error) {
      this.logger.warn(
        `Domestic route classification skipped: ${safeError(error)}`,
      );
      return null;
    }
  }

  async computeForFareClass(input: MarkupInput): Promise<MarkupComputation> {
    const rules = await this.loadActiveRules();
    const result = computeMarkup(input, rules);
    const ruleSnapshot =
      result.ruleId === null
        ? null
        : (rules.find((rule) => rule.id === result.ruleId) ?? null);

    return {
      ...result,
      ruleSnapshot,
    };
  }

  async applyMarkupToOffers(
    offers: FlightOfferDto[],
    context: OfferMarkupContext,
  ): Promise<void> {
    try {
      const rules = await this.loadActiveRules();
      const domesticByRoute = await this.buildDomesticRouteIndex(offers);

      offers.forEach((offer) => {
        const route = getOfferRoute(offer);
        const domestic = route ? (domesticByRoute.get(route) ?? null) : null;

        offer.fareClasses.forEach((fareClass) => {
          const result = computeMarkup(
            {
              airlineCode: offer.airline.code,
              channel: context.channel,
              cabin: fareClass.name ?? fareClass.code,
              paxType: context.paxType ?? 'ADT',
              domestic,
              tier: context.tier,
              route,
              netPrice: fareClass.priceVnd,
            },
            rules,
          );
          fareClass.priceVnd = result.sellPrice;
        });

        offer.cheapestPriceVnd = getCheapestPrice(offer);
      });
    } catch (error) {
      this.logger.warn(
        `Markup apply skipped, using net fares: ${safeError(error)}`,
      );
    }
  }

  private async buildDomesticRouteIndex(
    offers: FlightOfferDto[],
  ): Promise<Map<string, boolean | null>> {
    const routes = Array.from(
      new Set(offers.map((offer) => getOfferRoute(offer)).filter(Boolean)),
    ) as string[];
    const entries = await Promise.all(
      routes.map(async (route) => {
        const [from, to] = route.split('-');
        const domestic = await this.classifyDomestic(from, to);
        return [route, domestic] as const;
      }),
    );

    return new Map(entries);
  }
}

function getOfferRoute(offer: FlightOfferDto): string | null {
  const firstSegment = offer.segments[0];
  const lastSegment = offer.segments[offer.segments.length - 1];
  if (!firstSegment || !lastSegment) {
    return null;
  }

  return `${firstSegment.from.code}-${lastSegment.to.code}`.toUpperCase();
}

function getCheapestPrice(offer: FlightOfferDto): number {
  const availablePrices = offer.fareClasses
    .filter((fareClass) => !fareClass.soldOut && fareClass.priceVnd > 0)
    .map((fareClass) => fareClass.priceVnd);
  if (availablePrices.length > 0) {
    return Math.min(...availablePrices);
  }

  const allPrices = offer.fareClasses
    .filter((fareClass) => fareClass.priceVnd > 0)
    .map((fareClass) => fareClass.priceVnd);

  return allPrices.length > 0 ? Math.min(...allPrices) : 0;
}

function safeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

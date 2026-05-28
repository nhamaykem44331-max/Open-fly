import { SearchParamsDto } from '../integrations/muadi/dto/search-params.dto';
import { MuadiRawFlight } from '../integrations/muadi/muadi-provider.interface';

export interface OfferSnapshot {
  rawFlight: MuadiRawFlight;
  muadiSessionId: number;
  currencyCode: string;
  searchParams: SearchParamsDto;
}

export function offerSnapshotKey(offerId: string): string {
  return `offer:${offerId}`;
}

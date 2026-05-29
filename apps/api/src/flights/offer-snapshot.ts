import { HoldOfferSnapshot } from '../integrations/muadi/muadi-provider.interface';

export type OfferSnapshot = HoldOfferSnapshot;

export function offerSnapshotKey(offerId: string): string {
  return `offer:${offerId}`;
}

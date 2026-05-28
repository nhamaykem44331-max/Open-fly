export class FlightOfferDto {
  id!: string;
  airline!: {
    code: string;
    name: string;
  };
  flightNumber!: string;
  segments!: FlightSegmentDto[];
  fareClasses!: FareClassDto[];
  cheapestPriceVnd!: number;
  durationMinutes!: number;
  isDirect!: boolean;
}

export class FlightSegmentDto {
  from!: {
    code: string;
    city?: string;
  };
  to!: {
    code: string;
    city?: string;
  };
  departTime!: string;
  arriveTime!: string;
  durationMinutes!: number;
  flightNumber!: string;
  aircraft?: string;
}

export class FareClassDto {
  code!: string;
  name!: string;
  baseFareVnd!: number;
  taxesFeesVnd!: number;
  priceVnd!: number;
  seatAvailable!: number;
  soldOut!: boolean;
  refundable?: boolean;
  baggage?: string;
  baggageKg?: number;
}

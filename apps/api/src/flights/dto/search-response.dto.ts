import { SearchParamsDto } from '../../integrations/muadi/dto/search-params.dto';
import { FlightOfferDto } from './flight-offer.dto';

export class SearchResponseDto {
  query!: SearchParamsDto;
  offers!: FlightOfferDto[];
  returnOffers?: FlightOfferDto[];
  airlinesQueried!: string[];
  airlinesFailed!: {
    airline: string;
    reason: string;
  }[];
  cached!: boolean;
  fetchedAt!: string;
}

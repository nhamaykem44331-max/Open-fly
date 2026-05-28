import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { SearchParamsDto } from '../integrations/muadi/dto/search-params.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { FlightsService } from './flights.service';

@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Public()
  @Post('search')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  search(@Body() dto: SearchParamsDto): Promise<SearchResponseDto> {
    return this.flightsService.search(dto);
  }
}

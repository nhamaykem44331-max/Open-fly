import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MuadiClientService } from './muadi-client.service';
import {
  IMuadiProvider,
  SearchParams,
  SearchResult,
} from './muadi-provider.interface';

const SEARCH_AIRLINES = ['VN', 'VJ', 'QH', 'BL', 'VU'];

@Injectable()
export class RealMuadiProvider implements IMuadiProvider {
  constructor(
    private readonly muadiClient: MuadiClientService,
    private readonly prisma: PrismaService,
  ) {}

  async search(params: SearchParams): Promise<SearchResult> {
    const session = await this.prisma.muadiSession.findFirst({
      where: {
        active: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });
    if (!session) {
      throw new Error('Muadi session chưa được cấu hình');
    }

    await this.muadiClient.ensureValidSession(session.id);
    await Promise.all(
      SEARCH_AIRLINES.map((airline) =>
        this.muadiClient.searchFlightByAirline(session.id, airline, {
          origin: params.origin,
          destination: params.destination,
          date: params.date,
          paxAdt: params.paxAdt,
          paxChd: params.paxChd,
          paxInf: params.paxInf,
        }),
      ),
    );

    return {
      provider: 'muadi',
      searchedAt: new Date().toISOString(),
      offers: [],
    };
  }
}

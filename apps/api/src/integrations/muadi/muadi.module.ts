import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MuadiClientService } from './muadi-client.service';
import { MuadiSessionPoolService } from './muadi-session-pool.service';
import { MUADI_PROVIDER } from './muadi-provider.interface';
import { MockMuadiProvider } from './mock-muadi.provider';
import { RealMuadiProvider } from './real-muadi.provider';

@Module({
  providers: [
    MuadiClientService,
    MuadiSessionPoolService,
    MockMuadiProvider,
    RealMuadiProvider,
    {
      provide: MUADI_PROVIDER,
      inject: [ConfigService, MockMuadiProvider, RealMuadiProvider],
      useFactory: (
        config: ConfigService,
        mockProvider: MockMuadiProvider,
        realProvider: RealMuadiProvider,
      ) => {
        const useMock = config.get<string>('MUADI_USE_MOCK') ?? 'true';
        return useMock === 'false' ? realProvider : mockProvider;
      },
    },
  ],
  exports: [MUADI_PROVIDER, MuadiClientService, MuadiSessionPoolService],
})
export class MuadiModule {}

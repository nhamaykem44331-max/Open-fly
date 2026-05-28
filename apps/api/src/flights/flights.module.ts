import { Module } from '@nestjs/common';
import { MuadiModule } from '../integrations/muadi/muadi.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';

@Module({
  imports: [MuadiModule, PrismaModule],
  controllers: [FlightsController],
  providers: [FlightsService],
})
export class FlightsModule {}

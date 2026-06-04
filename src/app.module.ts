import { Module } from '@nestjs/common';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { EventApplicationModule } from './application/event/event-application.module';

@Module({
  imports: [InfrastructureModule, EventApplicationModule],
})
export class AppModule {}
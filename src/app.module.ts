import { Module } from '@nestjs/common';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { EventApplicationModule } from './application/event/event-application.module';
import { BookingApplicationModule } from './application/booking/booking-application.module';

@Module({
  imports: [InfrastructureModule, EventApplicationModule, BookingApplicationModule],
})
export class AppModule {}
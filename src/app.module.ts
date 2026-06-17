import { Module } from '@nestjs/common';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { EventApplicationModule } from './application/event/event-application.module';
import { BookingApplicationModule } from './application/booking/booking-application.module';
import { TicketApplicationModule } from './application/ticket/ticket-application.module';
import { RefundApplicationModule } from './application/refund/refund-application.module';

@Module({
  imports: [InfrastructureModule, EventApplicationModule, BookingApplicationModule, TicketApplicationModule, RefundApplicationModule,],
})
export class AppModule {}

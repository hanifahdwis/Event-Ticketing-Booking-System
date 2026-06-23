import { Module } from '@nestjs/common';
import { EventApplicationModule } from '../application/event/event-application.module';
import { BookingApplicationModule } from '../application/booking/booking-application.module';
import { TicketApplicationModule } from '../application/ticket/ticket-application.module';
import { RefundApplicationModule } from '../application/refund/refund-application.module';
import { EventController } from './controllers/event.controller';
import { BookingController } from './controllers/booking.controller';
import { TicketController } from './controllers/ticket.controller';
import { RefundController } from './controllers/refund.controller';

@Module({
  imports: [
    EventApplicationModule,
    BookingApplicationModule,
    TicketApplicationModule,
    RefundApplicationModule,
  ],
  controllers: [
    EventController,
    BookingController,
    TicketController,
    RefundController,
  ],
})
export class PresentationModule {}


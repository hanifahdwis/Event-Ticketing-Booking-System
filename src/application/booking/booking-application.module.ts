import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { CreateBookingCommandHandler } from './commands/create-booking.handler';
import { PayBookingCommandHandler } from './commands/pay-booking.handler';
import { ExpireBookingCommandHandler } from './commands/expire-booking.handler';
import { ExpireOverdueBookingsCommandHandler } from './commands/expire-overdue-bookings.handler';
import { GetPurchasedTicketsQueryHandler } from './queries/get-purchased-tickets.handler';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CreateBookingCommandHandler,
    PayBookingCommandHandler,
    ExpireBookingCommandHandler,
    ExpireOverdueBookingsCommandHandler,
    GetPurchasedTicketsQueryHandler,
  ],
  exports: [
    CreateBookingCommandHandler,
    PayBookingCommandHandler,
    ExpireBookingCommandHandler,
    ExpireOverdueBookingsCommandHandler,
    GetPurchasedTicketsQueryHandler,
  ],
})
export class BookingApplicationModule {}


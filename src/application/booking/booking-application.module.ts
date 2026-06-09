import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';

import { CreateBookingCommandHandler } from './commands/create-booking.handler';
import { PayBookingCommandHandler } from './commands/pay-booking.handler';
import { ExpireBookingCommandHandler } from './commands/expire-booking.handler';
import { GetPurchasedTicketsQueryHandler } from './queries/get-purchased-tickets.handler';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CreateBookingCommandHandler,
    PayBookingCommandHandler,
    ExpireBookingCommandHandler,
    GetPurchasedTicketsQueryHandler,
  ],
  exports: [
    CreateBookingCommandHandler,
    PayBookingCommandHandler,
    ExpireBookingCommandHandler,
    GetPurchasedTicketsQueryHandler,
  ],
})
export class BookingApplicationModule {}
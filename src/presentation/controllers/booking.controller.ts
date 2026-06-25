import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { CreateBookingCommandHandler } from '../../application/booking/commands/create-booking.handler';
import { PayBookingCommandHandler } from '../../application/booking/commands/pay-booking.handler';
import { ExpireBookingCommandHandler } from '../../application/booking/commands/expire-booking.handler';
import { ExpireOverdueBookingsCommandHandler } from '../../application/booking/commands/expire-overdue-bookings.handler';
import { GetPurchasedTicketsQueryHandler } from '../../application/booking/queries/get-purchased-tickets.handler';
import { GetAllPurchasedTicketsQueryHandler } from '../../application/booking/queries/get-all-purchased-tickets.handler';

import { CreateBookingCommand } from '../../application/booking/commands/create-booking.command';
import { PayBookingCommand } from '../../application/booking/commands/pay-booking.command';
import { ExpireBookingCommand } from '../../application/booking/commands/expire-booking.command';
import { ExpireOverdueBookingsCommand } from '../../application/booking/commands/expire-overdue-bookings.command';
import { GetPurchasedTicketsQuery } from '../../application/booking/queries/get-purchased-tickets.query';
import { GetAllPurchasedTicketsQuery } from '../../application/booking/queries/get-all-purchased-tickets.query';

class CreateBookingRequestBody {
  customerId: string;
  customerName: string;
  eventId: string;
  ticketCategoryId: string;
  quantity: number;
}

class PayBookingRequestBody {
  customerId: string;
  paymentAmount: number;
  currency: string;
}


@Controller('bookings')
export class BookingController {
  constructor(
    private readonly createBookingHandler: CreateBookingCommandHandler,
    private readonly payBookingHandler: PayBookingCommandHandler,
    private readonly expireBookingHandler: ExpireBookingCommandHandler,
    private readonly expireOverdueBookingsHandler: ExpireOverdueBookingsCommandHandler,
    private readonly getPurchasedTicketsHandler: GetPurchasedTicketsQueryHandler,
    private readonly getAllPurchasedTicketsHandler: GetAllPurchasedTicketsQueryHandler,
  ) {}

  
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBooking(@Body() body: CreateBookingRequestBody) {
    const command = new CreateBookingCommand(
      body.customerId,
      body.customerName,
      body.eventId,
      body.ticketCategoryId,
      body.quantity,
    );
    return this.createBookingHandler.execute(command);
  }


  @Patch(':bookingId/pay')
  async payBooking(
    @Param('bookingId') bookingId: string,
    @Body() body: PayBookingRequestBody,
  ) {
    const command = new PayBookingCommand(
      bookingId,
      body.customerId,
      body.paymentAmount,
      body.currency,
    );
    return this.payBookingHandler.execute(command);
  }


  @Patch(':bookingId/expire')
  async expireBooking(@Param('bookingId') bookingId: string) {
    const command = new ExpireBookingCommand(bookingId);
    return this.expireBookingHandler.execute(command);
  }

  @Post('expire-overdue')
  @HttpCode(HttpStatus.OK)
  async expireOverdueBookings() {
    const command = new ExpireOverdueBookingsCommand(new Date());
    return this.expireOverdueBookingsHandler.execute(command);
  }

  @Get('my-tickets')
  async getAllPurchasedTickets(@Query('customerId') customerId: string) {
    const query = new GetAllPurchasedTicketsQuery(customerId);
    return this.getAllPurchasedTicketsHandler.execute(query);
  }

  @Get(':bookingId/tickets')
  async getPurchasedTickets(
    @Param('bookingId') bookingId: string,
    @Query('customerId') customerId: string,
  ) {
    const query = new GetPurchasedTicketsQuery(customerId, bookingId);
    return this.getPurchasedTicketsHandler.execute(query);
  }
}

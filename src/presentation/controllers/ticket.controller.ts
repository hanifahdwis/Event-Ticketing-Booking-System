import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { CheckInTicketCommandHandler } from '../../application/ticket/commands/check-in-ticket.handler';
import { CheckInTicketCommand } from '../../application/ticket/commands/check-in-ticket.command';
class CheckInTicketRequestBody {
  ticketCode: string;
  eventId: string;
}


@Controller('tickets')
export class TicketController {
  constructor(
    private readonly checkInTicketHandler: CheckInTicketCommandHandler,
  ) {}
  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  async checkIn(@Body() body: CheckInTicketRequestBody) {
    const command = new CheckInTicketCommand(body.ticketCode, body.eventId);
    return this.checkInTicketHandler.execute(command);
  }
}

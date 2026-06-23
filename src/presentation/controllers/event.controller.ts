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

import { CreateEventCommandHandler } from '../../application/event/commands/create-event.handler';
import { PublishEventCommandHandler } from '../../application/event/commands/publish-event.handler';
import { CancelEventCommandHandler } from '../../application/event/commands/cancel-event.handler';
import { AddTicketCategoryCommandHandler } from '../../application/event/commands/add-ticket-category.handler';
import { DisableTicketCategoryCommandHandler } from '../../application/event/commands/disable-ticket-category.handler';
import { GetAvailableEventsQueryHandler } from '../../application/event/queries/get-available-events.handler';
import { GetEventByIdQueryHandler } from '../../application/event/queries/get-event-by-id.handler';
import { GetEventSalesReportQueryHandler } from '../../application/event/queries/get-event-sales-report.handler';
import { GetEventParticipantsQueryHandler } from '../../application/event/queries/get-event-participants.handler';

import { CreateEventCommand } from '../../application/event/commands/create-event.command';
import { PublishEventCommand } from '../../application/event/commands/publish-event.command';
import { CancelEventCommand } from '../../application/event/commands/cancel-event.command';
import { AddTicketCategoryCommand } from '../../application/event/commands/add-ticket-category.command';
import { DisableTicketCategoryCommand } from '../../application/event/commands/disable-ticket-category.command';
import { GetAvailableEventsQuery } from '../../application/event/queries/get-available-events.query';
import { GetEventByIdQuery } from '../../application/event/queries/get-event-by-id.query';
import { GetEventSalesReportQuery } from '../../application/event/queries/get-event-sales-report.query';
import { GetEventParticipantsQuery } from '../../application/event/queries/get-event-participants.query';

class CreateEventRequestBody {
  organizerId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  address: string;
  city: string;
  maxCapacity: number;
}

class PublishEventRequestBody {
  organizerId: string;
}

class CancelEventRequestBody {
  organizerId: string;
}

class AddTicketCategoryRequestBody {
  organizerId: string;
  name: string;
  price: number;
  currency?: string;
  quota: number;
  salesStartDate: Date;
  salesEndDate: Date;
}

class DisableTicketCategoryRequestBody {
  organizerId: string;
}


@Controller('events')
export class EventController {
  constructor(
    private readonly createEventHandler: CreateEventCommandHandler,
    private readonly publishEventHandler: PublishEventCommandHandler,
    private readonly cancelEventHandler: CancelEventCommandHandler,
    private readonly addTicketCategoryHandler: AddTicketCategoryCommandHandler,
    private readonly disableTicketCategoryHandler: DisableTicketCategoryCommandHandler,
    private readonly getAvailableEventsHandler: GetAvailableEventsQueryHandler,
    private readonly getEventByIdHandler: GetEventByIdQueryHandler,
    private readonly getEventSalesReportHandler: GetEventSalesReportQueryHandler,
    private readonly getEventParticipantsHandler: GetEventParticipantsQueryHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEvent(@Body() body: CreateEventRequestBody) {
    const command = new CreateEventCommand(
      body.organizerId,
      body.name,
      body.description,
      new Date(body.startDate),
      new Date(body.endDate),
      body.address,
      body.city,
      body.maxCapacity,
    );
    return this.createEventHandler.execute(command);
  }

  @Get()
  async getAvailableEvents(
    @Query('filterByDate') filterByDate?: string,
    @Query('filterByCity') filterByCity?: string,
  ) {
    const query = new GetAvailableEventsQuery(
      filterByDate ? new Date(filterByDate) : undefined,
      filterByCity,
    );
    return this.getAvailableEventsHandler.execute(query);
  }

  @Get(':eventId')
  async getEventById(@Param('eventId') eventId: string) {
    const query = new GetEventByIdQuery(eventId);
    return this.getEventByIdHandler.execute(query);
  }

  @Patch(':eventId/publish')
  async publishEvent(
    @Param('eventId') eventId: string,
    @Body() body: PublishEventRequestBody,
  ) {
    const command = new PublishEventCommand(eventId, body.organizerId);
    return this.publishEventHandler.execute(command);
  }

  @Patch(':eventId/cancel')
  async cancelEvent(
    @Param('eventId') eventId: string,
    @Body() body: CancelEventRequestBody,
  ) {
    const command = new CancelEventCommand(eventId, body.organizerId);
    return this.cancelEventHandler.execute(command);
  }

  @Post(':eventId/ticket-categories')
  @HttpCode(HttpStatus.CREATED)
  async addTicketCategory(
    @Param('eventId') eventId: string,
    @Body() body: AddTicketCategoryRequestBody,
  ) {
    const command = new AddTicketCategoryCommand(
      eventId,
      body.organizerId,
      body.name,
      body.price,
      body.quota,
      new Date(body.salesStartDate),
      new Date(body.salesEndDate),
      body.currency ?? 'IDR',
    );
    return this.addTicketCategoryHandler.execute(command);
  }

  @Patch(':eventId/ticket-categories/:ticketCategoryId/disable')
  async disableTicketCategory(
    @Param('eventId') eventId: string,
    @Param('ticketCategoryId') ticketCategoryId: string,
    @Body() body: DisableTicketCategoryRequestBody,
  ) {
    const command = new DisableTicketCategoryCommand(
      eventId,
      ticketCategoryId,
      body.organizerId,
    );
    return this.disableTicketCategoryHandler.execute(command);
  }

  @Get(':eventId/sales-report')
  async getEventSalesReport(
    @Param('eventId') eventId: string,
    @Query('organizerId') organizerId: string,
  ) {
    const query = new GetEventSalesReportQuery(eventId, organizerId);
    return this.getEventSalesReportHandler.execute(query);
  }

  @Get(':eventId/participants')
  async getEventParticipants(
    @Param('eventId') eventId: string,
    @Query('organizerId') organizerId: string,
  ) {
    const query = new GetEventParticipantsQuery(eventId, organizerId);
    return this.getEventParticipantsHandler.execute(query);
  }
}
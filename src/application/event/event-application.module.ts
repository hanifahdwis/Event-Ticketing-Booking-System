import { Module } from '@nestjs/common';
import { CreateEventCommandHandler } from './commands/create-event.handler';
import { PublishEventCommandHandler } from './commands/publish-event.handler';
import { AddTicketCategoryCommandHandler } from './commands/add-ticket-category.handler';
import { GetEventByIdQueryHandler } from './queries/get-event-by-id.handler';
import { GetAvailableEventsQueryHandler } from './queries/get-available-events.handler';
import { CancelEventCommandHandler } from './commands/cancel-event.handler';
import { DisableTicketCategoryCommandHandler } from './commands/disable-ticket-category.handler';
import { GetEventSalesReportQueryHandler } from './queries/get-event-sales-report.handler';
import { GetEventParticipantsQueryHandler } from './queries/get-event-participants.handler';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CreateEventCommandHandler,
    PublishEventCommandHandler,
    AddTicketCategoryCommandHandler,
    CancelEventCommandHandler,
    DisableTicketCategoryCommandHandler,
    GetEventByIdQueryHandler,
    GetAvailableEventsQueryHandler,
    GetEventSalesReportQueryHandler,
    GetEventParticipantsQueryHandler,
  ],
  exports: [
    CreateEventCommandHandler,
    PublishEventCommandHandler,
    AddTicketCategoryCommandHandler,
    CancelEventCommandHandler,
    DisableTicketCategoryCommandHandler,
    GetEventByIdQueryHandler,
    GetAvailableEventsQueryHandler,
    GetEventSalesReportQueryHandler,
    GetEventParticipantsQueryHandler,
  ],
})
export class EventApplicationModule {}


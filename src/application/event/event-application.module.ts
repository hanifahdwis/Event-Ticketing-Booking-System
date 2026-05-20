import { Module } from '@nestjs/common';
import { CreateEventCommandHandler } from './commands/create-event.handler';
import { PublishEventCommandHandler } from './commands/publish-event.handler';
import { AddTicketCategoryCommandHandler } from './commands/add-ticket-category.handler';
import { GetEventByIdQueryHandler } from './queries/get-event-by-id.handler';
import { GetAvailableEventsQueryHandler } from './queries/get-available-events.handler';

@Module({
  providers: [
    CreateEventCommandHandler,
    PublishEventCommandHandler,
    AddTicketCategoryCommandHandler,
    GetEventByIdQueryHandler,
    GetAvailableEventsQueryHandler,
  ],
  exports: [
    CreateEventCommandHandler,
    PublishEventCommandHandler,
    AddTicketCategoryCommandHandler,
    GetEventByIdQueryHandler,
    GetAvailableEventsQueryHandler,
  ],
})
export class EventApplicationModule {}
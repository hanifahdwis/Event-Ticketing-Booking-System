import { Injectable, Inject } from '@nestjs/common';
import { CreateEventCommand } from './create-event.command';
import { CreateEventResponseDto } from '../dtos/create-event.dto';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import { Event } from '../../../domain/event/aggregates/event.aggregate';
import {
  INotificationService,
  NOTIFICATION_SERVICE,
} from '../../common/interfaces/notification-service.interface';

@Injectable()
export class CreateEventCommandHandler {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,

    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}

  async execute(command: CreateEventCommand): Promise<CreateEventResponseDto> {
    const event = Event.create({
      organizerId: command.organizerId,
      name: command.name,
      description: command.description,
      schedule: {
        startDate: command.startDate,
        endDate: command.endDate,
      },
      location: {
        address: command.address,
        city: command.city,
      },
      maxCapacity: command.maxCapacity,
    });

    await this.eventRepository.save(event);

    await this.notificationService.sendEventCreatedNotification(
      command.organizerId,
      event.id.value,
      event.name.value,
    );

    const dto = new CreateEventResponseDto();
    dto.id = event.id.value;
    dto.organizerId = event.organizerId;
    dto.name = event.name.value;
    dto.description = event.description;
    dto.startDate = event.schedule.startDate;
    dto.endDate = event.schedule.endDate;
    dto.address = event.location.address;
    dto.city = event.location.city;
    dto.maxCapacity = event.maxCapacity.value;
    dto.status = event.status.value;

    return dto;
  }
}
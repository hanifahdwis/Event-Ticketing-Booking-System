import { Module } from '@nestjs/common';
import { Pool } from 'pg';

import { EVENT_REPOSITORY } from '../domain/event/repositories/event.repository.interface';
import { NOTIFICATION_SERVICE } from '../application/common/interfaces/notification-service.interface';

import { EventRepository, DB_POOL } from './event/repositories/event.repository';
import { NotificationService } from './services/notification.service';
import { databaseConfig } from './database/database.config';

const dbPoolProvider = {
  provide: DB_POOL,
  useFactory: () => new Pool(databaseConfig),
};

const eventRepositoryProvider = {
  provide: EVENT_REPOSITORY,
  useClass: EventRepository,
};

const notificationServiceProvider = {
  provide: NOTIFICATION_SERVICE,
  useClass: NotificationService,
};

@Module({
  providers: [
    dbPoolProvider,
    eventRepositoryProvider,
    notificationServiceProvider,
  ],
  exports: [
    DB_POOL,
    EVENT_REPOSITORY,
    NOTIFICATION_SERVICE,
  ],
})
export class InfrastructureModule {}
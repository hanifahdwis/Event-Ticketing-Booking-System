import { Module } from '@nestjs/common';
import { Pool } from 'pg';

import { EVENT_REPOSITORY } from '../domain/event/repositories/event.repository.interface';
import { BOOKING_REPOSITORY } from '../domain/booking/repositories/booking.repository.interface';
import { TICKET_REPOSITORY } from '../domain/ticket/repositories/ticket.repository.interface';
import { REFUND_REPOSITORY } from '../domain/refund/repositories/refund.repository.interface';
import { NOTIFICATION_SERVICE } from '../application/common/interfaces/notification-service.interface';
import { PAYMENT_GATEWAY } from '../application/common/interfaces/payment-gateway.interface';
import { REFUND_PAYMENT_SERVICE } from '../application/common/interfaces/refund-payment-service.interface';

import { EventRepository, DB_POOL } from './event/repositories/event.repository';
import { BookingRepository } from './booking/repositories/booking.repository';
import { TicketRepository } from './ticket/repositories/ticket.repository';
import { NotificationService } from './services/notification.service';
import { databaseConfig } from './database/database.config';
import { RefundRepository } from './refund/repositories/refund.repository';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { RefundPaymentService } from './services/refund-payment.service';

const dbPoolProvider = {
  provide: DB_POOL,
  useFactory: () => new Pool(databaseConfig),
};

const eventRepositoryProvider = {
  provide: EVENT_REPOSITORY,
  useClass: EventRepository,
};

const bookingRepositoryProvider = {
  provide: BOOKING_REPOSITORY,
  useClass: BookingRepository,
};

const ticketRepositoryProvider = {
  provide: TICKET_REPOSITORY,
  useClass: TicketRepository,
};

const refundRepositoryProvider = {
  provide: REFUND_REPOSITORY,
  useClass: RefundRepository,
};

const notificationServiceProvider = {
  provide: NOTIFICATION_SERVICE,
  useClass: NotificationService,
};

const paymentGatewayProvider = {
  provide: PAYMENT_GATEWAY,
  useClass: PaymentGatewayService,
};

const refundPaymentServiceProvider = {
  provide: REFUND_PAYMENT_SERVICE,
  useClass: RefundPaymentService,
};

@Module({
  providers: [
    dbPoolProvider,
    eventRepositoryProvider,
    bookingRepositoryProvider,
    ticketRepositoryProvider,
    refundRepositoryProvider,
    notificationServiceProvider,
    paymentGatewayProvider,
    refundPaymentServiceProvider,
  ],
  exports: [
    DB_POOL,
    EVENT_REPOSITORY,
    BOOKING_REPOSITORY,
    TICKET_REPOSITORY,
    REFUND_REPOSITORY,
    NOTIFICATION_SERVICE,
    PAYMENT_GATEWAY,
    REFUND_PAYMENT_SERVICE,
  ],
})
export class InfrastructureModule {}
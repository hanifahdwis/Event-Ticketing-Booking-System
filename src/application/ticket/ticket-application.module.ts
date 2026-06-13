import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { CheckInTicketCommandHandler } from './commands/check-in-ticket.handler';

@Module({
  imports: [InfrastructureModule],
  providers: [CheckInTicketCommandHandler],
  exports: [CheckInTicketCommandHandler],
})
export class TicketApplicationModule {}

import { TicketCode } from '../value-objects/ticket-code.vo';

export class TicketCodeGeneratorDomainService {
  generate(): TicketCode {
    return new TicketCode(); 
  }

  generateMany(count: number): TicketCode[] {
    if (count <= 0) {
      throw new Error('Count must be greater than zero');
    }
    return Array.from({ length: count }, () => this.generate());
  }
}
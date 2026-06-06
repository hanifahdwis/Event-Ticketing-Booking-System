import { TicketCode } from '../value-objects/ticket-code.vo';

/**
 * Domain service responsible for generating unique ticket codes.
 * Kept separate so alternate generation strategies (e.g. sequential,
 * QR-payload-based) can be swapped without touching the aggregate.
 */
export class TicketCodeGeneratorDomainService {
  generate(): TicketCode {
    return new TicketCode(); // delegates to TicketCode's built-in UUID-based generator
  }

  generateMany(count: number): TicketCode[] {
    if (count <= 0) {
      throw new Error('Count must be greater than zero');
    }
    return Array.from({ length: count }, () => this.generate());
  }
}
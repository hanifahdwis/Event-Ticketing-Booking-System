export class PayBookingCommand {
  constructor(
    public readonly bookingId: string,
    public readonly customerId: string,    
    public readonly paymentAmount: number,
    public readonly currency: string,
  ) {}
}
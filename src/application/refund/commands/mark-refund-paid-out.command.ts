export class MarkRefundPaidOutCommand {
  constructor(
    public readonly refundId: string,
    public readonly adminId: string,
  ) {}
}


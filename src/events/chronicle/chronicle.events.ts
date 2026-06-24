export class ChronicleSubmittedEvent {
  constructor(public readonly chronicleId: string) {}
}

export class ChronicleApprovedEvent {
  constructor(public readonly chronicleId: string) {}
}

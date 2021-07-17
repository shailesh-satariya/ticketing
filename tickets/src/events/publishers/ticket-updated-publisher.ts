import {Publisher, Subjects, TicketUpdatedEvent} from "@shstickets/common";

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
    subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}
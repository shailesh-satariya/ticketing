import {Listener, OrderCancelledEvent, Subjects} from "@shstickets/common";
import {Message} from "node-nats-streaming";
import {queueGroupName} from "./queue-group-name";
import {Ticket} from "../../models/ticket";
import {TicketUpdatedPublisher} from "../publishers/ticket-updated-publisher";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
    subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
    queueGroupName: string = queueGroupName;

    async onMessage(data: OrderCancelledEvent["data"], msg: Message) {
// Find the ticket that the order is reserving
        const ticket = await Ticket.findById(data.ticket.id);

        // If no ticket, throw error
        if (!ticket) {
            throw new Error("Ticket not found");
        }

        // Mark the ticket as being reserved by setting its orderId property
        ticket.set({orderId: undefined});

        // Save the ticket
        await ticket.save();

        // Publish an event
        const publisher = new TicketUpdatedPublisher(this.client);
        await publisher.publish({
            id: ticket.id,
            version: ticket.version,
            title: ticket.title,
            price: ticket.price,
            userId: ticket.userId,
            orderId: ticket.orderId
        });

        // Acknowledge
        msg.ack();
    };

}
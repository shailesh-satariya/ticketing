import {Listener, OrderCreatedEvent, Subjects} from "@shstickets/common";
import {Message} from "node-nats-streaming";
import {queueGroupName} from "./queue-group-name";
import {Order} from "../../models/order";


export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
    queueGroupName: string = queueGroupName;

    async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
        // Find the ticket that the order is reserving
        const {id, status, userId, version, ticket} = data;
        const order = await Order.build({
            id, status, userId, version, price: ticket.price
        });
        await order.save();

        // Acknowledge
        msg.ack();
    };

}
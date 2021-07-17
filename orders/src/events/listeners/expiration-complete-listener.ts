import {ExpirationCompleteEvent, Listener, OrderStatus, Subjects} from "@shstickets/common";
import {Message} from "node-nats-streaming";
import {queueGroupName} from "./queue-group-name";
import {Order} from "../../models/order";
import {OrderCancelledPublisher} from "../publishers/order-cancelled-publisher";

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
    subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
    queueGroupName: string = queueGroupName;

    async onMessage(data: ExpirationCompleteEvent["data"], msg: Message) {
        const {orderId} = data;
        const order = await Order.findById(orderId).populate("ticket");

        if (!order) {
            throw new Error("Order not found.");
        }
        if (order.status === OrderStatus.Complete) {
            return msg.ack();
        }

        order.set({status: OrderStatus.Cancelled});
        await order.save();

        await new OrderCancelledPublisher(this.client).publish({
            id: orderId,
            version: order.version,
            ticket: {
                id: order.ticket.id
            }
        });

        msg.ack();
    };

}
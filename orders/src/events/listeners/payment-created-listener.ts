import {Listener, PaymentCreatedEvent, Subjects} from "@shstickets/common";
import {Message} from "node-nats-streaming";
import {queueGroupName} from "./queue-group-name";
import {Order, OrderStatus} from "../../models/order";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
    subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
    queueGroupName: string = queueGroupName;

    async onMessage(data: PaymentCreatedEvent["data"], msg: Message) {
        const {orderId} = data;
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error("Order not found.");
        }

        order.set({status: OrderStatus.Complete});
        await order.save();

        msg.ack();
    };

}
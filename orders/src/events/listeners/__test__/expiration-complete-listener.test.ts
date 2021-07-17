import mongoose from "mongoose";
import {natsWrapper} from "../../../nats-wrapper";
import {Message} from "node-nats-streaming";
import {Ticket} from "../../../models/ticket";
import {ExpirationCompleteListener} from "../expiration-complete-listener";
import {ExpirationCompleteEvent} from "@shstickets/common";
import {Order, OrderStatus} from "../../../models/order";

const setup = async () => {
    // create an instance of the listener
    const listener = new ExpirationCompleteListener(natsWrapper.client);

    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: "Concert",
        price: 20
    });
    await ticket.save();
    const order = Order.build({
        status: OrderStatus.Created,
        userId: "1234",
        expiresAt: new Date(),
        ticket
    });
    await order.save();

    // create a fake data event
    const data: ExpirationCompleteEvent["data"] = {
        orderId: order.id
    };

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg, order, ticket};
};

it("updates the order status to cancel", async () => {
    const {listener, data, msg, order, ticket} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure a ticket was created!
    const updatedOrder = await Order.findById(order.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});


it("emits an OrderCancelled event", async () => {
    const {listener, data, msg, order, ticket} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure ack function is called
    expect(natsWrapper.client.publish).toHaveBeenCalled();
    const eventData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);
    expect(eventData.id).toEqual(order.id);
});

it("acks the message", async () => {
    const {listener, data, msg, order, ticket} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure ack function is called
    expect(msg.ack).toHaveBeenCalled();
});
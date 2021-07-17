import mongoose from "mongoose";
import {natsWrapper} from "../../../nats-wrapper";
import {OrderCancelledEvent, OrderStatus} from "@shstickets/common";
import {Message} from "node-nats-streaming";
import {OrderCancelledListener} from "../order-cancelled-listener";
import {Order} from "../../../models/order";

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCancelledListener(natsWrapper.client);

    // Create and save the ticket
    const orderId = new mongoose.Types.ObjectId().toHexString();
    const order = Order.build({
        id: orderId,
        price: 99,
        version: 0,
        status: OrderStatus.Created,
        userId: new mongoose.Types.ObjectId().toHexString()

    });
    await order.save();

    // create a fake data event
    const data: OrderCancelledEvent["data"] = {
        version: 1,
        id: orderId,
        ticket: {
            id: new mongoose.Types.ObjectId().toHexString()
        }
    };

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg, order};
};

it("updates the status of the order", async () => {
    const {listener, data, msg} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure a ticket was created!
    const updatedOrder = await Order.findById(data.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it("acks the message", async () => {
    const {listener, data, msg} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure ack function is called
    expect(msg.ack).toHaveBeenCalled();
});
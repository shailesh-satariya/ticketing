import mongoose from "mongoose";
import {OrderCreatedListener} from "../order-created-listener";
import {natsWrapper} from "../../../nats-wrapper";
import {OrderCreatedEvent, OrderStatus} from "@shstickets/common";
import {Message} from "node-nats-streaming";
import {Order} from "../../../models/order";

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCreatedListener(natsWrapper.client);

    // create a fake data event
    const data: OrderCreatedEvent["data"] = {
        version: 0,
        id: new mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        userId: new mongoose.Types.ObjectId().toHexString(),
        expiresAt: new Date().toISOString(),
        ticket: {
            id: new mongoose.Types.ObjectId().toHexString(),
            price: 10
        }
    };

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg};
};

it("replicates the order info", async () => {
    const {listener, data, msg} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure a ticket was created!
    const order = await Order.findById(data.id);

    expect(order!.price).toEqual(data.ticket.price);
});

it("acks the message", async () => {
    const {listener, data, msg} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure ack function is called
    expect(msg.ack).toHaveBeenCalled();
});
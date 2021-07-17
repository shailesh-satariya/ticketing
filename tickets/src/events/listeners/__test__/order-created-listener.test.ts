import mongoose from "mongoose";
import {OrderCreatedListener} from "../order-created-listener";
import {natsWrapper} from "../../../nats-wrapper";
import {OrderCreatedEvent, OrderStatus} from "@shstickets/common";
import {Message} from "node-nats-streaming";
import {Ticket} from "../../../models/ticket";

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCreatedListener(natsWrapper.client);

    // Create and save the ticket
    const ticket = Ticket.build({
        title: "Concert",
        price: 99,
        userId: new mongoose.Types.ObjectId().toHexString()
    });
    await ticket.save();

    // create a fake data event
    const data: OrderCreatedEvent["data"] = {
        version: 0,
        id: new mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        userId: new mongoose.Types.ObjectId().toHexString(),
        expiresAt: new Date().toISOString(),
        ticket: {
            id: ticket.id,
            price: ticket.price
        }
    };

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg, ticket};
};

it("sets the orderId of the ticket", async () => {
    const {listener, data, msg} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure a ticket was created!
    const updatedTicket = await Ticket.findById(data.ticket.id);

    expect(updatedTicket!.orderId).toEqual(data.id);
});

it("acks the message", async () => {
    const {listener, data, msg} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure ack function is called
    expect(msg.ack).toHaveBeenCalled();
});

it("it published a ticket updated event", async () => {
    const {listener, data, msg} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure ack function is called
    expect(natsWrapper.client.publish).toHaveBeenCalled();

    const ticketUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);
    expect(ticketUpdatedData.orderId).toEqual(data.id);
});
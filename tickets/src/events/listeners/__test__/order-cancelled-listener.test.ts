import mongoose from "mongoose";
import {natsWrapper} from "../../../nats-wrapper";
import {OrderCancelledEvent} from "@shstickets/common";
import {Message} from "node-nats-streaming";
import {Ticket} from "../../../models/ticket";
import {OrderCancelledListener} from "../order-cancelled-listener";

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCancelledListener(natsWrapper.client);

    // Create and save the ticket
    const orderId = new mongoose.Types.ObjectId().toHexString();
    const ticket = Ticket.build({
        title: "Concert",
        price: 99,
        userId: new mongoose.Types.ObjectId().toHexString()
    });
    ticket.set({orderId});
    await ticket.save();

    // create a fake data event
    const data: OrderCancelledEvent["data"] = {
        version: 0,
        id: orderId,
        ticket: {
            id: ticket.id
        }
    };

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg, ticket};
};

it("updates the ticket, publishes an event and ack the message", async () => {
    const {listener, data, msg} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure a ticket was created!
    const updatedTicket = await Ticket.findById(data.ticket.id);

    expect(updatedTicket!.orderId).toEqual(undefined);

    expect(msg.ack).toHaveBeenCalled();
});

it("acks the message", async () => {
    const {listener, data, msg} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure ack function is called
    expect(msg.ack).toHaveBeenCalled();

    // write assertion to make sure ack function is called
    expect(natsWrapper.client.publish).toHaveBeenCalled();
});
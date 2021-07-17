import mongoose from "mongoose";
import {natsWrapper} from "../../../nats-wrapper";
import {TicketUpdatedEvent} from "@shstickets/common";
import {Message} from "node-nats-streaming";
import {Ticket} from "../../../models/ticket";
import {TicketUpdatedListener} from "../ticket-updated-listener";

const setup = async () => {
    // create an instance of the listener
    const listener = new TicketUpdatedListener(natsWrapper.client);

    // Create and save a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: "Concert",
        price: 10
    });
    await ticket.save();

    // create a fake data event
    const data: TicketUpdatedEvent["data"] = {
        version: 1,
        id: ticket.id,
        title: "Concert",
        price: 100,
        userId: new mongoose.Types.ObjectId().toHexString()
    };

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return {listener, data, msg, ticket};
};

it("find, updates and saves a ticket", async () => {
    const {listener, data, msg} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure a ticket was created!
    const updatedTicket = await Ticket.findById(data.id);

    expect(updatedTicket).toBeDefined();
    expect(updatedTicket!.title).toEqual(data.title);
    expect(updatedTicket!.price).toEqual(data.price);
    expect(updatedTicket!.version).toEqual(data.version);
});

it("acks the message", async () => {
    const {listener, data, msg} = await setup();

    // call the onMessage function with data object + message object
    await listener.onMessage(data, msg);

    // write assertion to make sure ack function is called
    expect(msg.ack).toHaveBeenCalled();
});

it("it does not ack if event has a skipped version", async () => {
    const {listener, data, msg} = await setup();
    data.version = 10;

    // call the onMessage function with data object + message object
    try {
        await listener.onMessage(data, msg);
    } catch (err) {
    }

    // write assertion to make sure ack function is called
    expect(msg.ack).not.toHaveBeenCalled();
});
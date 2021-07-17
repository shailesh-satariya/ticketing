import request from "supertest";
import {app} from "../../app";
import {Ticket} from "../../models/ticket";
import mongoose from "mongoose";

declare var global: NodeJS.Global;

const buildTicket = async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: "Concert",
        price: 20
    });

    await ticket.save();

    return ticket;
};

it("fetches orders for particular user", async () => {
    // Create 3 tickets
    const ticketOne = await buildTicket();
    const ticketTwo = await buildTicket();
    const ticketThree = await buildTicket();

    const userOne = global.signin();
    const userTwo = global.signin();

    // Create one order as User #1
    await request(app)
        .post("/api/orders")
        .send({ticketId: ticketOne.id})
        .set("Cookie", userOne)
        .expect(201);

    // Create two orders as User #2
    const {body: orderOne} = await request(app)
        .post("/api/orders")
        .send({ticketId: ticketTwo.id})
        .set("Cookie", userTwo)
        .expect(201);
    const {body: orderTwo} = await request(app)
        .post("/api/orders")
        .send({ticketId: ticketThree.id})
        .set("Cookie", userTwo)
        .expect(201);

    // Make request to get orders for User #2
    const response = await request(app)
        .get("/api/orders")
        .set("Cookie", userTwo)
        .expect(200);

    // Make sure we only got orders for User #2
    expect(response.body.length).toEqual(2);
    expect(response.body[0].id).toEqual(orderOne.id);
    expect(response.body[1].id).toEqual(orderTwo.id);
    expect(response.body[0].ticket.id).toEqual(ticketTwo.id);
    expect(response.body[1].ticket.id).toEqual(ticketThree.id);
});
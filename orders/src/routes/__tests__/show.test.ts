import request from "supertest";
import {app} from "../../app";
import {Ticket} from "../../models/ticket";
import mongoose from "mongoose";

declare var global: NodeJS.Global;

it("fetches the order for particular user", async () => {
    // Create a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: "Concert",
        price: 20
    });
    await ticket.save();

    const user = global.signin();
    // make a request to build an order with this ticket
    const {body: order} = await request(app)
        .post("/api/orders")
        .send({ticketId: ticket.id})
        .set("Cookie", user)
        .expect(201);

    // make a request to fetch the use
    const {body: fetchedOrder} = await request(app)
        .get(`/api/orders/${order.id}`)
        .set("Cookie", user)
        .send()
        .expect(200);

    expect(fetchedOrder.id).toEqual(order.id);
});


it("return an error if one user tries access other user's order", async () => {
    // Create a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: "Concert",
        price: 20
    });
    await ticket.save();

    const user = global.signin();
    // make a request to build an order with this ticket
    const {body: order} = await request(app)
        .post("/api/orders")
        .send({ticketId: ticket.id})
        .set("Cookie", user)
        .expect(201);

    // make a request to fetch the use
    await request(app)
        .get(`/api/orders/${order.id}`)
        .set("Cookie", global.signin())
        .send()
        .expect(401);
});
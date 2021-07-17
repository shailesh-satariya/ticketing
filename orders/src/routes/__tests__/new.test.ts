import request from "supertest";
import {app} from "../../app";
import mongoose from "mongoose";
import {Ticket} from "../../models/ticket";
import {Order, OrderStatus} from "../../models/order";
import {natsWrapper} from "../../nats-wrapper";

declare var global: NodeJS.Global;

it("returns an error when ticketId is missing", async () => {
    const ticketId = mongoose.Types.ObjectId();
    const response = await request(app)
        .post("/api/orders")
        .set("Cookie", global.signin())
        .send({ticketId});

    expect(response.status).toEqual(404);
});

it("returns an error when ticket already reserved", async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: "concert",
        price: 20
    });
    await ticket.save();

    const order = Order.build({
        userId: "knknknkqjni",
        status: OrderStatus.Created,
        expiresAt: new Date(),
        ticket
    });
    await order.save();

    await request(app)
        .post("/api/orders")
        .send({ticketId: ticket.id})
        .set("Cookie", global.signin())
        .expect(400);
});

it("reserves a ticket", async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: "concert",
        price: 20
    });
    await ticket.save();

    await request(app)
        .post("/api/orders")
        .send({ticketId: ticket.id})
        .set("Cookie", global.signin())
        .expect(201);
});

it("emits an order created event", async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: "concert",
        price: 20
    });
    await ticket.save();

    await request(app)
        .post("/api/orders")
        .send({ticketId: ticket.id})
        .set("Cookie", global.signin())
        .expect(201);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
});

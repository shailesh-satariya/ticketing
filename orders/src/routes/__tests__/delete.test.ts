import request from "supertest";
import {app} from "../../app";
import {Ticket} from "../../models/ticket";
import {Order, OrderStatus} from "../../models/order";
import {natsWrapper} from "../../nats-wrapper";
import mongoose from "mongoose";

declare var global: NodeJS.Global;

it("marks an order as cancelled", async () => {
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

    // make a request to cancel the order
    await request(app)
        .delete(`/api/orders/${order.id}`)
        .set("Cookie", user)
        .send()
        .expect(204);

    // expectation to make sure order is cancelled
    const updatedOrder = await Order.findById(order.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it("emits an order cancelled event", async () => {
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

    // make a request to cancel the order
    await request(app)
        .delete(`/api/orders/${order.id}`)
        .set("Cookie", user)
        .send()
        .expect(204);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
});
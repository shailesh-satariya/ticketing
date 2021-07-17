import request from "supertest";
import {app} from "../../app";
import mongoose from "mongoose";
import {natsWrapper} from "../../nats-wrapper";
import {Ticket} from "../../models/ticket";

declare var global: NodeJS.Global;
jest.mock("../../nats-wrapper");

it("returns a 404 when provided id does not exists", async () => {
    const id = new mongoose.Types.ObjectId().toHexString();
    await request(app)
        .put(`/api/tickets/${id}`)
        .set("Cookie", global.signin())
        .send({title: "Concert", price: 20})
        .expect(404);
});

it("returns a 401 when user is not authenticated", async () => {
    const id = new mongoose.Types.ObjectId().toHexString();
    await request(app)
        .put(`/api/tickets/${id}`)
        .send({title: "Concert", price: 20})
        .expect(401);
});

it("returns a 401 when user does not own the ticket", async () => {
    const response = await request(app)
        .post("/api/tickets")
        .set("Cookie", global.signin())
        .send({title: "foo", price: 20});

    await request(app)
        .put(`/api/tickets/${response.body.id}`)
        .set("Cookie", global.signin())
        .send({title: "bar", price: 25})
        .expect(401);
});

it("returns a 400 when user provides invalid title or price", async () => {
    const cookie = global.signin();
    const response = await request(app)
        .post("/api/tickets")
        .set("Cookie", cookie)
        .send({title: "foo", price: 20});

    await request(app)
        .put(`/api/tickets/${response.body.id}`)
        .set("Cookie", cookie)
        .send({title: "", price: 25})
        .expect(400);

    await request(app)
        .put(`/api/tickets/${response.body.id}`)
        .set("Cookie", cookie)
        .send({title: "bar", price: -10})
        .expect(400);
});

it("updates the ticket provided valid inputs", async () => {
    const cookie = global.signin();
    const response = await request(app)
        .post("/api/tickets")
        .set("Cookie", cookie)
        .send({title: "foo", price: 20});

    const title = "Update";
    const price = 20;
    await request(app)
        .put(`/api/tickets/${response.body.id}`)
        .set("Cookie", cookie)
        .send({title, price})
        .expect(200);

    const ticketResponse = await request(app)
        .get(`/api/tickets/${response.body.id}`)
        .send();

    expect(ticketResponse.body.title).toEqual(title);
    expect(ticketResponse.body.price).toEqual(price);

});

it("publishes an event", async () => {
    const cookie = global.signin();
    const response = await request(app)
        .post("/api/tickets")
        .set("Cookie", cookie)
        .send({title: "foo", price: 20});

    expect(natsWrapper.client.publish).toHaveBeenCalled();

    const title = "Update";
    const price = 20;
    await request(app)
        .put(`/api/tickets/${response.body.id}`)
        .set("Cookie", cookie)
        .send({title, price})
        .expect(200);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it("reject updates if ticket is reserved", async () => {
    const cookie = global.signin();
    const response = await request(app)
        .post("/api/tickets")
        .set("Cookie", cookie)
        .send({title: "foo", price: 20});

    const ticket = await Ticket.findById(response.body.id);
    ticket!.set({orderId: new mongoose.Types.ObjectId().toHexString()});
    await ticket!.save();

    const title = "Update";
    const price = 20;
    await request(app)
        .put(`/api/tickets/${response.body.id}`)
        .set("Cookie", cookie)
        .send({title, price})
        .expect(400);
});
import request from "supertest";
import {app} from "../../app";
import mongoose from "mongoose";
import {Order} from "../../models/order";
import {OrderStatus} from "@shstickets/common";
import {stripe} from "../../stripe";
import {Payment} from "../../models/payment";

// jest.mock("../../stripe");

it("it returns a 404 when purchasing an order does not exist", async () => {
    await request(app)
        .post("/api/payments")
        .set("Cookie", global.signin())
        .send({
            token: "asldfkm",
            orderId: new mongoose.Types.ObjectId().toHexString()
        })
        .expect(404);
});

it("it returns a 401 when purchasing an order does not belong to user", async () => {
    const order = Order.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        userId: new mongoose.Types.ObjectId().toHexString(),
        version: 0,
        price: 20,
        status: OrderStatus.Created
    });

    await order.save();

    await request(app)
        .post("/api/payments")
        .set("Cookie", global.signin())
        .send({
            token: "asldfkm",
            orderId: order.id
        })
        .expect(401);
});

it("it returns a 400 when purchasing an cancelled order", async () => {
    const userId: string = new mongoose.Types.ObjectId().toHexString();
    const order = Order.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        userId,
        version: 0,
        price: 20,
        status: OrderStatus.Cancelled
    });

    await order.save();

    await request(app)
        .post("/api/payments")
        .set("Cookie", global.signin(userId))
        .send({
            token: "asldfkm",
            orderId: order.id
        })
        .expect(400);
});

it("returns a 201 with valid inputs", async () => {
    const userId: string = new mongoose.Types.ObjectId().toHexString();
    const price: number = Math.floor(Math.random() * 100000);
    const order = Order.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        userId,
        version: 0,
        price,
        status: OrderStatus.Created
    });

    await order.save();

    await request(app)
        .post("/api/payments")
        .set("Cookie", global.signin(userId))
        .send({
            token: "tok_visa",
            orderId: order.id
        })
        .expect(201);


    // const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
    // expect(chargeOptions.source).toEqual("token_visa");
    // expect(chargeOptions.amount).toEqual(order.price * 1000);
    // expect(chargeOptions.currency).toEqual("usd");
    const stripCharges = await stripe.charges.list({limit: 50});
    const stripCharge = stripCharges.data.find(charge => charge.amount === price * 100);

    expect(stripCharge).toBeDefined();
    expect(stripCharge!.currency).toEqual("usd");

    const payment = await Payment.findOne({
        orderId: order.id,
        stripeId: stripCharge!.id
    });

    expect(payment).not.toBeNull();
});
import request from "supertest";
import {app} from "../../app";

jest.setTimeout(30000);

it("fails when an email that does not exist is supplied", async () => {
    return request(app)
        .post("/api/users/signin")
        .send({
            email: "test@test.com",
            password: "password"
        })
        .expect(400);
});

it("fails when an incorrect password is supplied", async () => {
    await request(app)
        .post("/api/users/signup")
        .send({
            email: "test@test.com",
            password: "password"
        })
        .expect(201);

    await request(app)
        .post("/api/users/signin")
        .send({
            email: "test@test.com",
            password: "pass"
        })
        .expect(400);
});

it("responds with a cookie when valid credential given", async () => {
    await request(app)
        .post("/api/users/signup")
        .send({
            email: "test@test.com",
            password: "password"
        })
        .expect(201);

    const response = await request(app)
        .post("/api/users/signin")
        .send({
            email: "test@test.com",
            password: "password"
        })
        .expect(200);

    expect(response.get("Set-Cookie")).toBeDefined();
});
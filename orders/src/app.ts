import express from "express";
import "express-async-errors";
import {json} from "body-parser";
import cookieSession from "cookie-session";

import {currentUser, errorHandler, NotFoundError} from "@shstickets/common";
import {createOrderRouter} from "./routes/new";
import {showOrderRouter} from "./routes/show";
import {indexOrderRouter} from "./routes";
import {deleteOrderRouter} from "./routes/delete";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
    cookieSession({
        signed: false,
        secure: process.env.NODE_ENV !== "test"
    })
);

app.use(currentUser);

app.use(createOrderRouter);
app.use(showOrderRouter);
app.use(indexOrderRouter);
app.use(deleteOrderRouter);

app.all("*", async () => {
    throw new NotFoundError();
});
app.use(errorHandler);

export {app};
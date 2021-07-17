import mongoose from "mongoose";
import {OrderStatus} from "@shstickets/common";
import {updateIfCurrentPlugin} from "mongoose-update-if-current";

// An interface that describes the properties
// that are required to creat a new order
interface OrderAttrs {
    id: string;
    version: number;
    userId: string;
    status: OrderStatus;
    price: number;
}

// An interface that describes the properties
// that a Order Document has
interface OrderDoc extends mongoose.Document {
    userId: string;
    status: OrderStatus;
    price: number;
    version: number;
}

// An interface that describes the properties
// that a Order Model has
interface OrderModel extends mongoose.Model<OrderDoc> {
    build(attrs: OrderAttrs): OrderDoc;
}

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(OrderStatus),
        default: OrderStatus.Created
    },
    price: {
        type: Number,
        required: true
    }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});

orderSchema.set("versionKey", "version");
orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.build = (attrs: OrderAttrs) => {
    return new Order({
        _id: attrs.id,
        userId: attrs.userId,
        version: attrs.version,
        price: attrs.price,
        status: attrs.status
    });
};


const Order = mongoose.model<OrderDoc, OrderModel>("Order", orderSchema);

export {Order, OrderStatus};


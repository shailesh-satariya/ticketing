import mongoose from "mongoose";
import {updateIfCurrentPlugin} from "mongoose-update-if-current";

// An interface that describes the properties
// that are required to creat a new payment
interface PaymentAttrs {
    orderId: string;
    stripeId: string;
}

// An interface that describes the properties
// that a Payment Document has
interface PaymentDoc extends mongoose.Document {
    orderId: string;
    stripeId: string;
}

// An interface that describes the properties
// that a Payment Model has
interface PaymentModel extends mongoose.Model<PaymentDoc> {
    build(attrs: PaymentAttrs): PaymentDoc;
}

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    stripeId: {
        type: String,
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

paymentSchema.set("versionKey", "version");
paymentSchema.plugin(updateIfCurrentPlugin);

paymentSchema.statics.build = (attrs: PaymentAttrs) => {
    return new Payment(attrs);
};

const Payment = mongoose.model<PaymentDoc, PaymentModel>("Payment", paymentSchema);

export {Payment};


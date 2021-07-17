import * as mongoose from "mongoose";
import {Password} from "../services/password";

// An interface that describes the properties
// that are required to creat a new user
interface UserAttrs {
    email: string;
    password: string;
}

// An interface that describes the properties
// that a User Document has
interface UseDoc extends mongoose.Document {
    email: string;
    password: string;
}

// An interface that describes the properties
// that a User Model has
interface UserModel extends mongoose.Model<UseDoc> {
    build(attrs: UserAttrs): UseDoc;
}

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.password;
            delete ret.__v;
        }
    }
});

userSchema.pre("save", async function (done) {
    if (this.isModified("password")) {
        const hashed = await Password.toHash(this.get("password"));
        this.set("password", hashed);
    }
    done();
});

userSchema.statics.build = (attrs: UserAttrs) => {
    return new User(attrs);
};


const User = mongoose.model<UseDoc, UserModel>("User", userSchema);

export {User};


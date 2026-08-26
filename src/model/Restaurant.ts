import { Document, Schema, Types } from "mongoose";
import mongoose from "mongoose";

export interface IRestaurant extends Document {
    name: string,
    description?: string,
    image: string,
    ownerId: Types.ObjectId,
    phone: number,
    isVerified: boolean,

    autoLocation: {
        type: "Point",
        coordinates: [number, number]; // [longitude , latitdue]
        formattedAddress: string
    },
    isOpen: boolean,
    createdAt: Date
};

const schema = new Schema<IRestaurant>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    image: {
        type: String,
        required: true
    },
    ownerId: {
        type: Types.ObjectId,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    isOpen: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        required: true
    },
    autoLocation: {
        type: {
            type : String ,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        },
        formattedAddress : {
            type : String
        },
    },
},
{
    timestamps : true
}
);

schema.index({autoLocation : "2dsphere"});

export default mongoose.model<IRestaurant>('Restaurant' , schema)

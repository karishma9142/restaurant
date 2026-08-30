import mongoose, { Schema, Document } from "mongoose";

export interface IMenuItem extends Document {
    restaurantId: mongoose.Types.ObjectId;
    description: string;
    name: string;
    image: string;
    price: number;
    isAvailables: boolean;
    createdAt: Date;
    UpdatedAt: Date;
}

const schema = new Schema<IMenuItem>({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
    }
    , image: {
        type: String,
        required: true,
    },
    isAvailables: {
        type: Boolean,
        default: true
    }
},{
    timestamps : true
});

export default mongoose.model<IMenuItem>('MenuItem' , schema);
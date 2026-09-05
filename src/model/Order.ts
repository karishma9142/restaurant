import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
    userId: string;
    restaurantId: string;
    restaurantName: string;
    riderId: string | null;
    riderPhone: number | null;
    riderName: string | null;
    distance: number;
    riderAmount: number;

    items: {
        itemId: string
        name: string;
        price: number;
        quantity: number
    }[];

    subtotal: number;
    deliveryFee: number;
    platfromFee: number;
    totalAmount: number;

    addressId: string;

    deliveryAddress: {
        formattedAddress: string;
        mobile: number;
        latitude: number;
        longitude: number;
    };

    status: | 'placed' | 'accepted' | 'preaparing' | 'ready_for_rider' | 'rider_assigned' | 'picked_up' | 'delivered' | 'cancelled';

    paymentMethod: 'razorpay' | 'stripe';
    paymentStatus: 'pending' | 'paid' | 'failed';
    expireAt: Date;

    createdAt: Date;
    updatedAt: Date;
};

const schema = new Schema<IOrder>({
    userId: {
        type: String,
        required: true
    },
    restaurantId: {
        type: String,
        required: true
    },
     restaurantName: {
        type: String,
        required: true
    },
    riderId: {
        type: String,
        default: null
    },
    riderName: {
        type: String,
        default: null
    },
    riderPhone: {
        type: Number,
        default: null
    },
    riderAmount: {
        type: Number,
        required: true
    },
    distance: {
        type: Number,
        required: true
    },

    items: [
        {
            itemId: String,
            name: String,
            price: Number,
            quantity: Number

        },
    ],

    subtotal : Number,
    deliveryFee : Number,
    platfromFee : Number,
    totalAmount : Number,

    addressId : {
        type : String,
        required : true
    },

    deliveryAddress : {
        formattedAddress : {type : String , required : true},
        mobile : {type : Number , required : true},
        latitude : Number,
        longitude : Number
    },

    status : {
        type : String,
        enum : [ 'placed' , 'accepted' , 'preaparing' ,'ready_for_rider' , 'rider_assigned' , 'picked_up' , 'delivered' , 'cancelled'],
        default : 'placed'
    },

    paymentMethod : {
        type : String ,
        enum : ['razorpay' , 'stripe'],
        required : true,
    },

    paymentStatus : {
        type : String ,
        enum : ['pending' , 'paid' , 'failed'],
        default : 'pending'
    },

    expireAt : {
        type : Date,
        index : {expireAfterSeconds : 0},
    },

},
{
    timestamps : true,
});

export default mongoose.model<IOrder>('Order' , schema);
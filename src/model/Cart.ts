import mongoose, { Document, Schema } from 'mongoose';


export interface iCart extends Document {
    userid : mongoose.Types.ObjectId;
    restaurantId: mongoose.Types.ObjectId;
    itemId : mongoose.Types.ObjectId;
    quantity : number;
    createdAt : Date;
    updatedAt : Date;
}

const schema = new Schema<iCart> ({
    userid : {
        type : mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    restaurantId : {
        type : mongoose.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true
    },
    itemId : {
        type : mongoose.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
        index: true
    },
    quantity: {
        type : Number,
        default : 1,
        min:1
    },
},
{
    timestamps : true
});

schema.index({userid : 1 , restaurantId : 1,itemId : 1 } ,{unique : true});

export default mongoose.model<iCart>("Cart" , schema);
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/isAuth.js";
import TryCatch from "../middleware/trycatch.js";
import Cart from "../model/Cart.js";

export const addCart = TryCatch(async(req : AuthenticatedRequest , res) => {
    if(!req.user){
        return res.status(400).json({
            msg : 'Please login'
        })
    }

    const userid = req.user._id;

    const {restaurantId , itemId}  = req.body;

    if(!mongoose.Types.ObjectId.isValid(restaurantId) || !mongoose.Types.ObjectId.isValid(itemId)){
        return res.status(400).json({
            msg : 'Invalid restaurant and item id',
        })
    }

    const cartFromDifferentRestaurant = await Cart.findOne({
        userid ,
        restaurantId : {$ne : restaurantId},
    });

    if(cartFromDifferentRestaurant){
        return res.status(400).json({
            msg : "You can order from only one restaurant at a time . Please clear your cart first to add items from this restaurant"
        })
    }

    const cartItem = await Cart.findOneAndUpdate({
        userid ,
        restaurantId,
        itemId
    },{
        $inc : {quantity : 1},
        $setOnInsert : {userid , restaurantId , itemId}
    },{
        upsert: true , new:true , setDefaultsOnInsert: true
    }
)

return res.json({
    msg : 'item add to cart',
    cart: cartItem
})
});

export const fetchMyCart = TryCatch(
    async (req: AuthenticatedRequest, res) => {
        if (!req.user) {
            return res.status(401).json({
                msg: "Please login"
            });
        }

        const userid = req.user._id;

        const cartItems = await Cart.find({ userid })
            .populate("itemId")
            .populate("restaurantId");

        let subtotal = 0;
        let cartLength = 0;

        for (const cartItem of cartItems) {
            const item: any = cartItem.itemId;

            if (!item) continue;

            subtotal += item.price * cartItem.quantity;
            cartLength += cartItem.quantity;
        }

        return res.json({
            success: true,
            cartLength,
            subtotal,
            cart: cartItems
        });
    }
);

export const incrementCartitem = TryCatch(async (req:AuthenticatedRequest , res) => {
    const userid = req.user?._id;

    const {itemId} = req.body;

    if(!userid || !itemId){
        return res.status(400).json({
            msg : "Invalid request"
        })
    }

    const cartItem = await Cart.findOneAndUpdate(
        {userid , itemId},
        {$inc : {quantity : 1}},
        { returnDocument: "after" }
    );

    if(!cartItem){
        return res.status(404).json({
            msg : "item not found"
        })
    }

    res.json({
        msg : "quantity increased",
        cartItem
    })
});

export const decrementCartitem = TryCatch(async (req:AuthenticatedRequest , res) => {
    const userid = req.user?._id;

    const {itemId} = req.body;

    if(!userid || !itemId){
        return res.status(400).json({
            msg : "Invalid request"
        })
    }

    const cartItem = await Cart.findOne(
        {userid , itemId},
       
    );

    if(!cartItem){
        return res.status(404).json({
            msg : "item not found"
        })
    }

    if(cartItem.quantity === 1){
        await Cart.deleteOne({userid,itemId});

        return res.json({
        msg : 'item removed from cart',
        cartItem
    })
    }

    cartItem.quantity -= 1;
    await cartItem.save();
    res.json({
        msg : "quantity decreased",
        cartItem
    })
});

export const clearCart = TryCatch(async(req:AuthenticatedRequest , res) => {
    const userid = req.user?._id;

    if(!userid){
        return res.status(401).json({
            msg : "Unauthorized"
        })
    }

    await Cart.deleteMany({userid});

    res.json({
        msg : "all items are removed",
    })
})
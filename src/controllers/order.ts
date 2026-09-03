import { response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuth.js";
import TryCatch from "../middleware/trycatch.js";
import Address from "../model/Address.js";
import Cart from "../model/Cart.js";
import { IMenuItem } from "../model/MenuItem.js";
import Restaurant from "../model/Restaurant.js";

export const createOrder = TryCatch(async(req : AuthenticatedRequest , res) => {
    const user = req.user;

    if(!user){
        return res.status(401).json({
            msg : "Unauthorized"
        })
    }

    const {paymentMethod , addressId} = req.body;

    if(!addressId){
        return res.status(400).json({
            msg : "Address is required"
        });
    }

    const address = await Address.findOne({
        _id : addressId,
        userId : user._id.toString()
    });

    if(!address){
        return res.status(404).json({
            msg : "Address not found"
        })
    }

    const cartItems = await Cart.find({
        userid : user._id
    }).populate<{itemId : IMenuItem}>('itemId')
    .populate<{restaurantId : IMenuItem}>('restaurantId');

    if(cartItems.length === 0){
        return res.status(400).json({
            msg : "cart is empty"
        })
    }

    const firstcartItem = cartItems[0];

    if(!firstcartItem || !firstcartItem.restaurantId){
        return response.status(400).json({
            msg : "inavlid cart data"
        });
    }
    
    const restaurantId = firstcartItem.restaurantId._id;
    const restaurant = await Restaurant.findById(restaurantId);

    if(!restaurant){
        return res.status(404).json({
            msg : "No restaurant with this id"
        })
    }

    if(!restaurant.isOpen){
        return res.status(404).json({
            msg : "Sorry this restaurant is closed for now"
        })
    }
})  
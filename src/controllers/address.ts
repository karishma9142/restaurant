import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/isAuth.js";
import TryCatch from "../middleware/trycatch.js";
import Address from "../model/Address.js";

export const addAddress = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            msg: "Unauthorized"
        })
    }

    const { mobile, formattedAddress, latitude, longitude } = req.body;

    if (!mobile || !formattedAddress || latitude === undefined || !longitude === undefined) {
        return res.status(400).json({
            msg: "Please give all fields"
        })
    }

    const newAddress = await Address.create({
        userId: user._id.toString(),
        mobile,
        formattedAddress,
        location: {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)]
        }
    })

    res.status(200).json({
        msg: "Address add successfully",
        address: newAddress
    })
});


export const deleteAddress = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            msg: "Unauthorized"
        })
    }

    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            msg: "id ir required"
        })
    }

    const address = await Address.findOne({
        _id : id,
        userId: user._id.toString()
    })

    if(!address){
        return res.status(404).json({
            msg : "Address not found"
        })
    }

    await address.deleteOne();

    res.status(200).json({
        msg: "Address deleted successfully",
    })
});

export const getMyAddress = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            msg: "Unauthorized"
        })
    }
    const userId = user._id;
    const addAddress = await Address.find({
        userId : user._id.toString()
    }).sort({createdAt : -1});

    res.json(addAddress);
    
})
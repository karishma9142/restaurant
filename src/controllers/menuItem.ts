import axios from "axios";
import { AuthenticatedRequest } from "../middleware/isAuth.js";
import TryCatch from "../middleware/trycatch.js";
import Restaurant from "../model/Restaurant.js";
import getBuffer from "../config/datauri.js";
import MenuItem from "../model/MenuItem.js";

export const addMenuItem = TryCatch(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        return res.status(401).json({
            msg: "please login"
        })
    };

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
        return res.status(404).json({
            msg: 'no restaurant found'
        })
    }

    const { name, description, price } = req.body;

    if (!name || !price) {
        return res.status(400).json({
            msg: "name and price are required"
        })
    }

    const file = req.file;

    if (!file) {
        return res.status(400).json({
            msg: 'pleast fill image'
        })
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer) {
        return res.status(500).json({
            msg: "failed to create file buffer"
        })
    }

    const { data: uploadResult } = await axios.post(`${process.env.UTILS_SERVER}/api/upload`, {
        buffer: fileBuffer.content,
    });

    const item = await MenuItem.create({
        name,
        description,
        price,
        restaurantId: restaurant._id,
        image: uploadResult.url
    })

    res.json({
        msg: "Item Added Successfully",
        item
    })
});

export const getAllItems = TryCatch(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            msg: "Id is required"
        })
    }

    const items = await MenuItem.find({ restaurantId: id });
    res.json(items);
});

export const deleteMenuItem = TryCatch(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        return res.status(401).json({
            msg: "please login"
        })
    };

    const { itemId } = req.params;

    if (!itemId) {
        return res.status(400).json({
            msg: "ItemId is required"
        })
    }

    const item = await MenuItem.findById(itemId);

    if(!item){
        return res.status(404).json({
            msg : "No Item Found"
        })
    }

    const restaurant = await Restaurant.findOne({
        _id : item.restaurantId,
        ownerId: req.user._id,
    });

    if(!restaurant){
        return res.status(404).json({
            msg : "No restaunat fond"
        })
    }
    await item.deleteOne();

    res.json({
        msg : "Menu item deleted successfully"
    })
});

export const toggleMenuAvailability = TryCatch(async(req:AuthenticatedRequest , res)=> {
      if (!req.user) {
        return res.status(401).json({
            msg: "please login"
        })
    };

    const { itemId } = req.params;

    if (!itemId) {
        return res.status(400).json({
            msg: "ItemId is required"
        })
    }

    const item = await MenuItem.findById(itemId);

    if(!item){
        return res.status(404).json({
            msg : "No Item Found"
        })
    }

    const restaurant = await Restaurant.findOne({
        _id : item.restaurantId,
        ownerId: req.user._id,
    });

    if(!restaurant){
        return res.status(404).json({
            msg : "No restaunat fond"
        })
    }

    item.isAvailables = !item.isAvailables;
    await item.save();

    res.json({
        msg : `item marked as ${
            item.isAvailables ? "Available" : 
            "Unavailable"
        }`,
        item
    })
})
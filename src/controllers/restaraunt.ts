import axios from "axios";
import getBuffer from "../config/datauri.js";
import { AuthenticatedRequest } from "../middleware/isAuth.js";
import TryCatch from "../middleware/trycatch.js";
import Restaurant from "../model/Restaurant.js";
import jwt from 'jsonwebtoken';
import { execPath } from "process";

export const addRestaurant = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            msg: "unauthorized"
        })
    }
    const existingRestaurant = await Restaurant.findOne({
        ownerId: user._id,
    })

    if (existingRestaurant) {
        return res.status(400).json({
            msg: "you already have a restaurant"
        });
    }

    const { name, description, latitude, longitude, formattedAddress, phone } = req.body;

    if (!name || !latitude || !longitude) {
        return res.status(400).json({
            msg: 'pleast fill all details'
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

    const restaurant = await Restaurant.create({
        name,
        description,
        phone,
        image: uploadResult.url,
        ownerId: user._id,
        autoLocation: {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
            formattedAddress,
        },
        isVerified: false

    });

    return res.status(200).json({
        msg: "restaurant crated successfully"
    })
});

export const FetchMyRestaurant = TryCatch(
    async (req: AuthenticatedRequest, res) => {

        if (!req.user) {
            return res.status(401).json({ msg: "Please Login" });
        }

        const restaurant = await Restaurant.findOne({
            ownerId: req.user._id
        });

        if (!restaurant) {
            return res.status(404).json({ msg: "No restaurant found" });
        }

        console.log(req.user.restaurandId);
        if (!req.user.restaurandId) {   // fixed typo
            const token = jwt.sign(
                {
                    user: {
                        _id: req.user._id,
                        name: req.user.name,
                        email: req.user.email,
                        role: req.user.role,           // <-- added, critical
                        restaurandId: restaurant._id
                    }
                },
                process.env.JWT_SEC as string,
                { expiresIn: "15d" }
            );

            return res.json({ restaurant, token });
        }

        return res.json({ restaurant });
    }
);

export const updateStatusRestaurant = TryCatch(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        return res.status(403).json({
            msg: "please login"
        })
    }

    const { status } = req.body;
    if (typeof status !== 'boolean') {
        return res.status(400).json({
            msg: "status must be boolean"
        })
    }

    const restaurant = await Restaurant.findOneAndUpdate(
        { ownerId: req.user._id },
        { isOpen: status },
        { new: true }
    );

    if (!restaurant) {
        return res.status(404).json({
            msg: "Restaurant not found"
        })
    }

    res.json({
        msg: "Restaunarn stauts updated",
        restaurant
    })
});

export const updateRestaurant = TryCatch(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        return res.status(403).json({
            msg: "please login"
        })
    }

    const { name, description } = req.body;
    const restaurant = await Restaurant.findOneAndUpdate(
        { ownerId: req.user._id },
        { name, description },
        { new: true }
    );

    if (!restaurant) {
        return res.status(404).json({
            msg: "Restaurant not found"
        })
    }

    res.json({
        msg: "Restaunarn updated",
        restaurant
    })
});


export const getNeraByRestaurant = TryCatch(async(req , res) => {
    const {latitude , longitude , radius=5000,search=""} = req.query;

    if(!latitude || !longitude){
        return res.status(400).json({
            msg : "Latitude and longtitude are required"
        })
    }

    const query : any={
        isVerified : true 
    }

    if(search && typeof search === 'string'){
        query.name = {$regex : search , $options : 'i'};
    }

    const restaurants = await Restaurant.aggregate([
        {
            $geoNear: {
                near : {
                    type : 'Point',
                    coordinates : [Number(longitude) , Number(latitude)],
                },
                distanceField: 'distance',
                maxDistance : Number(radius),
                spherical : true,
                query,
            },
        },
        {
            $sort: {
                isOpen : -1,
                distance : 1

            },
        },
        {
            $addFields : {
                distanceKm: {
                    $round : [{$divide:['$distance',1000]},2],
                }
            }
        }
    ])
    res.json({
        success : true ,
        count : restaurants.length,
        restaurants
    })
});

export const fetchSingleRestaurant = TryCatch(async(req , res) => {
    const restaurant = await Restaurant.findById(req.params.id);
    res.json(restaurant);
})
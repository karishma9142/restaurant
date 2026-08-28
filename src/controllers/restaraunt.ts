import axios from "axios";
import getBuffer from "../config/datauri.js";
import { AuthenticatedRequest } from "../middleware/isAuth.js";
import TryCatch from "../middleware/trycatch.js";
import Restaurant from "../model/Restaurant.js";
import jwt from 'jsonwebtoken';

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
        isVerified : false

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
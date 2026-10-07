import { AuthenticatedRequest } from "../middleware/isAuth.js";
import TryCatch from "../middleware/trycatch.js";
import Address from "../model/Address.js";
import Cart from "../model/Cart.js";
import { IMenuItem } from "../model/MenuItem.js";
import Restaurant from "../model/Restaurant.js";
import Order from "../model/Order.js";
import axios, { create } from "axios";
import { publishEvent } from "../config/order_publisher.js";

export const createOrder = TryCatch(
    async (req: AuthenticatedRequest, res) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                msg: "Unauthorized"
            });
        }

        const { paymentMethod, addressId } = req.body;
        if (!addressId) {
            return res.status(400).json({
                msg: "Address is required"
            });
        }

        const address = await Address.findOne({
            _id: addressId,
            userId: user._id.toString()
        });

        if (!address) {
            return res.status(404).json({
                msg: "Address not found"
            });
        }
        const getDistanceKm = (
            lat1: number,
            lon1: number,
            lat2: number,
            lon2: number,
        ): number => {
            const R = 6371;

            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLon = ((lon2 - lon1) * Math.PI) / 180;

            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return +(R * c).toFixed(2);
        };



        const cartItems = await Cart.find({
            userid: user._id
        })
            .populate<{ itemId: IMenuItem }>("itemId")
            .populate("restaurantId");

        if (cartItems.length === 0) {
            return res.status(400).json({
                msg: "Cart is empty"
            });
        }

        const firstCartItem = cartItems[0];

        if (!firstCartItem || !firstCartItem.restaurantId) {
            return res.status(400).json({
                msg: "Invalid cart data"
            });
        }

        const restaurantId = firstCartItem.restaurantId._id;

        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({
                msg: "No restaurant with this id"
            });
        }

        if (!restaurant.isOpen) {
            return res.status(400).json({
                msg: "Sorry, this restaurant is closed for now"
            });
        }

        const distance = getDistanceKm(
            address.location.coordinates[1],
            address.location.coordinates[0],
            restaurant.autoLocation.coordinates[1],
            restaurant.autoLocation.coordinates[0]
        )
        let subtotal = 0;

        const orderItems = cartItems.map((cart) => {
            const item = cart.itemId;

            if (!item) {
                throw new Error("Invalid cart item");
            }

            const itemTotal = item.price * cart.quantity;
            subtotal += itemTotal;

            return {
                itemId: item._id.toString(),
                name: item.name,
                price: item.price,
                quantity: cart.quantity
            };
        });

        const deliveryFee = subtotal < 250 ? 49 : 0;
        const platfromFee = 7;

        const totalAmount =
            subtotal + deliveryFee + platfromFee;

        const expireAt = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        );

        const [longitude, latitude] = address.location.coordinates;

        const riderAmount = Math.ceil(distance) * 7;

        const order = await Order.create({
            userId: user._id.toString(),
            restaurantId: restaurantId.toString(),
            restaurantName: restaurant.name,
            riderId: null,
            distance,
            riderAmount,
            items: orderItems,

            subtotal,
            deliveryFee,
            platfromFee,
            totalAmount,

            paymentMethod,
            expireAt,
            paymentStatus: 'pending',
            status: 'placed',

            addressId: address._id.toString(),

            deliveryAddress: {
                formattedAddress: address.formattedAddress,
                mobile: address.mobile,
                latitude,
                longitude
            }
        });

        await Cart.deleteMany({ userid: user._id });

        return res.status(201).json({
            msg: "Order created successfully",
            orderId: order._id.toString(),
            amount: totalAmount
        });
    }
);

export const fetchOrderForPayment = TryCatch(async (req, res) => {
    if (req.headers['x-internal-key'] !== process.env.INTERNAL_SERVICE_KAY) {
        return res.status(403).json({
            msg: "Forbidden"
        });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            msg: "Order not found"
        });
    }

    if (order.paymentStatus !== 'pending') {
        return res.status(404).json({
            msg: "Order already paid"
        });
    }

    res.json({
        orderId: order._id,
        amount: order.totalAmount,
        currency: 'INR'
    })
});

export const fetchRestaurantOrders = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    const { restaurantId } = req.params;

    if (!user) {
        return res.status(401).json({
            msg: "Unauthorized"
        });
    }

    if (!restaurantId) {
        return res.status(404).json({
            msg: "restaurant id is required"
        });
    }

    const limit = req.query.limit ? Number(req.query.limit) : 0;

    const orders = await Order.find({ restaurantId, paymentStatus: 'paid' }).sort({ createdAt: -1 }).limit(limit);

    return res.json({
        success: true,
        count: orders.length,
        orders
    });
});

const ALLOWED_STATUSES = ['accepted', 'preparing', 'ready_for_rider'] as const;
export const updateOrderStatus = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    const { orderId } = req.params;
    const { status } = req.body;

    if (!user) {
        return res.status(401).json({
            msg: "Unauthorized"
        });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
            msg: "invalid order status"
        });
    }

    const order = await Order.findById(orderId);

    if (!order) {
        return res.status(404).json({
            msg: "order not found"
        });
    }

    if (order.paymentStatus !== 'paid') {
        return res.status(404).json({
            msg: "order not compelted"
        });
    }

    const restaurant = await Restaurant.findById(order.restaurantId);

    if (!restaurant) {
        return res.status(404).json({
            msg: "Restaurant not found"
        });
    }

    if (restaurant.ownerId.toString() !== String(user._id)) {
        return res.status(401).json({
            msg: "You are not allowed to update this order"
        });
    }

    order.status = status;

    await order.save();
    await axios.post(`${process.env.REALTIME_SERVER}/api/v1/internal/emit`, {
        event: "order:update",
        room: `user:${order.userId}`,
        payload: {
            orderId: order._id,
            status: order.status
        }
    }, {
        headers: {
            'x-internal-key': process.env.INTERNAL_SERVICE_KAY,
        },
    });

    // now assign riders

    if (status === 'ready_for_rider') {
        console.log(
            "publishing order ready for rider event for order",
            order._id
        );

        await publishEvent("ORDER_READY_FOR_RIDER", {
            orderId: order._id.toString(),
            restaurantId: restaurant._id.toString(),
            location: restaurant.autoLocation
        });

        console.log('Event Published successfully')
    }

    res.json({
        msg: "order status updated successfully",
        order,
    });
});

export const getMyOrders = TryCatch(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        return res.status(401).json({
            msg: "Unauthorized"
        });
    }

    const orders = await Order.find({
        userId: req.user._id.toString(),
        paymentStatus: 'paid',
    }).sort({ createdAt: -1 });

    res.json({
        orders
    })
});

export const fetchSingleOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        return res.status(401).json({
            msg: "Unauthorized"
        });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
        return res.status(404).json({
            msg: "order not found"
        });
    }

    if (order.userId !== req.user._id.toString()) {
        return res.status(401).json({
            msg: "You are not allowed to view this order"
        });
    }

    res.json(order);
});

export const assignRiderToOrder = TryCatch(async (req, res) => {
    if (req.headers['x-internal-key'] !== process.env.INTERNAL_SERVICE_KAY) {
        return res.status(403).json({
            msg: "Forbidden"
        });
    }

    const { orderId, riderId, riderName, riderPhone } = req.body;
    const order = await Order.findById(orderId);

    if (order?.riderId !== null) {
        return res.status(400).json({
            msg: 'Order Already taken'
        })
    }

    const orderUpdated = await Order.findOneAndUpdate(
        { _id: orderId, riderId: null },
        {
            riderId,
            riderName,
            riderPhone,
            status: 'rider_assigned'
        },
        {
            new: true
        }
    );

    await axios.post(`${process.env.REALTIME_SERVER}/api/v1/internal/emit`, {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order
    }, {
        headers: {
            'x-internal-key': process.env.INTERNAL_SERVICE_KAY,
        },
    });

    await axios.post(`${process.env.REALTIME_SERVER}/api/v1/internal/emit`, {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: order
    }, {
        headers: {
            'x-internal-key': process.env.INTERNAL_SERVICE_KAY,
        },
    });

    res.json({
        message: 'Rider Assigned sucessfuly',
        success: true,
        order: orderUpdated
    });
});

export const getCurrentOrderForRider = TryCatch(async (req, res) => {
    if (req.headers['x-internal-key'] !== process.env.INTERNAL_SERVICE_KAY) {
        return res.status(403).json({
            msg: "Forbidden"
        });
    }

    const { riderId } = req.query;

    if (!riderId) {
        return res.status(400).json({
            message: 'Rider id is requrid'
        });
    }

    if (typeof riderId !== "string") {
        return res.status(400).json({
            message: "Invalid riderId"
        });
    }

    const order = await Order.findOne({
        riderId,
        status: { $ne: 'delivered' }
    }).populate('restaurantId')

    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        });
    }

    res.json(order);
});

export const updateOrderStatusRider = TryCatch(async (req, res) => {
    if (req.headers['x-internal-key'] !== process.env.INTERNAL_SERVICE_KAY) {
        return res.status(403).json({
            msg: "Forbidden"
        });
    }

    const orderId = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        });
    }

    if (order.status === 'rider_assigned') {
        order.status = 'picked_up'

        await order.save();

        await axios.post(`${process.env.REALTIME_SERVER}/api/v1/internal/emit`, {
            event: "order:rider_assigned",
            room: `user:${order.userId}`,
            payload: order
        }, {
            headers: {
                'x-internal-key': process.env.INTERNAL_SERVICE_KAY,
            },
        });

        await axios.post(`${process.env.REALTIME_SERVER}/api/v1/internal/emit`, {
            event: "order:rider_assigned",
            room: `restaurant:${order.restaurantId}`,
            payload: order
        }, {
            headers: {
                'x-internal-key': process.env.INTERNAL_SERVICE_KAY,
            },
        });

        return res.json({
            message: "order updated successfully"
        })
    }

    if (order.status === 'picked_up') {
        order.status = 'delivered'

        await order.save();

        await axios.post(`${process.env.REALTIME_SERVER}/api/v1/internal/emit`, {
            event: "order:rider_assigned",
            room: `user:${order.userId}`,
            payload: order
        }, {
            headers: {
                'x-internal-key': process.env.INTERNAL_SERVICE_KAY,
            },
        });

        await axios.post(`${process.env.REALTIME_SERVER}/api/v1/internal/emit`, {
            event: "order:rider_assigned",
            room: `restaurant:${order.restaurantId}`,
            payload: order
        }, {
            headers: {
                'x-internal-key': process.env.INTERNAL_SERVICE_KAY,
            },
        });

        return res.json({
            message: "order updated successfully"
        })
    }
})
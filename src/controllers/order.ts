import { AuthenticatedRequest } from "../middleware/isAuth.js";
import TryCatch from "../middleware/trycatch.js";
import Address from "../model/Address.js";
import Cart from "../model/Cart.js";
import { IMenuItem } from "../model/MenuItem.js";
import Restaurant from "../model/Restaurant.js";
import Order from "../model/Order.js";

export const createOrder = TryCatch(
    async (req: AuthenticatedRequest, res) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                msg: "Unauthorized"
            });
        }

        const { paymentMethod, addressId, distance } = req.body;

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
            Date.now() + 15 * 60 * 1000
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

        await Cart.deleteMany({userid : user._id});

        return res.status(201).json({
            msg: "Order created successfully",
            orderId : order._id.toString(),
            amount : totalAmount
        });
    }
);

export const fetchOrderForPayment = TryCatch(async(req,res)=> {
    if(req.headers['x-internal-key'] !== process.env.INTERNAL_SERVICE_KAY){
        return res.status(403).json({
            msg : "Forbidden"
        });
    }

    const order = await Order.findById(req.params.id);

    if(!order){
        return res.status(404).json({
            msg : "Order not found"
        });
    }

    if(order.paymentStatus !== 'pending'){
        return res.status(404).json({
            msg : "Order already paid"
        });
    }

    res.json({
        orderId : order._id,
        amount : order.totalAmount,
        currency : 'INR'
    })
})
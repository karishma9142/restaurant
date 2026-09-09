import express from 'express';
import { IsAuth, isSeller } from '../middleware/isAuth.js';
import { createOrder, fetchOrderForPayment, fetchRestaurantOrders, fetchSingleOrder, getMyOrders, updateOrderStatus } from '../controllers/order.js';

const router = express.Router();

router.post('/new' , IsAuth , createOrder);
router.get('/payment/:id' , fetchOrderForPayment);
router.get('/:restaurantId' , IsAuth , isSeller , fetchRestaurantOrders);
router.put('/:orderId' , IsAuth , isSeller , updateOrderStatus);
router.get('/my' , IsAuth , getMyOrders);
router.get('/:id' , IsAuth , fetchSingleOrder);



export default router;
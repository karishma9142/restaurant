import express from 'express';
import { IsAuth, isSeller } from '../middleware/isAuth.js';
import { createOrder, fetchOrderForPayment, fetchRestaurantOrders, fetchSingleOrder, getMyOrders, updateOrderStatus } from '../controllers/order.js';

const router = express.Router();

router.get('/myorder' , IsAuth , getMyOrders);
router.get('/:id' , IsAuth , fetchSingleOrder);
router.post('/new' , IsAuth , createOrder);
router.get('/payment/:id' , fetchOrderForPayment);
router.get('/restaurant/:restaurantId' , IsAuth , isSeller , fetchRestaurantOrders);
router.put('/:orderId' , IsAuth , isSeller , updateOrderStatus);




export default router;
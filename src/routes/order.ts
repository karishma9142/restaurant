import express from 'express';
import { IsAuth, isSeller } from '../middleware/isAuth.js';
import { assignRiderToOrder, createOrder, fetchOrderForPayment, fetchRestaurantOrders, fetchSingleOrder, getCurrentOrderForRider, getMyOrders, updateOrderStatus, updateOrderStatusRider } from '../controllers/order.js';

const router = express.Router();

router.get('/myorder' , IsAuth , getMyOrders);
router.get('/:id' , IsAuth , fetchSingleOrder);
router.post('/new' , IsAuth , createOrder);
router.get('/payment/:id' , fetchOrderForPayment);
router.get('/restaurant/:restaurantId' , IsAuth , isSeller , fetchRestaurantOrders);
router.put('/:orderId' , IsAuth , isSeller , updateOrderStatus);
router.put('/assign/rider' , assignRiderToOrder);
router.get('/current/rider' , getCurrentOrderForRider);
router.purge('update/status/rider' , updateOrderStatusRider);


export default router;
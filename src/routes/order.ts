import express from 'express';
import { IsAuth } from '../middleware/isAuth.js';
import { createOrder, fetchOrderForPayment } from '../controllers/order.js';

const router = express.Router();

router.post('/new' , IsAuth , createOrder);
router.get('/payment/:id' , fetchOrderForPayment);


export default router;
import express from 'express';
import { IsAuth } from '../middleware/isAuth.js';
import { addCart, clearCart, decrementCartitem, fetchMyCart, incrementCartitem } from '../controllers/cart.js';

const router = express.Router();

router.post('/add' , IsAuth , addCart);
router.get('/all' , IsAuth , fetchMyCart);
router.put('/inc' , IsAuth , incrementCartitem);
router.put('/dec' , IsAuth , decrementCartitem);
router.delete('/clear' , IsAuth , clearCart);

export default router;
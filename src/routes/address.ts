import express from 'express';
import { IsAuth } from '../middleware/isAuth.js';
import { addAddress, deleteAddress, getMyAddress } from '../controllers/address.js';

const router = express.Router();

router.post('/new' , IsAuth,addAddress);
router.delete('/:id' , IsAuth,deleteAddress);
router.get('/all' , IsAuth,getMyAddress);

export default router;
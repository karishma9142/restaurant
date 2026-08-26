import express from 'express';
import { addRestaurant, FetchMyRestaurant } from '../controllers/restaraunt.js';
import { IsAuth, isSeller } from '../middleware/isAuth.js';

const router = express.Router();
router.post('/new' ,IsAuth , isSeller, addRestaurant);
router.get('/my' , IsAuth , isSeller ,FetchMyRestaurant);

export default router;
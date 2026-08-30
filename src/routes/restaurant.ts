import express from 'express';
import { addRestaurant, FetchMyRestaurant, updateRestaurant, updateStatusRestaurant } from '../controllers/restaraunt.js';
import { IsAuth, isSeller } from '../middleware/isAuth.js';
import uploadFile from '../middleware/multer.js';

const router = express.Router();
router.post('/new' ,IsAuth , isSeller,uploadFile, addRestaurant);
router.get('/my' , IsAuth , isSeller ,FetchMyRestaurant);
router.put('/status' , IsAuth , isSeller ,updateStatusRestaurant);
router.put('/edit' , IsAuth , isSeller ,updateRestaurant);

export default router;
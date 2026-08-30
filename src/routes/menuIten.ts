import express from 'express';
import { IsAuth, isSeller } from '../middleware/isAuth.js';
import { addMenuItem, deleteMenuItem, getAllItems, toggleMenuAvailability } from '../controllers/menuItem.js';
import uploadFile from '../middleware/multer.js';

const router = express.Router();

router.post('/new' , IsAuth , isSeller,uploadFile, addMenuItem);
router.get('/all/:id' , IsAuth , getAllItems);
router.delete('/:itemId' , IsAuth,isSeller , deleteMenuItem);
router.put('/status/:itemId',IsAuth , isSeller , toggleMenuAvailability);

export default router;
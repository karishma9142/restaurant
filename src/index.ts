import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import restaurantRoutes from './routes/restaurant.js'
import itemRoutes from './routes/menuIten.js';
import cartRoutes from './routes/Cart.js';
import addressRoutes from './routes/address.js';

dotenv.config();
connectDB();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5001

app.use('/api/restaurant' , restaurantRoutes);
app.use('/api/item' , itemRoutes);
app.use('/api/cart' , cartRoutes);
app.use('/api/address' ,addressRoutes);

app.listen(PORT);
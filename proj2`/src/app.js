
import {config} from "dotenv"
import express from 'express';

config({
    path: '.env'
})
const app = express();
app.use(express.json());

// Route for product
import productRouter from './routes/product.js';
app.use('/product', productRouter);
// Route for order
import orderRouter from './routes/order.js';
app.use('/order', orderRouter);
// Route for comments
import commentsRouter from './routes/comments.js';
app.use('/comments', commentsRouter);
// Route for User
import userRouter from './routes/user.js';
app.use('/user', userRouter);

const port = 3001
app.listen(port, () => {
console.log(`Server is running on port ${port}`);
});

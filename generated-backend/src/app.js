import {config} from "dotenv"
import express from 'express';

config({
    path: '.env'
})
const app = express();
app.use(express.json());

// Route for User
import userRouter from './routes/user.js';
app.use('/user', userRouter);

const port = 3002
app.listen(port, () => {
console.log(`Server is running on port ${port}`);
});

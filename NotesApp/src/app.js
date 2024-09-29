
import {config} from "dotenv"
import express from 'express';

config({
    path: '.env'
})
const app = express();
app.use(express.json());

// Route for user
import userRouter from './routes/user.js';
app.use('/user', userRouter);
// Route for note
import noteRouter from './routes/note.js';
app.use('/note', noteRouter);

const port = 3001
app.listen(port, () => {
console.log(`Server is running on port ${port}`);
});

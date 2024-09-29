
import {config} from "dotenv"
import express from 'express';

config({
    path: '.env'
})
const app = express();
app.use(express.json());

// Route for post
import postRouter from './routes/post.js';
app.use('/post', postRouter);
// Route for comment
import commentRouter from './routes/comment.js';
app.use('/comment', commentRouter);

const port = 3001
app.listen(port, () => {
console.log(`Server is running on port ${port}`);
});

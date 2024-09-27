
import {config} from "dotenv"
import express from 'express';

config({
    path: '.env'
})
const app = express();
app.use(express.json());

// Route for test1
import test1Router from './routes/test1.js';
app.use('/test1', test1Router);
// Route for test3
import test3Router from './routes/test3.js';
app.use('/test3', test3Router);

const port = 3001
app.listen(port, () => {
console.log(`Server is running on port ${port}`);
});

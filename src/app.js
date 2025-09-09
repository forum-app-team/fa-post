import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import postsRouter from './routes/posts.js';
import { errorHandler } from './middleware/errors.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/posts', postsRouter);

app.use(errorHandler);
export default app;

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireVerified } from '../middleware/verified.js';
import { createPost, publishPost, listPublished, getPost, updatePost } from '../controllers/posts.controller.js';

const r = Router();

r.get('/', requireAuth, listPublished);
r.get('/:id', requireAuth, getPost);

r.post('/', requireAuth, requireVerified, createPost);
r.put('/:id', requireAuth, requireVerified, updatePost);
r.put('/:id/publish', requireAuth, requireVerified, publishPost);

export default r;

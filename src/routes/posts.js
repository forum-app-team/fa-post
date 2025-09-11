import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireVerified } from '../middleware/verified.js';
import { requireOwner } from "../middleware/ownership.js";
import { requireAdmin } from '../middleware/roles.js';
import {
    createPost,
    publishPost,
    listPublished,
    getPost,
    updatePost,
    deletePost,
    recoverPost,
    archivePost,
    unarchivePost,
    hidePost,
    unhidePost,
    banPost,
    unbanPost
} from '../controllers/posts.controller.js';

const r = Router();

r.get('/', requireAuth, listPublished);
r.get('/:id', requireAuth, getPost);

r.post('/', requireAuth, requireVerified, createPost);
r.put('/:id', requireAuth, requireVerified, updatePost);
r.put('/:id/publish', requireAuth, requireVerified, publishPost);

r.delete('/:id', requireAuth, requireVerified, deletePost);

r.post('/:id/archive',   requireAuth, requireVerified, archivePost);
r.post('/:id/unarchive', requireAuth, requireVerified, unarchivePost);
r.post('/:id/hide',      requireAuth, requireVerified, hidePost);
r.post('/:id/unhide',    requireAuth, requireVerified, unhidePost);

r.post('/:id/ban',     requireAuth, requireVerified, requireAdmin, banPost);
r.post('/:id/unban',   requireAuth, requireVerified, requireAdmin, unbanPost);
r.post('/:id/recover', requireAuth, requireVerified, requireAdmin, recoverPost);

export default r;

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
import {
    listRepliesByPost,
    createReply,
    updateReply,
    deleteReply,
} from '../controllers/replies.controller.js';

const r = Router();


import { listTopPosts, listDrafts } from '../controllers/posts.controller.js';

// Top posts (by replies, desc)
r.get('/top', requireAuth, listTopPosts);
// Drafts (unpublished posts for current user)
r.get('/drafts', requireAuth, listDrafts);

// Posts
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

// Replies (nested under /api/posts)
r.get('/:postId/replies', requireAuth, listRepliesByPost);
r.post('/:postId/replies', requireAuth, requireVerified, createReply);
r.put('/:postId/replies/:id', requireAuth, requireVerified, updateReply);
r.delete('/:postId/replies/:id', requireAuth, requireVerified, deleteReply);

export default r;

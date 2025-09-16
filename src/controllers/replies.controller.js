import { Post } from '../models/Post.js';
import { Reply } from '../models/Reply.js';

const isAdmin = (user) => ['admin', 'super-admin'].includes(user?.role);
const isOwner = (userId, entity) => userId === entity.userId;

async function loadPostVisible(req, res) {
  const post = await Post.findByPk(req.params.postId);
  if (!post) { res.status(404).json({ message: 'Post not found' }); return null; }

  const owner = isOwner(req.user?.sub, post);
  const admin = isAdmin(req.user);
  const visible = (() => {
    switch (post.status) {
      case 'Published': return true;
      case 'Unpublished':
      case 'Hidden': return owner;
      case 'Banned':
      case 'Deleted': return owner || admin;
      default: return false;
    }
  })();
  if (!visible) { res.status(403).json({ message: 'Forbidden' }); return null; }
  return post;
}

function toReplyDTO(r) {
  return {
    id: r.id,
    postId: r.postId,
    parentReplyId: r.parentReplyId || null,
    userId: r.userId,
    content: r.content,
    isActive: !!r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function listRepliesByPost(req, res, next) {
  try {
    const post = await loadPostVisible(req, res); if (!post) return;

    const rows = await Reply.findAll({ where: { postId: post.id, isActive: true }, order: [['createdAt','ASC']] });
    const items = rows.map(toReplyDTO);

    // Build nested tree
    const byId = new Map(items.map(i => [i.id, { ...i, children: [] }]));
    const roots = [];
    for (const r of byId.values()) {
      if (r.parentReplyId && byId.has(r.parentReplyId)) {
        byId.get(r.parentReplyId).children.push(r);
      } else {
        roots.push(r);
      }
    }
    return res.json(roots);
  } catch (err) { next(err); }
}

export async function createReply(req, res, next) {
  try {
    const post = await loadPostVisible(req, res); if (!post) return;
    // Business rules: cannot reply if post is archived or not Published
    if (post.isArchived) return res.status(400).json({ message: 'Replies are disabled for this post' });
    if (post.status !== 'Published') return res.status(400).json({ message: 'Can only reply to Published posts' });

    const userId = req.user.sub;
    const { content, parentReplyId = null } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'content is required' });
    }

    let parent = null;
    if (parentReplyId) {
      parent = await Reply.findByPk(parentReplyId);
      if (!parent || !parent.isActive || parent.postId !== post.id) {
        return res.status(400).json({ message: 'Invalid parentReplyId' });
      }
    }

    const created = await Reply.create({ postId: post.id, userId, parentReplyId, content: content.trim() });
    return res.status(201).json(toReplyDTO(created));
  } catch (err) { next(err); }
}

export async function updateReply(req, res, next) {
  try {
    const post = await loadPostVisible(req, res); if (!post) return;
    const reply = await Reply.findByPk(req.params.id);
    if (!reply || reply.postId !== post.id) return res.status(404).json({ message: 'Reply not found' });
    if (!reply.isActive) return res.status(400).json({ message: 'Reply is inactive' });

    const isAuthor = isOwner(req.user.sub, reply);
    if (!isAuthor) return res.status(403).json({ message: 'Forbidden' });

    const { content } = req.body;
    if (content !== undefined) {
      if (typeof content !== 'string' || !content.trim()) return res.status(400).json({ message: 'Invalid content' });
      reply.content = content.trim();
    }
    await reply.save();
    return res.json(toReplyDTO(reply));
  } catch (err) { next(err); }
}

export async function deleteReply(req, res, next) {
  try {
    const post = await loadPostVisible(req, res); if (!post) return;
    const reply = await Reply.findByPk(req.params.id);
    if (!reply || reply.postId !== post.id) return res.status(404).json({ message: 'Reply not found' });

    const author = isOwner(req.user.sub, reply);
    const admin = isAdmin(req.user);
    const postOwner = isOwner(req.user.sub, post);

    if (!(author || admin || postOwner)) return res.status(403).json({ message: 'Forbidden' });

    reply.isActive = false; // soft-delete
    await reply.save();
    return res.status(204).end();
  } catch (err) { next(err); }
}


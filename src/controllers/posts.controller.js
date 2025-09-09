import { Post } from '../models/Post.js';

// create a post
export async function createPost(req, res, next) {
    try {
        const userId = req.user.sub;
        const { title, content, images = [], attachments = [] } = req.body;

        const post = await Post.create({ userId, title, content, images, attachments, status: 'Unpublished' });
        return res.status(201).json(toPostDetail(post));
    } catch (err) { next(err); }
}

// publish a post
export async function publishPost(req, res, next) {
    try {
        const { id } = req.params;
        const post = await Post.findByPk(id);
        if (!post) return res.status(404).json({ message: 'Not found' });

        if (post.userId !== req.user.sub) return res.status(403).json({ message: 'Forbidden' });

        if (post.status === 'Banned') return res.status(403).json({ message: 'Post is banned' });
        if (post.status === 'Deleted') return res.status(403).json({ message: 'Post is deleted' });

        post.status = 'Published';
        await post.save();

        return res.json(toPostDetail(post));
    } catch (err) { next(err); }
}

// list published posts
export async function listPublished(req, res, next) {
    try {
        const posts = await Post.findAll({
            where: { status: 'Published' },
            order: [['createdAt', 'DESC']],
            attributes: ['id','userId','title','createdAt']
        });
        return res.json(posts.map(toHomeCard));
    } catch (err) { next(err); }
}

// get post detail
export async function getPost(req, res, next) {
    try {
        const { id } = req.params;
        const post = await Post.findByPk(id);
        if (!post) return res.status(404).json({ message: 'Not found' });

        const isOwner = req.user.sub === post.userId;
        const isAdmin = req.user.role === 'admin';

        if (post.status === 'Published') {
        } else if (['Unpublished','Hidden'].includes(post.status)) {
            if (!isOwner) return res.status(403).json({ message: 'Forbidden' });
        } else if (post.status === 'Banned') {
            if (!(isOwner || isAdmin)) return res.status(403).json({ message: 'Forbidden' });
        } else if (post.status === 'Deleted') {
            if (!isOwner) return res.status(403).json({ message: 'Forbidden' });
        }

        return res.json(toPostDetail(post));
    } catch (err) { next(err); }
}


// update post
export async function updatePost(req, res, next) {
    try {
        const { id } = req.params;
        const { title, content, images, attachments, isArchived } = req.body;

        const post = await Post.findByPk(id);
        if (!post) return res.status(404).json({ message: 'Not found' });
        if (post.userId !== req.user.sub) return res.status(403).json({ message: 'Forbidden' });
        if (post.status === 'Banned' || post.status === 'Deleted') return res.status(403).json({ message: 'Blocked by state' });

        const titleChanged = title !== undefined && title !== post.title;
        const contentChanged = content !== undefined && content !== post.content;

        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        if (images !== undefined) post.images = images;
        if (attachments !== undefined) post.attachments = attachments;
        if (typeof isArchived === 'boolean') post.isArchived = isArchived;

        if (titleChanged || contentChanged) post.lastEditedAt = new Date();

        await post.save();
        return res.json(toPostDetail(post));
    } catch (err) { next(err); }
}


function toHomeCard(p) {
    return {
        id: p.id,
        userId: p.userId,
        title: p.title,
        date: p.createdAt
    };
}
function toPostDetail(p) {
    return {
        id: p.id,
        userId: p.userId,
        title: p.title,
        content: p.content,
        status: p.status,
        isArchived: p.isArchived,
        images: p.images || [],
        attachments: p.attachments || [],
        postDate: p.createdAt,
        updateDate: p.updatedAt,
        lastEditedAt: p.lastEditedAt
    };
}

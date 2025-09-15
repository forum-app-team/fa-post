import { Post } from '../models/Post.js';

const isAdmin = (user) => ['admin','super-admin'].includes(user?.role);
const isOwner = (user, post) => user?.sub === post.userId;

async function loadPost(id, res) {
    const post = await Post.findByPk(id);
    if (!post) res.status(404).json({message:'Post not found'});
    return post;
}


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
        const post = await loadPost(req.params.id, res); if (!post) return;

        if (!isOwner(req.user, post)) return res.status(403).json({message:'Forbidden'});

        if (post.status !== 'Unpublished') return res.status(400).json({message:'Only drafts can be published'});
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
        return res.json(posts.map(toPostDetail));
    } catch (err) { next(err); }
}

// get post detail
export async function getPost(req, res, next) {
    try {
        const post = await loadPost(req.params.id, res); if (!post) return;

        const owner = isOwner(req.user, post);
        const admin = isAdmin(req.user);

        const visible = (() => {
            switch (post.status) {
                case 'Published':   return true;
                case 'Unpublished':
                case 'Hidden':      return owner;
                case 'Banned':
                case 'Deleted':     return owner || admin;
                default:            return false;
            }
        })();
        if (!visible) return res.status(403).json({message:'Forbidden'});
        return res.json(toPostDetail(post));
    } catch (err) { next(err); }
}


// update post
export async function updatePost(req, res, next) {
    try {
        const post = await loadPost(req.params.id, res); if (!post) return;
        if (!isOwner(req.user, post)) return res.status(403).json({message:'Forbidden'});
        if (['Banned','Deleted'].includes(post.status)) return res.status(400).json({message:'Cannot edit banned/deleted'});

        const { title, content, images, attachments, isArchived } = req.body;
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

// delete post
export async function deletePost(req, res, next) {
    try {
        const post = await loadPost(req.params.id, res); if (!post) return;
        if (!isOwner(req.user, post)) return res.status(403).json({message:'Forbidden'});
        post.status = 'Deleted';
        await post.save();
        return res.status(204).end();
    } catch (err) { next(err); }
}

// recover post
export async function recoverPost(req, res, next) {
    try {
        const post = await loadPost(req.params.id, res); if (!post) return;
        if (!isAdmin(req.user)) return res.status(403).json({message:'Admin only'});
        if (post.status !== 'Deleted') return res.status(400).json({message:'Not deleted'});
        post.status = 'Published';
        await post.save();
        return res.json(toPostDetail(post));
    } catch (err) { next(err); }
}

// archive post
export async function archivePost(req, res, next) {
    try {
        const post = await loadPost(req.params.id, res); if (!post) return;
        if (!isOwner(req.user, post)) return res.status(403).json({ message: 'Forbidden' });
        if (['Banned', 'Deleted'].includes(post.status)) {
            return res.status(400).json({ message: 'Not allowed on banned/deleted posts' });
        }
        if (!post.isArchived) {
            post.isArchived = true;
            await post.save();
        }
        return res.json(toPostDetail(post));
    } catch (err) { next(err); }
}

// unarchive post
export async function unarchivePost(req, res, next) {
    try {
        const post = await loadPost(req.params.id, res); if (!post) return;
        if (!isOwner(req.user, post)) return res.status(403).json({ message: 'Forbidden' });
        if (['Banned', 'Deleted'].includes(post.status)) {
            return res.status(400).json({ message: 'Not allowed on banned/deleted posts' });
        }
        if (post.isArchived) {
            post.isArchived = false;
            await post.save();
        }
        return res.json(toPostDetail(post));
    } catch (err) { next(err); }
}

// hide post
export async function hidePost(req, res, next) {
    try {
        const post = await loadPost(req.params.id, res); if (!post) return;
        if (!isOwner(req.user, post)) return res.status(403).json({ message: 'Forbidden' });
        if (['Banned', 'Deleted'].includes(post.status)) {
            return res.status(400).json({ message: 'Not allowed on banned/deleted posts' });
        }
        if (post.status !== 'Published')
            return res.status(400).json({ message: 'Only Published can be hidden' });

        post.status = 'Hidden';
        await post.save();
        return res.json(toPostDetail(post));
    } catch (err) { next(err); }
}

// unhide post
export async function unhidePost(req, res, next) {
    try {
        const post = await loadPost(req.params.id, res); if (!post) return;
        if (!isOwner(req.user, post)) return res.status(403).json({ message: 'Forbidden' });
        if (['Banned', 'Deleted'].includes(post.status)) {
            return res.status(400).json({ message: 'Not allowed on banned/deleted posts' });
        }
        if (post.status !== 'Hidden')
            return res.status(400).json({ message: 'Only Hidden can be unhidden' });

        post.status = 'Published';
        await post.save();

        return res.json(toPostDetail(post));
    } catch (err) { next(err); }
}


// ban post
export async function banPost(req, res, next) {
    try {
        const post = await loadPost(req.params.id, res); if (!post) return;
        if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin only' });
        if (post.status !== 'Published') {
            return res.status(400).json({ message: 'Only Published can be banned' });
        }
        post.status = 'Banned';
        await post.save();
        return res.json(toPostDetail(post));
    } catch (err) { next(err); }
}

// unban post
export async function unbanPost(req, res, next) {
    try {
        const post = await loadPost(req.params.id, res); if (!post) return;
        if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin only' });
        if (post.status !== 'Banned') {
            return res.status(400).json({ message: 'Not currently banned' });
        }
        post.status = 'Published';
        await post.save();
        return res.json(toPostDetail(post));
    } catch (err) { next(err); }
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

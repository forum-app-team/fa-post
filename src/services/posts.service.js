//import axios from "axios";
import { literal, Op } from "sequelize";
import { Post } from '../models/Post.js';

const genError = (message, status) => {
    const err = new Error(message);
    err.status = status;
    return err;
};

export const filterPosts = async (query) => {
    const { status, q, field = 'title', sort = 'createdAt', ascending = 'false' } = query;
    let offset = Number(query.offset), limit = Number(query.limit);
    if (!Number.isInteger(offset) || !Number.isInteger(limit))
        throw genError('Limit and offset must be integers.', 400);
    offset = Math.max(0, offset);
    limit = Math.max(10, limit);

    const where = { status };
    if (q && q.trim()) {
        if (field === 'title')
            where.title = { [Op.like]: `%${q.trim()}%` };
        else if (field === 'author') {
            ;
        } else throw genError(`Unknown search field ${field}`, 400);
    }
    
    const replyWhere = [
        `r.postId = Post.id`,
        `r.isActive = 1` 
    ].join(" AND ");

    const replyCountSql = `(SELECT COUNT(*) FROM replies r WHERE ${replyWhere})`;

    const total = await Post.count({ where });
    if (total <= offset)
        offset = Math.floor(total / limit) * limit;

    const order = [], ord = ascending === 'true' ? "ASC" : "DESC";
    if (sort === 'replyCount') {
        order.push([literal("replyCount"), ord])
    }
    order.push(["createdAt", sort !== 'createdAt' ? "DESC" : ord]);
    order.push(["id", "DESC"]);


    const rows = await Post.findAll({
        where,
        attributes: [
            "id", "title", "createdAt", "userId",
            [literal(replyCountSql), "replyCount"],
        ],
        order,
        limit,
        offset,
        subQuery: false,
    });

    return {
        total,
        items: rows.map(r => ({
            id: r.id,
            title: r.title,
            createdAt: r.createdAt,
            userId: r.userId,
            replyCount: Number(r.get("replyCount")),
        })),
    };
};
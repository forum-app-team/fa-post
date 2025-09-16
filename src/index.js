import 'dotenv/config';
import app from './app.js';
import { sequelize } from './config/db.js';
import { Post } from './models/Post.js';
import { Reply } from './models/Reply.js';

// Optional: define associations if needed
// Reply.belongsTo(Post, { foreignKey: 'postId' });
// Reply.belongsTo(Reply, { as: 'parent', foreignKey: 'parentReplyId' });
// Reply.hasMany(Reply, { as: 'children', foreignKey: 'parentReplyId' });

const PORT = process.env.PORT || 3002;

(async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('Database connected.');
    } catch (err) {
        console.warn('Database unavailable, starting server without DB (messages endpoint will still work).');
        console.warn(err?.message);
    }
    app.listen(PORT, () => console.log(`Post service on :${PORT}`));
})();

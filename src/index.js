import 'dotenv/config';
import app from './app.js';
import { sequelize } from './config/db.js';
import { Post } from './models/Post.js';
import { Reply } from './models/Reply.js';
import { initRabbit, closeRabbit } from './messaging/rabbit.js';

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

    // Init RabbitMQ (non-fatal if not available)
    await initRabbit();

    const server = app.listen(PORT, () => console.log(`Post service on :${PORT}`));

    const shutdown = async () => {
        try { await closeRabbit(); } catch {}
        server.close(() => process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
})();

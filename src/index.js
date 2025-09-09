import 'dotenv/config';
import app from './app.js';
import { sequelize } from './config/db.js';
import { Post } from './models/Post.js';

const PORT = process.env.PORT || 3002;

(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => console.log(`Post service on :${PORT}`));
})();

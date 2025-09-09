import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Post = sequelize.define('Post', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },

    title: { type: DataTypes.STRING(200), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },

    status: {
        type: DataTypes.ENUM('Unpublished', 'Published', 'Hidden', 'Banned', 'Deleted'),
        allowNull: false,
        defaultValue: 'Unpublished'
    },
    isArchived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    images: { type: DataTypes.JSON, allowNull: true },
    attachments: { type: DataTypes.JSON, allowNull: true },

    lastEditedAt: { type: DataTypes.DATE, allowNull: true }
}, {
    tableName: 'posts',
    timestamps: true,
    indexes: [
        { fields: ['status', 'createdAt'] },
        { fields: ['userId'] }
    ]
});

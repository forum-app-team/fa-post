import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Reply = sequelize.define('Reply', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  postId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  parentReplyId: { type: DataTypes.UUID, allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'replies',
  timestamps: true,
  indexes: [
    { fields: ['postId', 'createdAt'] },
    { fields: ['parentReplyId'] },
    { fields: ['userId'] },
  ],
});

import { Server as SocketIOServer } from 'socket.io';
import db from '../utils/db';

export class NotificationService {
    private io: SocketIOServer;
    private subscriptions: Map<string, Set<string>>;

    constructor(io: SocketIOServer) {
        this.io = io;
        this.subscriptions = new Map();
    }

    async subscribe(userId: string, categories: string[]) {
        if (categories.includes('all')) {
            categories = ['new_friend_request', 'new_broadcast_message', 'accept_friend_request', 'other_categories']; // Add all categories
        }
        if (!this.subscriptions.has(userId)) {
            this.subscriptions.set(userId, new Set());
        }
        categories.forEach(category => this.subscriptions.get(userId)?.add(category));

        // Store the subscription in the database
        await db.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
        for (const category of categories) {
            await db.query('INSERT INTO subscriptions (user_id, category) VALUES ($1, $2)', [userId, category]);
        }
    }

    async unsubscribe(userId: string) {
        this.subscriptions.delete(userId);
        await db.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
    }

    async sendNotificationOnDemand(senderId: string, receiverUserId: string, category: string, message: string) {
        if (category === 'broadcast') {
            const query = 'SELECT user_id FROM subscriptions WHERE category = $1';
            const result = await db.query(query, [category]);
            const userIds = result.rows.map((row: any) => row.user_id);
            for (const userId of userIds) {
                await this.storeNotification(senderId, userId, category, message, 'unread');
                this.sendNotification(userId, category, { senderId, message });
            }
        } else {
            await this.storeNotification(senderId, receiverUserId, category, message, 'unread');
            this.sendNotification(receiverUserId, category, { senderId, message });
        }
    }

    async sendNotification(userId: string, category: string, message: any) {
        if (this.subscriptions.has(userId) && this.subscriptions.get(userId)?.has(category)) {
            this.io.to(userId).emit('notification', message);
        }
    }

    async storeNotification(senderId: string, receiverUserId: string, category: string, message: string, status: string) {
        const query = 'INSERT INTO notifications (sender_id, receiver_user_id, category, message, status) VALUES ($1, $2, $3, $4, $5)';
        await db.query(query, [senderId, receiverUserId, category, message, status]);
    }

    async getNotifications(receiverUserId: string) {
        const query = 'SELECT * FROM notifications WHERE receiver_user_id = $1 ORDER BY created_at DESC';
        const result = await db.query(query, [receiverUserId]);
        return result.rows;
    }

    async markAsRead(id: string) {
        const query = 'UPDATE notifications SET status = $1 WHERE id = $2';
        await db.query(query, ['read', id]);
    }
}

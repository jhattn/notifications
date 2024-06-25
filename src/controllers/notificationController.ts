import { Server } from 'restify';
import { Server as SocketIOServer } from 'socket.io';
import { NotificationService } from '../services/notificationService';

export function createNotificationController(server: Server, io: SocketIOServer) {
    const notificationService = new NotificationService(io);

    server.post('/notifications/subscribe', async (req, res) => {
        const { userId, categories } = req.body;
        try {
            await notificationService.subscribe(userId, categories);
            res.send(200, { message: 'Subscribed to notifications successfully' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    server.post('/notifications/unsubscribe', async (req, res) => {
        const { userId } = req.body;
        try {
            await notificationService.unsubscribe(userId);
            res.send(200, { message: 'Unsubscribed from notifications successfully' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    server.post('/notifications/send', async (req, res) => {
        const { senderId, receiverUserId, category, message } = req.body;
        try {
            await notificationService.sendNotificationOnDemand(senderId, receiverUserId, category, message);
            res.send(200, { message: 'Notification sent successfully' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    server.get('/notifications/:userId', async (req, res) => {
        const { userId } = req.params;
        try {
            const notifications = await notificationService.getNotifications(userId);
            res.send(200, notifications);
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    server.post('/notifications/read/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await notificationService.markAsRead(id);
            res.send(200, { message: 'Notification marked as read' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    // Endpoint to mock SQS message
    server.post('/notifications/mock-sqs', async (req, res) => {
        const { senderId, receiverUserId, category, message } = req.body;
        try {
            await notificationService.handleMockSQSMessage({ senderId, receiverUserId, category, message });
            res.send(200, { message: 'Mock SQS message processed successfully' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    // Endpoint to add web push subscription
    server.post('/notifications/push-subscribe', async (req, res) => {
        const { userId, subscription } = req.body;
        try {
            await notificationService.addPushSubscription(userId, subscription);
            res.send(200, { message: 'Push subscription added successfully' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });
}

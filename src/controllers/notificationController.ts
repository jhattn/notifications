import { Server } from 'restify';
import { Server as SocketIOServer } from 'socket.io';
import { NotificationService } from '../services/notificationService';

/**
 * Creates a notification controller with the specified server and Socket.IO server instance.
 * @param server - The server instance.
 * @param io - The Socket.IO server instance.
 */
export function createNotificationController(server: Server, io: SocketIOServer) {
    const notificationService = new NotificationService(io);

    /**
     * Endpoint to subscribe to notifications.
     * @param req - The request object.
     * @param res - The response object.
     */
    server.post('/notifications/subscribe', async (req, res) => {
        const { userId, categories } = req.body;
        try {
            await notificationService.subscribe(userId, categories);
            res.send(200, { message: 'Subscribed to notifications successfully' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    /**
     * Endpoint to unsubscribe from notifications.
     * @param req - The request object.
     * @param res - The response object.
     */
    server.post('/notifications/unsubscribe', async (req, res) => {
        const { userId } = req.body;
        try {
            await notificationService.unsubscribe(userId);
            res.send(200, { message: 'Unsubscribed from notifications successfully' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    /**
     * Endpoint to send a notification on demand.
     * @param req - The request object.
     * @param res - The response object.
     */
    server.post('/notifications/send', async (req, res) => {
        const { senderId, receiverUserId, category, message } = req.body;
        try {
            await notificationService.sendNotificationOnDemand(senderId, receiverUserId, category, message);
            res.send(200, { message: 'Notification sent successfully' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    /**
     * Endpoint to get notifications for a specific user.
     * @param req - The request object.
     * @param res - The response object.
     */
    server.get('/notifications/:userId', async (req, res) => {
        const { userId } = req.params;
        try {
            const notifications = await notificationService.getNotifications(userId);
            res.send(200, notifications);
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    /**
     * Endpoint to mark a notification as read.
     * @param req - The request object.
     * @param res - The response object.
     */
    server.post('/notifications/read/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await notificationService.markAsRead(id);
            res.send(200, { message: 'Notification marked as read' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    /**
     * Endpoint to mock SQS message.
     * @param req - The request object.
     * @param res - The response object.
     */
    server.post('/notifications/mock-sqs', async (req, res) => {
        const { senderId, receiverUserId, category, message } = req.body;
        try {
            await notificationService.handleMockSQSMessage({ senderId, receiverUserId, category, message });
            res.send(200, { message: 'Mock SQS message processed successfully' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    /**
     * Endpoint to add web push subscription.
     * @param req - The request object.
     * @param res - The response object.
     */
    server.post('/notifications/push-subscribe', async (req, res) => {
        const { userId, subscription } = req.body;
        try {
            await notificationService.addPushSubscription(userId, subscription);
            res.send(200, { message: 'Push subscription added successfully' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    /**
     * Endpoint to send a test push notification.
     * @param req - The request object.
     * @param res - The response object.
     */
    server.post('/notifications/push-send', async (req, res) => {
        const { userId, message } = req.body;
        try {
            await notificationService.sendPushNotification(userId, { title: 'Test Push Notification', message: message });
            res.send(200, { message: 'Test push notification sent successfully' });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });

    // add an endpoint for unread notifications count
    server.get('/notifications/unread/:userId', async (req, res) => {
        const { userId } = req.params;
        try {
            const count = await notificationService.getUnreadNotificationsCount(userId);
            res.send(200, { count });
        } catch (error: any) {
            res.send(500, { error: error.message });
        }
    });
}

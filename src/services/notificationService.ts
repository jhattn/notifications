import { Server as SocketIOServer } from "socket.io";
import db from "../utils/db";
import { webpush } from "../utils/webPush";
import { PushSubscription } from "web-push";

interface Message {
  senderId: string;
  receiverUserId?: string; // Optional since it's not needed for broadcast messages
  message: string;
  category: string;
}

export class NotificationService {
  private io: SocketIOServer;
  private subscriptions: Map<string, Set<string>>;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.subscriptions = new Map();
  }

  async subscribe(userId: string, categories: string[]) {
    if (categories.includes("all")) {
      categories = [
        "new_friend_request",
        "new_broadcast_message",
        "accept_friend_request",
        "other_categories",
      ];
    }
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, new Set());
    }
    categories.forEach((category) =>
      this.subscriptions.get(userId)?.add(category)
    );

    await db.query("DELETE FROM subscriptions WHERE user_id = $1", [userId]);
    for (const category of categories) {
      await db.query(
        "INSERT INTO subscriptions (user_id, category) VALUES ($1, $2)",
        [userId, category]
      );
    }
  }

  async unsubscribe(userId: string) {
    this.subscriptions.delete(userId);
    await db.query("DELETE FROM subscriptions WHERE user_id = $1", [userId]);
  }

  async addPushSubscription(userId: string, subscription: PushSubscription) {
    const query =
      "INSERT INTO push_subscriptions (user_id, subscription) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET subscription = $2";
    await db.query(query, [userId, subscription]);
  }

  async sendPushNotification(userId: string, message: any) {
    const query =
      "SELECT subscription FROM push_subscriptions WHERE user_id = $1";
    const result = await db.query(query, [userId]);
    console.log("result", result.rows);
    if (result.rows.length > 0) {
      const subscription: PushSubscription = result.rows[0].subscription;
      console.log({ subscription, message });

      await webpush.sendNotification(subscription, JSON.stringify(message));
    }
  }

  async sendNotificationOnDemand(
    senderId: string,
    receiverUserId: string,
    category: string,
    message: string
  ) {
    if (category === "broadcast") {
      const query = "SELECT user_id FROM subscriptions WHERE category = $1";
      const result = await db.query(query, [category]);
      const userIds = result.rows.map((row: any) => row.user_id);
      for (const userId of userIds) {
        await this.storeNotification(
          senderId,
          userId,
          category,
          message,
          "unread"
        );
        this.sendNotification(userId, category, {
          senderId,
          message,
          category,
        });
        await this.sendPushNotification(userId, {
          senderId,
          message,
          category,
        });
      }
    } else {
      await this.storeNotification(
        senderId,
        receiverUserId,
        category,
        message,
        "unread"
      );
      this.sendNotification(receiverUserId, category, {
        senderId,
        receiverUserId,
        message,
        category,
      });
      await this.sendPushNotification(receiverUserId, {
        senderId,
        receiverUserId,
        message,
        category,
      });
    }
  }

  async sendNotification(userId: string, category: string, message: any) {
    if (
      this.subscriptions.has(userId) &&
      this.subscriptions.get(userId)?.has(category)
    ) {
      this.io.to(userId).emit("notification", message);
    }
  }

  async storeNotification(
    senderId: string,
    receiverUserId: string,
    category: string,
    message: string,
    status: string
  ) {
    const query =
      "INSERT INTO notifications (sender_id, receiver_user_id, category, message, status) VALUES ($1, $2, $3, $4, $5)";
    await db.query(query, [
      senderId,
      receiverUserId,
      category,
      message,
      status,
    ]);
  }

  async getNotifications(receiverUserId: string) {
    const query =
      "SELECT * FROM notifications WHERE receiver_user_id = $1 ORDER BY created_at DESC";
    const result = await db.query(query, [receiverUserId]);
    return result.rows;
  }

  async markAsRead(id: string) {
    const query = "UPDATE notifications SET status = $1 WHERE id = $2";
    await db.query(query, ["read", id]);
  }

  // Mock SQS message handling
  async handleMockSQSMessage(message: Message) {
    const { senderId, receiverUserId, category, message: msg } = message;
    if (category === "broadcast") {
      const query = "SELECT user_id FROM subscriptions WHERE category = $1";
      const result = await db.query(query, [category]);
      const userIds = result.rows.map((row: any) => row.user_id);
      for (const userId of userIds) {
        await this.storeNotification(senderId, userId, category, msg, "unread");
        this.sendNotification(userId, category, {
          senderId,
          message: msg,
          category,
        });
        await this.sendPushNotification(userId, {
          senderId,
          message: msg,
          category,
        });
      }
    } else {
      await this.storeNotification(
        senderId,
        receiverUserId!,
        category,
        msg,
        "unread"
      ); // Non-null assertion since receiverUserId should be present
      this.sendNotification(receiverUserId!, category, {
        senderId,
        receiverUserId,
        message: msg,
        category,
      });
      await this.sendPushNotification(receiverUserId!, {
        senderId,
        receiverUserId,
        message: msg,
        category,
      });
    }
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const query =
      "SELECT COUNT(*) FROM notifications WHERE receiver_user_id = $1 AND status = $2";
    const result = await db.query(query, [userId, "unread"]);
    return parseInt(result.rows[0].count, 10);
  }
}

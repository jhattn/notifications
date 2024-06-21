import { SQS } from 'aws-sdk';
import { Server as SocketIOServer } from 'socket.io';
import { NotificationService } from '../services/notificationService';

export class SQSClient {
    private sqs: SQS;
    private queueUrl: string;
    private notificationService: NotificationService;

    constructor(io: SocketIOServer) {
        this.sqs = new SQS({ region: process.env.AWS_REGION });
        this.queueUrl = process.env.SQS_QUEUE_URL!;
        this.notificationService = new NotificationService(io);
    }

    listenForMessages() {
        const params = {
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
        };

        const receiveMessages = () => {
            this.sqs.receiveMessage(params, (err, data) => {
                if (err) {
                    console.error('Error receiving message from SQS:', err);
                    return;
                }

                if (data.Messages) {
                    data.Messages.forEach(message => {
                        const body = JSON.parse(message.Body!);
                        const { userId, category, notification } = body;
                        this.notificationService.sendNotification(userId, category, notification);

                        const deleteParams = {
                            QueueUrl: this.queueUrl,
                            ReceiptHandle: message.ReceiptHandle!,
                        };
                        this.sqs.deleteMessage(deleteParams, (err) => {
                            if (err) {
                                console.error('Error deleting message from SQS:', err);
                            }
                        });
                    });
                }

                // Continuously listen for messages
                receiveMessages();
            });
        };

        receiveMessages();
    }
}

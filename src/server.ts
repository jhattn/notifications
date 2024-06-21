import * as dotenv from 'dotenv';
dotenv.config();

import * as restify from 'restify';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createNotificationController } from './controllers/notificationController';
import { SQSClient } from './utils/sqsClient';
import * as path from 'path';

export function createServer() {
    const server = restify.createServer();
    const io = new SocketIOServer(server.server);

    server.use(restify.plugins.bodyParser());

    createNotificationController(server, io);

    server.get('/test', restify.plugins.serveStatic({
        directory: path.join(__dirname, '../public'),
        file: 'index.html'
    }));

    io.on('connection', (socket: Socket) => {
        console.log('a user connected');

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });

    const sqsClient = new SQSClient(io);
    sqsClient.listenForMessages();

    return server;
}

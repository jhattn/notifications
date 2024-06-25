import * as dotenv from 'dotenv';
dotenv.config();

import * as restify from 'restify';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createNotificationController } from './controllers/notificationController';
import { SQSClient } from './utils/sqsClient';
import * as path from 'path';
import * as fs from 'fs';

export function createServer() {
    const server = restify.createServer();
    const io = new SocketIOServer(server.server);

    server.use(restify.plugins.bodyParser());

    createNotificationController(server, io);

    // Serve the test page with the injected VAPID public key
    server.get('/test', (req, res, next) => {
        const filePath = path.join(__dirname, '../public/index.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.send(500, 'Error reading index.html');
                return next();
            }

            const updatedHtml = data.replace('<%= publicVapidKey %>', process.env.VAPID_PUBLIC_KEY || '');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(updatedHtml);
            res.end();
            return next();
        });
    });

    // Serve the service worker file
    server.get('/sw.js', restify.plugins.serveStatic({
        directory: path.join(__dirname, '../public'),
        file: 'sw.js'
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

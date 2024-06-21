import { createServer } from './server';

const server = createServer();

const PORT = process.env.PORT || 8082;

server.listen(PORT, () => {
    console.log(`Notification service is listening on port ${PORT}`);
});

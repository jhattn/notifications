const webpush = require('web-push');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const vapidKeys = webpush.generateVAPIDKeys();

const envFilePath = path.join(__dirname, '.env');

fs.readFile(envFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading .env file:', err);
        return;
    }

    let envConfig = data;

    if (envConfig.includes('VAPID_PUBLIC_KEY') || envConfig.includes('VAPID_PRIVATE_KEY')) {
        envConfig = envConfig.replace(/VAPID_PUBLIC_KEY=.*/g, `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
        envConfig = envConfig.replace(/VAPID_PRIVATE_KEY=.*/g, `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    } else {
        envConfig += `\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`;
    }

    fs.writeFile(envFilePath, envConfig, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to .env file:', err);
            return;
        }

        console.log('VAPID keys generated and added to .env file successfully.');
    });
});

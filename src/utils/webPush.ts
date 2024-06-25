import * as webpush from 'web-push';
import * as dotenv from 'dotenv';

dotenv.config();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY as string;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY as string;

webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  publicVapidKey,
  privateVapidKey
);

export { webpush, publicVapidKey };

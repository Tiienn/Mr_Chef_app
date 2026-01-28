import webpush from 'web-push';
import { getDb } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;

if (vapidPublicKey && vapidPrivateKey && vapidEmail) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotificationToAll(payload: PushPayload): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
    console.log('Push notifications not configured (missing VAPID keys)');
    return;
  }

  try {
    const db = getDb();
    const subscriptions = await db.select().from(pushSubscriptions);

    if (subscriptions.length === 0) {
      console.log('No push subscriptions found');
      return;
    }

    const notificationPayload = JSON.stringify(payload);

    // Send to all subscriptions in parallel
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationPayload
          );
        } catch (error: unknown) {
          // If subscription is invalid (410 Gone or 404), remove it
          if (error && typeof error === 'object' && 'statusCode' in error) {
            const statusCode = (error as { statusCode: number }).statusCode;
            if (statusCode === 410 || statusCode === 404) {
              console.log('Removing invalid subscription:', sub.endpoint);
              await db.delete(pushSubscriptions).where(
                eq(pushSubscriptions.endpoint, sub.endpoint)
              );
            }
          }
          throw error;
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    console.log(`Push notifications sent: ${successful} successful, ${failed} failed`);
  } catch (error) {
    console.error('Failed to send push notifications:', error);
  }
}

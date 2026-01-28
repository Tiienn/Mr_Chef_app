# Add Push Notifications (Like WhatsApp)

## Goal
Kitchen devices receive notification sound + notification bar alert when new orders are placed, even when phone is locked or browser is closed.

## Approach
Use **Web Push API with VAPID keys** (no Firebase needed). This requires:
1. Service worker to receive push events in background
2. Push subscription stored in database
3. Backend sends push when order is created

## Tasks
- [ ] Install `web-push` package
- [ ] Generate VAPID keys and add to env vars
- [ ] Create database table for push subscriptions
- [ ] Create service worker (`public/sw.js`)
- [ ] Create API endpoint to save push subscriptions (`/api/push/subscribe`)
- [ ] Update Kitchen page to request push permission and subscribe
- [ ] Update Orders POST to send push notification when order created
- [ ] Add PWA manifest for installable app
- [ ] Test on mobile device

## Technical Details

### VAPID Keys
- Generate once: `npx web-push generate-vapid-keys`
- Store in env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`

### Database Schema Addition
```sql
CREATE TABLE push_subscriptions (
  id INTEGER PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Service Worker
- Listens for 'push' events
- Shows notification with sound
- Handles notification click (opens kitchen page)

### Flow
1. Kitchen page loads → requests notification permission
2. If granted → subscribes to push → saves subscription to DB
3. Customer places order → backend sends push to all subscriptions
4. Service worker receives push → shows notification with sound

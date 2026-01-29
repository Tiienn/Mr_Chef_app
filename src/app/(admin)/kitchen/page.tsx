'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChefHat } from 'lucide-react';

// Global audio context (persisted to avoid autoplay issues)
let audioContext: AudioContext | null = null;

// Initialize audio context on user interaction
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// WhatsApp-style notification sound using Web Audio API
function playNotificationSound() {
  try {
    const ctx = initAudioContext();
    if (!ctx) return;

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = 830; // G#5
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.5, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // Second tone (higher)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1046; // C6
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.5, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.35);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}

// Request browser notification permission
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Register service worker and subscribe to push notifications
async function setupPushNotifications(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered');

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Get VAPID public key from environment
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('VAPID public key not configured');
      return;
    }

    // Convert VAPID key to Uint8Array
    const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    // Send subscription to backend
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });

    console.log('Push notifications enabled');
  } catch (error) {
    console.error('Failed to setup push notifications:', error);
  }
}

// Show browser notification for new order
function showOrderNotification(order: Order) {
  if (Notification.permission !== 'granted') return;

  const itemsList = order.items
    .map(item => `${item.quantity}x ${item.menuItemName}`)
    .join(', ');

  const notification = new Notification(`New Order #${order.orderNumber}`, {
    body: `${itemsList}${order.tableNumber ? `\nTable: ${order.tableNumber}` : ''}`,
    icon: '/favicon.ico',
    tag: `order-${order.id}`,
    requireInteraction: true,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  // Auto-close after 10 seconds
  setTimeout(() => notification.close(), 10000);
}

interface OrderItem {
  id: number;
  menuItemName: string;
  quantity: number;
  notes: string | null;
  priceAtTime: number;
}

interface Order {
  id: number;
  orderNumber: string;
  tableNumber: string | null;
  takeaway: boolean;
  status: string;
  total: number;
  createdAt: string | null;
  updatedAt: string | null;
  items: OrderItem[];
}

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500' },
  preparing: { label: 'Preparing', color: 'bg-blue-500' },
  ready: { label: 'Ready', color: 'bg-green-500' },
  served: { label: 'Served', color: 'bg-gray-500' },
};

function formatTime(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const seenOrderIdsRef = useRef<Set<number>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Request notification permission, setup push, and init audio on mount
  useEffect(() => {
    const initNotifications = async () => {
      const granted = await requestNotificationPermission();
      if (granted) {
        await setupPushNotifications();
      }
    };
    initNotifications();

    // Initialize audio context on first user interaction
    const handleInteraction = () => {
      initAudioContext();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const checkForNewOrders = useCallback((newOrders: Order[]) => {
    // Skip notification on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      // Initialize seen orders with all current order IDs
      seenOrderIdsRef.current = new Set(newOrders.map(o => o.id));
      return;
    }

    // Check for new orders that we haven't seen before
    const brandNewOrders = newOrders.filter(order => !seenOrderIdsRef.current.has(order.id));

    if (brandNewOrders.length > 0) {
      // Play sound
      playNotificationSound();

      // Show browser notification for each new order
      brandNewOrders.forEach(order => {
        showOrderNotification(order);
      });

      // Add new order IDs to seen set
      brandNewOrders.forEach(order => seenOrderIdsRef.current.add(order.id));
    }
  }, []);

  useEffect(() => {
    const connectSSE = () => {
      const eventSource = new EventSource('/api/orders/stream');
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('orders', (event) => {
        try {
          const data = JSON.parse(event.data);
          checkForNewOrders(data.orders);
          setOrders(data.orders);
          setIsConnected(true);
          setError(null);
        } catch (err) {
          console.error('Error parsing orders:', err);
        }
      });

      eventSource.addEventListener('heartbeat', () => {
        setIsConnected(true);
      });

      eventSource.addEventListener('error', (event) => {
        if (event instanceof MessageEvent) {
          try {
            const data = JSON.parse(event.data);
            setError(data.message);
          } catch {
            setError('Connection error');
          }
        }
        setIsConnected(false);
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        // Reconnect after 3 seconds
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [checkForNewOrders]);

  const getOrdersByStatus = (status: OrderStatus): Order[] => {
    return orders.filter((order) => order.status === status);
  };

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    if (updatingOrderId) return;

    setUpdatingOrderId(orderId);
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (response.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (err) {
      console.error('Failed to update order:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const activeStatuses: OrderStatus[] = ['pending', 'served'];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <h1 className="text-lg font-semibold">Kitchen Display</h1>
          </Link>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )}
              aria-label={isConnected ? 'Connected' : 'Disconnected'}
            />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Live' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Orders Grid */}
      <main className="flex-1 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          {activeStatuses.map((status) => (
            <div key={status} className="space-y-3">
              {/* Status Column Header */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-3 w-3 rounded-full',
                    STATUS_CONFIG[status].color
                  )}
                />
                <h2 className="font-semibold">{STATUS_CONFIG[status].label}</h2>
                {status === 'pending' && (
                  <span className="text-xs text-muted-foreground">(click to serve)</span>
                )}
                {status === 'served' && (
                  <span className="text-xs text-muted-foreground">(click to undo)</span>
                )}
                <Badge variant="secondary" className="ml-auto">
                  {getOrdersByStatus(status).length}
                </Badge>
              </div>

              {/* Order Cards */}
              <div className="space-y-3">
                {getOrdersByStatus(status).map((order) => (
                  <Card
                    key={order.id}
                    className={cn(
                      'transition-all cursor-pointer',
                      status === 'pending' && 'border-yellow-500/50 hover:bg-accent/50',
                      status === 'served' && 'border-gray-500/50 opacity-75 hover:opacity-100',
                      updatingOrderId === order.id && 'opacity-50'
                    )}
                    onClick={() => updateOrderStatus(order.id, status === 'pending' ? 'served' : 'pending')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updateOrderStatus(order.id, status === 'pending' ? 'served' : 'pending');
                      }
                    }}
                  >
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">
                          #{order.orderNumber}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(order.createdAt)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {order.takeaway && (
                          <Badge className="w-fit bg-orange-500 hover:bg-orange-500">
                            Takeaway
                          </Badge>
                        )}
                        {order.tableNumber && (
                          <Badge variant="outline" className="w-fit">
                            Table {order.tableNumber}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4 px-4">
                      <ul className="space-y-1">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex items-start gap-2">
                            <span className="font-medium text-primary">
                              {item.quantity}x
                            </span>
                            <div className="flex-1">
                              <span>{item.menuItemName}</span>
                              {item.notes && (
                                <p className="text-sm text-muted-foreground italic">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
                {getOrdersByStatus(status).length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No {status} orders
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

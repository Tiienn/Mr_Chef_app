'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChefHat } from 'lucide-react';

// Simple notification sound using Web Audio API
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880; // A5 note
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
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

  const checkForNewOrders = useCallback((newOrders: Order[]) => {
    // Skip notification on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      // Initialize seen orders with all current order IDs
      seenOrderIdsRef.current = new Set(newOrders.map(o => o.id));
      return;
    }

    // Check for new orders that we haven't seen before
    const newOrderIds = newOrders
      .filter(order => !seenOrderIdsRef.current.has(order.id))
      .map(order => order.id);

    if (newOrderIds.length > 0) {
      playNotificationSound();
      // Add new order IDs to seen set
      newOrderIds.forEach(id => seenOrderIdsRef.current.add(id));
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

  const markAsServed = async (orderId: number) => {
    if (updatingOrderId) return;

    setUpdatingOrderId(orderId);
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'served' }),
      });

      if (response.ok) {
        // Update local state immediately for better UX
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: 'served' } : order
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
                      'transition-all',
                      status === 'pending' && 'border-yellow-500/50 cursor-pointer hover:bg-accent/50',
                      status === 'served' && 'border-gray-500/50 opacity-75',
                      updatingOrderId === order.id && 'opacity-50'
                    )}
                    onClick={status === 'pending' ? () => markAsServed(order.id) : undefined}
                    role={status === 'pending' ? 'button' : undefined}
                    tabIndex={status === 'pending' ? 0 : undefined}
                    onKeyDown={status === 'pending' ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        markAsServed(order.id);
                      }
                    } : undefined}
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
                      {order.tableNumber && (
                        <Badge variant="outline" className="w-fit">
                          Table {order.tableNumber}
                        </Badge>
                      )}
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

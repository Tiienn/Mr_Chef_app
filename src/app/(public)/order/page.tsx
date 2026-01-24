'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, Minus, Trash2, ShoppingCart, X } from 'lucide-react';
import type { MenuItem } from '@/db/schema';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

// Categories in display order
const CATEGORIES = ['Noodles', 'Dumplings', 'Bread', 'Halim', 'Fried Rice'];

function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

export default function OrderPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMenuItems() {
      try {
        const response = await fetch('/api/menu');
        if (response.ok) {
          const data = await response.json();
          setMenuItems(data);
        }
      } catch (error) {
        console.error('Failed to load menu items:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMenuItems();
  }, []);

  const addToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((prev) => prev.filter((item) => item.menuItem.id !== menuItemId));
  };

  const getCartTotal = () => {
    return cart.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getItemsForCategory = (category: string) => {
    return menuItems
      .filter((item) => item.category === category && item.available)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const getCartItemQuantity = (menuItemId: number) => {
    const item = cart.find((item) => item.menuItem.id === menuItemId);
    return item?.quantity || 0;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Order</h1>
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={() => setIsCartOpen(true)}
            aria-label="Open cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {getCartItemCount() > 0 && (
              <Badge
                className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs"
                variant="default"
              >
                {getCartItemCount()}
              </Badge>
            )}
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="w-full"
        >
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0">
            {CATEGORIES.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className={cn(
                  'min-h-[44px] min-w-[80px] flex-shrink-0 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none'
                )}
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      {/* Menu Items Grid */}
      <main className="flex-1 p-4">
        <Tabs value={activeCategory} className="w-full">
          {CATEGORIES.map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {getItemsForCategory(category).map((item) => {
                  const quantity = getCartItemQuantity(item.id);
                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        'relative cursor-pointer transition-all active:scale-[0.98]',
                        quantity > 0 && 'ring-2 ring-primary'
                      )}
                      onClick={() => addToCart(item)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Add ${item.name} to cart`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          addToCart(item);
                        }
                      }}
                    >
                      <CardContent className="flex min-h-[120px] flex-col justify-between p-4">
                        <div>
                          <h3 className="font-medium leading-tight">
                            {item.name}
                          </h3>
                          {item.price > 0 && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatPrice(item.price)}
                            </p>
                          )}
                        </div>
                        {quantity > 0 && (
                          <Badge
                            className="absolute right-2 top-2"
                            variant="default"
                          >
                            {quantity}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {getItemsForCategory(category).length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No items available in this category
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Cart Summary Bar (when cart has items) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="sticky bottom-0 border-t bg-background p-4">
          <Button
            className="w-full min-h-[44px]"
            onClick={() => setIsCartOpen(true)}
          >
            View Cart ({getCartItemCount()} items) - {formatPrice(getCartTotal())}
          </Button>
        </div>
      )}

      {/* Cart Panel (Slide-up drawer) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCartOpen(false)}
            aria-hidden="true"
          />

          {/* Cart Panel */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-auto rounded-t-xl bg-background">
            <div className="sticky top-0 flex items-center justify-between border-b bg-background p-4">
              <h2 className="text-lg font-semibold">Your Order</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {cart.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">
                Your cart is empty
              </p>
            ) : (
              <>
                <div className="divide-y">
                  {cart.map((item) => (
                    <div
                      key={item.menuItem.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.menuItem.name}</p>
                        {item.menuItem.price > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.menuItem.price)} each
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => updateQuantity(item.menuItem.id, -1)}
                          aria-label={`Decrease ${item.menuItem.name} quantity`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => updateQuantity(item.menuItem.id, 1)}
                          aria-label={`Increase ${item.menuItem.name} quantity`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={() => removeFromCart(item.menuItem.id)}
                          aria-label={`Remove ${item.menuItem.name} from cart`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t p-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(getCartTotal())}</span>
                  </div>
                  <Button className="mt-4 w-full min-h-[44px]" disabled>
                    Place Order (Coming Soon)
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

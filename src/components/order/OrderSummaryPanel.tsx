'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronUp, ChevronDown, Plus, Minus, Trash2 } from 'lucide-react';
import type { MenuItem } from '@/db/schema';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface OrderSummaryPanelProps {
  cart: CartItem[];
  onUpdateQuantity: (menuItemId: number, delta: number) => void;
  onRemoveItem: (menuItemId: number) => void;
  onViewFullCart: () => void;
}

function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

export function OrderSummaryPanel({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onViewFullCart,
}: OrderSummaryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getCartTotal = () => {
    return cart.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-0 z-40 border-t bg-background shadow-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className="flex w-full items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            aria-label={isOpen ? 'Collapse order summary' : 'Expand order summary'}
          >
            <div className="flex items-center gap-2">
              {isOpen ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
              <span className="font-medium">
                {getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'items'}
              </span>
            </div>
            <span className="font-semibold">{formatPrice(getCartTotal())}</span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="max-h-[40vh] overflow-y-auto border-t">
            {cart.map((item) => (
              <div
                key={item.menuItem.id}
                className="flex items-center justify-between border-b p-3 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.menuItem.name}</p>
                  {item.menuItem.price > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.menuItem.price * item.quantity)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(item.menuItem.id, -1);
                    }}
                    aria-label={`Decrease ${item.menuItem.name} quantity`}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(item.menuItem.id, 1);
                    }}
                    aria-label={`Increase ${item.menuItem.name} quantity`}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.menuItem.id);
                    }}
                    aria-label={`Remove ${item.menuItem.name} from cart`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t p-4">
            <Button
              className="w-full min-h-[44px]"
              onClick={onViewFullCart}
            >
              View Full Cart
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

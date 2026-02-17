import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@ecom/ui';
import { formatPrice } from '@/lib/utils';
import { Eye, Package } from 'lucide-react';

export function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => adminApi.getOrders(),
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Orders</h1>
        <p className="text-muted-foreground">Manage and fulfill customer orders</p>
      </div>

      {isLoading && <div className="text-center py-12">Loading orders...</div>}

      {data && (
        <div className="space-y-4">
          {data.orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">Order #{order.id.substring(0, 8).toUpperCase()}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()} • {order.items.length} items
                    </p>
                    <p className="text-sm">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatPrice(order.total)}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.pluginId || 'No fulfillment'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              disabled
                              aria-label={`View order ${order.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Order details coming soon</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              disabled
                              aria-label={`Fulfill order ${order.id}`}
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Order fulfillment coming soon</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Subtotal</p>
                      <p className="font-medium">{formatPrice(order.subtotal)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tax</p>
                      <p className="font-medium">{formatPrice(order.tax)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Shipping</p>
                      <p className="font-medium">{formatPrice(order.shipping)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-bold text-lg">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data?.orders?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No orders yet</p>
        </div>
      )}
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Store, TrendingUp } from 'lucide-react';

export function DashboardPage() {
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => adminApi.getProducts(1000),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => adminApi.getOrders(1000),
  });

  const stats = [
    {
      title: 'Total Products',
      value: productsData?.products?.length || 0,
      icon: Package,
      description: 'Active products in catalog',
    },
    {
      title: 'Total Orders',
      value: ordersData?.orders?.length || 0,
      icon: ShoppingCart,
      description: 'Orders placed',
    },
    {
      title: 'Tenants',
      value: 1,
      icon: Store,
      description: 'Active storefronts',
    },
    {
      title: 'Revenue',
      value: '$0',
      icon: TrendingUp,
      description: 'Total revenue',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersData?.orders?.length ? (
              <div className="space-y-4">
                {ordersData.orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Order #{order.id.substring(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${order.total}</p>
                      <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No orders yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-sm">
              • View and manage products
            </p>
            <p className="text-muted-foreground text-sm">
              • Process orders and track status
            </p>
            <p className="text-muted-foreground text-sm">
              • Configure plugins and integrations
            </p>
            <p className="text-muted-foreground text-sm">
              • Manage tenant storefronts
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

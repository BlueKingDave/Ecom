import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@ecom/ui';
import { Package, ShoppingCart, Store, TrendingUp } from 'lucide-react';
import { DashboardCardSkeleton } from '@/components/DashboardCardSkeleton';
export function DashboardPage() {
    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['products'],
        queryFn: () => adminApi.getProducts(1000),
    });
    const { data: ordersData, isLoading: ordersLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: () => adminApi.getOrders(1000),
    });
    const isLoading = productsLoading || ordersLoading;
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
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-4xl font-bold mb-2", children: "Dashboard" }), _jsx("p", { className: "text-muted-foreground", children: "Welcome to your admin dashboard" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: isLoading ? (Array.from({ length: 4 }).map((_, i) => (_jsx(DashboardCardSkeleton, {}, i)))) : (stats.map((stat) => (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: stat.title }), _jsx(stat.icon, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: stat.value }), _jsx("p", { className: "text-xs text-muted-foreground", children: stat.description })] })] }, stat.title)))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Orders" }) }), _jsx(CardContent, { children: ordersData?.orders?.length ? (_jsx("div", { className: "space-y-4", children: ordersData.orders.slice(0, 5).map((order) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-medium", children: ["Order #", order.id.substring(0, 8)] }), _jsx("p", { className: "text-sm text-muted-foreground", children: new Date(order.createdAt).toLocaleDateString() })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-medium", children: ["$", order.total] }), _jsx("p", { className: "text-sm text-muted-foreground capitalize", children: order.status })] })] }, order.id))) })) : (_jsx("p", { className: "text-muted-foreground", children: "No orders yet" })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Quick Actions" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsx("p", { className: "text-muted-foreground text-sm", children: "\u2022 View and manage products" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "\u2022 Process orders and track status" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "\u2022 Configure plugins and integrations" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "\u2022 Manage tenant storefronts" })] })] })] })] }));
}

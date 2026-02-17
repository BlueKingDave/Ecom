import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Eye, Package } from 'lucide-react';
export function OrdersPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: () => adminApi.getOrders(),
    });
    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-4xl font-bold mb-2", children: "Orders" }), _jsx("p", { className: "text-muted-foreground", children: "Manage and fulfill customer orders" })] }), isLoading && _jsx("div", { className: "text-center py-12", children: "Loading orders..." }), data && (_jsx("div", { className: "space-y-4", children: data.orders.map((order) => (_jsx(Card, { children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("h3", { className: "font-semibold", children: ["Order #", order.id.substring(0, 8).toUpperCase()] }), _jsx("span", { className: `text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`, children: order.status })] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [new Date(order.createdAt).toLocaleString(), " \u2022 ", order.items.length, " items"] }), _jsxs("p", { className: "text-sm", children: [order.shippingAddress.firstName, " ", order.shippingAddress.lastName] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-2xl font-bold", children: formatPrice(order.total) }), _jsx("p", { className: "text-sm text-muted-foreground", children: order.pluginId || 'No fulfillment' })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "icon", variant: "outline", children: _jsx(Eye, { className: "h-4 w-4" }) }), _jsx(Button, { size: "icon", variant: "outline", children: _jsx(Package, { className: "h-4 w-4" }) })] })] })] }), _jsx("div", { className: "mt-4 pt-4 border-t", children: _jsxs("div", { className: "grid grid-cols-4 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Subtotal" }), _jsx("p", { className: "font-medium", children: formatPrice(order.subtotal) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Tax" }), _jsx("p", { className: "font-medium", children: formatPrice(order.tax) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Shipping" }), _jsx("p", { className: "font-medium", children: formatPrice(order.shipping) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Total" }), _jsx("p", { className: "font-bold text-lg", children: formatPrice(order.total) })] })] }) })] }) }, order.id))) })), data?.orders?.length === 0 && (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: "No orders yet" }) }))] }));
}

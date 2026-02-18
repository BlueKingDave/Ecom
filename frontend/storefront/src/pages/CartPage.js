import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getSessionId } from '@/lib/session';
import { Button } from '@ecom/ui';
import { Card, CardContent, CardFooter } from '@ecom/ui';
import { formatPrice } from '@/lib/utils';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
export function CartPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const sessionId = getSessionId();
    const { data: cart, isLoading } = useQuery({
        queryKey: ['cart', sessionId],
        queryFn: () => api.getCart(sessionId),
    });
    const updateItemMutation = useMutation({
        mutationFn: ({ productId, quantity }) => api.updateCartItem(productId, quantity, sessionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Cart updated');
        },
        onError: () => {
            toast.error('Failed to update cart. Please try again.');
        },
    });
    const removeItemMutation = useMutation({
        mutationFn: (productId) => api.removeFromCart(productId, sessionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Item removed from cart');
        },
        onError: () => {
            toast.error('Failed to remove item. Please try again.');
        },
    });
    const clearCartMutation = useMutation({
        mutationFn: () => api.clearCart(sessionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Cart cleared');
        },
        onError: () => {
            toast.error('Failed to clear cart. Please try again.');
        },
    });
    if (isLoading) {
        return (_jsx("div", { className: "container mx-auto px-4 py-8", children: _jsx("div", { className: "text-center", children: "Loading cart..." }) }));
    }
    if (!cart || cart.items.length === 0) {
        return (_jsx("div", { className: "container mx-auto px-4 py-8", children: _jsxs("div", { className: "max-w-md mx-auto text-center py-12", children: [_jsx(ShoppingBag, { className: "mx-auto h-16 w-16 text-muted-foreground mb-4" }), _jsx("h1", { className: "text-3xl font-bold mb-4", children: "Your cart is empty" }), _jsx("p", { className: "text-muted-foreground mb-6", children: "Add some products to your cart to get started." }), _jsx(Link, { to: "/products", children: _jsx(Button, { size: "lg", children: "Browse Products" }) })] }) }));
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsx("h1", { className: "text-4xl font-bold", children: "Shopping Cart" }), cart.items.length > 0 && (_jsx(Button, { variant: "outline", size: "sm", onClick: () => clearCartMutation.mutate(), disabled: clearCartMutation.isPending, children: "Clear Cart" }))] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsx("div", { className: "lg:col-span-2 space-y-4", children: cart.items.map((item) => (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "w-24 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden", children: item.image ? (_jsx("img", { src: item.image, alt: `${item.name} product image`, className: "w-full h-full object-cover", loading: "lazy" })) : (_jsxs("div", { className: "w-full h-full flex items-center justify-center text-muted-foreground text-xs", children: [_jsxs("span", { className: "sr-only", children: ["No product image available for ", item.name] }), _jsx("span", { "aria-hidden": "true", children: "No image" })] })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-semibold text-lg mb-1 truncate", children: item.name }), _jsx("p", { className: "text-muted-foreground mb-3", children: formatPrice(item.price) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "icon", className: "h-8 w-8", onClick: () => updateItemMutation.mutate({
                                                                        productId: item.productId,
                                                                        quantity: Math.max(1, item.quantity - 1),
                                                                    }), disabled: item.quantity <= 1 || updateItemMutation.isPending, "aria-label": `Decrease quantity of ${item.name}`, children: _jsx(Minus, { className: "h-4 w-4" }) }), _jsx("span", { className: "w-8 text-center font-medium", "aria-label": `Quantity: ${item.quantity}`, children: item.quantity }), _jsx(Button, { variant: "outline", size: "icon", className: "h-8 w-8", onClick: () => updateItemMutation.mutate({
                                                                        productId: item.productId,
                                                                        quantity: item.quantity + 1,
                                                                    }), disabled: updateItemMutation.isPending, "aria-label": `Increase quantity of ${item.name}`, children: _jsx(Plus, { className: "h-4 w-4" }) })] }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => removeItemMutation.mutate(item.productId), disabled: removeItemMutation.isPending, "aria-label": `Remove ${item.name} from cart`, children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), "Remove"] })] })] }), _jsx("div", { className: "text-right", children: _jsx("p", { className: "font-semibold text-lg", children: formatPrice((parseFloat(item.price) * item.quantity).toFixed(2)) }) })] }) }) }, item.productId))) }), _jsx("div", { className: "lg:col-span-1", children: _jsxs(Card, { children: [_jsxs(CardContent, { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Order Summary" }), _jsxs("div", { className: "space-y-3 mb-6", children: [_jsxs("div", { className: "flex justify-between text-muted-foreground", children: [_jsxs("span", { children: ["Subtotal (", cart.itemCount, " items)"] }), _jsx("span", { children: formatPrice(cart.subtotal) })] }), _jsxs("div", { className: "flex justify-between text-muted-foreground", children: [_jsx("span", { children: "Shipping" }), _jsx("span", { children: "Calculated at checkout" })] }), _jsxs("div", { className: "flex justify-between text-muted-foreground", children: [_jsx("span", { children: "Tax" }), _jsx("span", { children: "Calculated at checkout" })] })] }), _jsx("div", { className: "border-t pt-4 mb-6", children: _jsxs("div", { className: "flex justify-between text-xl font-bold", children: [_jsx("span", { children: "Total" }), _jsx("span", { children: formatPrice(cart.subtotal) })] }) }), _jsx(Button, { size: "lg", className: "w-full", onClick: () => navigate('/checkout'), children: "Proceed to Checkout" })] }), _jsx(CardFooter, { className: "bg-muted/50 p-6", children: _jsx(Link, { to: "/products", className: "text-sm text-muted-foreground hover:text-foreground", children: "\u2190 Continue Shopping" }) })] }) })] })] }));
}

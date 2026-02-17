import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
export function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [quantity, setQuantity] = useState(1);
    const { data: product, isLoading } = useQuery({
        queryKey: ['product', id],
        queryFn: () => api.getProduct(id),
        enabled: !!id,
    });
    const addToCartMutation = useMutation({
        mutationFn: (item) => api.addToCart(item),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            navigate('/cart');
        },
    });
    const handleAddToCart = () => {
        if (!product)
            return;
        addToCartMutation.mutate({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            image: product.images[0],
        });
    };
    if (isLoading) {
        return (_jsx("div", { className: "container mx-auto px-4 py-8", children: _jsx("div", { className: "text-center", children: "Loading product..." }) }));
    }
    if (!product) {
        return (_jsx("div", { className: "container mx-auto px-4 py-8", children: _jsx("div", { className: "text-center", children: "Product not found" }) }));
    }
    return (_jsx("div", { className: "container mx-auto px-4 py-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsx("div", { className: "aspect-square bg-muted rounded-lg overflow-hidden", children: product.images[0] ? (_jsx("img", { src: product.images[0], alt: product.name, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center text-muted-foreground", children: "No image available" })) }), _jsxs("div", { className: "flex flex-col", children: [_jsx("h1", { className: "text-4xl font-bold mb-4", children: product.name }), _jsxs("div", { className: "mb-6", children: [_jsx("span", { className: "text-3xl font-bold", children: formatPrice(product.price) }), product.compareAtPrice && (_jsx("span", { className: "ml-3 text-xl text-muted-foreground line-through", children: formatPrice(product.compareAtPrice) }))] }), _jsx("div", { className: "mb-8", children: _jsx("p", { className: "text-muted-foreground", children: product.description || 'No description available' }) }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Quantity" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "icon", onClick: () => setQuantity(Math.max(1, quantity - 1)), children: "-" }), _jsx("span", { className: "w-12 text-center", children: quantity }), _jsx(Button, { variant: "outline", size: "icon", onClick: () => setQuantity(quantity + 1), children: "+" })] })] }), _jsxs(Button, { size: "lg", className: "w-full", onClick: handleAddToCart, disabled: addToCartMutation.isPending, children: [_jsx(ShoppingCart, { className: "mr-2 h-5 w-5" }), addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'] })] })] }) }));
}

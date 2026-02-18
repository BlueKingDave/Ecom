import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, Button, EmptyState } from '@ecom/ui';
import { formatPrice } from '@/lib/utils';
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';
import { Package } from 'lucide-react';
export function ProductsPage() {
    const navigate = useNavigate();
    const { data, isLoading, error } = useQuery({
        queryKey: ['products'],
        queryFn: () => api.getProducts(),
    });
    if (isLoading) {
        return (_jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsx("div", { className: "h-10 w-48 bg-muted rounded-md animate-pulse mb-8" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: Array.from({ length: 6 }).map((_, i) => (_jsx(ProductCardSkeleton, {}, i))) })] }));
    }
    if (error) {
        return (_jsx("div", { className: "container mx-auto px-4 py-8", children: _jsxs("div", { className: "text-center text-destructive", children: ["Error loading products: ", error instanceof Error ? error.message : 'Unknown error'] }) }));
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Products | Ecommerce Store" }), _jsx("meta", { name: "description", content: "Browse our collection of custom printed products. Upload your photos and create unique t-shirts, mugs, and posters." }), _jsx("meta", { property: "og:title", content: "Products | Ecommerce Store" }), _jsx("meta", { property: "og:description", content: "Browse our collection of custom printed products." })] }), _jsx("h1", { className: "text-4xl font-bold mb-8", children: "Our Products" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: data?.products.map((product) => (_jsxs(Card, { className: "overflow-hidden", children: [_jsx(CardHeader, { className: "p-0", children: _jsx("div", { className: "aspect-square bg-muted", children: product.images[0] ? (_jsx("img", { src: product.images[0], alt: `${product.name} - ${product.description?.substring(0, 100) || 'Custom printed product'}`, className: "w-full h-full object-cover", loading: "lazy" })) : (_jsxs("div", { className: "w-full h-full flex items-center justify-center text-muted-foreground", children: [_jsx("span", { className: "sr-only", children: "No product image available" }), _jsx("span", { "aria-hidden": "true", children: "No image" })] })) }) }), _jsxs(CardContent, { className: "p-4", children: [_jsx(CardTitle, { className: "text-lg mb-2", children: product.name }), _jsx("p", { className: "text-sm text-muted-foreground line-clamp-2", children: product.description || 'No description available' })] }), _jsxs(CardFooter, { className: "p-4 pt-0 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "text-2xl font-bold", children: formatPrice(product.price) }), product.compareAtPrice && (_jsx("span", { className: "ml-2 text-sm text-muted-foreground line-through", children: formatPrice(product.compareAtPrice) }))] }), _jsx(Link, { to: `/products/${product.id}`, children: _jsx(Button, { children: "View Details" }) })] })] }, product.id))) }), data?.products.length === 0 && (_jsx(EmptyState, { icon: Package, title: "No Products Yet", description: "We're currently setting up our catalog. Check back soon for amazing custom products!", actionLabel: "Return Home", actionOnClick: () => navigate('/') }))] }));
}

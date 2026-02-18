import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Skeleton } from '@ecom/ui';
// Lazy load all page components
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage').then(m => ({ default: m.OrderConfirmationPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
// Loading fallback component
function PageLoader() {
    return (_jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsx(Skeleton, { className: "h-10 w-64 mb-8" }), _jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-96 w-full" }), _jsx(Skeleton, { className: "h-32 w-full" })] })] }));
}
function App() {
    return (_jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(Routes, { children: _jsxs(Route, { path: "/", element: _jsx(Layout, {}), children: [_jsx(Route, { index: true, element: _jsx(HomePage, {}) }), _jsx(Route, { path: "products", element: _jsx(ProductsPage, {}) }), _jsx(Route, { path: "products/:id", element: _jsx(ProductDetailPage, {}) }), _jsx(Route, { path: "cart", element: _jsx(CartPage, {}) }), _jsx(Route, { path: "checkout", element: _jsx(CheckoutPage, {}) }), _jsx(Route, { path: "order-confirmation/:orderId", element: _jsx(OrderConfirmationPage, {}) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }) }) }));
}
export default App;

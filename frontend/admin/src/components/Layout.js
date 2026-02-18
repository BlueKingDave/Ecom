import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Store, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@ecom/ui';
export function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/products', label: 'Products', icon: Package },
        { path: '/orders', label: 'Orders', icon: ShoppingCart },
        { path: '/tenants', label: 'Tenants', icon: Store },
        { path: '/plugins', label: 'Plugins', icon: Settings },
    ];
    // Close sidebar on navigation (mobile only)
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    }, [location.pathname]);
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsx("a", { href: "#main-content", className: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md", children: "Skip to main content" }), sidebarOpen && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-40 lg:hidden", onClick: () => setSidebarOpen(false), "aria-hidden": "true" })), _jsxs("aside", { className: cn('w-64 bg-card border-r transition-transform duration-300 ease-in-out z-50', 'fixed inset-y-0 left-0 lg:static lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full'), children: [_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Admin Dashboard" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Ecom Platform" })] }), _jsx("button", { className: "lg:hidden p-2 hover:bg-accent rounded-md transition-colors", onClick: () => setSidebarOpen(false), "aria-label": "Close menu", children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsx("div", { className: "hidden lg:block mt-4", children: _jsx(ThemeToggle, {}) })] }), _jsx("nav", { className: "px-4 space-y-1", children: navItems.map(({ path, label, icon: Icon }) => {
                            const isActive = location.pathname === path;
                            return (_jsxs(Link, { to: path, className: `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-accent hover:text-accent-foreground'}`, children: [_jsx(Icon, { className: "h-5 w-5" }), _jsx("span", { children: label })] }, path));
                        }) })] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsx("header", { className: "lg:hidden border-b bg-card sticky top-0 z-30", children: _jsxs("div", { className: "flex items-center justify-between px-4 py-3", children: [_jsx("button", { onClick: () => setSidebarOpen(true), className: "p-2 hover:bg-accent rounded-md transition-colors", "aria-label": "Open menu", children: _jsx(Menu, { className: "h-6 w-6" }) }), _jsx("h2", { className: "text-lg font-semibold", children: "Admin Panel" }), _jsx(ThemeToggle, {})] }) }), _jsx("main", { className: "flex-1 overflow-auto", id: "main-content", children: _jsx("div", { className: "container mx-auto py-8 px-4", children: _jsx(Outlet, {}) }) })] })] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Store, Settings } from 'lucide-react';
export function Layout() {
    const location = useLocation();
    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/products', label: 'Products', icon: Package },
        { path: '/orders', label: 'Orders', icon: ShoppingCart },
        { path: '/tenants', label: 'Tenants', icon: Store },
        { path: '/plugins', label: 'Plugins', icon: Settings },
    ];
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsxs("aside", { className: "w-64 bg-card border-r", children: [_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Admin Dashboard" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Ecom Platform" })] }), _jsx("nav", { className: "px-4 space-y-1", children: navItems.map(({ path, label, icon: Icon }) => {
                            const isActive = location.pathname === path;
                            return (_jsxs(Link, { to: path, className: `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-accent hover:text-accent-foreground'}`, children: [_jsx(Icon, { className: "h-5 w-5" }), _jsx("span", { children: label })] }, path));
                        }) })] }), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx("div", { className: "container mx-auto py-8", children: _jsx(Outlet, {}) }) })] }));
}

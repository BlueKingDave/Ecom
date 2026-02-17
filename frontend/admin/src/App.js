import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { TenantsPage } from './pages/TenantsPage';
import { PluginsPage } from './pages/PluginsPage';
function App() {
    return (_jsx(Routes, { children: _jsxs(Route, { path: "/", element: _jsx(Layout, {}), children: [_jsx(Route, { index: true, element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "products", element: _jsx(ProductsPage, {}) }), _jsx(Route, { path: "orders", element: _jsx(OrdersPage, {}) }), _jsx(Route, { path: "tenants", element: _jsx(TenantsPage, {}) }), _jsx(Route, { path: "plugins", element: _jsx(PluginsPage, {}) })] }) }));
}
export default App;

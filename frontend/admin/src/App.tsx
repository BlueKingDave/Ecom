import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { TenantsPage } from './pages/TenantsPage';
import { PluginsPage } from './pages/PluginsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="plugins" element={<PluginsPage />} />
      </Route>
    </Routes>
  );
}

export default App;

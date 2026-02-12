import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function Layout() {
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.getCart(),
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">
              Ecommerce Store
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium hover:text-primary">
                Home
              </Link>
              <Link to="/products" className="text-sm font-medium hover:text-primary">
                Products
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/cart">
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cart && cart.itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {cart.itemCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">About</h3>
              <p className="text-sm text-muted-foreground">
                Your one-stop shop for custom products with AI-powered designs.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/products" className="text-muted-foreground hover:text-foreground">
                    Products
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="text-muted-foreground hover:text-foreground">
                    Cart
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <p className="text-sm text-muted-foreground">support@example.com</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 Ecommerce Store. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

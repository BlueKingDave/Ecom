import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { Button, ThemeToggle } from '@ecom/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.getCart(),
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">
              Ecommerce Store
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium hover:text-primary">
                Home
              </Link>
              <Link to="/products" className="text-sm font-medium hover:text-primary">
                Products
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 hover:bg-accent rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Cart Button */}
              <Link to="/cart">
                <Button
                  variant="outline"
                  size="icon"
                  className="relative"
                  aria-label={`Shopping cart with ${cart?.itemCount || 0} items`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cart && cart.itemCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {cart.itemCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Live region for cart updates (screen readers) */}
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                {cart && `Shopping cart: ${cart.itemCount} ${cart.itemCount === 1 ? 'item' : 'items'}`}
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t pt-4">
              <div className="flex flex-col gap-4">
                <Link
                  to="/"
                  className="text-sm font-medium hover:text-primary py-2 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/products"
                  className="text-sm font-medium hover:text-primary py-2 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Products
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1" id="main-content">
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
            © {new Date().getFullYear()} Ecommerce Store. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

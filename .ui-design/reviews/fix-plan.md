# Frontend Fix Plan - Phase 1 Foundation

**Generated:** 2026-02-17
**Based on:** Design Review #frontend_comprehensive_20260217_143000
**Total Issues:** 47 (8 Critical, 15 Major, 16 Minor, 8 Suggestions)

## Executive Summary

This plan addresses 47 identified issues across both Admin and Storefront frontends. Fixes are grouped into 5 phases based on severity, dependencies, and impact. 

**Critical Path:** Phase 1 (Critical Fixes) must be completed before production deployment.

---

## Phase 1: Critical Fixes  🔴

**Priority:** URGENT - Must fix before production
**Impact:** Security, Accessibility, Mobile Usage

### Task 1.1: Clean Up Build Artifacts ⚡ QUICK WIN
**Issue:** #1 - Compiled JavaScript Files in Source Directories
**Files:** All `.js` files in `frontend/*/src/`

**Steps:**
```bash
# 1. Backup current state
git add -A
git commit -m "Pre-cleanup checkpoint"

# 2. Remove compiled files
find frontend/admin/src -name "*.js" -type f -delete
find frontend/storefront/src -name "*.js" -type f -delete

# 3. Update .gitignore
cat >> .gitignore << 'EOF'

# Frontend build artifacts
frontend/*/src/**/*.js
frontend/*/src/**/*.js.map
!frontend/*/src/**/*.config.js
dist/
build/
.vite/
EOF

# 4. Verify apps still work
cd frontend/storefront && npm run dev
cd ../admin && npm run dev

# 5. Commit
git add .gitignore
git status # Verify no .js files staged
git commit -m "Remove compiled files from source, update .gitignore"
```

**Acceptance Criteria:**
- [ ] No `.js` files in `frontend/*/src/` directories
- [ ] `.gitignore` prevents future commits
- [ ] Both apps build and run successfully
- [ ] Git status shows clean working tree

---

### Task 1.2: Add Mobile Navigation to Storefront
**Issue:** #2 - Mobile Navigation Missing
**Files:** `frontend/storefront/src/components/Layout.tsx`

**Implementation:**

```tsx
// frontend/storefront/src/components/Layout.tsx
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ... existing code ...

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">
              Ecommerce Store
            </Link>

            {/* Desktop Navigation - keep existing */}
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
                className="md:hidden p-2 hover:bg-accent rounded-md"
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

              {/* Cart button - keep existing */}
              <Link to="/cart">
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {/* ... existing cart badge ... */}
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t pt-4">
              <div className="flex flex-col gap-4">
                <Link
                  to="/"
                  className="text-sm font-medium hover:text-primary py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/products"
                  className="text-sm font-medium hover:text-primary py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Products
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Rest of layout... */}
    </div>
  );
}
```

**Testing:**
- [ ] Menu icon appears on mobile (< 768px width)
- [ ] Menu opens/closes on click
- [ ] Links navigate correctly
- [ ] Menu closes after clicking link
- [ ] Desktop navigation still works
- [ ] Cart button visible on mobile

---

### Task 1.3: Make Admin Dashboard Responsive
**Issue:** #3 - Admin Dashboard Not Mobile Responsive
**Files:** `frontend/admin/src/components/Layout.tsx`

**Implementation:**

```tsx
// frontend/admin/src/components/Layout.tsx
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on navigation (mobile only)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const navItems = [
    // ... existing nav items ...
  ];

  return (
    <div className="min-h-screen flex">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-card border-r transition-transform duration-300 ease-in-out",
          "fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-6 lg:block">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Ecom Platform</p>
          </div>
          <button
            className="lg:hidden p-2 hover:bg-accent rounded-md"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with menu button */}
        <header className="lg:hidden border-b bg-card p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-accent rounded-md"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-8 px-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
```

**Testing:**
- [ ] Sidebar slides in/out on mobile
- [ ] Overlay closes sidebar when clicked
- [ ] Sidebar auto-closes after navigation on mobile
- [ ] Desktop sidebar remains static
- [ ] All pages accessible on mobile
- [ ] Content area usable on small screens

---

### Task 1.4: Add Essential Accessibility Attributes
**Issues:** #4, #6, #7 - Missing Accessibility
**Effort:** 8 hours
**Files:** Multiple component files

**Part A: ARIA Labels for Icon Buttons (2 hours)**

```tsx
// frontend/storefront/src/components/Layout.tsx
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

// frontend/storefront/src/pages/CartPage.tsx
<Button
  variant="outline"
  size="icon"
  className="h-8 w-8"
  onClick={() => updateItemMutation.mutate({...})}
  disabled={item.quantity <= 1 || updateItemMutation.isPending}
  aria-label="Decrease quantity"
>
  <Minus className="h-4 w-4" />
</Button>

<Button
  variant="outline"
  size="icon"
  className="h-8 w-8"
  onClick={() => updateItemMutation.mutate({...})}
  disabled={updateItemMutation.isPending}
  aria-label="Increase quantity"
>
  <Plus className="h-4 w-4" />
</Button>

// frontend/admin/src/pages/ProductsPage.tsx
<Button
  size="icon"
  variant="outline"
  aria-label={`Edit ${product.name}`}
>
  <Edit className="h-4 w-4" />
</Button>

<Button
  size="icon"
  variant="outline"
  aria-label={`Delete ${product.name}`}
>
  <Trash2 className="h-4 w-4" />
</Button>
```

**Part B: Skip Navigation Link **

```tsx
// frontend/storefront/src/components/Layout.tsx
// Add at the very top of the Layout component return
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
>
  Skip to main content
</a>

// Add id to main element
<main className="flex-1" id="main-content">
  <Outlet />
</main>
```

**Part C: Form Error Accessibility **

```tsx
// frontend/storefront/src/pages/CheckoutPage.tsx
<Label htmlFor="email">Email *</Label>
<Input
  id="email"
  type="email"
  {...register('email')}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>
{errors.email && (
  <p
    id="email-error"
    role="alert"
    className="text-sm text-destructive mt-1"
  >
    {errors.email.message}
  </p>
)}
```

**Part D: Descriptive Image Alt Text **

```tsx
// frontend/storefront/src/pages/ProductsPage.tsx
<img
  src={product.images[0]}
  alt={`${product.name} - ${product.description?.substring(0, 100) || 'Custom printed product'}`}
  className="w-full h-full object-cover"
  loading="lazy"
/>

// Empty state images
<div className="w-full h-full flex items-center justify-center text-muted-foreground">
  <span className="sr-only">No product image available</span>
  <span aria-hidden="true">No image</span>
</div>
```

**Part E: Live Regions for Cart Updates **

```tsx
// frontend/storefront/src/components/Layout.tsx
// Add near cart button
<div className="sr-only" aria-live="polite" aria-atomic="true">
  {cart && `Shopping cart: ${cart.itemCount} items`}
</div>
```

**Testing:**
- [ ] Screen reader reads all icon button labels
- [ ] Tab key reveals skip navigation link
- [ ] Skip link jumps to main content
- [ ] Form errors read by screen reader
- [ ] Image alt text descriptive and helpful
- [ ] Cart updates announced to screen readers

---

### Task 1.5: Implement Error Boundaries
**Issue:** #5 - No Error Boundaries
**Effort:** 3 hours
**Files:** New component + App integration

**Implementation:**

```tsx
// frontend/storefront/src/components/ErrorBoundary.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo);

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. Please try reloading the page.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs bg-muted p-3 rounded-md overflow-auto">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Error Details
                  </summary>
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <Button onClick={() => window.location.reload()} className="flex-1">
                  Reload Page
                </Button>
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

```tsx
// frontend/storefront/src/main.tsx
import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

**Testing:**
- [ ] Throw test error, verify boundary catches it
- [ ] Error UI displays correctly
- [ ] Reload button works
- [ ] Try Again button resets boundary
- [ ] Dev mode shows error details
- [ ] Prod mode hides error details
- [ ] Repeat for admin app

---

## Phase 2: Code Quality & Architecture 🟠

**Priority:** HIGH - Required for maintainability
**Estimated Effort:** 5-6 days
**Impact:** Developer Experience, Maintainability

### Task 2.1: Extract Shared UI Components
**Issue:** #12 - Duplicate UI Components
**Effort:** 1 day
**Files:** New `packages/ui` directory

**Steps:**

```bash
# 1. Create shared UI package
mkdir -p packages/ui/src/components
mkdir -p packages/ui/src/lib

# 2. Move components to shared package
cp frontend/storefront/src/components/ui/* packages/ui/src/components/
cp frontend/storefront/src/lib/utils.ts packages/ui/src/lib/

# 3. Create package.json
cat > packages/ui/package.json << 'EOF'
{
  "name": "@ecom/ui",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./lib/*": "./src/lib/*"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
EOF

# 4. Create index export
cat > packages/ui/src/index.ts << 'EOF'
export * from './components/button';
export * from './components/card';
export * from './components/input';
export * from './components/label';
export * from './components/checkbox';
export { cn } from './lib/utils';
EOF

# 5. Update pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'frontend/*'
  - 'packages/*'
  - 'backend/*'
  - 'plugins/*'
EOF

# 6. Update frontend apps to use shared package
# In frontend/storefront/package.json and frontend/admin/package.json:
# Add: "@ecom/ui": "workspace:*"

pnpm install

# 7. Update imports in both frontends
# Find and replace:
# From: import { Button } from '@/components/ui/button'
# To: import { Button } from '@ecom/ui'
```

**Acceptance Criteria:**
- [ ] Shared `@ecom/ui` package created
- [ ] All UI components moved to shared package
- [ ] Both apps import from `@ecom/ui`
- [ ] No duplicate component code
- [ ] Both apps build successfully
- [ ] All existing functionality works

---

### Task 2.2: Add Loading Skeletons
**Issue:** #13 - No Loading Skeletons
**Files:** New skeleton components + pages

**Implementation:**

```tsx
// packages/ui/src/components/skeleton.tsx
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

// frontend/storefront/src/components/ProductCardSkeleton.tsx
import { Card, CardContent, CardFooter, CardHeader, Skeleton } from '@ecom/ui';

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Skeleton className="aspect-square w-full" />
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-28" />
      </CardFooter>
    </Card>
  );
}

// frontend/storefront/src/pages/ProductsPage.tsx
if (isLoading) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
```

**Testing:**
- [ ] Skeleton appears during loading
- [ ] Layout matches actual content
- [ ] No layout shift when content loads
- [ ] Skeletons added to all loading states

---

### Task 2.3: Implement Route Code Splitting
**Issue:** #23 - No Route-Level Code Splitting
**Effort:** 2 hours
**Files:** `frontend/*/src/App.tsx`

**Implementation:**

```tsx
// frontend/storefront/src/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Skeleton } from '@ecom/ui';

// Lazy load all pages
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage').then(m => ({ default: m.OrderConfirmationPage })));

// Loading fallback
function PageLoader() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-64 mb-8" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
```

**Testing:**
- [ ] Check Network tab for chunked bundles
- [ ] Verify lazy loading works
- [ ] No loading flicker on fast connections
- [ ] Loading fallback shows on slow 3G
- [ ] Repeat for admin app

---

### Task 2.4: Add Dark Mode Toggle
**Issue:** #9 - Dark Mode Toggle Missing
**Effort:** 3 hours
**Files:** New ThemeProvider component

**Implementation:**

```tsx
// packages/ui/src/components/theme-provider.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// packages/ui/src/components/theme-toggle.tsx
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './button';
import { useTheme } from './theme-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

```tsx
// frontend/storefront/src/main.tsx
import { ThemeProvider } from '@ecom/ui';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        {/* ... rest of app ... */}
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);

// frontend/storefront/src/components/Layout.tsx
import { ThemeToggle } from '@ecom/ui';

<div className="flex items-center gap-4">
  <ThemeToggle />
  <Link to="/cart">
    {/* cart button */}
  </Link>
</div>
```

**Testing:**
- [ ] Theme toggle appears in header
- [ ] Light mode works
- [ ] Dark mode works
- [ ] System theme follows OS preference
- [ ] Theme persists on reload
- [ ] All components look good in dark mode

---

## Phase 3: UX Improvements (Week 3) 🟡

**Priority:** MEDIUM - Enhance user experience
**Estimated Effort:** 5 days
**Impact:** User Satisfaction, Conversion

### Task 3.1: Implement Toast Notifications
**Issue:** #19 - Missing Success Feedback
**Effort:** 4 hours
**Files:** Install sonner, add to mutations

```bash
pnpm add sonner
```

```tsx
// frontend/storefront/src/main.tsx
import { Toaster } from 'sonner';

<ThemeProvider>
  <Toaster position="top-right" richColors />
  <ErrorBoundary>
    {/* ... */}
  </ErrorBoundary>
</ThemeProvider>

// frontend/storefront/src/pages/CartPage.tsx
import { toast } from 'sonner';

const removeItemMutation = useMutation({
  mutationFn: (productId: string) => api.removeFromCart(productId, sessionId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['cart'] });
    toast.success('Item removed from cart');
  },
  onError: () => {
    toast.error('Failed to remove item. Please try again.');
  },
});

const updateItemMutation = useMutation({
  mutationFn: ({ productId, quantity }) =>
    api.updateCartItem(productId, quantity, sessionId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['cart'] });
    toast.success('Cart updated');
  },
  onError: () => {
    toast.error('Failed to update cart. Please try again.');
  },
});
```

---

### Task 3.2: Add 404 Page
**Issue:** #36 - No 404 Page
**Effort:** 2 hours

```tsx
// frontend/storefront/src/pages/NotFoundPage.tsx
import { Link } from 'react-router-dom';
import { Button } from '@ecom/ui';
import { Home, Search } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
      <div className="space-y-6">
        <div className="text-9xl font-bold text-muted-foreground/20">404</div>
        <h1 className="text-4xl font-bold">Page Not Found</h1>
        <p className="text-xl text-muted-foreground">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild size="lg">
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/products">
              <Search className="mr-2 h-5 w-5" />
              Browse Products
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// frontend/storefront/src/App.tsx
import { NotFoundPage } from './pages/NotFoundPage';

<Routes>
  <Route path="/" element={<Layout />}>
    {/* ... existing routes ... */}
    <Route path="*" element={<NotFoundPage />} />
  </Route>
</Routes>
```

---

### Task 3.3: Fix Non-Functional Buttons
**Issue:** #10 - Non-Functional Buttons

**Files:** Admin pages with edit/delete buttons

**Option 1: Disable with Tooltip**
```tsx
// frontend/admin/src/pages/ProductsPage.tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@ecom/ui';

<div className="flex gap-2">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="outline" disabled>
          <Edit className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Coming in Phase 2</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="outline" disabled>
          <Trash2 className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Coming in Phase 2</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>
```

**Option 2: Implement Basic Functionality**
*(If time allows, implement actual edit/delete)*

---

### Task 3.4: Improve Empty States
**Issue:** #22 - Empty State Design
**Effort:** 3 hours
**Files:** All pages with empty states

```tsx
// frontend/storefront/src/components/EmptyState.tsx
import { Button } from '@ecom/ui';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <Icon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Button asChild size="lg">
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}

// Usage
{data?.products.length === 0 && (
  <EmptyState
    icon={Package}
    title="No Products Yet"
    description="We're currently setting up our catalog. Check back soon for amazing products!"
    actionLabel="Return Home"
    actionHref="/"
  />
)}
```

---

### Task 3.5: Add Breadcrumbs Navigation
**Issue:** #30 - No Breadcrumbs
**Effort:** 4 hours

```tsx
// packages/ui/src/components/breadcrumbs.tsx
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('mb-6', className)}>
      <ol className="flex items-center gap-2 text-sm flex-wrap">
        <li>
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {i === items.length - 1 ? (
              <span
                className="text-foreground font-medium"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Usage in ProductDetailPage
<div className="container mx-auto px-4 py-8">
  <Breadcrumbs
    items={[
      { label: 'Products', path: '/products' },
      { label: product.name, path: `/products/${product.id}` },
    ]}
  />
  {/* rest of page */}
</div>
```

---

### Task 3.6: Add Page Titles & Meta Tags
**Issues:** #26, #34 - Missing Page Titles and Meta Tags
**Effort:** 3 hours

```bash
pnpm add react-helmet-async
```

```tsx
// frontend/storefront/src/main.tsx
import { HelmetProvider } from 'react-helmet-async';

<HelmetProvider>
  <ThemeProvider>
    {/* ... */}
  </ThemeProvider>
</HelmetProvider>

// frontend/storefront/src/pages/ProductsPage.tsx
import { Helmet } from 'react-helmet-async';

export function ProductsPage() {
  return (
    <>
      <Helmet>
        <title>Products | Ecommerce Store</title>
        <meta
          name="description"
          content="Browse our collection of custom printed products. Upload your photos and create unique t-shirts, mugs, and posters."
        />
        <meta property="og:title" content="Products | Ecommerce Store" />
        <meta
          property="og:description"
          content="Browse our collection of custom printed products."
        />
      </Helmet>

      {/* page content */}
    </>
  );
}

// Repeat for all pages with appropriate titles/descriptions
```

---

## Phase 4: Performance & Polish (Week 4) ⚡

**Priority:** LOW - Nice to have
**Estimated Effort:** 3-4 days
**Impact:** Performance, Professional Polish

### Task 4.1: Implement Optimistic Updates
**Issue:** #21 - No Optimistic Updates
**Effort:** 4 hours

### Task 4.2: Add Image Optimization
**Issue:** #16 - No Image Optimization
**Effort:** 1 day

### Task 4.3: Fix Minor Visual Issues
**Issues:** #24, #25, #27, #28, #29, #31, #32, #33
**Effort:** 1 day

### Task 4.4: Add Favicon & Branding
**Issue:** #37 - No Favicon
**Effort:** 1 hour

### Task 4.5: Add Print Styles
**Issue:** #39 - No Print Styles
**Effort:** 2 hours

---

## Phase 5: Future Enhancements (Backlog) 💡

**Priority:** FUTURE - Feature requests
**Effort:** 2-3 weeks additional work

- Search functionality
- Product filtering
- Wishlist/favorites
- Product comparison
- Analytics tracking
- Social sharing
- Activity logs

---

## Implementation Checklist

### Before Starting
- [ ] Create feature branch: `git checkout -b fix/frontend-improvements`
- [ ] Review full fix plan
- [ ] Set up task tracking (GitHub Issues, Jira, etc.)
- [ ] Allocate time blocks for each phase

### Phase 1 (Critical)
- [ ] Task 1.1: Clean build artifacts
- [ ] Task 1.2: Mobile navigation
- [ ] Task 1.3: Responsive admin
- [ ] Task 1.4: Accessibility
- [ ] Task 1.5: Error boundaries
- [ ] Test on mobile devices
- [ ] Run accessibility audit (aXe, Lighthouse)
- [ ] Create PR for Phase 1 review

### Phase 2 (Quality)
- [ ] Task 2.1: Shared components
- [ ] Task 2.2: Loading skeletons
- [ ] Task 2.3: Code splitting
- [ ] Task 2.4: Dark mode
- [ ] Run bundle analysis
- [ ] Test performance metrics
- [ ] Create PR for Phase 2 review

### Phase 3 (UX)
- [ ] Task 3.1: Toast notifications
- [ ] Task 3.2: 404 page
- [ ] Task 3.3: Fix buttons
- [ ] Task 3.4: Empty states
- [ ] Task 3.5: Breadcrumbs
- [ ] Task 3.6: Page titles
- [ ] User testing session
- [ ] Create PR for Phase 3 review

### Phase 4 (Performance)
- [ ] Complete all Phase 4 tasks
- [ ] Performance testing
- [ ] Lighthouse audit (target: 90+ all metrics)
- [ ] Cross-browser testing
- [ ] Final PR for Phase 4

---

## Testing Strategy

### Manual Testing
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Test on tablet
- [ ] Test with keyboard only
- [ ] Test with screen reader (NVDA, VoiceOver)

### Automated Testing
```bash
# Run accessibility tests
pnpm add -D @axe-core/react
pnpm add -D jest-axe

# Performance testing
pnpm run build
pnpm add -D lighthouse

# Visual regression testing
pnpm add -D @playwright/test
```

### Performance Benchmarks
- Lighthouse Performance: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Bundle size: < 200KB (gzipped)

---

## Rollback Plan

If critical issues arise:

```bash
# Revert to previous state
git checkout master
git checkout -b rollback/frontend-fixes
git revert <commit-hash>

# Or reset to specific commit
git reset --hard <safe-commit-hash>
```

---

## Success Metrics

After completing all phases:

- [ ] Lighthouse Accessibility Score: 100
- [ ] Lighthouse Performance Score: 90+
- [ ] Mobile bounce rate: < 40%
- [ ] Page load time: < 2s
- [ ] Zero console errors
- [ ] WCAG 2.1 AA compliant
- [ ] Works on IE11+ (if required)
- [ ] Code duplication: < 5%
- [ ] Bundle size reduction: 30%+

---

**Created by:** Design Review System
**Next Review:** After Phase 3 completion
**Questions?** Review the original design review report for detailed context.

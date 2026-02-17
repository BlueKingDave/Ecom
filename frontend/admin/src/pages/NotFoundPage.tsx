import { Link } from 'react-router-dom';
import { Button } from '@ecom/ui';
import { Home, LayoutDashboard } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
      <div className="space-y-6">
        <div className="text-9xl font-bold text-muted-foreground/20">404</div>
        <h1 className="text-4xl font-bold">Page Not Found</h1>
        <p className="text-xl text-muted-foreground">
          The admin page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center pt-4 flex-wrap">
          <Button asChild size="lg">
            <Link to="/">
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/products">
              <Home className="mr-2 h-5 w-5" />
              Manage Products
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

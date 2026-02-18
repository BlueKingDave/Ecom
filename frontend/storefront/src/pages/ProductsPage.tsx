import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-10 w-48 bg-muted rounded-md animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          Error loading products: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Our Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="aspect-square bg-muted">
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={`${product.name} - ${product.description?.substring(0, 100) || 'Custom printed product'}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <span className="sr-only">No product image available</span>
                    <span aria-hidden="true">No image</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description || 'No description available'}
              </p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
                {product.compareAtPrice && (
                  <span className="ml-2 text-sm text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>
              <Link to={`/products/${product.id}`}>
                <Button>View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {data?.products.length === 0 && (
        <EmptyState
          icon={Package}
          title="No Products Yet"
          description="We're currently setting up our catalog. Check back soon for amazing custom products!"
          actionLabel="Return Home"
          actionOnClick={() => navigate('/')}
        />
      )}
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '@/lib/api';
import { Card, CardContent, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, EmptyState } from '@ecom/ui';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';

export function ProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => adminApi.getProducts(),
  });

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Products | Ecom Admin</title>
        <meta name="description" content="Manage your product catalog - add, edit, and organize products" />
      </Helmet>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Product creation coming soon</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-0">
                <div className="aspect-square bg-muted">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={`${product.name} - ${product.description || 'Product image'}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <span className="sr-only">No product image available for {product.name}</span>
                      <span aria-hidden="true">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              aria-label={`Edit ${product.name}`}
                              disabled
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Product editing coming soon</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              aria-label={`Delete ${product.name}`}
                              disabled
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Product deletion coming soon</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data?.products?.length === 0 && (
        <EmptyState
          icon={Package}
          title="No Products Yet"
          description="Start building your product catalog by adding your first product. Products can be customized with AI-generated designs."
          actionLabel="Add Product"
          actionOnClick={() => {}}
          actionDisabled={true}
        />
      )}
    </div>
  );
}

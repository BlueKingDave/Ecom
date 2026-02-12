import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Store } from 'lucide-react';

export function TenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Tenants</h1>
          <p className="text-muted-foreground">Manage your storefronts</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Default Tenant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-medium">default</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Domain</p>
              <p className="font-medium">localhost:5173</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium text-green-600">Active</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Note:</p>
            <p className="text-sm">
              Tenant management endpoints will be implemented in a future phase.
              For now, use the default tenant configured in the database.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">Edit</Button>
            <Button variant="outline">View Storefront</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

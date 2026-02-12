import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, CheckCircle2, XCircle } from 'lucide-react';

export function PluginsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['plugins'],
    queryFn: () => adminApi.getPlugins(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Plugins</h1>
        <p className="text-muted-foreground">Configure integrations and plugins</p>
      </div>

      {isLoading && <div className="text-center py-12">Loading plugins...</div>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.plugins.map((plugin) => (
            <Card key={plugin.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {plugin.name}
                  </div>
                  {plugin.enabled ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plugin ID</p>
                  <p className="font-medium font-mono text-sm">{plugin.id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`font-medium ${plugin.enabled ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {plugin.enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                  <Button
                    variant={plugin.enabled ? 'outline' : 'default'}
                    size="sm"
                  >
                    {plugin.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data?.plugins?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No plugins available</p>
        </div>
      )}
    </div>
  );
}

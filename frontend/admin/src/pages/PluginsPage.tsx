import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { Package, CheckCircle2, XCircle, X } from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Button, Input, Label, Skeleton, EmptyState,
} from '@ecom/ui';
import { adminApi } from '@/lib/api';
import type { Plugin, ConfigField, PluginCapability } from '@/lib/api';

// ---------------------------------------------------------------------------
// Zod schema builder from manifest config fields
// ---------------------------------------------------------------------------
function buildZodSchema(configSchema: Record<string, ConfigField>) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, field] of Object.entries(configSchema)) {
    let schema: z.ZodTypeAny;
    if (field.type === 'boolean') {
      schema = z.boolean();
    } else if (field.type === 'number') {
      schema = z.coerce.number();
    } else {
      schema = field.required ? z.string().min(1, `${key} is required`) : z.string().optional();
    }
    shape[key] = schema;
  }
  return z.object(shape);
}

// ---------------------------------------------------------------------------
// Capability badge colours
// ---------------------------------------------------------------------------
const CAPABILITY_COLOURS: Record<PluginCapability, string> = {
  'catalog.sync': 'bg-blue-100 text-blue-800',
  'inventory.update': 'bg-purple-100 text-purple-800',
  'price.update': 'bg-yellow-100 text-yellow-800',
  'order.create': 'bg-green-100 text-green-800',
  'order.status': 'bg-teal-100 text-teal-800',
  'order.cancel': 'bg-red-100 text-red-800',
  'webhook.inbound': 'bg-orange-100 text-orange-800',
};

// ---------------------------------------------------------------------------
// ConfigureModal
// ---------------------------------------------------------------------------
interface ConfigureModalProps {
  plugin: Plugin;
  onClose: () => void;
}

function ConfigureModal({ plugin, onClose }: ConfigureModalProps) {
  const queryClient = useQueryClient();
  const configSchema = plugin.manifest?.config ?? {};
  const schema = buildZodSchema(configSchema);
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(
      Object.entries(configSchema).map(([key, field]) => [key, field.default ?? ''])
    ) as FormValues,
  });

  const configure = useMutation({
    mutationFn: (values: FormValues) =>
      adminApi.updatePluginConfig(plugin.pluginId, values as Record<string, unknown>),
    onSuccess: () => {
      toast.success('Plugin configured successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-plugins'] });
      onClose();
    },
    onError: (err: Error) => {
      toast.error(`Configuration failed: ${err.message}`);
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg border shadow-lg w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Configure {plugin.manifest?.name ?? plugin.pluginId}</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((values) => configure.mutate(values))} className="space-y-4">
          {Object.entries(configSchema).map(([key, field]) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key}>
                {key}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id={key}
                type={field.encrypted ? 'password' : 'text'}
                placeholder={field.description}
                {...register(key as keyof FormValues)}
              />
              {errors[key as keyof typeof errors] && (
                <p className="text-xs text-destructive">
                  {(errors[key as keyof typeof errors] as { message?: string })?.message}
                </p>
              )}
              {field.description && !errors[key as keyof typeof errors] && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting || configure.isPending}>
              {configure.isPending ? 'Saving…' : 'Save Configuration'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PluginCard
// ---------------------------------------------------------------------------
interface PluginCardProps {
  plugin: Plugin;
}

function PluginCard({ plugin }: PluginCardProps) {
  const queryClient = useQueryClient();
  const [showConfigure, setShowConfigure] = useState(false);

  const capabilities = (plugin.manifest?.capabilities ?? []) as PluginCapability[];
  const canSyncCatalog = capabilities.includes('catalog.sync') && plugin.enabled;

  // Health dot — auto-refreshes every 60 s while plugin is enabled
  const { data: health } = useQuery({
    queryKey: ['plugin-health', plugin.pluginId],
    queryFn: () => adminApi.getPluginHealth(plugin.pluginId),
    refetchInterval: 60_000,
    enabled: plugin.enabled,
  });

  const togglePlugin = useMutation({
    mutationFn: (enabled: boolean) => adminApi.togglePlugin(plugin.pluginId, enabled),
    onSuccess: (_, enabled) => {
      toast.success(`Plugin ${enabled ? 'enabled' : 'disabled'}`);
      queryClient.invalidateQueries({ queryKey: ['tenant-plugins'] });
      queryClient.invalidateQueries({ queryKey: ['plugin-health', plugin.pluginId] });
    },
    onError: (err: Error) => {
      toast.error(`Toggle failed: ${err.message}`);
    },
  });

  const syncCatalog = useMutation({
    mutationFn: () => adminApi.syncCatalog(plugin.pluginId),
    onSuccess: (result) => {
      toast.success(`Synced ${result.synced} products`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: Error) => {
      toast.error(`Sync failed: ${err.message}`);
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {plugin.enabled ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" aria-label="Enabled" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" aria-label="Disabled" />
              )}
              <span>{plugin.manifest?.name ?? plugin.pluginId}</span>
            </div>
            {/* Health dot */}
            {plugin.enabled && (
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
                }`}
                title={health?.status === 'ok' ? 'Healthy' : (health?.message ?? 'Unavailable')}
              />
            )}
          </CardTitle>
          {plugin.manifest?.description && (
            <CardDescription>{plugin.manifest.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Capability badges */}
          {capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {capabilities.map((cap) => (
                <span
                  key={cap}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    CAPABILITY_COLOURS[cap] ?? 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {cap}
                </span>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground font-mono">{plugin.pluginId}</div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setShowConfigure(true)}>
              Configure
            </Button>

            <Button
              variant={plugin.enabled ? 'outline' : 'default'}
              size="sm"
              disabled={togglePlugin.isPending}
              onClick={() => togglePlugin.mutate(!plugin.enabled)}
            >
              {togglePlugin.isPending
                ? (plugin.enabled ? 'Disabling…' : 'Enabling…')
                : (plugin.enabled ? 'Disable' : 'Enable')}
            </Button>

            {canSyncCatalog && (
              <Button
                variant="outline"
                size="sm"
                disabled={syncCatalog.isPending}
                onClick={() => syncCatalog.mutate()}
              >
                {syncCatalog.isPending ? 'Syncing…' : 'Sync Catalog'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showConfigure && (
        <ConfigureModal plugin={plugin} onClose={() => setShowConfigure(false)} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// PluginsPage
// ---------------------------------------------------------------------------
export function PluginsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['tenant-plugins'],
    queryFn: () => adminApi.getTenantPlugins(),
  });

  const plugins = data?.plugins ?? [];

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Plugins | Ecom Admin</title>
        <meta name="description" content="Configure and manage fulfillment plugins and integrations" />
      </Helmet>

      <div>
        <h1 className="text-4xl font-bold mb-2">Plugins</h1>
        <p className="text-muted-foreground">Configure integrations and fulfillment plugins</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && plugins.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plugins.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} />
          ))}
        </div>
      )}

      {!isLoading && plugins.length === 0 && (
        <EmptyState
          icon={Package}
          title="No Plugins Configured"
          description="No plugins have been configured for this tenant yet. Plugins let you connect fulfillment providers, payment gateways, and more."
        />
      )}
    </div>
  );
}

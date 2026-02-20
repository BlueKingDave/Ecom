import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { Megaphone, X } from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Button, Input, Label, Skeleton, EmptyState,
} from '@ecom/ui';
import { adminApi } from '@/lib/api';
import type { Campaign, AdPlatform, CampaignStatus, CampaignMetrics } from '@/lib/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PLATFORM_BADGES: Record<AdPlatform, { label: string; className: string }> = {
  meta: { label: 'Meta', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  tiktok: { label: 'TikTok', className: 'bg-gray-900 text-white' },
  google: { label: 'Google', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

const STATUS_BADGES: Record<CampaignStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  active: { label: 'Active', className: 'bg-green-100 text-green-800' },
  paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-800' },
};

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const campaignSchema = z.object({
  name: z.string().min(1).max(255),
  platform: z.enum(['meta', 'tiktok', 'google'] as const),
  budget: z.coerce.number().positive(),
  config: z
    .string()
    .refine(
      (s) => { try { JSON.parse(s); return true; } catch { return false; } },
      'Must be valid JSON'
    ),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

// ---------------------------------------------------------------------------
// CampaignModal
// ---------------------------------------------------------------------------
interface CampaignModalProps {
  campaign?: Campaign;
  onClose: () => void;
}

function CampaignModal({ campaign, onClose }: CampaignModalProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: campaign
      ? {
          name: campaign.name,
          platform: campaign.platform,
          budget: parseFloat(campaign.budget),
          config: JSON.stringify(campaign.config, null, 2),
        }
      : { name: '', platform: 'meta' as const, budget: 0, config: '{}' },
  });

  const createMutation = useMutation({
    mutationFn: (values: CampaignFormValues) =>
      adminApi.createCampaign({
        name: values.name,
        platform: values.platform,
        budget: values.budget,
        config: JSON.parse(values.config),
      }),
    onSuccess: () => {
      toast.success('Campaign created');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      onClose();
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: (values: CampaignFormValues) =>
      adminApi.updateCampaign(campaign!.id, {
        name: values.name,
        budget: String(values.budget),
        config: JSON.parse(values.config),
      }),
    onSuccess: () => {
      toast.success('Campaign updated');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      onClose();
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  const mutation = campaign ? updateMutation : createMutation;
  const isEditing = Boolean(campaign);

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
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Campaign' : 'Create Campaign'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
            <Input id="name" placeholder="Summer Sale Campaign" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {!isEditing && (
            <div className="space-y-1">
              <Label htmlFor="platform">Platform <span className="text-destructive">*</span></Label>
              <select
                id="platform"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('platform')}
              >
                <option value="meta">Meta</option>
                <option value="tiktok">TikTok</option>
                <option value="google">Google</option>
              </select>
              {errors.platform && <p className="text-xs text-destructive">{errors.platform.message}</p>}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="budget">Budget (USD) <span className="text-destructive">*</span></Label>
            <Input id="budget" type="number" min="0" step="0.01" placeholder="100" {...register('budget')} />
            {errors.budget && <p className="text-xs text-destructive">{errors.budget.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="config">Config (JSON)</Label>
            <textarea
              id="config"
              rows={4}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
              placeholder="{}"
              {...register('config')}
            />
            {errors.config && <p className="text-xs text-destructive">{errors.config.message}</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Campaign'}
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
// MetricsPanel
// ---------------------------------------------------------------------------
interface MetricsPanelProps {
  campaignId: string;
}

function MetricsPanel({ campaignId }: MetricsPanelProps) {
  const { data, isLoading } = useQuery<CampaignMetrics>({
    queryKey: ['campaign-metrics', campaignId],
    queryFn: () => adminApi.getCampaignMetrics(campaignId),
  });

  if (isLoading) return <Skeleton className="h-20 w-full rounded" />;
  if (!data) return null;

  const metrics: { label: string; value: string }[] = [
    { label: 'Impressions', value: data.impressions.toLocaleString() },
    { label: 'Clicks', value: data.clicks.toLocaleString() },
    { label: 'Conversions', value: data.conversions.toLocaleString() },
    { label: 'Spend', value: `$${data.spend.toFixed(2)}` },
    { label: 'CPC', value: `$${data.cpc.toFixed(3)}` },
    { label: 'CPA', value: `$${data.cpa.toFixed(2)}` },
    { label: 'ROAS', value: `${data.roas.toFixed(1)}x` },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 p-3 bg-muted/50 rounded-md">
      {metrics.map(({ label, value }) => (
        <div key={label} className="text-center">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CampaignCard
// ---------------------------------------------------------------------------
interface CampaignCardProps {
  campaign: Campaign;
}

function CampaignCard({ campaign }: CampaignCardProps) {
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);

  const platform = PLATFORM_BADGES[campaign.platform as AdPlatform] ?? { label: campaign.platform, className: 'bg-gray-100 text-gray-700' };
  const status = STATUS_BADGES[campaign.status];

  const activateMutation = useMutation({
    mutationFn: () => adminApi.activateCampaign(campaign.id),
    onSuccess: () => {
      toast.success('Campaign activated');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (err: Error) => toast.error(`Activate failed: ${err.message}`),
  });

  const pauseMutation = useMutation({
    mutationFn: () => adminApi.pauseCampaign(campaign.id),
    onSuccess: () => {
      toast.success('Campaign paused');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (err: Error) => toast.error(`Pause failed: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteCampaign(campaign.id),
    onSuccess: () => {
      toast.success('Campaign deleted');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="truncate">{campaign.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${platform.className}`}>
                {platform.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                {status.label}
              </span>
            </div>
          </CardTitle>
          <CardDescription>Budget: ${parseFloat(campaign.budget).toFixed(2)}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {campaign.status === 'active' && <MetricsPanel campaignId={campaign.id} />}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              Edit
            </Button>

            {(campaign.status === 'draft' || campaign.status === 'paused') && (
              <Button
                size="sm"
                disabled={activateMutation.isPending}
                onClick={() => activateMutation.mutate()}
              >
                {activateMutation.isPending ? 'Activating…' : 'Activate'}
              </Button>
            )}

            {campaign.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                disabled={pauseMutation.isPending}
                onClick={() => pauseMutation.mutate()}
              >
                {pauseMutation.isPending ? 'Pausing…' : 'Pause'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (confirm('Delete this campaign?')) deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showEdit && <CampaignModal campaign={campaign} onClose={() => setShowEdit(false)} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// CampaignsPage
// ---------------------------------------------------------------------------
export function CampaignsPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => adminApi.getCampaigns(),
  });

  const campaigns = data?.campaigns ?? [];

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Campaigns | Ecom Admin</title>
        <meta name="description" content="Manage ad campaigns across Meta, TikTok, and Google" />
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Campaigns</h1>
          <p className="text-muted-foreground">Manage ad campaigns across Meta, TikTok, and Google</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          Create Campaign
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {!isLoading && campaigns.length === 0 && (
        <EmptyState
          icon={Megaphone}
          title="No Campaigns Yet"
          description="Create your first ad campaign to start reaching customers on Meta, TikTok, or Google."
        />
      )}

      {showCreate && <CampaignModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

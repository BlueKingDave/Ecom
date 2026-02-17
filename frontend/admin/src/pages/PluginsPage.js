import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-4xl font-bold mb-2", children: "Plugins" }), _jsx("p", { className: "text-muted-foreground", children: "Configure integrations and plugins" })] }), isLoading && _jsx("div", { className: "text-center py-12", children: "Loading plugins..." }), data && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: data.plugins.map((plugin) => (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Settings, { className: "h-5 w-5" }), plugin.name] }), plugin.enabled ? (_jsx(CheckCircle2, { className: "h-5 w-5 text-green-500" })) : (_jsx(XCircle, { className: "h-5 w-5 text-muted-foreground" }))] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Plugin ID" }), _jsx("p", { className: "font-medium font-mono text-sm", children: plugin.id })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Status" }), _jsx("p", { className: `font-medium ${plugin.enabled ? 'text-green-600' : 'text-muted-foreground'}`, children: plugin.enabled ? 'Enabled' : 'Disabled' })] }), _jsxs("div", { className: "flex gap-2 pt-2", children: [_jsx(Button, { variant: "outline", size: "sm", children: "Configure" }), _jsx(Button, { variant: plugin.enabled ? 'outline' : 'default', size: "sm", children: plugin.enabled ? 'Disable' : 'Enable' })] })] })] }, plugin.id))) })), data?.plugins?.length === 0 && (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: "No plugins available" }) }))] }));
}

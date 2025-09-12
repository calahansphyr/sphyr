import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  Zap,
  Clock,
  Database,
  Network,
  Cpu,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Settings,
  Eye,
  Download,
  CheckCircle2,
  X,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
  category: 'system' | 'network' | 'database' | 'application';
}

export interface PerformanceAlert {
  id: string;
  metricId: string;
  type: 'threshold' | 'anomaly' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  id: string;
  name: string;
  period: {
    from: Date;
    to: Date;
  };
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  summary: {
    overallHealth: number;
    totalAlerts: number;
    criticalIssues: number;
    averageResponseTime: number;
    uptime: number;
  };
  generatedAt: Date;
}

export interface PerformanceMonitoringConfig {
  enabled: boolean;
  samplingInterval: number; // in milliseconds
  alertThresholds: Record<string, { warning: number; critical: number }>;
  autoAlerting: boolean;
  reportGeneration: boolean;
  dataRetention: number; // in days
  notifications: {
    email: boolean;
    inApp: boolean;
    webhook: boolean;
  };
}

export interface AdvancedPerformanceMonitoringProps {
  className?: string;
  onGetMetrics?: () => Promise<PerformanceMetric[]>;
  onGetAlerts?: () => Promise<PerformanceAlert[]>;
  onGetReports?: () => Promise<PerformanceReport[]>;
  onUpdateConfig?: (config: PerformanceMonitoringConfig) => Promise<void>;
  onGenerateReport?: (period: { from: Date; to: Date }) => Promise<PerformanceReport>;
  onResolveAlert?: (alertId: string) => Promise<void>;
  onDismissAlert?: (alertId: string) => Promise<void>;
}

export const AdvancedPerformanceMonitoring: React.FC<AdvancedPerformanceMonitoringProps> = ({
  className = "",
  onGetMetrics,
  onGetAlerts,
  onGetReports,
  onUpdateConfig,
  onGenerateReport,
  onResolveAlert,
  onDismissAlert
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'alerts' | 'reports' | 'settings'>('overview');
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [config, setConfig] = useState<PerformanceMonitoringConfig>({
    enabled: true,
    samplingInterval: 5000,
    alertThresholds: {},
    autoAlerting: true,
    reportGeneration: true,
    dataRetention: 30,
    notifications: {
      email: true,
      inApp: true,
      webhook: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [showSettings, setShowSettings] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadMetrics = useCallback(async () => {
    if (!onGetMetrics) return;

    try {
      const metricsData = await onGetMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  }, [onGetMetrics]);

  const loadAlerts = useCallback(async () => {
    if (!onGetAlerts) return;

    try {
      const alertsData = await onGetAlerts();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  }, [onGetAlerts]);

  const loadReports = useCallback(async () => {
    if (!onGetReports) return;

    try {
      const reportsData = await onGetReports();
      setReports(reportsData);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  }, [onGetReports]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMetrics(),
        loadAlerts(),
        loadReports()
      ]);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadMetrics, loadAlerts, loadReports]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up real-time monitoring
  useEffect(() => {
    if (realTimeEnabled && config.enabled) {
      intervalRef.current = setInterval(() => {
        loadMetrics();
      }, config.samplingInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [realTimeEnabled, config.enabled, config.samplingInterval, loadMetrics]);


  const handleResolveAlert = useCallback(async (alertId: string) => {
    if (!onResolveAlert) return;

    try {
      await onResolveAlert(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true, resolvedAt: new Date() } : alert
      ));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  }, [onResolveAlert]);

  const handleDismissAlert = useCallback(async (alertId: string) => {
    if (!onDismissAlert) return;

    try {
      await onDismissAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  }, [onDismissAlert]);

  const handleGenerateReport = useCallback(async () => {
    if (!onGenerateReport) return;

    setLoading(true);
    try {
      const now = new Date();
      const from = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
      
      const report = await onGenerateReport({ from, to: now });
      setReports(prev => [report, ...prev]);
      setShowReportDialog(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  }, [onGenerateReport]);

  const handleUpdateConfig = useCallback(async (newConfig: PerformanceMonitoringConfig) => {
    if (!onUpdateConfig) return;

    try {
      await onUpdateConfig(newConfig);
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  }, [onUpdateConfig]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <Cpu className="w-4 h-4" />;
      case 'network':
        return <Network className="w-4 h-4" />;
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'application':
        return <Zap className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${value.toFixed(1)}ms`;
    } else if (unit === 'MB') {
      return `${value.toFixed(1)}MB`;
    } else if (unit === 'GB') {
      return `${value.toFixed(1)}GB`;
    } else if (unit === 'bps') {
      return `${(value / 1000000).toFixed(1)}Mbps`;
    } else if (unit === 'req/s') {
      return `${value.toFixed(1)} req/s`;
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    return `${value.toFixed(1)} ${unit}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculate overall health score
  const overallHealth = metrics.length > 0 
    ? Math.round(metrics.reduce((sum, metric) => {
        const score = metric.status === 'healthy' ? 100 : metric.status === 'warning' ? 50 : 0;
        return sum + score;
      }, 0) / metrics.length)
    : 100;

  // Get active alerts count
  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitoring</h2>
          <p className="text-gray-600">Monitor system performance and health metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={realTimeEnabled}
              onCheckedChange={setRealTimeEnabled}
            />
            <Label>Real-time</Label>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowReportDialog(true)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallHealth}%</div>
            <Progress value={overallHealth} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {overallHealth >= 90 ? 'Excellent' : overallHealth >= 70 ? 'Good' : overallHealth >= 50 ? 'Fair' : 'Poor'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts.length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.find(m => m.name === 'Response Time')?.value.toFixed(1) || '0.0'}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.find(m => m.name === 'Uptime')?.value.toFixed(1) || '100.0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 24h
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'metrics' | 'alerts' | 'reports' | 'settings')}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.slice(0, 5).map(metric => (
                    <div key={metric.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(metric.category)}
                        <div>
                          <p className="font-medium">{metric.name}</p>
                          <p className="text-sm text-gray-600">{formatValue(metric.value, metric.unit)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(metric.trend)}
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Latest performance alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeAlerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="text-sm text-gray-600">{formatDate(alert.timestamp)}</span>
                        </div>
                        <p className="text-sm">{alert.message}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissAlert(alert.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={selectedTimeRange} onValueChange={(value: string) => setSelectedTimeRange(value as '1h' | '24h' | '7d' | '30d')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadMetrics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map(metric => (
              <Card key={metric.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(metric.category)}
                      <CardTitle className="text-sm">{metric.name}</CardTitle>
                    </div>
                    {getStatusIcon(metric.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold">
                      {formatValue(metric.value, metric.unit)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Thresholds:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-600">
                          {formatValue(metric.threshold.warning, metric.unit)}
                        </span>
                        <span className="text-red-600">
                          {formatValue(metric.threshold.critical, metric.unit)}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={(metric.value / metric.threshold.critical) * 100} 
                      className="h-2"
                    />
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status}
                      </Badge>
                      {getTrendIcon(metric.trend)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadAlerts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {alerts.map(alert => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">
                          {alert.type}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {formatDate(alert.timestamp)}
                        </span>
                        {alert.resolved && (
                          <Badge variant="secondary">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      {alert.metadata && (
                        <div className="text-xs text-gray-500">
                          {Object.entries(alert.metadata).map(([key, value]) => (
                            <span key={key} className="mr-4">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {!alert.resolved && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissAlert(alert.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Performance Reports</h3>
            <Button onClick={() => setShowReportDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>

          <div className="space-y-4">
            {reports.map(report => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{report.name}</h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(report.period.from)} - {formatDate(report.period.to)}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span>Health: {report.summary.overallHealth}%</span>
                        <span>Alerts: {report.summary.totalAlerts}</span>
                        <span>Uptime: {report.summary.uptime.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Performance Monitoring Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Monitoring</Label>
                  <p className="text-sm text-gray-600">Enable performance monitoring</p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Sampling Interval</Label>
                <div className="space-y-2">
                  <Slider
                    value={[config.samplingInterval / 1000]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, samplingInterval: value * 1000 }))}
                    max={60}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">
                    {config.samplingInterval / 1000} seconds
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Alerting</Label>
                  <p className="text-sm text-gray-600">Automatically generate alerts for threshold breaches</p>
                </div>
                <Switch
                  checked={config.autoAlerting}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoAlerting: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Report Generation</Label>
                  <p className="text-sm text-gray-600">Automatically generate performance reports</p>
                </div>
                <Switch
                  checked={config.reportGeneration}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, reportGeneration: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Retention (Days)</Label>
                <Input
                  type="number"
                  value={config.dataRetention}
                  onChange={(e) => setConfig(prev => ({ ...prev, dataRetention: parseInt(e.target.value) || 30 }))}
                  min={1}
                  max={365}
                />
              </div>

              <div className="space-y-3">
                <Label>Notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Email</Label>
                    <Switch
                      checked={config.notifications.email}
                      onCheckedChange={(checked) => setConfig(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, email: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">In-App</Label>
                    <Switch
                      checked={config.notifications.inApp}
                      onCheckedChange={(checked) => setConfig(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, inApp: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Webhook</Label>
                    <Switch
                      checked={config.notifications.webhook}
                      onCheckedChange={(checked) => setConfig(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, webhook: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateConfig(config)}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Generation Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Performance Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Report Period</Label>
              <Select defaultValue="24h">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateReport} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedPerformanceMonitoring;

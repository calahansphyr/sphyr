import React, { useState, useCallback, useEffect } from 'react';
import {
  Download,
  Upload,
  FileText,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Info,
  File,
  BarChart3,
  PieChart,
  Download as DownloadIcon,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { userBehaviorTracker } from '@/lib/analytics/UserBehaviorTracker';

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  dataTypes: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  includeMetadata: boolean;
  includeAnalytics: boolean;
  includeUserData: boolean;
  compression: boolean;
  encryption: boolean;
}

export interface ImportOptions {
  format: 'json' | 'csv' | 'xlsx';
  dataTypes: string[];
  mergeStrategy: 'replace' | 'merge' | 'skip_duplicates';
  validation: boolean;
  backup: boolean;
}

export interface ExportJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
  options: ExportOptions;
}

export interface ImportJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  recordsProcessed?: number;
  recordsImported?: number;
  error?: string;
  options: ImportOptions;
}

export interface DataExportImportProps {
  className?: string;
  onExport?: (options: ExportOptions) => Promise<ExportJob>;
  onImport?: (file: File, options: ImportOptions) => Promise<ImportJob>;
  onGetExportJobs?: () => Promise<ExportJob[]>;
  onGetImportJobs?: () => Promise<ImportJob[]>;
  onCancelJob?: (jobId: string, type: 'export' | 'import') => Promise<void>;
  onDownloadExport?: (jobId: string) => Promise<string>;
}

export const DataExportImport: React.FC<DataExportImportProps> = ({
  className = "",
  onExport,
  onImport,
  onGetExportJobs,
  onGetImportJobs,
  onCancelJob,
  onDownloadExport
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Export options
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    dataTypes: ['search_history', 'saved_searches', 'preferences'],
    dateRange: { from: null, to: null },
    includeMetadata: true,
    includeAnalytics: false,
    includeUserData: true,
    compression: true,
    encryption: false
  });

  // Import options
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    format: 'json',
    dataTypes: ['search_history', 'saved_searches', 'preferences'],
    mergeStrategy: 'merge',
    validation: true,
    backup: true
  });

  const dataTypes = [
    { id: 'search_history', label: 'Search History', description: 'Your search queries and results' },
    { id: 'saved_searches', label: 'Saved Searches', description: 'Bookmarked and saved search queries' },
    { id: 'preferences', label: 'User Preferences', description: 'Settings and customization options' },
    { id: 'integrations', label: 'Integration Settings', description: 'Connected platforms and configurations' },
    { id: 'analytics', label: 'Usage Analytics', description: 'Search patterns and behavior data' },
    { id: 'notifications', label: 'Notification Settings', description: 'Alert and notification preferences' }
  ];

  const formatOptions = [
    { value: 'json', label: 'JSON', description: 'Structured data format', icon: FileText },
    { value: 'csv', label: 'CSV', description: 'Spreadsheet compatible', icon: BarChart3 },
    { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel format', icon: PieChart },
    { value: 'pdf', label: 'PDF', description: 'Human readable report', icon: File }
  ];

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      if (onGetExportJobs) {
        const exports = await onGetExportJobs();
        setExportJobs(exports);
      }
      if (onGetImportJobs) {
        const imports = await onGetImportJobs();
        setImportJobs(imports);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [onGetExportJobs, onGetImportJobs]);

  // Load jobs on component mount
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleExport = useCallback(async () => {
    if (!onExport) return;

    setLoading(true);
    try {
      const job = await onExport(exportOptions);
      setExportJobs(prev => [job, ...prev]);
      setShowExportDialog(false);

      // Track export event
      userBehaviorTracker.trackEvent('click', {
        element: 'export_button',
        action: 'data_export',
        format: exportOptions.format,
        dataTypes: exportOptions.dataTypes,
        includeAnalytics: exportOptions.includeAnalytics,
        compression: exportOptions.compression,
        encryption: exportOptions.encryption
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  }, [exportOptions, onExport]);

  const handleImport = useCallback(async () => {
    if (!selectedFile || !onImport) return;

    setLoading(true);
    try {
      const job = await onImport(selectedFile, importOptions);
      setImportJobs(prev => [job, ...prev]);
      setShowImportDialog(false);
      setSelectedFile(null);

      // Track import event
      userBehaviorTracker.trackEvent('click', {
        element: 'import_button',
        action: 'data_import',
        format: importOptions.format,
        dataTypes: importOptions.dataTypes,
        mergeStrategy: importOptions.mergeStrategy,
        fileSize: selectedFile.size,
        fileName: selectedFile.name
      });
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedFile, importOptions, onImport]);

  const handleCancelJob = useCallback(async (jobId: string, type: 'export' | 'import') => {
    if (!onCancelJob) return;

    try {
      await onCancelJob(jobId, type);
      if (type === 'export') {
        setExportJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: 'cancelled' } : job
        ));
      } else {
        setImportJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: 'cancelled' } : job
        ));
      }
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  }, [onCancelJob]);

  const handleDownloadExport = useCallback(async (jobId: string) => {
    if (!onDownloadExport) return;

    try {
      const downloadUrl = await onDownloadExport(jobId);
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `sphyr-export-${jobId}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download export:', error);
    }
  }, [onDownloadExport, exportOptions.format]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Export & Import</h2>
          <p className="text-gray-600">Export your data or import from other sources</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'export' | 'import')}>
        <TabsList>
          <TabsTrigger value="export">Export Jobs</TabsTrigger>
          <TabsTrigger value="import">Import Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          {exportJobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Export Jobs</h3>
                <p className="text-gray-600 mb-4">You haven&apos;t created any data exports yet.</p>
                <Button onClick={() => setShowExportDialog(true)}>
                  <Download className="w-4 h-4 mr-2" />
                  Create Export
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {exportJobs.map(job => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <h3 className="font-semibold">{job.name}</h3>
                          <p className="text-sm text-gray-600">
                            Created {formatDate(job.createdAt)}
                            {job.fileSize && ` • ${formatFileSize(job.fileSize)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        {job.status === 'processing' && (
                          <div className="w-24">
                            <Progress value={job.progress} className="h-2" />
                          </div>
                        )}
                        {job.status === 'completed' && job.downloadUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadExport(job.id)}
                          >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                        {(job.status === 'pending' || job.status === 'processing') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelJob(job.id, 'export')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                    {job.error && (
                      <Alert className="mt-3">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>{job.error}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          {importJobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Import Jobs</h3>
                <p className="text-gray-600 mb-4">You haven&apos;t imported any data yet.</p>
                <Button onClick={() => setShowImportDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {importJobs.map(job => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <h3 className="font-semibold">{job.name}</h3>
                          <p className="text-sm text-gray-600">
                            Created {formatDate(job.createdAt)}
                            {job.recordsProcessed && ` • ${job.recordsProcessed} records processed`}
                            {job.recordsImported && ` • ${job.recordsImported} imported`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        {job.status === 'processing' && (
                          <div className="w-24">
                            <Progress value={job.progress} className="h-2" />
                          </div>
                        )}
                        {(job.status === 'pending' || job.status === 'processing') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelJob(job.id, 'import')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                    {job.error && (
                      <Alert className="mt-3">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>{job.error}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Export Format</Label>
                <div className="grid gap-3 md:grid-cols-2 mt-2">
                  {formatOptions.map(format => (
                    <Card
                      key={format.value}
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        exportOptions.format === format.value
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover:shadow-md"
                      )}
                      onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as string }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <format.icon className="w-5 h-5 text-gray-600" />
                          <div>
                            <h3 className="font-semibold">{format.label}</h3>
                            <p className="text-sm text-gray-600">{format.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label>Data Types to Export</Label>
                <div className="grid gap-3 mt-2">
                  {dataTypes.map(dataType => (
                    <div key={dataType.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={dataType.id}
                        checked={exportOptions.dataTypes.includes(dataType.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setExportOptions(prev => ({
                              ...prev,
                              dataTypes: [...prev.dataTypes, dataType.id]
                            }));
                          } else {
                            setExportOptions(prev => ({
                              ...prev,
                              dataTypes: prev.dataTypes.filter(type => type !== dataType.id)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={dataType.id} className="flex-1">
                        <div>
                          <span className="font-medium">{dataType.label}</span>
                          <p className="text-sm text-gray-600">{dataType.description}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date Range (Optional)</Label>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={exportOptions.dateRange.from ? exportOptions.dateRange.from.toISOString().split('T')[0] : ''}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, from: e.target.value ? new Date(e.target.value) : null }
                      }))}
                    />
                    <Input
                      type="date"
                      value={exportOptions.dateRange.to ? exportOptions.dateRange.to.toISOString().split('T')[0] : ''}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, to: e.target.value ? new Date(e.target.value) : null }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Include Metadata</Label>
                    <Checkbox
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeMetadata: !!checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Include Analytics</Label>
                    <Checkbox
                      checked={exportOptions.includeAnalytics}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeAnalytics: !!checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Compress File</Label>
                    <Checkbox
                      checked={exportOptions.compression}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, compression: !!checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Encrypt File</Label>
                    <Checkbox
                      checked={exportOptions.encryption}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, encryption: !!checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={loading || exportOptions.dataTypes.length === 0}>
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Start Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Select File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <File className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-gray-600">Click to select a file or drag and drop</p>
                      <Input
                        type="file"
                        accept=".json,.csv,.xlsx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedFile(file);
                        }}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label htmlFor="file-upload">
                        <Button variant="outline" asChild>
                          <span>Choose File</span>
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Import Format</Label>
                <Select value={importOptions.format} onValueChange={(value) => setImportOptions(prev => ({ ...prev, format: value as string }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data Types to Import</Label>
                <div className="grid gap-3 mt-2">
                  {dataTypes.map(dataType => (
                    <div key={dataType.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`import-${dataType.id}`}
                        checked={importOptions.dataTypes.includes(dataType.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setImportOptions(prev => ({
                              ...prev,
                              dataTypes: [...prev.dataTypes, dataType.id]
                            }));
                          } else {
                            setImportOptions(prev => ({
                              ...prev,
                              dataTypes: prev.dataTypes.filter(type => type !== dataType.id)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`import-${dataType.id}`} className="flex-1">
                        <div>
                          <span className="font-medium">{dataType.label}</span>
                          <p className="text-sm text-gray-600">{dataType.description}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Merge Strategy</Label>
                  <Select value={importOptions.mergeStrategy} onValueChange={(value) => setImportOptions(prev => ({ ...prev, mergeStrategy: value as string }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="replace">Replace existing data</SelectItem>
                      <SelectItem value="merge">Merge with existing data</SelectItem>
                      <SelectItem value="skip_duplicates">Skip duplicates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Validate Data</Label>
                    <Checkbox
                      checked={importOptions.validation}
                      onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, validation: !!checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Create Backup</Label>
                    <Checkbox
                      checked={importOptions.backup}
                      onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, backup: !!checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Importing data will merge with your existing data based on the selected strategy. 
                We recommend creating a backup before importing.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={loading || !selectedFile || importOptions.dataTypes.length === 0}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Start Import
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

export default DataExportImport;

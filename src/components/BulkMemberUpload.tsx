import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UploadResult {
  success: Array<{ name: string; email: string; password: string; member_code: string }>;
  errors: Array<{ row: number; name: string; error: string }>;
}

export default function BulkMemberUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = 'Name,Email,Phone,Age,Gender,Plan';
    const sample = 'John Doe,john@example.com,+919876543210,25,Male,Monthly\nJane Smith,jane@example.com,+919876543211,28,Female,Quarterly';
    const csv = `${headers}\n${sample}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'member_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCredentials = () => {
    if (!result?.success.length) return;
    const headers = 'Name,Email,Password,Member Code';
    const rows = result.success.map(r => `${r.name},${r.email},${r.password},${r.member_code}`).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'member_credentials.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): Array<Record<string, string>> => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast({ title: 'Invalid file', description: 'Please upload a CSV file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast({ title: 'Empty file', description: 'No data rows found in the file', variant: 'destructive' });
        setUploading(false);
        return;
      }

      // Get user's organization
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user!.id)
        .eq('role', 'owner')
        .single();

      if (!orgMember) {
        toast({ title: 'Error', description: 'You must register an organization first', variant: 'destructive' });
        setUploading(false);
        return;
      }

      // Call edge function to bulk create members
      const { data, error } = await supabase.functions.invoke('bulk-create-members', {
        body: {
          members: rows,
          organization_id: orgMember.organization_id,
        },
      });

      if (error) throw error;

      setResult(data as UploadResult);

      if (data.success.length > 0) {
        toast({ title: 'Members created!', description: `${data.success.length} members added successfully` });
      }
      if (data.errors.length > 0) {
        toast({ title: 'Some rows failed', description: `${data.errors.length} rows had errors`, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Bulk Member Upload
          </CardTitle>
          <CardDescription>
            Upload a CSV file with member details to create accounts in bulk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <Download className="w-4 h-4" />
            Download CSV Template
          </Button>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Creating member accounts...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Drop your CSV file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
                <Badge variant="outline" className="gap-1">
                  <FileSpreadsheet className="w-3 h-3" />
                  CSV format
                </Badge>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-3">
          {result.success.length > 0 && (
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  {result.success.length} Members Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-auto text-sm space-y-1">
                  {result.success.map((m, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                      <span>{m.name}</span>
                      <span className="text-muted-foreground text-xs">{m.email}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={downloadCredentials} className="w-full mt-3 gap-2" variant="outline">
                  <Download className="w-4 h-4" />
                  Download Credentials CSV
                </Button>
              </CardContent>
            </Card>
          )}

          {result.errors.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  {result.errors.length} Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-auto text-sm space-y-1">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                      <span>Row {err.row}: {err.name || 'Unknown'}</span>
                      <span className="text-destructive text-xs">{err.error}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

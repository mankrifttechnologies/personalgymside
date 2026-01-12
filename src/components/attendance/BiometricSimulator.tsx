import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAllGymMembers, useBiometricDevices, useProcessAttendance } from '@/hooks/useAttendance';
import type { BiometricInput } from '@/types/attendance';

export function BiometricSimulator() {
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<string>('BIO-01');
  const [scanType, setScanType] = useState<'check-in' | 'check-out'>('check-in');
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: members, isLoading: loadingMembers } = useAllGymMembers();
  const { data: devices } = useBiometricDevices();
  const processAttendance = useProcessAttendance();

  const handleSimulateScan = async () => {
    if (!selectedMember) return;

    const input: BiometricInput = {
      memberId: selectedMember,
      deviceId: selectedDevice,
      timestamp: new Date().toISOString(),
      type: scanType
    };

    try {
      const result = await processAttendance.mutateAsync(input);
      setLastResult({ success: true, message: result.message });
    } catch (error: any) {
      setLastResult({ success: false, message: error.message });
    }
  };

  const handleRandomScan = async () => {
    if (!members || members.length === 0) return;

    const randomMember = members[Math.floor(Math.random() * members.length)];
    
    const input: BiometricInput = {
      memberId: randomMember.member_code,
      deviceId: selectedDevice,
      timestamp: new Date().toISOString(),
      type: scanType
    };

    try {
      const result = await processAttendance.mutateAsync(input);
      setLastResult({ success: true, message: `${randomMember.member_code}: ${result.message}` });
    } catch (error: any) {
      setLastResult({ success: false, message: error.message });
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/20">
            <Fingerprint className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Biometric Simulator</CardTitle>
            <CardDescription>
              Simulate thumb scanner input for testing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Member</label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members?.map(member => (
                  <SelectItem key={member.id} value={member.member_code}>
                    {member.member_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Device</label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger>
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent>
                {devices?.map(device => (
                  <SelectItem key={device.id} value={device.device_id}>
                    {device.name} ({device.device_id})
                  </SelectItem>
                ))}
                <SelectItem value="BIO-01">Main Entrance Scanner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Scan Type</label>
            <Select value={scanType} onValueChange={(v) => setScanType(v as 'check-in' | 'check-out')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="check-in">Check In</SelectItem>
                <SelectItem value="check-out">Check Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleSimulateScan}
            disabled={!selectedMember || processAttendance.isPending}
            className="flex-1"
          >
            {processAttendance.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Fingerprint className="h-4 w-4 mr-2" />
            )}
            Simulate Thumb Scan
          </Button>

          <Button 
            variant="outline"
            onClick={handleRandomScan}
            disabled={!members?.length || processAttendance.isPending}
          >
            Random Scan
          </Button>
        </div>

        {lastResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            lastResult.success 
              ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            {lastResult.success ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{lastResult.message}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Demo Mode:</strong> This simulates input from a biometric thumb scanner. 
          In production, this would receive data from the physical device via API webhook.
        </div>
      </CardContent>
    </Card>
  );
}

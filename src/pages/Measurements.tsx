import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useMeasurements } from '@/hooks/useMeasurements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Scale, ChevronLeft, Plus, Trash2, TrendingUp, TrendingDown,
  Activity, Dumbbell, Utensils, User, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Measurements() {
  const { user, loading: authLoading } = useAuth();
  const { 
    measurements, 
    isLoading, 
    addMeasurement, 
    deleteMeasurement,
    getWeightProgress,
    getLatestMeasurement,
    getWeightChange 
  } = useMeasurements();
  
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState<number | ''>('');
  const [bodyFat, setBodyFat] = useState<number | ''>('');
  const [chest, setChest] = useState<number | ''>('');
  const [waist, setWaist] = useState<number | ''>('');
  const [hips, setHips] = useState<number | ''>('');
  const [biceps, setBiceps] = useState<number | ''>('');
  const [thighs, setThighs] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <Scale className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleAddMeasurement = async () => {
    if (!weight && !bodyFat && !chest && !waist && !hips && !biceps && !thighs) {
      toast.error('Please enter at least one measurement');
      return;
    }

    try {
      await addMeasurement.mutateAsync({
        measurement_date: new Date().toISOString().split('T')[0],
        weight_kg: weight || null,
        body_fat_percentage: bodyFat || null,
        chest_cm: chest || null,
        waist_cm: waist || null,
        hips_cm: hips || null,
        biceps_cm: biceps || null,
        thighs_cm: thighs || null,
        notes: notes || null,
      });
      
      toast.success('Measurement added!');
      setShowForm(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to add measurement');
    }
  };

  const resetForm = () => {
    setWeight('');
    setBodyFat('');
    setChest('');
    setWaist('');
    setHips('');
    setBiceps('');
    setThighs('');
    setNotes('');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMeasurement.mutateAsync(id);
      toast.success('Measurement deleted');
    } catch (error) {
      toast.error('Failed to delete measurement');
    }
  };

  const weightData = getWeightProgress();
  const latest = getLatestMeasurement();
  const weightChange = getWeightChange();

  return (
    <div className="min-h-screen pb-24 safe-area-top">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link to="/profile">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Body Measurements</h1>
          <p className="text-sm text-muted-foreground">Track your progress</p>
        </div>
        <Button variant="energy" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </header>

      <main className="px-4 space-y-6">
        {/* Current Stats */}
        {latest && (
          <div className="glass rounded-xl p-4 animate-slide-up">
            <h3 className="font-semibold mb-4">Current Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              {latest.weight_kg && (
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <p className="text-2xl font-bold text-primary">{latest.weight_kg} kg</p>
                  <p className="text-xs text-muted-foreground">Weight</p>
                </div>
              )}
              {latest.body_fat_percentage && (
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <p className="text-2xl font-bold text-accent">{latest.body_fat_percentage}%</p>
                  <p className="text-xs text-muted-foreground">Body Fat</p>
                </div>
              )}
            </div>
            
            {weightChange && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {weightChange.change > 0 ? (
                  <TrendingUp className="w-5 h-5 text-warning" />
                ) : weightChange.change < 0 ? (
                  <TrendingDown className="w-5 h-5 text-accent" />
                ) : null}
                <span className={`font-medium ${
                  weightChange.change > 0 ? 'text-warning' : 
                  weightChange.change < 0 ? 'text-accent' : 'text-muted-foreground'
                }`}>
                  {weightChange.change > 0 ? '+' : ''}{weightChange.change} kg
                </span>
                <span className="text-sm text-muted-foreground">over {weightChange.period}</span>
              </div>
            )}
          </div>
        )}

        {/* Weight Chart */}
        {weightData.length > 1 && (
          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-semibold mb-4">Weight Progress</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [`${value} kg`, 'Weight']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Add Measurement Form */}
        {showForm && (
          <div className="glass rounded-xl p-4 animate-slide-up">
            <h3 className="font-semibold mb-4">New Measurement</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Weight (kg)</label>
                <Input
                  type="number"
                  placeholder="70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Body Fat (%)</label>
                <Input
                  type="number"
                  placeholder="15"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Chest (cm)</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={chest}
                  onChange={(e) => setChest(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Waist (cm)</label>
                <Input
                  type="number"
                  placeholder="80"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hips (cm)</label>
                <Input
                  type="number"
                  placeholder="95"
                  value={hips}
                  onChange={(e) => setHips(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Biceps (cm)</label>
                <Input
                  type="number"
                  placeholder="35"
                  value={biceps}
                  onChange={(e) => setBiceps(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Thighs (cm)</label>
                <Input
                  type="number"
                  placeholder="55"
                  value={thighs}
                  onChange={(e) => setThighs(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-muted-foreground">Notes</label>
              <Input
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button 
              variant="energy" 
              className="w-full mt-4"
              onClick={handleAddMeasurement}
              disabled={addMeasurement.isPending}
            >
              {addMeasurement.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Measurement'}
            </Button>
          </div>
        )}

        {/* Measurement History */}
        {measurements && measurements.length > 0 && (
          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-semibold mb-4">History</h3>
            <div className="space-y-3">
              {measurements.slice(0, 10).map((m) => (
                <div 
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {new Date(m.measurement_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {m.weight_kg && (
                        <span className="text-xs text-muted-foreground">{m.weight_kg}kg</span>
                      )}
                      {m.body_fat_percentage && (
                        <span className="text-xs text-muted-foreground">{m.body_fat_percentage}%</span>
                      )}
                      {m.chest_cm && (
                        <span className="text-xs text-muted-foreground">Chest: {m.chest_cm}cm</span>
                      )}
                      {m.waist_cm && (
                        <span className="text-xs text-muted-foreground">Waist: {m.waist_cm}cm</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

import { useState } from 'react';
import { useProgressPhotos, type ProgressPhoto } from '@/hooks/useProgressPhotos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Upload, Trash2, Loader2, ImageIcon, GitCompareArrows, X } from 'lucide-react';

export default function ProgressPhotoComparison() {
  const { photos, isLoading, uploadPhoto, deletePhoto, analyzePhoto, comparePhotos } = useProgressPhotos();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pose, setPose] = useState('front');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [analysisPhoto, setAnalysisPhoto] = useState<ProgressPhoto | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    await uploadPhoto.mutateAsync({
      file, pose,
      weight: weight ? parseFloat(weight) : null,
      notes, date,
    });
    setFile(null); setWeight(''); setNotes(''); setUploadOpen(false);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = async () => {
    if (selected.length !== 2) return;
    const ordered = [...selected].map(id => photos.find(p => p.id === id)!).sort(
      (a, b) => new Date(a.photo_date).getTime() - new Date(b.photo_date).getTime()
    );
    const result = await comparePhotos.mutateAsync({ before: ordered[0], after: ordered[1] });
    setComparisonResult({ ...result, before: ordered[0], after: ordered[1] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Progress Photos AI
          </h3>
          <p className="text-xs text-muted-foreground">Track body changes with AI analysis</p>
        </div>
        <div className="flex gap-2">
          {photos.length >= 2 && (
            <Button
              size="sm" variant={compareMode ? 'default' : 'outline'}
              onClick={() => { setCompareMode(!compareMode); setSelected([]); setComparisonResult(null); }}
              className="gap-1.5"
            >
              <GitCompareArrows className="w-4 h-4" /> Compare
            </Button>
          )}
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Upload className="w-4 h-4" /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Progress Photo</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>Photo</Label>
                  <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <Label>Pose</Label>
                  <Select value={pose} onValueChange={setPose}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="front">Front</SelectItem>
                      <SelectItem value="side">Side</SelectItem>
                      <SelectItem value="back">Back</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Weight (kg) — optional</Label>
                  <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
                <div>
                  <Label>Notes — optional</Label>
                  <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleUpload} disabled={!file || uploadPhoto.isPending}>
                  {uploadPhoto.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Upload
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {compareMode && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <p className="text-xs">Select 2 photos to compare ({selected.length}/2)</p>
            <Button
              size="sm"
              disabled={selected.length !== 2 || comparePhotos.isPending}
              onClick={handleCompare}
              className="gap-1.5"
            >
              {comparePhotos.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Compare
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : photos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No progress photos yet</p>
            <p className="text-xs mt-1">Add photos to track and compare your transformation</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map(photo => {
            const isSelected = selected.includes(photo.id);
            return (
              <Card
                key={photo.id}
                className={`overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                onClick={() => compareMode ? toggleSelect(photo.id) : setAnalysisPhoto(photo)}
              >
                <div className="relative aspect-[3/4] bg-muted">
                  {photo.photo_url && <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />}
                  {isSelected && (
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {selected.indexOf(photo.id) + 1}
                    </div>
                  )}
                  {photo.ai_analysis && (
                    <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-[9px] gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> AI
                    </Badge>
                  )}
                </div>
                <CardContent className="p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{new Date(photo.photo_date).toLocaleDateString()}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{photo.pose_type}{photo.weight_kg ? ` • ${photo.weight_kg}kg` : ''}</p>
                    </div>
                    {!compareMode && (
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); deletePhoto.mutate(photo); }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Single photo analysis */}
      <Dialog open={!!analysisPhoto} onOpenChange={(o) => !o && setAnalysisPhoto(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Photo Details</DialogTitle></DialogHeader>
          {analysisPhoto && (
            <div className="space-y-3">
              <img src={analysisPhoto.photo_url} alt="" className="w-full rounded-lg max-h-72 object-contain bg-muted" />
              <div className="text-sm">
                <p className="font-medium">{new Date(analysisPhoto.photo_date).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground capitalize">{analysisPhoto.pose_type}{analysisPhoto.weight_kg ? ` • ${analysisPhoto.weight_kg}kg` : ''}</p>
                {analysisPhoto.notes && <p className="text-xs mt-1">{analysisPhoto.notes}</p>}
              </div>

              {analysisPhoto.ai_analysis ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Card><CardContent className="p-3">
                      <p className="text-[10px] text-muted-foreground uppercase">Body Fat</p>
                      <p className="text-xl font-bold text-primary">~{analysisPhoto.ai_analysis.estimated_body_fat_percentage}%</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-3">
                      <p className="text-[10px] text-muted-foreground uppercase">Muscle</p>
                      <p className="text-sm font-bold capitalize">{analysisPhoto.ai_analysis.muscle_mass_level?.replace(/_/g, ' ')}</p>
                    </CardContent></Card>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div><p className="text-xs font-semibold text-muted-foreground">Development</p><p>{analysisPhoto.ai_analysis.muscular_development}</p></div>
                    <div><p className="text-xs font-semibold text-muted-foreground">Posture</p><p>{analysisPhoto.ai_analysis.posture_notes}</p></div>
                    {analysisPhoto.ai_analysis.visible_strengths?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Strengths</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisPhoto.ai_analysis.visible_strengths.map((s: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysisPhoto.ai_analysis.areas_to_improve?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Focus Areas</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisPhoto.ai_analysis.areas_to_improve.map((s: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">AI estimates only — not medical advice.</p>
                </div>
              ) : (
                <Button
                  className="w-full gap-2"
                  disabled={analyzePhoto.isPending}
                  onClick={async () => {
                    const updated = await analyzePhoto.mutateAsync(analysisPhoto);
                    setAnalysisPhoto({ ...analysisPhoto, ai_analysis: updated });
                  }}
                >
                  {analyzePhoto.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Analyze with AI
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comparison result */}
      <Dialog open={!!comparisonResult} onOpenChange={(o) => !o && setComparisonResult(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> AI Comparison
            </DialogTitle>
          </DialogHeader>
          {comparisonResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Before • {new Date(comparisonResult.before.photo_date).toLocaleDateString()}</p>
                  <img src={comparisonResult.before.photo_url} className="w-full aspect-[3/4] object-cover rounded-lg" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">After • {new Date(comparisonResult.after.photo_date).toLocaleDateString()}</p>
                  <img src={comparisonResult.after.photo_url} className="w-full aspect-[3/4] object-cover rounded-lg" />
                </div>
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <p className="text-sm">{comparisonResult.overall_summary}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-2 text-sm">
                <div><p className="text-xs font-semibold text-muted-foreground">Body Fat</p><p>{comparisonResult.body_fat_change}</p></div>
                <div><p className="text-xs font-semibold text-muted-foreground">Muscle</p><p>{comparisonResult.muscle_change}</p></div>
                <div><p className="text-xs font-semibold text-muted-foreground">Posture</p><p>{comparisonResult.posture_change}</p></div>
              </div>

              {comparisonResult.improvements?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">✓ Improvements</p>
                  <ul className="text-sm space-y-1">
                    {comparisonResult.improvements.map((s: string, i: number) => (
                      <li key={i} className="flex gap-2"><span className="text-primary">•</span>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {comparisonResult.focus_next?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">→ Focus Next</p>
                  <ul className="text-sm space-y-1">
                    {comparisonResult.focus_next.map((s: string, i: number) => (
                      <li key={i} className="flex gap-2"><span className="text-accent">•</span>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground italic">AI estimates only — not medical advice.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

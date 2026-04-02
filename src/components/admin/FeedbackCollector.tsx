import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFeedbackForms, useCreateFeedbackForm, useFeedbackResponses } from '@/hooks/useCommunications';
import { ClipboardList, Plus, Loader2, Eye, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function FeedbackCollector() {
  const { data: forms = [], isLoading } = useFeedbackForms();
  const createForm = useCreateFeedbackForm();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<string[]>(['']);
  const [viewFormId, setViewFormId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!title.trim() || questions.filter(q => q.trim()).length === 0) return;
    createForm.mutate({
      title,
      description: description || undefined,
      questions: questions.filter(q => q.trim()).map((q, i) => ({ id: i + 1, text: q, type: 'text' })),
    }, {
      onSuccess: () => {
        setCreateOpen(false);
        setTitle('');
        setDescription('');
        setQuestions(['']);
      },
    });
  };

  const addQuestion = () => setQuestions([...questions, '']);
  const updateQuestion = (i: number, val: string) => {
    const copy = [...questions];
    copy[i] = val;
    setQuestions(copy);
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Feedback Forms ({forms.length})
            </CardTitle>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  New Form
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Feedback Form</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Form title"
                  />
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="min-h-[60px]"
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Questions</p>
                    {questions.map((q, i) => (
                      <Input
                        key={i}
                        value={q}
                        onChange={e => updateQuestion(i, e.target.value)}
                        placeholder={`Question ${i + 1}`}
                      />
                    ))}
                    <Button variant="ghost" size="sm" onClick={addQuestion} className="text-xs">
                      <Plus className="w-3 h-3 mr-1" /> Add Question
                    </Button>
                  </div>
                  <Button className="w-full" onClick={handleCreate} disabled={createForm.isPending || !title.trim()}>
                    {createForm.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                    Create Form
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {forms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No forms yet</p>
          ) : (
            forms.map(f => (
              <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{f.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{format(new Date(f.created_at), 'MMM d')}</span>
                    <Badge variant={f.is_active ? 'default' : 'secondary'} className="text-[9px] px-1">
                      {f.is_active ? 'Active' : 'Closed'}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setViewFormId(f.id)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {viewFormId && (
        <Dialog open={!!viewFormId} onOpenChange={() => setViewFormId(null)}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Responses</DialogTitle>
            </DialogHeader>
            <ResponsesViewer formId={viewFormId} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function ResponsesViewer({ formId }: { formId: string }) {
  const { data: responses = [], isLoading } = useFeedbackResponses(formId);

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin mx-auto" />;

  if (responses.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No responses yet</p>;
  }

  return (
    <div className="space-y-3">
      {responses.map(r => (
        <div key={r.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="font-medium">{r.user_name}</span>
            <span>{format(new Date(r.created_at), 'MMM d, h:mm a')}</span>
          </div>
          {Array.isArray(r.answers) && (r.answers as any[]).map((a: any, i: number) => (
            <div key={i} className="text-sm">
              <span className="text-muted-foreground text-xs">Q{a.id || i + 1}:</span>{' '}
              <span>{a.answer || 'No answer'}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

import { useState } from 'react';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/hooks/useRevenue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Trash2, Wallet, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'salary', label: 'Salaries' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'other', label: 'Other' },
];

export default function ExpenseManager() {
  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', amount: 0, category: 'other',
    expense_date: new Date().toISOString().split('T')[0],
    is_recurring: false, recurring_interval: '', notes: '',
  });

  const resetForm = () => {
    setForm({ title: '', amount: 0, category: 'other', expense_date: new Date().toISOString().split('T')[0], is_recurring: false, recurring_interval: '', notes: '' });
  };

  const handleSave = async () => {
    await createExpense.mutateAsync({
      ...form,
      recurring_interval: form.is_recurring ? form.recurring_interval : null,
    } as any);
    setSheetOpen(false);
    resetForm();
  };

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyTotal = expenses?.filter(e => {
    const d = new Date(e.expense_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).reduce((s, e) => s + Number(e.amount), 0) || 0;

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      rent: 'bg-blue-500/10 text-blue-700', salary: 'bg-green-500/10 text-green-700',
      equipment: 'bg-purple-500/10 text-purple-700', utilities: 'bg-yellow-500/10 text-yellow-700',
      maintenance: 'bg-orange-500/10 text-orange-700', marketing: 'bg-pink-500/10 text-pink-700',
    };
    return colors[cat] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Monthly Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">This Month's Expenses</p>
            <div className="flex items-center gap-1 mt-0.5">
              <IndianRupee className="w-4 h-4 text-primary" />
              <span className="text-xl font-bold">{monthlyTotal.toLocaleString()}</span>
            </div>
          </div>
          <Wallet className="w-8 h-8 text-primary/30" />
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-base">Expenses</h3>
        <Sheet open={sheetOpen} onOpenChange={(o) => { setSheetOpen(o); if (!o) resetForm(); }}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs h-8">
              <Plus className="w-3.5 h-3.5" /> Add Expense
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add Expense</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Monthly Rent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount (₹)</Label>
                  <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_recurring} onCheckedChange={v => setForm({ ...form, is_recurring: v })} />
                <Label className="text-xs">Recurring Expense</Label>
              </div>
              {form.is_recurring && (
                <Select value={form.recurring_interval} onValueChange={v => setForm({ ...form, recurring_interval: v })}>
                  <SelectTrigger><SelectValue placeholder="Interval" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional..." />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={createExpense.isPending || !form.title || !form.amount}>
                {createExpense.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Expense
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-2">
        {expenses?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No expenses recorded</p>
          </div>
        )}
        {expenses?.map(expense => (
          <Card key={expense.id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Badge className={`text-[10px] shrink-0 ${categoryColor(expense.category)}`}>
                    {CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{expense.title}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(expense.expense_date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-0.5">
                    <IndianRupee className="w-3 h-3" />
                    <span className="font-bold text-sm">{Number(expense.amount).toLocaleString()}</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteExpense.mutate(expense.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {expense.is_recurring && (
                <Badge variant="outline" className="text-[10px] mt-1.5">🔄 {expense.recurring_interval}</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

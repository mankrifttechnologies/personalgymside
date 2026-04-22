import DunningRulesManager from './DunningRulesManager';
import NotificationQueueView from './NotificationQueueView';

interface Props {
  organizationId?: string;
}

export default function DunningTab({ organizationId }: Props) {
  if (!organizationId) {
    return <p className="text-sm text-muted-foreground">No organization selected.</p>;
  }
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How dunning works</p>
        <p>
          Rules trigger based on days relative to a payment's due date. Run a "Sweep" to scan unpaid invoices
          and queue reminders. Open WhatsApp/SMS links to send manually, then mark as sent.
        </p>
      </div>
      <DunningRulesManager organizationId={organizationId} />
      <NotificationQueueView organizationId={organizationId} />
    </div>
  );
}

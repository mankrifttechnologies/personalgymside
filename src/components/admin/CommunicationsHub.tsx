import BulkNotifier from './BulkNotifier';
import PaymentReminders from './PaymentReminders';
import FeedbackCollector from './FeedbackCollector';

export default function CommunicationsHub() {
  return (
    <div className="space-y-4">
      <BulkNotifier />
      <PaymentReminders />
      <FeedbackCollector />
    </div>
  );
}

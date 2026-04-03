import ChurnPredictor from './ChurnPredictor';
import RevenueForecaster from './RevenueForecaster';
import MemberSegmentation from './MemberSegmentation';
import CustomReportBuilder from './CustomReportBuilder';

export default function AdvancedInsights() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ChurnPredictor />
        <RevenueForecaster />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <MemberSegmentation />
        <CustomReportBuilder />
      </div>
    </div>
  );
}

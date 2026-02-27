import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3 } from 'lucide-react';
import { AnalysisResult } from '@/types/audio';

interface StatisticsPanelProps {
  result: AnalysisResult | null;
}

export function StatisticsPanel({ result }: StatisticsPanelProps) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            No data to display
          </p>
        </CardContent>
      </Card>
    );
  }

  const { statistics, intervals } = result;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" data-testid="statistics-title">
          <BarChart3 className="h-5 w-5" />
          Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Bounces"
              value={statistics.bounceCount.toString()}
              dataTestId="bounce-count"
            />
            <StatCard
              label="1st Interval (sec)"
              value={intervals.length > 0 ? intervals[0].toFixed(3) : '0'}
              dataTestId="first-interval"
            />
            <StatCard
              label="1st Height (m)"
              value={intervals.length > 0 ? ((9.8 * intervals[0] * intervals[0]) / 8).toFixed(2) : '0'}
              dataTestId="first-height"
            />
          </div>
        </div>

        {intervals.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Bounce Intervals</h4>
            <div className="max-h-48 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Time (sec)</TableHead>
                    <TableHead>Height (m)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intervals.map((interval: number, index: number) => {
                    const height = (9.8 * interval * interval) / 8;
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{interval.toFixed(3)}</TableCell>
                        <TableCell>{height.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  dataTestId?: string;
}

function StatCard({ label, value, dataTestId }: StatCardProps) {
  return (
    <div className="bg-muted rounded-lg p-4 text-center" data-testid={dataTestId}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

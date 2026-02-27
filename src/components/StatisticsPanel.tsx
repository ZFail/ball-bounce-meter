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
            Статистика
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Нет данных для отображения
          </p>
        </CardContent>
      </Card>
    );
  }

  const { statistics, intervals } = result;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Статистика
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Интервалы */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              label="Ударов"
              value={statistics.bounceCount.toString()}
              dataTestId="bounce-count"
            />
            <StatCard
              label="Средний (сек)"
              value={statistics.average.toFixed(3)}
              dataTestId="average-interval"
            />
            <StatCard
              label="Мин (сек)"
              value={statistics.min.toFixed(3)}
              dataTestId="min-interval"
            />
            <StatCard
              label="Макс (сек)"
              value={statistics.max.toFixed(3)}
              dataTestId="max-interval"
            />
            <StatCard
              label="Отклонение"
              value={statistics.stdDev.toFixed(3)}
              dataTestId="std-dev"
            />
          </div>

          {/* Высота подлета - только средняя */}
          {statistics.averageHeight !== undefined && (
            <div className="grid grid-cols-1 gap-4">
              <StatCard
                label="Высота подлета (м)"
                value={statistics.averageHeight.toFixed(2)}
                dataTestId="average-height"
              />
            </div>
          )}
        </div>

        {intervals.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Интервалы между ударами</h4>
            <div className="max-h-48 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Время (сек)</TableHead>
                    <TableHead>Высота (м)</TableHead>
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

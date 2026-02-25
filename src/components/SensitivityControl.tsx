import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Settings } from 'lucide-react';

interface SensitivityControlProps {
  threshold: number;
  minDistance: number;
  onThresholdChange: (value: number) => void;
  onMinDistanceChange: (value: number) => void;
}

export function SensitivityControl({
  threshold,
  minDistance,
  onThresholdChange,
  onMinDistanceChange,
}: SensitivityControlProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Настройки детекции
        </CardTitle>
        <CardDescription>
          Настройте чувствительность для лучшего распознавания ударов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Чувствительность (порог)</label>
            <span className="text-sm text-muted-foreground">{threshold.toFixed(2)}</span>
          </div>
          <Slider
            value={[threshold]}
            onValueChange={([value]) => onThresholdChange(value)}
            min={0.05}
            max={0.95}
            step={0.05}
          />
          <p className="text-xs text-muted-foreground">
            Меньшее значение = выше чувствительность (больше пиков)
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Мин. расстояние между ударами (сек)</label>
            <span className="text-sm text-muted-foreground">{minDistance.toFixed(2)}</span>
          </div>
          <Slider
            value={[minDistance]}
            onValueChange={([value]) => onMinDistanceChange(value)}
            min={0.05}
            max={2.0}
            step={0.05}
          />
          <p className="text-xs text-muted-foreground">
            Минимальное время между соседними ударами
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

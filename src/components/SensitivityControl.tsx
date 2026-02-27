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
          Detection Settings
        </CardTitle>
        <CardDescription>
          Adjust sensitivity for better bounce detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Sensitivity (Threshold)</label>
            <span className="text-sm text-muted-foreground">{threshold.toFixed(2)}</span>
          </div>
          <Slider
            value={[threshold]}
            onValueChange={([value]) => onThresholdChange(value)}
            min={0.05}
            max={0.95}
            step={0.05}
            data-testid="threshold-slider"
          />
          <p className="text-xs text-muted-foreground">
            Lower value = higher sensitivity (more peaks)
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Min Distance Between Bounces (sec)</label>
            <span className="text-sm text-muted-foreground">{minDistance.toFixed(2)}</span>
          </div>
          <Slider
            value={[minDistance]}
            onValueChange={([value]) => onMinDistanceChange(value)}
            min={0.05}
            max={2.0}
            step={0.05}
            data-testid="min-distance-slider"
          />
          <p className="text-xs text-muted-foreground">
            Minimum time between adjacent bounces
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

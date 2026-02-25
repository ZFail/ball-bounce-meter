import { useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  peaks?: number[];  // Временные метки пиков в секундах
  duration?: number; // Длительность в секундах
}

export function WaveformVisualizer({ 
  audioBuffer, 
  peaks = [],
  duration 
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Устанавливаем размеры canvas
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const width = canvas.width;
    const height = canvas.height;
    const channelData = audioBuffer.getChannelData(0);
    const samples = audioBuffer.length;
    const step = Math.ceil(samples / width);
    const amp = height / 2;
    const audioDuration = duration || audioBuffer.duration;

    // Вычисляем зоны пиков (диапазоны x-координат)
    const peakZones = peaks.map(peakTime => {
      const x = (peakTime / audioDuration) * width;
      const zoneWidth = Math.max(3, width / 100); // Минимум 3px, максимум 1% от ширины
      return { x, zoneWidth };
    });

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);

    // Рисуем waveform
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      // Проверяем, попадает ли этот столбец в зону пика
      const isPeak = peakZones.some(zone => {
        const halfWidth = zone.zoneWidth / 2;
        return i >= zone.x - halfWidth && i <= zone.x + halfWidth;
      });

      // Рисуем столбец waveform
      ctx.fillStyle = isPeak ? '#ef4444' : '#94a3b8'; // Красный для пиков, серый для остального
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }

  }, [audioBuffer, peaks, duration]);

  useEffect(() => {
    drawWaveform();
    
    // Перерисовываем при изменении размера окна
    const handleResize = () => drawWaveform();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWaveform]);

  if (!audioBuffer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Визуализация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={containerRef}
            className="h-48 bg-muted rounded-lg flex items-center justify-center"
          >
            <p className="text-muted-foreground">
              Загрузите аудио для отображения waveform
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Визуализация
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-48 w-full">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        {peaks.length > 0 && (
          <div className="mt-2 text-sm text-muted-foreground text-center">
            Найдено ударов: {peaks.length}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

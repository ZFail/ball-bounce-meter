import { useEffect, useRef, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Activity, Upload } from 'lucide-react';

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  peaks?: number[];  // Временные метки пиков в секундах
  duration?: number; // Длительность в секундах
  onFileSelect?: (file: File) => void;
  enabledPeaks?: boolean[];
  onPeakToggle?: (index: number, enabled: boolean) => void;
}

export function WaveformVisualizer({
  audioBuffer,
  peaks = [],
  duration,
  onFileSelect,
  enabledPeaks = [],
  onPeakToggle
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Устанавливаем размеры canvas
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const width = canvas.width;
    const height = canvas.height;

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);

    if (!audioBuffer) return;

    const channelData = audioBuffer.getChannelData(0);
    const samples = audioBuffer.length;
    const step = Math.ceil(samples / width);
    const audioDuration = duration || audioBuffer.duration;

    // Находим максимальное значение для нормализации
    let maxAmplitude = 0;
    for (let i = 0; i < samples; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > maxAmplitude) maxAmplitude = abs;
    }
    
    // Используем минимум 0.01 чтобы избежать деления на ноль
    const normalizationFactor = Math.max(maxAmplitude, 0.01);
    const amp = height / 2;

    // Вычисляем зоны пиков (диапазоны x-координат)
    const peakZones = peaks.map(peakTime => {
      const x = (peakTime / audioDuration) * width;
      const zoneWidth = Math.max(3, width / 100); // Минимум 3px, максимум 1% от ширины
      return { x, zoneWidth };
    });

    // Рисуем waveform
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      // Нормализуем значения относительно максимальной амплитуды
      const normalizedMin = min / normalizationFactor;
      const normalizedMax = max / normalizationFactor;

      // Проверяем, попадает ли этот столбец в зону пика
      const peakIndex = peakZones.findIndex(zone => {
        const halfWidth = zone.zoneWidth / 2;
        return i >= zone.x - halfWidth && i <= zone.x + halfWidth;
      });

      const isPeak = peakIndex >= 0;
      const isPeakEnabled = isPeak && enabledPeaks[peakIndex] !== false;

      // Рисуем столбец waveform
      if (isPeak && !isPeakEnabled) {
        // Отключенный пик - серый
        ctx.fillStyle = '#64748b';
      } else if (isPeak) {
        // Включенный пик - красный
        ctx.fillStyle = '#ef4444';
      } else {
        // Обычный waveform - серый
        ctx.fillStyle = '#94a3b8';
      }
      ctx.fillRect(i, (1 + normalizedMin) * amp, 1, Math.max(1, (normalizedMax - normalizedMin) * amp));
    }

  }, [audioBuffer, peaks, duration, enabledPeaks]);

  useEffect(() => {
    drawWaveform();

    // Перерисовываем при изменении размера окна
    const handleResize = () => drawWaveform();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [drawWaveform]);

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
          className="h-48 w-full relative"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!audioBuffer && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Перетащите аудиофайл сюда
                </p>
                <p className="text-xs mt-1">
                  MP3, WAV, OGG, WebM
                </p>
              </div>
            </div>
          )}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-lg flex items-center justify-center z-10">
              <div className="text-center text-primary font-medium">
                <Upload className="h-12 w-12 mx-auto mb-2" />
                <p>Отпустите файл для загрузки</p>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Галочки для включения/отключения пиков - позиционируются под каждым пиком */}
        {peaks.length > 0 && onPeakToggle && (
          <div className="relative h-8 mt-2">
            {peaks.map((peakTime, index) => {
              const position = (peakTime / (duration || audioBuffer?.duration || 1)) * 100;
              return (
                <div
                  key={index}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${position}%` }}
                >
                  <Checkbox
                    id={`peak-${index}`}
                    checked={enabledPeaks[index] !== false}
                    onCheckedChange={(checked: boolean | 'indeterminate') => onPeakToggle(index, checked === true)}
                    className="h-4 w-4"
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

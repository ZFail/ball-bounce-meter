import { useState, useCallback, useEffect, useRef } from 'react';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { StatisticsPanel } from '@/components/StatisticsPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { SensitivityControl } from '@/components/SensitivityControl';
import { Button } from '@/components/ui/button';
import { AnalysisResult, AnalysisResultWithBuffer } from '@/types/audio';
import { Mic, Upload, Square } from 'lucide-react';
import { getChannelData, decodeAudioData } from '@/services/audioAnalyzer';
import { detectPeaks, calculateIntervals, calculateStatistics } from '@/services/peakDetector';
import { generateId, saveAnalysisResult } from '@/services/storage';

function App() {
  // Читаем threshold из URL параметра или используем значение по умолчанию 0.2
  const getInitialThreshold = () => {
    const params = new URLSearchParams(window.location.search);
    const thresholdParam = params.get('threshold');
    return thresholdParam ? parseFloat(thresholdParam) : 0.2;
  };

  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [channelData, setChannelData] = useState<Float32Array | null>(null);
  const [threshold, setThreshold] = useState(getInitialThreshold());
  const [minDistance, setMinDistance] = useState(0.1);
  const [enabledPeaks, setEnabledPeaks] = useState<boolean[]>([]);
  
  // Состояние для записи с микрофона
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalysisComplete = useCallback((result: AnalysisResultWithBuffer) => {
    setCurrentResult(result);
    setAudioBuffer(result.audioBuffer);
    setChannelData(getChannelData(result.audioBuffer, 0));
    // Все пики включены по умолчанию
    setEnabledPeaks(new Array(result.peaks.length).fill(true));
  }, []);

  const handlePeakToggle = useCallback((index: number, enabled: boolean) => {
    setEnabledPeaks(prev => {
      const next = [...prev];
      next[index] = enabled;
      return next;
    });
  }, []);

  // Обработка файла (из drag-and-drop или кнопки)
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await decodeAudioData(arrayBuffer);
      
      const sourceType: 'file' | 'webm' = file.name.toLowerCase().endsWith('.webm') ? 'webm' : 'file';
      
      const channelData = getChannelData(audioBuffer, 0);
      const { peaks, intervals, statistics } = detectPeaksAndCalculate(
        channelData,
        audioBuffer.sampleRate,
        threshold,
        minDistance
      );

      const resultWithBuffer: AnalysisResult & { audioBuffer: AudioBuffer } = {
        id: generateId(),
        timestamp: Date.now(),
        sourceType,
        fileName: file.name,
        peaks: peaks.map(p => p.time),
        intervals,
        statistics,
        audioBuffer,
      };

      const { audioBuffer: _, ...result } = resultWithBuffer;
      
      // Сохраняем в историю только если есть интервалы (минимум 2 пика)
      if (intervals.length > 0) {
        saveAnalysisResult(result);
      }
      
      handleAnalysisComplete(resultWithBuffer);
    } catch (error) {
      console.error('Error processing file:', error);
    }
  }, [threshold, minDistance, handleAnalysisComplete]);

  // Запись с микрофона
  const handleStartRecording = useCallback(async () => {
    // Очищаем предыдущую запись при начале новой
    setRecordedBlob(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
        
        // Обрабатываем аудио для визуализации
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await decodeAudioData(arrayBuffer);
          const channelData = getChannelData(audioBuffer, 0);
          const { peaks, intervals, statistics } = detectPeaksAndCalculate(
            channelData,
            audioBuffer.sampleRate,
            threshold,
            minDistance
          );

          const resultWithBuffer: AnalysisResult & { audioBuffer: AudioBuffer } = {
            id: generateId(),
            timestamp: Date.now(),
            sourceType: 'mic',
            peaks: peaks.map(p => p.time),
            intervals,
            statistics,
            audioBuffer,
          };

          const { audioBuffer: _, ...result } = resultWithBuffer;

          // Сохраняем в историю только если есть интервалы (минимум 2 пика)
          if (intervals.length > 0) {
            saveAnalysisResult(result);
          }

          handleAnalysisComplete(resultWithBuffer);
        } catch (error) {
          console.error('Error processing audio:', error);
        } finally {
          setIsRecording(false);
          setRecordingTime(0);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      const startTime = Date.now();
      const timer = setInterval(() => {
        setRecordingTime((Date.now() - startTime) / 1000);
      }, 100);

      (mediaRecorder as any).timer = timer;
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  }, [threshold, minDistance, handleAnalysisComplete]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      const timer = (mediaRecorderRef.current as any).timer;
      if (timer) clearInterval(timer);
    }
    // Не очищаем recordedBlob здесь - он очистится при начале новой записи
  }, []);

  // Очистка Blob URL при размонтировании компонента
  useEffect(() => {
    return () => {
      if (recordedBlob) {
        // Браузер сам очистит blob URL при размонтировании
        // Явная очистка не требуется
      }
    };
  }, []);

  // Пересчитываем пики при изменении threshold/minDistance
  useEffect(() => {
    if (!channelData || !audioBuffer) return;

    const { peaks, intervals, statistics } = detectPeaksAndCalculate(
      channelData,
      audioBuffer.sampleRate,
      threshold,
      minDistance
    );

    const peaksChanged = JSON.stringify(peaks.map(p => p.time)) !== JSON.stringify(currentResult?.peaks || []);
    if (!peaksChanged) return;

    // Сбрасываем enabledPeaks для новых пиков
    setEnabledPeaks(new Array(peaks.length).fill(true));

    setCurrentResult({
      id: currentResult?.id || generateId(),
      timestamp: currentResult?.timestamp || Date.now(),
      sourceType: currentResult?.sourceType || 'file',
      peaks: peaks.map(p => p.time),
      intervals,
      statistics,
    });
  }, [threshold, minDistance, channelData, audioBuffer]);

  // Пересчитываем статистику при изменении enabledPeaks
  useEffect(() => {
    if (!currentResult || !enabledPeaks.length) return;

    // Фильтруем пики по enabledPeaks
    const filteredPeaks = currentResult.peaks.filter((_, index) => enabledPeaks[index]);

    if (filteredPeaks.length < 2) {
      // Недостаточно пиков для статистики
      setCurrentResult({
        ...currentResult,
        intervals: [],
        statistics: {
          average: 0,
          min: 0,
          max: 0,
          stdDev: 0,
          bounceCount: filteredPeaks.length,
        },
      });
      return;
    }

    // Вычисляем интервалы между включёнными пиками
    const intervals: number[] = [];
    for (let i = 1; i < filteredPeaks.length; i++) {
      intervals.push(filteredPeaks[i] - filteredPeaks[i - 1]);
    }

    // Вычисляем статистику
    const sum = intervals.reduce((a, b) => a + b, 0);
    const average = sum / intervals.length;
    const min = Math.min(...intervals);
    const max = Math.max(...intervals);
    const squaredDiffs = intervals.map(interval => Math.pow(interval - average, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Расчёт высоты подлета мяча
    // Формула: h = g × t² / 8, где t — время между ударами
    // g = 9.8 м/с² (ускорение свободного падения)
    const calculateHeight = (t: number) => (9.8 * t * t) / 8;
    const heights = intervals.map(calculateHeight);
    const averageHeight = heights.reduce((a, b) => a + b, 0) / heights.length;

    setCurrentResult({
      ...currentResult,
      intervals,
      statistics: {
        average,
        min,
        max,
        stdDev,
        bounceCount: filteredPeaks.length,
        averageHeight,
      },
    });
  }, [enabledPeaks]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Ball Bounce Meter</h1>
          <p className="text-muted-foreground">
            Анализ звука ударов мяча об пол
          </p>
        </header>

        {/* Кнопки управления */}
        <div className="flex justify-center gap-4 flex-wrap">
          <Button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            variant={isRecording ? 'destructive' : 'default'}
            className="gap-2"
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4" />
                Остановить запись
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Запись с микрофона
              </>
            )}
          </Button>

          {/* Кнопка скачивания записи */}
          {recordedBlob && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              title="Скачать запись"
            >
              <a
                href={URL.createObjectURL(recordedBlob)}
                download={`recording-${Date.now()}.webm`}
              >
                <Upload className="h-4 w-4" />
              </a>
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/webm"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Выбрать файл
          </Button>
        </div>

        {isRecording && (
          <div className="text-center text-sm text-muted-foreground">
            Запись: {recordingTime.toFixed(1)} сек
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <WaveformVisualizer
              audioBuffer={audioBuffer}
              peaks={currentResult?.peaks}
              onFileSelect={handleFileSelect}
              enabledPeaks={enabledPeaks}
              onPeakToggle={handlePeakToggle}
            />
          </div>
          <div className="md:col-span-2">
            <SensitivityControl
              threshold={threshold}
              minDistance={minDistance}
              onThresholdChange={setThreshold}
              onMinDistanceChange={setMinDistance}
            />
          </div>
          <div className="md:col-span-2">
            <StatisticsPanel result={currentResult} />
          </div>
          <div className="md:col-span-2">
            <HistoryPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

function detectPeaksAndCalculate(
  channelData: Float32Array,
  sampleRate: number,
  threshold: number,
  minDistance: number
) {
  const peaks = detectPeaks(channelData, sampleRate, { threshold, minDistance });
  const intervals = calculateIntervals(peaks);
  const statistics = calculateStatistics(intervals);
  return { peaks, intervals, statistics };
}

export default App;

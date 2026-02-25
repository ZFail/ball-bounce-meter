import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AudioRecorder } from '@/components/AudioRecorder';
import { FileUploader } from '@/components/FileUploader';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { StatisticsPanel } from '@/components/StatisticsPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { SensitivityControl } from '@/components/SensitivityControl';
import { AnalysisResult, AnalysisResultWithBuffer } from '@/types/audio';
import { Mic, Upload } from 'lucide-react';
import { getChannelData } from '@/services/audioAnalyzer';
import { detectPeaks, calculateIntervals, calculateStatistics } from '@/services/peakDetector';

function App() {
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [channelData, setChannelData] = useState<Float32Array | null>(null);
  const [threshold, setThreshold] = useState(0.5);
  const [minDistance, setMinDistance] = useState(0.1);

  const handleAnalysisComplete = useCallback((result: AnalysisResultWithBuffer) => {
    setCurrentResult(result);
    setAudioBuffer(result.audioBuffer);
    setChannelData(getChannelData(result.audioBuffer, 0));
  }, []);

  const handleSelectHistoryResult = useCallback((result: AnalysisResult) => {
    setCurrentResult(result);
    setAudioBuffer(null);
    setChannelData(null);
  }, []);

  // Пересчитываем пики при изменении настроек (только если уже есть результат)
  useEffect(() => {
    if (!channelData || !audioBuffer || !currentResult) return;

    const { peaks, intervals, statistics } = detectPeaksAndCalculate(
      channelData,
      audioBuffer.sampleRate,
      threshold,
      minDistance
    );

    // Обновляем только если пики изменились
    const peaksChanged = JSON.stringify(peaks.map(p => p.time)) !== JSON.stringify(currentResult.peaks);
    if (!peaksChanged) return;

    setCurrentResult({
      ...currentResult,
      peaks: peaks.map(p => p.time),
      intervals,
      statistics,
    });
  }, [threshold, minDistance, channelData, audioBuffer, currentResult]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Ball Bounce Meter</h1>
          <p className="text-muted-foreground">
            Анализ звука ударов мяча об пол
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <SensitivityControl
              threshold={threshold}
              minDistance={minDistance}
              onThresholdChange={setThreshold}
              onMinDistanceChange={setMinDistance}
            />
          </div>
        </div>

        <Tabs defaultValue="mic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mic" className="gap-2">
              <Mic className="h-4 w-4" />
              Микрофон
            </TabsTrigger>
            <TabsTrigger value="file" className="gap-2">
              <Upload className="h-4 w-4" />
              Файл
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="mic" className="space-y-4">
            <AudioRecorder 
              onAnalysisComplete={handleAnalysisComplete}
              threshold={threshold}
              minDistance={minDistance}
            />
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4">
            <FileUploader 
              onAnalysisComplete={handleAnalysisComplete}
              threshold={threshold}
              minDistance={minDistance}
            />
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <WaveformVisualizer 
              audioBuffer={audioBuffer} 
              peaks={currentResult?.peaks}
            />
          </div>
          <div className="md:col-span-2">
            <StatisticsPanel result={currentResult} />
          </div>
          <div className="md:col-span-2">
            <HistoryPanel onSelectResult={handleSelectHistoryResult} />
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

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AudioRecorder } from '@/components/AudioRecorder';
import { FileUploader } from '@/components/FileUploader';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { StatisticsPanel } from '@/components/StatisticsPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { SensitivityControl } from '@/components/SensitivityControl';
import { AnalysisResult, AnalysisResultWithBuffer } from '@/types/audio';
import { Mic, Upload } from 'lucide-react';

function App() {
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [threshold, setThreshold] = useState(0.3);
  const [minDistance, setMinDistance] = useState(0.1);

  const handleAnalysisComplete = useCallback((result: AnalysisResultWithBuffer) => {
    setCurrentResult(result);
    setAudioBuffer(result.audioBuffer);
  }, []);

  const handleSelectHistoryResult = useCallback((result: AnalysisResult) => {
    setCurrentResult(result);
    setAudioBuffer(null); // Нет буфера для истории
  }, []);

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

export default App;

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileAudio, Loader2 } from 'lucide-react';
import { loadAudioFile, getChannelData } from '@/services/audioAnalyzer';
import { detectPeaks, calculateIntervals, calculateStatistics } from '@/services/peakDetector';
import { saveAnalysisResult, generateId } from '@/services/storage';
import { AnalysisResult } from '@/types/audio';

interface FileUploaderProps {
  onAnalysisComplete: (result: AnalysisResult & { audioBuffer: AudioBuffer }) => void;
  threshold: number;
  minDistance: number;
}

const ACCEPTED_FORMATS = ['audio/*', 'video/webm'];

export function FileUploader({ onAnalysisComplete, threshold, minDistance }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true);
    setFileName(file.name);
    
    try {
      const audioData = await loadAudioFile(file);
      setIsUploading(false);
      setIsProcessing(true);
      
      // Анализируем аудио
      const channelData = getChannelData(audioData.audioBuffer, 0);
      const { peaks, intervals, statistics } = detectPeaksAndCalculate(
        channelData, 
        audioData.audioBuffer.sampleRate,
        threshold,
        minDistance
      );
      
      const resultWithBuffer: AnalysisResult & { audioBuffer: AudioBuffer } = {
        id: generateId(),
        timestamp: Date.now(),
        sourceType: audioData.sourceType,
        fileName: audioData.fileName,
        peaks: peaks.map((p) => p.time),
        intervals,
        statistics,
        audioBuffer: audioData.audioBuffer,
      };
      
      // Сохраняем без audioBuffer (localStorage не поддерживает AudioBuffer)
      const { audioBuffer: _, ...result } = resultWithBuffer;
      saveAnalysisResult(result);
      onAnalysisComplete(resultWithBuffer);
    } catch (error) {
      console.error('Error processing file:', error);
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, [onAnalysisComplete]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileAudio className="h-5 w-5" />
          Загрузка файла
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FORMATS.join(',')}
            onChange={handleInputChange}
            className="hidden"
            data-testid="file-input"
          />
          
          {isUploading || isProcessing ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                {isUploading ? 'Загрузка...' : 'Обработка...'}
              </div>
              {fileName && (
                <div className="text-xs text-muted-foreground truncate">
                  {fileName}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                Перетащите файл или кликните для выбора
              </div>
              <div className="text-xs text-muted-foreground">
                MP3, WAV, OGG, WebM
              </div>
            </div>
          )}
        </div>
        
        {isProcessing && (
          <Progress value={50} className="h-2" />
        )}
      </CardContent>
    </Card>
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

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, Square, Circle } from 'lucide-react';
import { getChannelData, decodeAudioData } from '@/services/audioAnalyzer';
import { detectPeaks, calculateIntervals, calculateStatistics } from '@/services/peakDetector';
import { saveAnalysisResult, generateId } from '@/services/storage';
import { AnalysisResult } from '@/types/audio';

interface AudioRecorderProps {
  onAnalysisComplete: (result: AnalysisResult & { audioBuffer: AudioBuffer }) => void;
  threshold: number;
  minDistance: number;
}

export function AudioRecorder({ onAnalysisComplete, threshold, minDistance }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        
        try {
          const audioBuffer = await decodeAudioData(arrayBuffer);
          
          setIsProcessing(true);
          
          // Анализируем аудио
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
            peaks: peaks.map((p) => p.time),
            intervals,
            statistics,
            audioBuffer,
          };
          
          // Сохраняем без audioBuffer (localStorage не поддерживает AudioBuffer)
          const { audioBuffer: _, ...result } = resultWithBuffer;
          saveAnalysisResult(result);
          onAnalysisComplete(resultWithBuffer);
        } catch (error) {
          console.error('Error processing audio:', error);
        } finally {
          setIsProcessing(false);
          setIsRecording(false);
          setRecordingTime(0);
          
          // Останавливаем треки
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

      // Сохраняем timer для очистки
      (mediaRecorder as any).timer = timer;
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  }, [onAnalysisComplete]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      // Очищаем timer
      const timer = (mediaRecorderRef.current as any).timer;
      if (timer) clearInterval(timer);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Запись с микрофона
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-4">
          {!isRecording ? (
            <Button 
              onClick={handleStartRecording}
              disabled={isProcessing}
              className="gap-2"
            >
              <Circle className="h-4 w-4" />
              Начать запись
            </Button>
          ) : (
            <Button 
              onClick={handleStopRecording}
              variant="destructive"
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Остановить
            </Button>
          )}
        </div>
        
        {isRecording && (
          <div className="space-y-2">
            <div className="text-center text-sm text-muted-foreground">
              Запись: {recordingTime.toFixed(1)} сек
            </div>
            <Progress value={(recordingTime % 1) * 100} className="h-2" />
          </div>
        )}
        
        {isProcessing && (
          <div className="text-center text-sm text-muted-foreground">
            Обработка аудио...
          </div>
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

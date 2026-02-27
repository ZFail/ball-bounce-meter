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
  // Read threshold from URL param or use default 0.2
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
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalysisComplete = useCallback((result: AnalysisResultWithBuffer) => {
    setCurrentResult(result);
    setAudioBuffer(result.audioBuffer);
    setChannelData(getChannelData(result.audioBuffer, 0));
    // Enable all peaks by default
    setEnabledPeaks(new Array(result.peaks.length).fill(true));
  }, []);

  const handlePeakToggle = useCallback((index: number, enabled: boolean) => {
    setEnabledPeaks(prev => {
      const next = [...prev];
      next[index] = enabled;
      return next;
    });
  }, []);

  // File handling (from drag-and-drop or button)
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

      // Save to history only if there are intervals (at least 2 peaks)
      if (intervals.length > 0) {
        saveAnalysisResult(result);
      }
      
      handleAnalysisComplete(resultWithBuffer);
    } catch (error) {
      console.error('Error processing file:', error);
    }
  }, [threshold, minDistance, handleAnalysisComplete]);

  // Microphone recording
  const handleStartRecording = useCallback(async () => {
    // Clear previous recording when starting new one
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
        
        // Process audio for visualization
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

          // Save to history only if there are intervals (at least 2 peaks)
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
    // Don't clear recordedBlob here - it will be cleared when starting new recording
  }, []);

  // Cleanup Blob URL on unmount
  useEffect(() => {
    return () => {
      if (recordedBlob) {
        // Browser will clean up blob URL on unmount
        // Explicit cleanup not required
      }
    };
  }, []);

  // Recalculate peaks when threshold/minDistance changes
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

    // Reset enabledPeaks for new peaks
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

  // Recalculate statistics when enabledPeaks changes
  useEffect(() => {
    if (!currentResult || !enabledPeaks.length) return;

    // Filter peaks by enabledPeaks
    const filteredPeaks = currentResult.peaks.filter((_, index) => enabledPeaks[index]);

    if (filteredPeaks.length < 2) {
      // Not enough peaks for statistics
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

    // Calculate intervals between enabled peaks
    const intervals: number[] = [];
    for (let i = 1; i < filteredPeaks.length; i++) {
      intervals.push(filteredPeaks[i] - filteredPeaks[i - 1]);
    }

    // Calculate statistics
    const sum = intervals.reduce((a, b) => a + b, 0);
    const average = sum / intervals.length;
    const min = Math.min(...intervals);
    const max = Math.max(...intervals);
    const squaredDiffs = intervals.map(interval => Math.pow(interval - average, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Calculate bounce height
    // Formula: h = g × t² / 8, where t is time interval between bounces
    // g = 9.8 m/s² (gravity)
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
            Audio analysis of ball bounces
          </p>
        </header>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 flex-wrap">
          <Button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            variant={isRecording ? 'destructive' : 'default'}
            className="gap-2"
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Record from Mic
              </>
            )}
          </Button>

          {/* Download Recording Button */}
          {recordedBlob && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              title="Download Recording"
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
            Select File
          </Button>
        </div>

        {isRecording && (
          <div className="text-center text-sm text-muted-foreground">
            Recording: {recordingTime.toFixed(1)} sec
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

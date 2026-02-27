export interface AnalysisResult {
  id: string;
  timestamp: number;
  sourceType: 'mic' | 'file' | 'webm';
  fileName?: string;
  peaks: number[];
  intervals: number[];
  statistics: {
    average: number;
    min: number;
    max: number;
    stdDev: number;
    bounceCount: number;
    averageHeight?: number;  // Средняя высота подлета (метры)
  };
}

export interface AnalysisResultWithBuffer extends AnalysisResult {
  audioBuffer: AudioBuffer;
}

export interface AudioData {
  audioBuffer: AudioBuffer;
  sourceType: 'mic' | 'file' | 'webm';
  fileName?: string;
}

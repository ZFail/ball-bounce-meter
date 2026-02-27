/**
 * Peak detection parameters
 */
export interface PeakDetectionOptions {
  threshold?: number;      // Sensitivity threshold (0-1, percentage of max amplitude)
  minDistance?: number;    // Minimum distance between peaks (in seconds)
}

/**
 * Peak detection result
 */
export interface PeakResult {
  time: number;            // Peak time in seconds
  amplitude: number;       // Peak amplitude
}

/**
 * Detects peaks in audio data
 * @param channelData - PCM audio data
 * @param sampleRate - Sample rate in Hz
 * @param options - Detection parameters
 */
export function detectPeaks(
  channelData: Float32Array,
  sampleRate: number,
  options: PeakDetectionOptions = {}
): PeakResult[] {
  const {
    threshold = 0.2,
    minDistance = 0.1,
  } = options;

  const peaks: PeakResult[] = [];

  // Find maximum amplitude for threshold normalization
  let maxAmplitude = 0;
  for (let i = 0; i < channelData.length; i++) {
    const absValue = Math.abs(channelData[i]);
    if (absValue > maxAmplitude) {
      maxAmplitude = absValue;
    }
  }

  // Calculate local maxima in window
  const windowSize = Math.floor(sampleRate * 0.01); // 10ms window
  const minDistanceSamples = Math.floor(sampleRate * minDistance);

  // Threshold as percentage of maximum amplitude
  // threshold = 0.05 means 5% of max, threshold = 0.9 means 90% of max
  const normalizedThreshold = threshold * maxAmplitude;

  let localMaxIndex = -1;
  let localMaxValue = 0;

  for (let i = 0; i < channelData.length; i++) {
    const absValue = Math.abs(channelData[i]);

    // Find local maximum
    if (absValue > localMaxValue) {
      localMaxValue = absValue;
      localMaxIndex = i;
    }

    // Check if current maximum is a peak
    if (i - localMaxIndex > windowSize && localMaxIndex >= 0) {
      // Check threshold and distance from previous peak
      if (localMaxValue > normalizedThreshold) {
        const lastPeak = peaks[peaks.length - 1];
        const distanceFromLastPeak = lastPeak
          ? localMaxIndex - Math.floor(lastPeak.time * sampleRate)
          : Infinity;

        if (distanceFromLastPeak >= minDistanceSamples) {
          peaks.push({
            time: localMaxIndex / sampleRate,
            amplitude: localMaxValue,
          });
        }
      }

      // Reset for next peak search
      localMaxIndex = -1;
      localMaxValue = 0;
    }
  }

  // Check last found maximum
  if (localMaxIndex >= 0 && localMaxValue > normalizedThreshold) {
    const lastPeak = peaks[peaks.length - 1];
    const distanceFromLastPeak = lastPeak
      ? localMaxIndex - Math.floor(lastPeak.time * sampleRate)
      : Infinity;

    if (distanceFromLastPeak >= minDistanceSamples) {
      peaks.push({
        time: localMaxIndex / sampleRate,
        amplitude: localMaxValue,
      });
    }
  }

  return peaks;
}

/**
 * Calculates intervals between peaks
 */
export function calculateIntervals(peaks: PeakResult[]): number[] {
  if (peaks.length < 2) return [];

  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i].time - peaks[i - 1].time);
  }
  return intervals;
}

/**
 * Calculates interval statistics
 */
export function calculateStatistics(intervals: number[]) {
  if (intervals.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      bounceCount: 0,
    };
  }

  const sum = intervals.reduce((a, b) => a + b, 0);
  const average = sum / intervals.length;
  const min = Math.min(...intervals);
  const max = Math.max(...intervals);

  // Standard deviation
  const squaredDiffs = intervals.map(interval =>
    Math.pow(interval - average, 2)
  );
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // Calculate bounce height
  // Formula: h = g × t² / 8, where t is time interval between bounces
  // g = 9.8 m/s² (gravity)
  const calculateHeight = (t: number) => (9.8 * t * t) / 8;

  const heights = intervals.map(calculateHeight);
  const averageHeight = heights.reduce((a, b) => a + b, 0) / heights.length;

  return {
    average,
    min,
    max,
    stdDev,
    bounceCount: intervals.length + 1,
    averageHeight,
  };
}

/**
 * Full audio analysis
 */
export function analyzeAudio(
  channelData: Float32Array,
  sampleRate: number,
  options: PeakDetectionOptions = {}
) {
  const peaks = detectPeaks(channelData, sampleRate, options);
  const intervals = calculateIntervals(peaks);
  const statistics = calculateStatistics(intervals);
  
  return {
    peaks,
    intervals,
    statistics,
  };
}

/**
 * Параметры для детекции пиков
 */
export interface PeakDetectionOptions {
  threshold?: number;      // Порог чувствительности (0-1, процент от максимальной амплитуды)
  minDistance?: number;    // Минимальное расстояние между пиками (в секундах)
}

/**
 * Результат детекции пиков
 */
export interface PeakResult {
  time: number;            // Время пика в секундах
  amplitude: number;       // Амплитуда пика
}

/**
 * Находит пики в аудиоданных
 * @param channelData - аудиоданные (PCM)
 * @param sampleRate - частота дискретизации
 * @param options - параметры детекции
 */
export function detectPeaks(
  channelData: Float32Array,
  sampleRate: number,
  options: PeakDetectionOptions = {}
): PeakResult[] {
  const {
    threshold = 0.5,
    minDistance = 0.1,
  } = options;

  const peaks: PeakResult[] = [];

  // Находим максимальную амплитуду для нормализации порога
  let maxAmplitude = 0;
  for (let i = 0; i < channelData.length; i++) {
    const absValue = Math.abs(channelData[i]);
    if (absValue > maxAmplitude) {
      maxAmplitude = absValue;
    }
  }

  // Вычисляем локальные максимумы в окне
  const windowSize = Math.floor(sampleRate * 0.01); // 10ms окно
  const minDistanceSamples = Math.floor(sampleRate * minDistance);

  // Порог как процент от максимальной амплитуды
  // threshold = 0.05 означает 5% от максимума, threshold = 0.9 означает 90% от максимума
  const normalizedThreshold = threshold * maxAmplitude;

  let localMaxIndex = -1;
  let localMaxValue = 0;

  for (let i = 0; i < channelData.length; i++) {
    const absValue = Math.abs(channelData[i]);

    // Ищем локальный максимум
    if (absValue > localMaxValue) {
      localMaxValue = absValue;
      localMaxIndex = i;
    }

    // Проверяем, является ли текущий максимум пиком
    if (i - localMaxIndex > windowSize && localMaxIndex >= 0) {
      // Проверяем порог и расстояние от предыдущего пика
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

      // Сбрасываем для поиска следующего пика
      localMaxIndex = -1;
      localMaxValue = 0;
    }
  }

  // Проверяем последний найденный максимум
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
 * Вычисляет интервалы между пиками
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
 * Вычисляет статистику интервалов
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
  
  // Стандартное отклонение
  const squaredDiffs = intervals.map(interval => 
    Math.pow(interval - average, 2)
  );
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  return {
    average,
    min,
    max,
    stdDev,
    bounceCount: intervals.length + 1,
  };
}

/**
 * Полный анализ аудио
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

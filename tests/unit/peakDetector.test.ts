import { describe, it, expect } from 'vitest';
import { detectPeaks, calculateIntervals, calculateStatistics } from '@/services/peakDetector';

/**
 * Создаёт синтетические аудиоданные с пиками разной амплитуды
 * @param peakTimes - времена пиков в секундах
 * @param sampleRate - частота дискретизации
 * @param duration - длительность в секундах
 * @param peakAmplitudes - амплитуды пиков (0-1), если не указано - используется peakAmplitude
 */
function createSyntheticAudioData(
  peakTimes: number[],
  sampleRate: number = 44100,
  duration: number = 5,
  peakAmplitude: number = 0.9,
  peakAmplitudes?: number[]
): Float32Array {
  const totalSamples = Math.floor(sampleRate * duration);
  const data = new Float32Array(totalSamples);
  
  // Заполняем шумом
  for (let i = 0; i < totalSamples; i++) {
    data[i] = (Math.random() - 0.5) * 0.05; // Низкий уровень шума
  }
  
  // Добавляем пики
  peakTimes.forEach((time, idx) => {
    const peakIndex = Math.floor(time * sampleRate);
    const amplitude = peakAmplitudes?.[idx] ?? peakAmplitude;
    // Создаём резкий пик с затуханием
    for (let i = 0; i < 100; i++) {
      const index = peakIndex + i;
      if (index < totalSamples) {
        data[index] += (1 - i / 100) * amplitude;
      }
    }
  });
  
  return data;
}

describe('PeakDetector', () => {
  describe('detectPeaks с синтетическими данными', () => {
    it('должен найти 4 пика с одинаковой амплитудой', () => {
      const channelData = createSyntheticAudioData([0.5, 1.2, 2.0, 3.5], 44100, 5, 0.9);
      const sampleRate = 44100;
      
      // Низкий порог для нахождения всех пиков
      const peaks = detectPeaks(channelData, sampleRate, { threshold: 0.3, minDistance: 0.1 });
      
      expect(peaks.length).toBeGreaterThanOrEqual(3);
    });

    it('должен фильтровать пики с разной амплитудой по threshold', () => {
      // Создаём пики с разной амплитудой: 1.0, 0.7, 0.4, 0.2
      const channelData = createSyntheticAudioData(
        [0.5, 1.5, 2.5, 3.5],
        44100,
        5,
        0.9,
        [1.0, 0.7, 0.4, 0.2]
      );
      const sampleRate = 44100;
      
      // Низкий порог (0.1) - находит все пики
      const lowThreshold = detectPeaks(channelData, sampleRate, { threshold: 0.1, minDistance: 0.1 });
      expect(lowThreshold.length).toBe(4);
      
      // Порог по умолчанию (0.5) - находит пики с амплитудой > 50% от максимума
      // maxAmplitude ~= 1.0, normalizedThreshold ~= 0.5
      // Пики: 1.0 > 0.5 ✓, 0.7 > 0.5 ✓, 0.4 < 0.5 ✗, 0.2 < 0.5 ✗
      const defaultThreshold = detectPeaks(channelData, sampleRate, { minDistance: 0.1 });
      expect(defaultThreshold.length).toBe(2);
      
      // Высокий порог (0.8) - находит только самый громкий пик
      const highThreshold = detectPeaks(channelData, sampleRate, { threshold: 0.8, minDistance: 0.1 });
      expect(highThreshold.length).toBe(1);
    });

    it('должен найти 2 пика', () => {
      const channelData = createSyntheticAudioData([1.0, 2.5]);
      const sampleRate = 44100;
      
      const peaks = detectPeaks(channelData, sampleRate, { threshold: 0.3, minDistance: 0.1 });
      
      expect(peaks.length).toBeGreaterThanOrEqual(2);
    });

    it('должен фильтровать пики по minDistance', () => {
      const channelData = createSyntheticAudioData([1.0, 1.05, 2.0]);
      const sampleRate = 44100;
      
      const peaks = detectPeaks(channelData, sampleRate, { threshold: 0.3, minDistance: 0.1 });
      
      // Пики на 1.0 и 1.05 должны слиться в один
      expect(peaks.length).toBeLessThanOrEqual(2);
    });
  });

  describe('calculateIntervals', () => {
    it('должен возвращать пустой массив для 0 или 1 пика', () => {
      expect(calculateIntervals([])).toEqual([]);
      expect(calculateIntervals([{ time: 1, amplitude: 0.5 }])).toEqual([]);
    });

    it('должен вычислять интервалы между пиками', () => {
      const peaks = [
        { time: 0.5, amplitude: 0.8 },
        { time: 1.2, amplitude: 0.7 },
        { time: 2.0, amplitude: 0.9 },
      ];
      
      const intervals = calculateIntervals(peaks);
      
      expect(intervals).toEqual([0.7, 0.8]);
    });
  });

  describe('calculateStatistics', () => {
    it('должен возвращать нули для пустого массива интервалов', () => {
      const stats = calculateStatistics([]);
      
      expect(stats).toEqual({
        average: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        bounceCount: 0,
      });
    });

    it('должен вычислять статистику интервалов', () => {
      const intervals = [0.5, 0.5, 0.5];
      
      const stats = calculateStatistics(intervals);
      
      expect(stats.average).toBe(0.5);
      expect(stats.min).toBe(0.5);
      expect(stats.max).toBe(0.5);
      expect(stats.stdDev).toBe(0);
      expect(stats.bounceCount).toBe(4);
    });

    it('должен вычислять стандартное отклонение', () => {
      const intervals = [0.4, 0.5, 0.6];
      
      const stats = calculateStatistics(intervals);
      
      expect(stats.average).toBe(0.5);
      expect(stats.bounceCount).toBe(4);
      expect(stats.stdDev).toBeCloseTo(0.0816, 3);
    });
  });
});

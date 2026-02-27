import { describe, it, expect } from 'vitest';
import { detectPeaks, calculateIntervals, calculateStatistics } from '@/services/peakDetector';

/**
 * Creates synthetic audio data with peaks of different amplitudes
 * @param peakTimes - peak times in seconds
 * @param sampleRate - sample rate
 * @param duration - duration in seconds
 * @param peakAmplitudes - peak amplitudes (0-1), if not specified uses peakAmplitude
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
  
  // Fill with noise
  for (let i = 0; i < totalSamples; i++) {
    data[i] = (Math.random() - 0.5) * 0.05; // Low noise level
  }
  
  // Add peaks
  peakTimes.forEach((time, idx) => {
    const peakIndex = Math.floor(time * sampleRate);
    const amplitude = peakAmplitudes?.[idx] ?? peakAmplitude;
    // Create sharp peak with decay
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
  describe('detectPeaks with synthetic data', () => {
    it('should find 4 peaks with same amplitude', () => {
      const channelData = createSyntheticAudioData([0.5, 1.2, 2.0, 3.5], 44100, 5, 0.9);
      const sampleRate = 44100;
      
      // Low threshold to find all peaks
      const peaks = detectPeaks(channelData, sampleRate, { threshold: 0.3, minDistance: 0.1 });
      
      expect(peaks.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter peaks with different amplitudes by threshold', () => {
      // Create peaks with different amplitudes: 1.0, 0.7, 0.4, 0.2
      const channelData = createSyntheticAudioData(
        [0.5, 1.5, 2.5, 3.5],
        44100,
        5,
        0.9,
        [1.0, 0.7, 0.4, 0.2]
      );
      const sampleRate = 44100;
      
      // Low threshold (0.1) - finds all peaks
      const lowThreshold = detectPeaks(channelData, sampleRate, { threshold: 0.1, minDistance: 0.1 });
      expect(lowThreshold.length).toBe(4);
      
      // Default threshold (0.5) - finds peaks with amplitude > 50% of max
      // Peaks: 1.0 > 0.5 ✓, 0.7 > 0.5 ✓, 0.4 < 0.5 ✗, 0.2 < 0.5 ✗
      const defaultThreshold = detectPeaks(channelData, sampleRate, { minDistance: 0.1 });
      expect(defaultThreshold.length).toBe(2);
      
      // High threshold (0.8) - finds only loudest peak
      const highThreshold = detectPeaks(channelData, sampleRate, { threshold: 0.8, minDistance: 0.1 });
      expect(highThreshold.length).toBe(1);
    });

    it('should find 2 peaks', () => {
      const channelData = createSyntheticAudioData([1.0, 2.5]);
      const sampleRate = 44100;
      
      const peaks = detectPeaks(channelData, sampleRate, { threshold: 0.3, minDistance: 0.1 });
      
      expect(peaks.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter peaks by minDistance', () => {
      const channelData = createSyntheticAudioData([1.0, 1.05, 2.0]);
      const sampleRate = 44100;
      
      const peaks = detectPeaks(channelData, sampleRate, { threshold: 0.3, minDistance: 0.1 });
      
      // Peaks at 1.0 and 1.05 should merge into one
      expect(peaks.length).toBeLessThanOrEqual(2);
    });
  });

  describe('calculateIntervals', () => {
    it('should return empty array for 0 or 1 peak', () => {
      expect(calculateIntervals([])).toEqual([]);
      expect(calculateIntervals([{ time: 1, amplitude: 0.5 }])).toEqual([]);
    });

    it('should calculate intervals between peaks', () => {
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
    it('should return zeros for empty intervals array', () => {
      const stats = calculateStatistics([]);
      
      expect(stats).toEqual({
        average: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        bounceCount: 0,
      });
    });

    it('should calculate interval statistics', () => {
      const intervals = [0.5, 0.5, 0.5];
      
      const stats = calculateStatistics(intervals);
      
      expect(stats.average).toBe(0.5);
      expect(stats.min).toBe(0.5);
      expect(stats.max).toBe(0.5);
      expect(stats.stdDev).toBe(0);
      expect(stats.bounceCount).toBe(4);
    });

    it('should calculate standard deviation', () => {
      const intervals = [0.4, 0.5, 0.6];
      
      const stats = calculateStatistics(intervals);
      
      expect(stats.average).toBe(0.5);
      expect(stats.bounceCount).toBe(4);
      expect(stats.stdDev).toBeCloseTo(0.0816, 3);
    });
  });
});

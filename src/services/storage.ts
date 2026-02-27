import { AnalysisResult } from '@/types/audio';

const STORAGE_KEY = 'ball-bounce-meter-results';
const MAX_HISTORY = 10;

/**
 * Saves analysis result to localStorage (without audioBuffer)
 */
export function saveAnalysisResult(result: AnalysisResult): void {
  const history = getAnalysisHistory();

  // Add new result at the beginning
  history.unshift(result);

  // Limit number of records
  if (history.length > MAX_HISTORY) {
    history.splice(MAX_HISTORY);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  
  // Dispatch event for UI update
  window.dispatchEvent(new CustomEvent('history-update'));
}

/**
 * Gets all analysis history
 */
export function getAnalysisHistory(): AnalysisResult[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Gets analysis result by ID
 */
export function getAnalysisResultById(id: string): AnalysisResult | null {
  const history = getAnalysisHistory();
  return history.find(result => result.id === id) || null;
}

/**
 * Deletes analysis result by ID
 */
export function deleteAnalysisResult(id: string): void {
  const history = getAnalysisHistory();
  const filtered = history.filter(result => result.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Clears all history
 */
export function clearAnalysisHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Generates unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

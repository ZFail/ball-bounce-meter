import { AnalysisResult } from '@/types/audio';

const STORAGE_KEY = 'ball-bounce-meter-results';
const MAX_HISTORY = 10;

/**
 * Сохраняет результат анализа в localStorage (без audioBuffer)
 */
export function saveAnalysisResult(result: AnalysisResult): void {
  const history = getAnalysisHistory();
  
  // Добавляем новый результат в начало
  history.unshift(result);
  
  // Ограничиваем количество записей
  if (history.length > MAX_HISTORY) {
    history.splice(MAX_HISTORY);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/**
 * Получает всю историю анализов
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
 * Получает результат анализа по ID
 */
export function getAnalysisResultById(id: string): AnalysisResult | null {
  const history = getAnalysisHistory();
  return history.find(result => result.id === id) || null;
}

/**
 * Удаляет результат анализа по ID
 */
export function deleteAnalysisResult(id: string): void {
  const history = getAnalysisHistory();
  const filtered = history.filter(result => result.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Очищает всю историю
 */
export function clearAnalysisHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Генерирует уникальный ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

# Ball Bounce Meter

Веб-приложение для анализа звука ударов мяча об пол с визуализацией и статистикой.

## Проект Overview

**Назначение:** Анализ аудиозаписей (с микрофона или файлов) для распознавания времени между ударами мяча об пол.

**Технологический стек:**
- **Фреймворк:** React 19 + TypeScript
- **Сборка:** Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Иконки:** Lucide React
- **Аудио анализ:** Web Audio API
- **Визуализация:** Canvas API
- **Тесты:** Playwright
- **Хранение:** localStorage

## Структура проекта

```
ball-bounce-meter/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui компоненты
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── table.tsx
│   │   │   └── tabs.tsx
│   │   ├── AudioRecorder.tsx       # Запись с микрофона
│   │   ├── FileUploader.tsx        # Загрузка файлов (MP3, WAV, OGG, WebM)
│   │   ├── WaveformVisualizer.tsx  # Визуализация waveform
│   │   ├── StatisticsPanel.tsx     # Статистика интервалов
│   │   ├── HistoryPanel.tsx        # История анализов
│   │   └── SensitivityControl.tsx  # Настройки детекции
│   ├── services/
│   │   ├── audioAnalyzer.ts        # Web Audio API функции
│   │   ├── peakDetector.ts         # Алгоритм детекции пиков
│   │   └── storage.ts              # localStorage утилиты
│   ├── types/
│   │   └── audio.ts                # TypeScript типы
│   ├── lib/
│   │   └── utils.ts                # cn() утилита
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/
│   └── e2e/
│       └── app.spec.ts             # Playwright тесты
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── playwright.config.ts
```

## Building and Running

### Установка зависимостей

```bash
npm install
```

### Запуск dev-сервера

```bash
npm run dev
```

Приложение доступно по адресу: http://localhost:5173

### Сборка production версии

```bash
npm run build
```

Результат в директории `dist/`

### Preview production сборки

```bash
npm run preview
```

### Запуск тестов

```bash
npm test
```

## Основные возможности

### Источники аудио

1. **Микрофон** — запись звука в реальном времени через `getUserMedia({ audio: true })`
2. **Файл** — загрузка аудиофайлов (MP3, WAV, OGG) или видео (WebM)

### Анализ аудио

- **Детекция пиков** — threshold-based алгоритм для распознавания ударов
- **Настройки чувствительности:**
  - Порог чувствительности (0.05–0.95)
  - Минимальное расстояние между ударами (0.05–2.0 сек)

### Визуализация

- Waveform аудиодорожки на Canvas
- Красные маркеры на местах обнаруженных пиков
- Отображение количества найденных ударов

### Статистика

- Количество ударов
- Средний интервал между ударами
- Минимальный интервал
- Максимальный интервал
- Стандартное отклонение
- Таблица всех интервалов

### История

- Сохранение последних 10 анализов в localStorage
- Просмотр истории с возможностью загрузки результатов
- Удаление отдельных записей и очистка всей истории

## Типы данных

```typescript
interface AnalysisResult {
  id: string;              // Уникальный ID
  timestamp: number;       // Дата анализа
  sourceType: 'mic' | 'file' | 'webm';
  fileName?: string;       // Имя файла (если загружен)
  peaks: number[];         // Временные метки пиков (секунды)
  intervals: number[];     // Интервалы между ударами (секунды)
  statistics: {
    average: number;       // Средний интервал
    min: number;           // Минимальный интервал
    max: number;           // Максимальный интервал
    stdDev: number;        // Стандартное отклонение
    bounceCount: number;   // Количество ударов
  };
}
```

## Ключевые алгоритмы

### Детекция пиков (peakDetector.ts)

1. Вычисление локальных максимумов амплитуды
2. Фильтрация по порогу чувствительности
3. Фильтрация по минимальному расстоянию между пиками
4. Расчёт интервалов и статистики

### Web Audio API (audioAnalyzer.ts)

- `decodeAudioData()` — декодирование аудио из файлов/WebM
- `getChannelData()` — получение PCM данных
- `MediaRecorder` — запись с микрофона в WebM формат

## Development Notes

- **localStorage ключ:** `ball-bounce-meter-results`
- **Алиас импортов:** `@/*` → `src/*`
- **CSS переменные:** shadcn/ui theme в `src/index.css`

## Расширение функционала

### Добавить новый источник аудио

1. Создать компонент в `src/components/`
2. Добавить функцию загрузки в `src/services/audioAnalyzer.ts`
3. Добавить вкладку в `App.tsx`

### Изменить алгоритм детекции

Отредактировать `src/services/peakDetector.ts`:
- `detectPeaks()` — основная функция детекции
- `calculateIntervals()` — расчёт интервалов
- `calculateStatistics()` — статистика

## Troubleshooting

### Ошибки сборки

```bash
# Очистить кэш и переустановить зависимости
rm -rf node_modules dist
npm install
npm run build
```

### Проблемы с доступом к микрофону

- Проверить разрешения браузера
- Убедиться что используется HTTPS (или localhost)

## License

MIT

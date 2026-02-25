import { AudioData } from '@/types/audio';

/**
 * Записывает аудио с микрофона
 */
export async function recordFromMicrophone(): Promise<AudioData> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  return new Promise((resolve) => {
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await decodeAudioData(arrayBuffer);
      
      // Останавливаем все треки
      stream.getTracks().forEach(track => track.stop());
      
      resolve({
        audioBuffer,
        sourceType: 'mic',
      });
    };

    mediaRecorder.start();
    
    // Возвращаем функцию для остановки записи
    (mediaRecorder as any).stopRecording = () => mediaRecorder.stop();
  });
}

/**
 * Декодирует аудио данные в AudioBuffer
 */
export async function decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  const audioContext = new AudioContext();
  return await audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Загружает аудио из файла
 */
export async function loadAudioFile(file: File): Promise<AudioData> {
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await decodeAudioData(arrayBuffer);
  
  const sourceType: 'file' | 'webm' = file.name.toLowerCase().endsWith('.webm') 
    ? 'webm' 
    : 'file';
  
  return {
    audioBuffer,
    sourceType,
    fileName: file.name,
  };
}

/**
 * Получает сырые аудиоданные (PCM) из AudioBuffer
 */
export function getChannelData(audioBuffer: AudioBuffer, channel: number = 0): Float32Array {
  return audioBuffer.getChannelData(channel);
}

/**
 * Получает информацию об аудио
 */
export function getAudioInfo(audioBuffer: AudioBuffer) {
  return {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels,
    length: audioBuffer.length,
  };
}

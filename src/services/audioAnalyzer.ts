import { AudioData } from '@/types/audio';

/**
 * Records audio from microphone
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

      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());

      resolve({
        audioBuffer,
        sourceType: 'mic',
      });
    };

    mediaRecorder.start();

    // Return function to stop recording
    (mediaRecorder as any).stopRecording = () => mediaRecorder.stop();
  });
}

/**
 * Decodes audio data to AudioBuffer
 */
export async function decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  const audioContext = new AudioContext();
  return await audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Loads audio from file
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
 * Gets raw PCM audio data from AudioBuffer
 */
export function getChannelData(audioBuffer: AudioBuffer, channel: number = 0): Float32Array {
  return audioBuffer.getChannelData(channel);
}

/**
 * Gets audio information
 */
export function getAudioInfo(audioBuffer: AudioBuffer) {
  return {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels,
    length: audioBuffer.length,
  };
}

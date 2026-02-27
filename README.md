# Ball Bounce Meter

Web application for analyzing audio recordings of ball bounces with waveform visualization and statistics.

**Live Demo:** [https://zfail.github.io/ball-bounce-meter](https://zfail.github.io/ball-bounce-meter)

## Features

- **🎤 Microphone Recording** - Record audio directly from your microphone
- **📁 File Upload** - Upload audio files (MP3, WAV, OGG, WebM) or drag & drop
- **📊 Waveform Visualization** - Auto-scaling waveform with peak detection
- **📈 Statistics** - View bounce count, intervals, and calculated height
- **⚙️ Adjustable Sensitivity** - Fine-tune detection threshold and minimum distance
- **💾 History** - Save and review previous analyses
- **⬇️ Download Recording** - Save your microphone recordings as WebM files

## Usage

### Recording from Microphone

1. Click **"Record from Mic"**
2. Allow microphone access when prompted
3. Make ball bounces near the microphone
4. Click **"Stop Recording"**
5. View the analysis results

### Uploading Audio File

1. Click **"Select File"** or drag & drop a file onto the waveform area
2. Supported formats: MP3, WAV, OGG, WebM
3. Analysis runs automatically

### Adjusting Detection

- **Threshold**: Controls sensitivity (0.05-0.95)
  - Lower = more sensitive (detects quieter bounces)
  - Higher = less sensitive (only loud bounces)
- **Min Distance**: Minimum time between bounces (0.05-2.0 seconds)

### Peak Management

- Click checkboxes below the waveform to enable/disable individual peaks
- Statistics recalculate based on selected peaks

## Physics

### Bounce Height Calculation

The app calculates bounce height using the time interval between bounces:

```
h = g × t² / 8
```

Where:
- `h` = height in meters
- `g` = 9.8 m/s² (gravity)
- `t` = time interval between bounces in seconds

This formula derives from the physics of free fall: time up = time down = t/2, and h = ½g(t/2)².

## Technology Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **UI Components**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **Audio Analysis**: Web Audio API
- **Visualization**: Canvas API
- **Testing**: Playwright (E2E) + Vitest (unit)
- **Storage**: localStorage

## License

MIT

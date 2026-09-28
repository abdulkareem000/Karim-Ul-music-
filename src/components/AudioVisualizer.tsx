import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../services/audioEngine';
import { Activity, BarChart2, Radio, Disc } from 'lucide-react';

export type VisualizerMode = 'bars' | 'wave' | 'radial' | 'glow_matrix';

interface AudioVisualizerProps {
  primaryColor?: string;
  accentColor?: string;
  height?: number;
  className?: string;
  showControls?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  primaryColor = '#10b981',
  accentColor = '#6366f1',
  height = 140,
  className = '',
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('bars');
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const { frequency, waveform } = audioEngine.getVisualizerData();
      const isPlaying = audioEngine.getIsPlaying();

      if (mode === 'bars') {
        const barCount = 36;
        const barWidth = (w / barCount) - 3;
        const step = Math.floor(frequency.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const rawVal = isPlaying ? frequency[i * step] : 8 + Math.sin(Date.now() * 0.003 + i) * 6;
          const barHeight = Math.max(4, (rawVal / 255) * (h - 10));
          const x = i * (barWidth + 3);
          const y = h - barHeight;

          const grad = ctx.createLinearGradient(0, y, 0, h);
          grad.addColorStop(0, accentColor);
          grad.addColorStop(1, primaryColor);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();
        }
      } else if (mode === 'wave') {
        ctx.beginPath();
        ctx.lineWidth = 3;
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, primaryColor);
        grad.addColorStop(0.5, accentColor);
        grad.addColorStop(1, primaryColor);
        ctx.strokeStyle = grad;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 12;

        const sliceWidth = w / waveform.length;
        let x = 0;

        for (let i = 0; i < waveform.length; i++) {
          const v = isPlaying ? waveform[i] / 128.0 : 1 + Math.sin(Date.now() * 0.004 + i * 0.1) * 0.05;
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      } else if (mode === 'radial') {
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = Math.min(centerX, centerY) * 0.45;
        const bars = 48;
        const step = Math.floor(frequency.length / bars);

        // Center ambient disc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fill();

        for (let i = 0; i < bars; i++) {
          const angle = (i / bars) * Math.PI * 2;
          const rawVal = isPlaying ? frequency[i * step] : 10 + Math.sin(Date.now() * 0.003 + i) * 6;
          const length = (rawVal / 255) * (Math.min(centerX, centerY) * 0.5);

          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + length);
          const y2 = centerY + Math.sin(angle) * (radius + length);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = i % 2 === 0 ? primaryColor : accentColor;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      } else if (mode === 'glow_matrix') {
        // Mirrored center bars
        const bars = 28;
        const barWidth = (w / bars) - 4;
        const midY = h / 2;
        const step = Math.floor(frequency.length / bars);

        for (let i = 0; i < bars; i++) {
          const rawVal = isPlaying ? frequency[i * step] : 12;
          const barHeight = Math.max(3, (rawVal / 255) * (h * 0.45));
          const x = i * (barWidth + 4);

          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.roundRect(x, midY - barHeight, barWidth, barHeight * 2, 4);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [mode, primaryColor, accentColor]);

  return (
    <div className={`relative flex flex-col items-center w-full ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ height }}
        className="w-full rounded-xl pointer-events-none"
      />

      {showControls && (
        <div className="flex items-center gap-1.5 mt-2 bg-slate-900/60 p-1 rounded-lg border border-slate-800/80 backdrop-blur-md">
          <button
            onClick={() => setMode('bars')}
            className={`p-1.5 rounded-md transition-colors text-xs flex items-center gap-1 ${
              mode === 'bars' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Frequency Bars"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bars</span>
          </button>
          <button
            onClick={() => setMode('wave')}
            className={`p-1.5 rounded-md transition-colors text-xs flex items-center gap-1 ${
              mode === 'wave' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Oscilloscope Wave"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wave</span>
          </button>
          <button
            onClick={() => setMode('radial')}
            className={`p-1.5 rounded-md transition-colors text-xs flex items-center gap-1 ${
              mode === 'radial' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Radial Pulse"
          >
            <Disc className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Radial</span>
          </button>
          <button
            onClick={() => setMode('glow_matrix')}
            className={`p-1.5 rounded-md transition-colors text-xs flex items-center gap-1 ${
              mode === 'glow_matrix' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mirrored Matrix"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Matrix</span>
          </button>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { clsx } from 'clsx';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
}

export function Slider({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  label,
  className 
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-green-400">
          {label}: <span className="text-white">{value}</span>
        </label>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500/50"
          style={{
            background: `linear-gradient(to right, #10B981 0%, #10B981 ${percentage}%, #374151 ${percentage}%, #374151 100%)`
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            input[type="range"]::-webkit-slider-thumb {
              appearance: none;
              height: 18px;
              width: 18px;
              border-radius: 50%;
              background: linear-gradient(to right, #10B981, #059669);
              cursor: pointer;
              box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
              border: none;
            }
            
            input[type="range"]::-moz-range-thumb {
              height: 18px;
              width: 18px;
              border-radius: 50%;
              background: linear-gradient(to right, #10B981, #059669);
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
            }
          `
        }} />
      </div>
    </div>
  );
}
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from '../stores/canvasStore';

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  const {
    pixels,
    currentTool,
    currentColor,
    brushSize,
    showGrid,
    canvasSize,
    selectedFrame,
    layers,
    activeLayer,
    setPixel,
    clearPixel,
    setIsDrawing,
    splatterLogo
  } = useCanvasStore();



  // Calculate exact pixel scale for 200x200 grid
  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      if (container) {
        const maxWidth = window.innerWidth * 0.5; // Use 50% for center space
        const maxHeight = window.innerHeight * 0.8;
        const maxSize = Math.min(maxWidth, maxHeight);
        
        // Calculate scale to ensure exactly 200x200 pixels are visible
        const pixelSize = Math.floor(maxSize / canvasSize);
        setCanvasScale(Math.max(2, pixelSize)); // Minimum 2px per grid pixel
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    
    return () => window.removeEventListener('resize', updateScale);
  }, [canvasSize]);

  // Render canvas with layers and frame as pixels
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to exactly 200x200 pixels
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // Configure context for pixel art
    ctx.imageSmoothingEnabled = false;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Render layers in order: background, face, eyes, smile, frame
    layers.forEach(layer => {
      if (!layer.visible) return;
      
      if (layer.type === 'background') {
        // Fill entire canvas with background color/gradient
        if (layer.color?.includes('gradient')) {
          // Parse gradient
          const gradientMatch = layer.color.match(/linear-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
          if (gradientMatch) {
            const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
            gradient.addColorStop(0, gradientMatch[2].trim());
            gradient.addColorStop(1, gradientMatch[3].trim());
            ctx.fillStyle = gradient;
          } else {
            ctx.fillStyle = layer.color || '#0F172A';
          }
        } else {
          ctx.fillStyle = layer.color || '#0F172A';
        }
        ctx.fillRect(0, 0, canvasSize, canvasSize);
      } else if (layer.type === 'frame') {
        // Draw frame as pixels around the border
        const frameWidth = 4; // 4 pixel frame width
        if (selectedFrame) {
          const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
          gradient.addColorStop(0, selectedFrame.colors[0]);
          gradient.addColorStop(0.5, selectedFrame.colors[1]);
          gradient.addColorStop(1, selectedFrame.colors[2] || selectedFrame.colors[0]);
          
          ctx.fillStyle = gradient;
          
          // Top border
          ctx.fillRect(0, 0, canvasSize, frameWidth);
          // Bottom border
          ctx.fillRect(0, canvasSize - frameWidth, canvasSize, frameWidth);
          // Left border
          ctx.fillRect(0, 0, frameWidth, canvasSize);
          // Right border
          ctx.fillRect(canvasSize - frameWidth, 0, frameWidth, canvasSize);
        }
      } else {
        // For face, eyes, smile - these will be PNG images loaded as layers
        // For now, render any pixels from the layer
        layer.pixels.forEach((color, key) => {
          const [x, y] = key.split(',').map(Number);
          if (x >= 0 && x < canvasSize && y >= 0 && y < canvasSize) {
            ctx.globalAlpha = layer.opacity / 100;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
            ctx.globalAlpha = 1;
          }
        });
      }
    });

    // Draw user pixels (on top of layers)
    pixels.forEach((color, key) => {
      const [x, y] = key.split(',').map(Number);
      const frameWidth = 4;
      // Only draw pixels in the drawable area (inside frame)
      if (x >= frameWidth && x < canvasSize - frameWidth && 
          y >= frameWidth && y < canvasSize - frameWidth) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    });

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 0.1;
      ctx.globalAlpha = 0.2;
      
      // Draw grid lines every 10 pixels for major grid
      for (let x = 0; x <= canvasSize; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvasSize; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize, y);
        ctx.stroke();
      }
      
      // Draw minor grid lines every pixel with lower opacity
      ctx.lineWidth = 0.05;
      ctx.globalAlpha = 0.1;
      for (let x = 0; x <= canvasSize; x += 1) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvasSize; y += 1) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize, y);
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1;
    }
  }, [pixels, showGrid, canvasSize, selectedFrame, layers]);

  const getPixelCoordinates = useCallback((event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / canvasScale);
    const y = Math.floor((event.clientY - rect.top) / canvasScale);

    // Ensure we're not drawing in the frame area
    const frameWidth = 4;
    if (x >= frameWidth && x < canvasSize - frameWidth && 
        y >= frameWidth && y < canvasSize - frameWidth) {
      return { x, y };
    }
    return null;
  }, [canvasScale, canvasSize]);

  const handlePixelAction = useCallback((x: number, y: number) => {
    if (currentTool === 'splatter') {
      splatterLogo(x, y);
      return;
    }

    // Apply brush size with minimum 1 grid unit
    const effectiveBrushSize = Math.max(1, brushSize);
    const halfBrush = Math.floor(effectiveBrushSize / 2);
    const frameWidth = 4;
    
    // Track pixels changed for transaction
    const pixelsChanged: Array<{x: number, y: number, color: string}> = [];
    
    for (let dx = -halfBrush; dx <= halfBrush; dx++) {
      for (let dy = -halfBrush; dy <= halfBrush; dy++) {
        const pixelX = x + dx;
        const pixelY = y + dy;
        
        // Make sure we stay within bounds and outside frame area
        if (pixelX >= frameWidth && pixelX < canvasSize - frameWidth && 
            pixelY >= frameWidth && pixelY < canvasSize - frameWidth) {
          if (currentTool === 'pen') {
            setPixel(pixelX, pixelY, currentColor);
            pixelsChanged.push({x: pixelX, y: pixelY, color: currentColor});
          } else if (currentTool === 'eraser') {
            clearPixel(pixelX, pixelY);
            pixelsChanged.push({x: pixelX, y: pixelY, color: 'transparent'});
          }
        }
      }
    }
    
  }, [brushSize, canvasSize, currentTool, currentColor, setPixel, clearPixel, splatterLogo]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const coords = getPixelCoordinates(event);
    if (coords) {
      setIsDragging(true);
      setIsDrawing(true);
      handlePixelAction(coords.x, coords.y);
    }
  }, [getPixelCoordinates, handlePixelAction, setIsDrawing]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging) return;
    
    const coords = getPixelCoordinates(event);
    if (coords) {
      handlePixelAction(coords.x, coords.y);
    }
  }, [isDragging, getPixelCoordinates, handlePixelAction]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsDrawing(false);
  }, [setIsDrawing]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden w-full h-full p-8"
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full animate-pulse" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(34, 211, 238, 0.1) 0%, transparent 50%),
            linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 20px 20px, 20px 20px'
        }} />
      </div>
      
      {/* Pixel Count Display */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-lg border border-purple-500/30">
          <span className="text-purple-400 font-mono font-bold">{pixels.size.toLocaleString()}</span>
          <span className="text-gray-300 text-sm">pixels</span>
        </div>
      </div>
      
      <div className="relative z-10 flex items-center justify-center">
        {/* Main Canvas - Pixel Perfect */}
        <canvas
          ref={canvasRef}
          style={{
            width: `${canvasSize * canvasScale}px`,
            height: `${canvasSize * canvasScale}px`,
            imageRendering: 'pixelated',
            cursor: currentTool === 'pen' ? 'crosshair' : 
                   currentTool === 'eraser' ? 'grab' : 
                   currentTool === 'splatter' ? 'copy' : 'default'
          }}
          className="border-2 border-green-500/40 rounded-lg shadow-2xl shadow-green-500/20 bg-transparent relative z-10"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
    splatterLogo,
    preloadImage,
    getImageFromCache
  } = useCanvasStore();

  // Constants for frame and drawing area
  const FRAME_WIDTH = 4;
  const DRAWABLE_AREA_START = FRAME_WIDTH;
  const DRAWABLE_AREA_END = canvasSize - FRAME_WIDTH;

  // Calculate exact pixel scale for 200x200 grid
  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      if (container) {
        // Get container dimensions
        const rect = container.getBoundingClientRect();
        const availableWidth = rect.width - 64; // Account for padding
        const availableHeight = rect.height - 64; // Account for padding
        const maxSize = Math.min(availableWidth, availableHeight);
        
        // Calculate scale to ensure exactly 200x200 pixels are visible
        const pixelSize = Math.floor(maxSize / canvasSize);
        setCanvasScale(Math.max(3, pixelSize)); // Minimum 3px per grid pixel for better visibility
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    
    return () => window.removeEventListener('resize', updateScale);
  }, [canvasSize]);

  // Preload all layer images on mount and when they change
  useEffect(() => {
    layers.forEach(layer => {
      if (layer.imageUrl && layer.visible) {
        preloadImage(layer.imageUrl).catch(console.warn);
      }
    });
  }, [layers, preloadImage]);

  // Memoize render dependencies to prevent unnecessary re-renders
  const renderDependencies = useMemo(() => ({
    pixelsArray: Array.from(pixels.entries()),
    layersData: layers.map(layer => ({
      id: layer.id,
      type: layer.type,
      visible: layer.visible,
      opacity: layer.opacity,
      color: layer.color,
      imageUrl: layer.imageUrl,
      pixelsArray: Array.from(layer.pixels.entries())
    })),
    frameType: selectedFrame?.type,
    frameColors: selectedFrame?.colors,
    showGridState: showGrid
  }), [pixels, layers, selectedFrame, showGrid]);

  // Optimized render function with image caching
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

    // Render layers in order: background, face, eyes, smile
    renderDependencies.layersData.forEach(layer => {
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
      } else {
        // For face, eyes, smile - use cached images
        if (layer.imageUrl && layer.visible) {
          const cachedImg = getImageFromCache(layer.imageUrl);
          if (cachedImg) {
            ctx.globalAlpha = layer.opacity;
            // Draw the image scaled to fit the drawable area (avoiding frame area)
            const drawableSize = canvasSize - (FRAME_WIDTH * 2);
            ctx.drawImage(
              cachedImg,
              FRAME_WIDTH, // x position (inside frame)
              FRAME_WIDTH, // y position (inside frame)
              drawableSize, // width
              drawableSize  // height
            );
            ctx.globalAlpha = 1;
          }
        }
        
        // Also render any pixels from the layer (for custom drawing on layers)
        layer.pixelsArray.forEach(([key, color]) => {
          const [x, y] = key.split(',').map(Number);
          if (x >= DRAWABLE_AREA_START && x < DRAWABLE_AREA_END && 
              y >= DRAWABLE_AREA_START && y < DRAWABLE_AREA_END) {
            ctx.globalAlpha = layer.opacity;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
            ctx.globalAlpha = 1;
          }
        });
      }
    });

    // Draw frame as pixels around the border (after all layers, before drawing layer)
    if (selectedFrame && renderDependencies.frameColors) {
      const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
      gradient.addColorStop(0, renderDependencies.frameColors[0]);
      gradient.addColorStop(0.5, renderDependencies.frameColors[1]);
      gradient.addColorStop(1, renderDependencies.frameColors[2] || renderDependencies.frameColors[0]);
      
      ctx.fillStyle = gradient;
      
      // Top border
      ctx.fillRect(0, 0, canvasSize, FRAME_WIDTH);
      // Bottom border
      ctx.fillRect(0, canvasSize - FRAME_WIDTH, canvasSize, FRAME_WIDTH);
      // Left border
      ctx.fillRect(0, 0, FRAME_WIDTH, canvasSize);
      // Right border
      ctx.fillRect(canvasSize - FRAME_WIDTH, 0, FRAME_WIDTH, canvasSize);
    }

    // Draw user pixels from drawing layer (topmost layer - for signatures/brush strokes)
    renderDependencies.pixelsArray.forEach(([key, color]) => {
      const [x, y] = key.split(',').map(Number);
      // Only draw pixels in the drawable area (inside frame)
      if (x >= DRAWABLE_AREA_START && x < DRAWABLE_AREA_END && 
          y >= DRAWABLE_AREA_START && y < DRAWABLE_AREA_END) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    });

    // Draw grid if enabled
    if (renderDependencies.showGridState) {
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
  }, [renderDependencies, canvasSize, getImageFromCache, FRAME_WIDTH, DRAWABLE_AREA_START, DRAWABLE_AREA_END]);

  const getPixelCoordinates = useCallback((event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;

    const pixelX = Math.floor(canvasX);
    const pixelY = Math.floor(canvasY);

    // Constrain to drawable area only (inside frame)
    if (pixelX < DRAWABLE_AREA_START || pixelX >= DRAWABLE_AREA_END || 
        pixelY < DRAWABLE_AREA_START || pixelY >= DRAWABLE_AREA_END) {
      return null; // Outside drawable area
    }

    return { x: pixelX, y: pixelY };
  }, [DRAWABLE_AREA_START, DRAWABLE_AREA_END]);

  const handleDraw = useCallback((event: React.MouseEvent) => {
    const coords = getPixelCoordinates(event);
    if (!coords) return;

    const { x, y } = coords;

    // Apply brush size effect
    for (let dx = -Math.floor(brushSize / 2); dx <= Math.floor(brushSize / 2); dx++) {
      for (let dy = -Math.floor(brushSize / 2); dy <= Math.floor(brushSize / 2); dy++) {
        const pixelX = x + dx;
        const pixelY = y + dy;

        // Ensure we stay within drawable bounds
        if (pixelX >= DRAWABLE_AREA_START && pixelX < DRAWABLE_AREA_END && 
            pixelY >= DRAWABLE_AREA_START && pixelY < DRAWABLE_AREA_END) {
          
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= brushSize / 2) {
            if (currentTool === 'pen') {
              setPixel(pixelX, pixelY, currentColor);
            } else if (currentTool === 'eraser') {
              clearPixel(pixelX, pixelY);
            } else if (currentTool === 'splatter') {
              if (Math.random() < 0.3) { // 30% chance for splatter effect
                setPixel(pixelX, pixelY, currentColor);
              }
            }
          }
        }
      }
    }
  }, [getPixelCoordinates, brushSize, currentTool, currentColor, setPixel, clearPixel, DRAWABLE_AREA_START, DRAWABLE_AREA_END]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const coords = getPixelCoordinates(event);
    if (!coords) return;

    setIsDragging(true);
    setIsDrawing(true);
    handleDraw(event);
  }, [getPixelCoordinates, setIsDrawing, handleDraw]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging) {
      handleDraw(event);
    }
  }, [isDragging, handleDraw]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsDrawing(false);
  }, [setIsDrawing]);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setIsDrawing(false);
  }, [setIsDrawing]);

  // Handle double-click for logo splatter
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    const coords = getPixelCoordinates(event);
    if (coords) {
      splatterLogo(coords.x, coords.y);
    }
  }, [getPixelCoordinates, splatterLogo]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-900/30 rounded-lg border border-gray-700"
    >
      <canvas
        ref={canvasRef}
        className="border border-gray-600 rounded cursor-crosshair shadow-xl"
        style={{
          width: `${canvasSize * canvasScale}px`,
          height: `${canvasSize * canvasScale}px`,
          imageRendering: 'pixelated',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
}
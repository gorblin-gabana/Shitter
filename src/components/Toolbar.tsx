import React from 'react';
import { Paintbrush, Eraser, Grid3X3, Palette, Download, Upload, Zap } from 'lucide-react';
import { useCanvasStore } from '../stores/canvasStore';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Slider } from './ui/Slider';

const COLOR_PALETTE = [
  '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', 
  '#10B981', '#F97316', '#EC4899', '#6366F1',
  '#14B8A6', '#84CC16', '#F59E0B', '#8B5CF6',
  '#000000', '#FFFFFF', '#6B7280', '#374151'
];

export function Toolbar() {
  const {
    currentTool,
    currentColor,
    brushSize,
    showGrid,
    setTool,
    setColor,
    setBrushSize,
    toggleGrid,
    clearCanvas,
    exportCanvas,
    importCanvas
  } = useCanvasStore();

  const handleExport = () => {
    const data = exportCanvas();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gorbagana-art.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        importCanvas(data);
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const handleGenerateArt = () => {
    // Mock AI generation - creates random pixels
    const colors = COLOR_PALETTE;
    const newPixels = new Map();
    
    // Generate random art pattern
    for (let i = 0; i < 1000; i++) {
      const x = Math.floor(Math.random() * 256);
      const y = Math.floor(Math.random() * 256);
      const color = colors[Math.floor(Math.random() * colors.length)];
      newPixels.set(`${x},${y}`, color);
    }
    
    // Import the generated pattern
    const pixelArray = Array.from(newPixels.entries());
    importCanvas(JSON.stringify(pixelArray));
  };

  return (
    <Card className="w-80 h-full flex flex-col bg-gray-800/95 backdrop-blur-sm">
      <CardContent className="flex-1 space-y-6">
        {/* Tools */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={currentTool === 'pen' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTool('pen')}
              className="justify-start"
            >
              <Paintbrush className="w-4 h-4 mr-2" />
              Pen
            </Button>
            <Button
              variant={currentTool === 'eraser' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTool('eraser')}
              className="justify-start"
            >
              <Eraser className="w-4 h-4 mr-2" />
              Eraser
            </Button>
          </div>
        </div>

        {/* Brush Settings */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Brush</h3>
          <Slider
            label="Size"
            value={brushSize}
            onChange={setBrushSize}
            min={1}
            max={10}
            step={1}
          />
        </div>

        {/* Color Picker */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Color</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg border-2 border-gray-600 shadow-inner"
                style={{ backgroundColor: currentColor }}
              />
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded-lg border-2 border-gray-600 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color }}
                  onClick={() => setColor(color)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* View Options */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">View</h3>
          <Button
            variant={showGrid ? 'primary' : 'outline'}
            size="sm"
            onClick={toggleGrid}
            className="w-full justify-start"
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            Grid {showGrid ? 'On' : 'Off'}
          </Button>
        </div>

        {/* AI Generation */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">AI Generator</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerateArt}
            className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            Gorb Splatter
          </Button>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Actions</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="justify-start"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            
            <label className="cursor-pointer">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                as="span"
              >
                <Upload className="w-4 h-4 mr-1" />
                Import
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
          
          <Button
            variant="danger"
            size="sm"
            onClick={clearCanvas}
            className="w-full"
          >
            Clear Canvas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
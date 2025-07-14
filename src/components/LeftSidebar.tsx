import React from 'react';
import { Layers, Eye, EyeOff } from 'lucide-react';
import { useCanvasStore } from '../stores/canvasStore';
import { Slider } from './ui/Slider';

export function LeftSidebar() {
  const {
    layers,
    activeLayer,
    setActiveLayer,
    toggleLayerVisibility,
    updateLayerOpacity,
    updateLayerColor,
    loadLayerImage,
    backgroundOptions
  } = useCanvasStore();

  const handleImageSelect = (layerId: string, imageNumber: number) => {
    const imageUrl = `/${layerId}_${imageNumber}.png`;
    loadLayerImage(layerId, imageUrl);
  };

  const getLayerImages = (layerId: string) => {
    if (layerId === 'background') return [];
    return [1, 2, 3, 4]; // 4 options for each layer
  };

  return (
    <div className="w-72 bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Layers</h2>
        </div>
        <p className="text-sm text-gray-400 mt-1">Manage your artwork layers</p>
      </div>

      {/* Active Layer Indicator */}
      <div className="px-4 py-3 bg-gray-800/30 border-b border-gray-800">
        <div className="text-sm text-gray-400 mb-1">Active Layer</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-green-400 font-medium capitalize">{activeLayer}</span>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className={`border rounded-lg transition-all ${
                activeLayer === layer.id
                  ? 'border-green-400 bg-green-400/5'
                  : 'border-gray-700 bg-gray-800/30'
              }`}
            >
              {/* Layer Header */}
              <div
                onClick={() => setActiveLayer(layer.id)}
                className="p-3 cursor-pointer hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white capitalize">{layer.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer.id);
                      }}
                      className={`p-1 rounded ${
                        layer.visible ? 'text-green-400' : 'text-gray-500'
                      }`}
                    >
                      {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Opacity Control */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-400 w-12">Opacity:</span>
                  <Slider
                    value={layer.opacity}
                    onChange={(value) => updateLayerOpacity(layer.id, value)}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 w-8">{layer.opacity}%</span>
                </div>
              </div>

              {/* Layer Content */}
              {activeLayer === layer.id && (
                <div className="px-3 pb-3 border-t border-gray-700">
                  {layer.type === 'background' ? (
                    /* Background Options */
                    <div className="pt-3">
                      <div className="text-xs text-gray-400 mb-2">Background Options</div>
                      <div className="grid grid-cols-2 gap-2">
                        {backgroundOptions.map((bg) => (
                          <button
                            key={bg.id}
                            onClick={() => updateLayerColor(layer.id, bg.value)}
                            className={`p-2 rounded border-2 transition-all ${
                              layer.color === bg.value
                                ? 'border-green-400'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                          >
                            <div
                              className="w-full h-6 rounded mb-1"
                              style={{ background: bg.value }}
                            />
                            <span className="text-xs text-gray-300">{bg.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Image Selection for other layers */
                    <div className="pt-3">
                      <div className="text-xs text-gray-400 mb-2">Select {layer.name}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {getLayerImages(layer.id).map((imageNum) => (
                          <button
                            key={imageNum}
                            onClick={() => handleImageSelect(layer.id, imageNum)}
                            className={`p-2 rounded border-2 transition-all ${
                              layer.imageUrl === `/${layer.id}_${imageNum}.png`
                                ? 'border-green-400'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                          >
                            <div className="w-full h-8 bg-gray-700 rounded mb-1 flex items-center justify-center">
                              <span className="text-xs text-gray-400">{layer.name} {imageNum}</span>
                            </div>
                            <span className="text-xs text-gray-300">Option {imageNum}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
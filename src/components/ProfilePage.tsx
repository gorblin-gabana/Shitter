import React, { useState } from 'react';
import { PixelCanvas } from './PixelCanvas';
import { Card, CardContent } from './ui/Card';
import { NFTMintModal } from './NFTMintModal';
import { useCanvasStore } from '../stores/canvasStore';
import { useWalletStore } from '../stores/walletStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { Layers, Eye, EyeOff, Palette, Image, Paintbrush, Eraser, ChevronDown, ChevronRight, Wallet, LogOut, Sparkles } from 'lucide-react';

interface ProfilePageProps {
  onNavigateToFeed?: () => void;
}

export function ProfilePage({ onNavigateToFeed }: ProfilePageProps = {}) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [expandedLayer, setExpandedLayer] = useState<string>('face'); // Start with face expanded
  const [expandedFrame, setExpandedFrame] = useState<boolean>(true); // Frame section expanded
  const [showColorPicker, setShowColorPicker] = useState(false);
  const {
    selectedFrame,
    setFrame,
    layers,
    activeLayer,
    setActiveLayer,
    toggleLayerVisibility,
    updateLayerOpacity,
    updateLayerColor,
    loadLayerImage,
    replaceLayerImage,
    backgroundOptions,
    pixels,
    currentTool,
    currentColor,
    brushSize,
    showGrid,
    setTool,
    setColor,
    setBrushSize,
    toggleGrid
  } = useCanvasStore();
  const { 
    gameWallet, 
    gameBalance, 
    isTrashpackConnected, 
    trashpackAddress, 
    mainWallet 
  } = useWalletStore();
  const { publicKey, wallet, disconnect } = useWallet();

  const frameOptions = [
    { type: 'classic' as const, name: 'Classic', gradient: 'from-green-400 to-emerald-600', colors: ['#10b981', '#059669', '#047857'], pattern: 'solid' },
    { type: 'modern' as const, name: 'Gold', gradient: 'from-yellow-400 to-orange-500', colors: ['#fbbf24', '#f59e0b', '#d97706'], pattern: 'metallic' },
    { type: 'neon' as const, name: 'Ocean', gradient: 'from-blue-400 to-cyan-500', colors: ['#60a5fa', '#06b6d4', '#0891b2'], pattern: 'glow' },
    { type: 'wooden' as const, name: 'Sunset', gradient: 'from-pink-400 to-purple-600', colors: ['#f472b6', '#9333ea', '#7c3aed'], pattern: 'wood-grain' },
    { type: 'digital' as const, name: 'Fire', gradient: 'from-red-400 to-orange-600', colors: ['#f87171', '#ea580c', '#dc2626'], pattern: 'digital' },
  ];

  // Color palette - same colors as before
  const colorPalette = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#FF1744',
    '#FF5722', '#FF9800', '#FFC107', '#CDDC39', '#8BC34A', '#4CAF50',
    '#009688', '#00BCD4', '#03A9F4', '#2196F3', '#3F51B5', '#9C27B0',
    '#E91E63', '#795548', '#607D8B', '#9E9E9E', '#000000', '#FFFFFF'
  ];

  const getLayerImages = (layerId: string) => {
    if (layerId === 'background') return [];
    if (layerId === 'face') return [1, 2, 3, 4, 5]; // face has 5 options
    if (layerId === 'eyes') return [1, 2, 3, 4, 5, 6]; // eyes has 6 options
    if (layerId === 'smile') return []; // smile folder is empty - no images available
    if (layerId === 'drawing') return []; // drawing layer has no images
    return [1, 2, 3, 4]; // default
  };

  const getImageUrl = (layerId: string, imageNumber: number) => {
    if (layerId === 'face') {
      return imageNumber === 5 ? `/face/Face_5.png` : `/face/face_${imageNumber}.png`;
    } else if (layerId === 'eyes') {
      return `/eyes/eyes_${imageNumber}.png`;
    }
    return '';
  };

  // Get wallet info (reused from RightSidebar)
  const getWalletInfo = () => {
    if (isTrashpackConnected) {
      return {
        name: 'TrashPack',
        icon: '/trashpack.png',
        address: trashpackAddress || '7xKXt...9Qm2',
        isImage: true
      };
    }

    if (publicKey && wallet) {
      const walletName = wallet.adapter.name;
      let icon = '👛';
      
      switch (walletName.toLowerCase()) {
        case 'backpack':
          icon = '🎒';
          break;
        case 'phantom':
          icon = '👻';
          break;
        case 'solflare':
          icon = '☀️';
          break;
        case 'slope':
          icon = '📐';
          break;
        case 'sollet':
          icon = '💙';
          break;
        default:
          icon = '👛';
      }

      return {
        name: walletName,
        icon,
        address: publicKey.toString(),
        isImage: false
      };
    }

    return null;
  };

  const handleDisconnect = async () => {
    if (isTrashpackConnected) {
      const trashpack = (window as any).trashpack;
      if (trashpack?.disconnect) {
        await trashpack.disconnect();
      }
      window.location.reload();
    } else {
      await disconnect();
    }
  };

  const walletInfo = getWalletInfo();

  // Add Drawing layer to the display layers
  const displayLayers = [
    ...layers,
    {
      id: 'drawing',
      name: 'Drawing',
      visible: true,
      opacity: 1.0,
      type: 'drawing' as const,
      pixels: new Map()
    }
  ];

  return (
    <div className="h-full flex overflow-hidden max-w-7xl mx-auto w-full px-4">
      {/* Left Sidebar - Accordion Layers + Frames */}
      <div className="w-96 bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium text-white">Avatar Layers</span>
          </div>
          
          {/* Active Layer Indicator */}
          <div className="px-3 py-2 bg-gray-800/30 rounded-lg border border-gray-700 mb-4">
            <div className="text-xs text-gray-400 mb-1">Active Layer</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-400 font-medium capitalize text-sm">{activeLayer}</span>
            </div>
          </div>

          {/* Accordion Layers List */}
          <div className="space-y-2 mb-6">
            {displayLayers.map((layer) => (
              <div
                key={layer.id}
                className={`border rounded-lg transition-all ${
                  activeLayer === layer.id
                    ? 'border-green-400 bg-green-400/5'
                    : 'border-gray-700 bg-gray-800/30'
                }`}
              >
                {/* Layer Header - Accordion Toggle */}
                <div
                  onClick={() => {
                    setActiveLayer(layer.id);
                    setExpandedLayer(expandedLayer === layer.id ? '' : layer.id);
                  }}
                  className="p-3 cursor-pointer hover:bg-gray-700/30 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white capitalize">{layer.name}</span>
                    {layer.id !== 'drawing' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerVisibility(layer.id);
                        }}
                        className={`p-1 rounded transition-colors ${
                          layer.visible
                            ? 'text-green-400 hover:bg-green-400/20'
                            : 'text-gray-500 hover:bg-gray-500/20'
                        }`}
                      >
                        {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {expandedLayer === layer.id ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Layer Content */}
                {expandedLayer === layer.id && (
                  <div className="p-3 border-t border-gray-700 space-y-3">
                    {layer.type === 'background' && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-400 mb-2">Background Options</div>
                        <div className="grid grid-cols-3 gap-2">
                          {backgroundOptions.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => updateLayerColor(layer.id, bg.value)}
                              className={`h-8 rounded border-2 transition-all ${
                                layer.color === bg.value
                                  ? 'border-green-400 shadow-lg'
                                  : 'border-gray-600 hover:border-gray-500'
                              }`}
                              style={{
                                background: bg.type === 'gradient' ? bg.value : bg.value
                              }}
                              title={bg.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {(layer.type === 'face' || layer.type === 'eyes' || layer.type === 'smile') && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-400 mb-2">Choose {layer.name} Style</div>
                        <div className="grid grid-cols-3 gap-2">
                          {getLayerImages(layer.id).map((imageNumber) => {
                            const imageUrl = getImageUrl(layer.id, imageNumber);
                            return (
                              <button
                                key={imageNumber}
                                onClick={() => {
                                  console.log(`Replacing ${layer.type} with:`, imageUrl);
                                  replaceLayerImage(layer.type as 'face' | 'eyes' | 'smile', imageUrl);
                                }}
                                className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                                  layer.imageUrl === imageUrl
                                    ? 'border-green-400 shadow-lg shadow-green-400/25'
                                    : 'border-gray-600 hover:border-gray-500'
                                }`}
                              >
                                <div className="aspect-square bg-gray-800 flex items-center justify-center relative overflow-hidden">
                                  <img
                                    src={imageUrl}
                                    alt={`${layer.name} ${imageNumber}`}
                                    className="w-full h-full object-cover rounded"
                                    onError={(e) => {
                                      console.warn(`Failed to load image: ${imageUrl}`);
                                      e.currentTarget.style.display = 'none';
                                      const fallbackElement = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (fallbackElement) {
                                        fallbackElement.textContent = `${layer.name} ${imageNumber}`;
                                        fallbackElement.classList.remove('hidden');
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-white absolute inset-0 flex items-center justify-center bg-gray-700/80 hidden">{layer.name} {imageNumber}</span>
                                  {layer.imageUrl === imageUrl && (
                                    <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center">
                                      <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-gray-900">✓</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {layer.type === 'drawing' && (
                      <div className="text-xs text-gray-400 text-center py-2">
                        Use brush tools to draw on this layer
                      </div>
                    )}

                    {layer.id !== 'background' && layer.id !== 'drawing' && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-400">Opacity: {Math.round(layer.opacity * 100)}%</div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={layer.opacity}
                          onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Accordion Frame Selection - Moved from Right Sidebar */}
          <div className="border border-gray-700 bg-gray-800/30 rounded-lg">
            {/* Frame Header - Accordion Toggle */}
            <div
              onClick={() => setExpandedFrame(!expandedFrame)}
              className="flex items-center justify-between cursor-pointer hover:bg-gray-700/30 transition-colors p-3 rounded-t-lg"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Profile Frame</span>
              </div>
              <div className="flex items-center gap-2">
                {expandedFrame ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Frame Content */}
            {expandedFrame && (
              <div className="p-3 border-t border-gray-700">
                <div className="grid grid-cols-3 gap-2">
                  {frameOptions.map((frame) => (
                    <button
                      key={frame.type}
                      onClick={() => {
                        console.log('Frame clicked:', frame);
                        console.log('Current selectedFrame:', selectedFrame);
                        setFrame({ type: frame.type, colors: frame.colors, pattern: frame.pattern });
                      }}
                      className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                        selectedFrame?.type === frame.type
                          ? 'border-green-400 shadow-lg shadow-green-400/25'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div
                        className={`h-12 bg-gradient-to-br ${frame.gradient} flex items-center justify-center relative`}
                      >
                        <div className="w-6 h-6 bg-gray-800/40 rounded border border-white/20 flex items-center justify-center">
                          <span className="text-xs text-white font-bold">A</span>
                        </div>
                        {selectedFrame?.type === frame.type && (
                          <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center">
                            <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                              <span className="text-xs text-gray-900">✓</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-1 bg-gray-800/60">
                        <span className="text-xs text-white font-medium">{frame.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle - Canvas */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Canvas - Square Container */}
        <div className="flex-1 flex items-center justify-center p-6 min-h-0">
          <div className="w-full aspect-square max-w-[500px] max-h-[500px] flex items-center justify-center">
            <PixelCanvas />
          </div>
        </div>

        {/* Enhanced Color Picker + Tools */}
        <div className="flex-shrink-0 bg-gray-900/50 border-t border-gray-800 p-3">
          {/* First Row - Tools and Brush Size */}
          <div className="flex items-center justify-center gap-4 mb-3">
            {/* Tools */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTool('pen')}
                className={`p-2 rounded transition-all ${
                  currentTool === 'pen'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Paintbrush className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded transition-all ${
                  currentTool === 'eraser'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>

            {/* Brush Size */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Size:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-white w-6">{brushSize}</span>
            </div>

            {/* Current Color Display */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Color:</span>
              <div 
                className="w-8 h-8 rounded border-2 border-white cursor-pointer"
                style={{ backgroundColor: currentColor }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
            </div>

            {/* Grid Toggle */}
            <button
              onClick={toggleGrid}
              className={`px-3 py-2 rounded text-xs transition-all ${
                showGrid
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Grid
            </button>
          </div>

          {/* Color Picker Section */}
          {showColorPicker && (
            <div className="mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="grid grid-cols-9 gap-1 mb-3">
                {colorPalette.slice(18).map((color) => (
                  <button
                    key={color}
                    onClick={() => setColor(color)}
                    className={`w-6 h-6 rounded border transition-all hover:scale-110 ${
                      currentColor === color
                        ? 'border-white border-2 shadow-lg'
                        : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Custom:</span>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-600 bg-transparent cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Second Row - Color Palette (First 18 colors) */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1">
              {colorPalette.slice(0, 18).map((color) => (
                <button
                  key={color}
                  onClick={() => setColor(color)}
                  className={`w-5 h-5 rounded border transition-all hover:scale-110 ${
                    currentColor === color
                      ? 'border-white border-2 shadow-lg'
                      : 'border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="ml-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors"
              >
                {showColorPicker ? 'Less' : 'More'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Wallet, Prebuilt Profiles, Mint (NO FRAMES) */}
      <div className="w-96 bg-gray-900/50 backdrop-blur-md border-l border-gray-800 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Enhanced Wallet & Credits - Reused from RightSidebar */}
            <Card className="bg-gray-800/20 border-gray-700/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                      {walletInfo?.isImage ? (
                        <img src={walletInfo.icon} alt={walletInfo.name} className="w-5 h-5" />
                      ) : (
                        <span className="text-lg">{walletInfo?.icon}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">
                        {walletInfo?.name || 'Unknown'}
                      </div>
                      <div className="text-gray-400 text-xs font-mono">
                        {walletInfo?.address ? 
                          `${walletInfo.address.slice(0, 4)}...${walletInfo.address.slice(-3)}` : 
                          'Not connected'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <button
                      onClick={handleDisconnect}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title="Disconnect wallet"
                    >
                      <LogOut className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Credits Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-800/40 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">GoodShits</div>
                    <div className="text-white text-base font-medium">1,247</div>
                  </div>
                  
                  {gameWallet && (
                    <div className="bg-gray-800/40 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">GORB</div>
                      <div className="text-white text-base font-medium">{gameBalance.toFixed(1)}</div>
                    </div>
                  )}
                  
                  <div className="bg-gray-800/40 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Activity</div>
                    <div className="text-white text-base font-medium">892</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prebuilt Rare Profile Pictures */}
            <Card className="bg-gray-800/40 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">Rare Profiles</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Legendary', rarity: 'L', gradient: 'from-orange-400 to-yellow-500' },
                    { name: 'Epic', rarity: 'E', gradient: 'from-purple-400 to-pink-500' },
                    { name: 'Mythic', rarity: 'SR', gradient: 'from-red-400 to-pink-500' },
                    { name: 'Divine', rarity: 'SR', gradient: 'from-blue-400 to-cyan-500' }
                  ].map((profile) => (
                    <button
                      key={profile.name}
                      className="group relative overflow-hidden rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-all duration-200"
                    >
                      <div className={`h-16 bg-gradient-to-br ${profile.gradient} flex items-center justify-center relative`}>
                        <div className="w-8 h-8 bg-gray-800/40 rounded border border-white/20 flex items-center justify-center">
                          <span className="text-xs text-white font-bold">{profile.rarity}</span>
                        </div>
                      </div>

                      <div className="p-2 bg-gray-800/60">
                        <span className="text-xs text-white font-medium">{profile.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 px-4 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Image className="w-4 h-4" />
              Export Profile Picture
            </button>
          </div>
        </div>
      </div>

      {/* Export Profile Picture Modal */}
      {showExportModal && (
        <NFTMintModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
} 
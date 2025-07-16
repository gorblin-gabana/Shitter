import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ArrowLeft, Download, Image, Palette, Eye, EyeOff, Layers, User } from 'lucide-react';
import { useCanvasStore } from '../stores/canvasStore';
import { useWalletStore } from '../stores/walletStore';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { NFTMintModal } from './NFTMintModal';
import { Slider } from './ui/Slider';
import { PixelCanvas } from './PixelCanvas';
import { Toolbar } from './Toolbar';

interface AvatarCreatorProps {
  onBack: () => void;
}

export function AvatarCreator({ onBack }: AvatarCreatorProps) {
  const { publicKey } = useWallet();
  const [showMintModal, setShowMintModal] = useState(false);
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
    backgroundOptions,
    pixels
  } = useCanvasStore();
  const { gameWallet, gameBalance } = useWalletStore();

  const frameOptions = [
    { type: 'classic' as const, name: 'Classic', gradient: 'from-green-400 to-emerald-600', colors: ['#10b981', '#059669'], pattern: 'solid' },
    { type: 'modern' as const, name: 'Gold', gradient: 'from-yellow-400 to-orange-500', colors: ['#fbbf24', '#f59e0b'], pattern: 'metallic' },
    { type: 'neon' as const, name: 'Ocean', gradient: 'from-blue-400 to-cyan-500', colors: ['#60a5fa', '#06b6d4'], pattern: 'glow' },
    { type: 'wooden' as const, name: 'Sunset', gradient: 'from-pink-400 to-purple-600', colors: ['#f472b6', '#9333ea'], pattern: 'wood-grain' },
    { type: 'digital' as const, name: 'Fire', gradient: 'from-red-400 to-orange-600', colors: ['#f87171', '#ea580c'], pattern: 'digital' },
  ];

  const handleImageSelect = (layerId: string, imageNumber: number) => {
    const imageUrl = `/${layerId}_${imageNumber}.png`;
    loadLayerImage(layerId, imageUrl);
  };

  const getLayerImages = (layerId: string) => {
    if (layerId === 'background') return [];
    return [1, 2, 3, 4]; // 4 options for each layer
  };

  const downloadCanvas = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'shitter-avatar.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Avatar Creator</h1>
              <p className="text-sm text-gray-400">Design your uncensored identity</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas Area - Now takes most of the space */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="flex-shrink-0">
            <Toolbar />
          </div>

          {/* Canvas - Now much larger */}
          <div className="flex-1 flex items-center justify-center p-8">
            <PixelCanvas />
          </div>
        </div>

        {/* Right Sidebar - Combined Tools, Layers & Export */}
        <div className="w-96 bg-gray-900/50 backdrop-blur-md border-l border-gray-800 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Wallet Info */}
              <Card className="bg-gray-800/40 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Connected</div>
                      <div className="text-xs text-gray-400 font-mono">
                        {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}
                      </div>
                    </div>
                  </div>
                  <WalletMultiButton className="!w-full !bg-gray-700/50 !text-gray-200 hover:!bg-gray-600 !rounded-lg !text-sm !py-2 !border-gray-600" />
                </CardContent>
              </Card>

              {/* Layers Section */}
              <Card className="bg-gray-800/40 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-medium text-white">Layers</span>
                  </div>
                  
                  {/* Active Layer Indicator */}
                  <div className="px-3 py-2 bg-gray-800/30 rounded-lg border border-gray-700 mb-4">
                    <div className="text-xs text-gray-400 mb-1">Active Layer</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-400 font-medium capitalize text-sm">{activeLayer}</span>
                    </div>
                  </div>

                  {/* Layers List */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
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
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Opacity:</span>
                              <span className="text-xs text-white font-medium">{layer.opacity}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={layer.opacity}
                              onChange={(e) => updateLayerOpacity(layer.id, Number(e.target.value))}
                              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                                                     {layer.id === 'background' ? (
                             /* Background Color Selection */
                             <div className="pt-3">
                               <div className="text-xs text-gray-400 mb-2">Background Color</div>
                               <div className="grid grid-cols-4 gap-1">
                                 {backgroundOptions.map((bg, index) => (
                                   <button
                                     key={index}
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       updateLayerColor(layer.id, bg.value);
                                     }}
                                     className={`w-8 h-8 rounded border-2 transition-all ${
                                       layer.color === bg.value 
                                         ? 'border-green-400 scale-110' 
                                         : 'border-gray-600 hover:border-gray-500'
                                     }`}
                                     style={{ background: bg.value.includes('gradient') ? bg.value : bg.value }}
                                     title={bg.name}
                                   />
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleImageSelect(layer.id, imageNum);
                                    }}
                                    className={`p-2 rounded border-2 transition-all ${
                                      layer.imageUrl === `/${layer.id}_${imageNum}.png`
                                        ? 'border-green-400'
                                        : 'border-gray-600 hover:border-gray-500'
                                    }`}
                                  >
                                    <div className="w-full h-6 bg-gray-700 rounded mb-1 flex items-center justify-center">
                                      <span className="text-xs text-gray-400">{layer.name} {imageNum}</span>
                                    </div>
                                    <span className="text-xs text-gray-300">Option {imageNum}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Frame Selection */}
              <Card className="bg-gray-800/40 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-purple-400/20 rounded-lg flex items-center justify-center">
                      <Palette className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Avatar Frame</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {frameOptions.map((frame) => (
                      <button
                        key={frame.type}
                        onClick={() => setFrame(frame)}
                        className={`group p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                          selectedFrame?.type === frame.type
                            ? 'border-green-400 bg-green-400/10 shadow-lg shadow-green-400/20'
                            : 'border-gray-600 hover:border-gray-500 bg-gray-700/30'
                        }`}
                      >
                        <div className={`w-full h-6 rounded-md bg-gradient-to-r ${frame.gradient} mb-2 shadow-sm`} />
                        <span className="text-xs text-gray-300 font-medium">{frame.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Avatar Stats */}
              <Card className="bg-gray-800/40 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                      <Image className="w-4 h-4 text-yellow-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Avatar Stats</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-400">Pixels Used:</span>
                      <span className="text-white font-mono font-medium">{pixels.size}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-400">Active Layers:</span>
                      <span className="text-white font-medium">
                        {layers.filter(layer => layer.visible).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-400">Frame Style:</span>
                      <span className="text-white font-medium capitalize">
                        {frameOptions.find(f => f.type === selectedFrame?.type)?.name || 'None'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={downloadCanvas}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Avatar
                </Button>
                
                <Button
                  onClick={() => setShowMintModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Mint Avatar NFT
                </Button>
              </div>

              {/* App Wallet Info */}
              {gameWallet && (
                <Card className="bg-gray-800/30 border-gray-700/50">
                  <CardContent className="p-3">
                    <div className="text-xs text-gray-400 mb-2">In-App Wallet</div>
                    <div className="text-xs text-gray-500 font-mono mb-1">
                      {gameWallet.publicKey.toString().slice(0, 8)}...{gameWallet.publicKey.toString().slice(-8)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Balance: <span className="text-green-400 font-medium">{gameBalance.toFixed(4)} GORB</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NFT Mint Modal */}
      {showMintModal && (
        <NFTMintModal
          isOpen={showMintModal}
          onClose={() => setShowMintModal(false)}
        />
      )}
    </div>
  );
} 
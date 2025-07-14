import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useCanvasStore } from '../stores/canvasStore';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { toast } from 'sonner';

interface NFTMintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NFTMintModal({ isOpen, onClose }: NFTMintModalProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [mintComplete, setMintComplete] = useState(false);
  const [nftData, setNftData] = useState<{ name: string; description: string }>({
    name: 'My Gorbagana Art',
    description: 'Created with Break Gorbagana pixel art tool'
  });

  const { pixels, canvasSize } = useCanvasStore();

  const handleMint = async () => {
    if (pixels.size === 0) {
      toast.error('Canvas is empty! Create some art first.');
      return;
    }

    setIsMinting(true);
    
    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock successful mint
      setMintComplete(true);
      toast.success('NFT minted successfully!');
      
      setTimeout(() => {
        onClose();
        setMintComplete(false);
        setIsMinting(false);
      }, 2000);
      
    } catch (error) {
      console.error('Minting failed:', error);
      toast.error('Minting failed. Please try again.');
      setIsMinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-black border-green-500/30 shadow-2xl shadow-green-500/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-400" />
              Mint NFT
            </CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-green-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!mintComplete ? (
            <>
              {/* Canvas Preview */}
              <div className="text-center">
                <div className="inline-block p-4 bg-gray-900 rounded-lg border border-green-500/20">
                  <div className="w-32 h-32 bg-slate-900 rounded border-2 border-green-500/30 relative overflow-hidden">
                    {/* Mock canvas preview */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-cyan-500/20">
                      <div className="absolute inset-2 border border-green-500/30 opacity-50"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-green-400 font-mono">
                        {pixels.size} pixels
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">Canvas Preview</p>
              </div>

              {/* NFT Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-400 mb-2">
                    NFT Name
                  </label>
                  <input
                    type="text"
                    value={nftData.name}
                    onChange={(e) => setNftData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-green-500/30 rounded-lg text-white focus:border-green-500 focus:outline-none"
                    placeholder="Enter NFT name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={nftData.description}
                    onChange={(e) => setNftData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-900 border border-green-500/30 rounded-lg text-white focus:border-green-500 focus:outline-none resize-none"
                    placeholder="Describe your artwork"
                  />
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-300">
                    <p className="font-medium mb-1">One NFT per wallet</p>
                    <p>You can only mint one NFT per wallet address. Make sure your art is ready!</p>
                  </div>
                </div>
              </div>

              {/* Mint Button */}
              <Button
                onClick={handleMint}
                loading={isMinting}
                disabled={!nftData.name.trim() || pixels.size === 0}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600"
              >
                {isMinting ? 'Minting NFT...' : 'Mint NFT'}
              </Button>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Mint Successful!</h3>
              <p className="text-gray-400 mb-4">
                Your pixel art has been minted as an NFT on the Gorbagana network.
              </p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-left">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Token:</span>
                    <span className="text-green-400 font-mono">Gx7k...9mN2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-emerald-400">Gorbagana</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
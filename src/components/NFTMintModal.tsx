import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useCanvasStore } from '../stores/canvasStore';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { toast } from 'sonner';
import lighthouse from '@lighthouse-web3/sdk';
// @ts-ignore
import apiKey from '../Apikey.txt';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NFTMintModal({ isOpen, onClose }: ExportModalProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mintComplete, setMintComplete] = useState(false);
  const [nftData, setNftData] = useState<{ name: string; description: string }>({
    name: 'My Gorbagana Avatar',
    description: 'Created with Gorbchain Avatar Creator'
  });
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { 
    pixels, 
    canvasSize, 
    layers, 
    selectedFrame,
    getImageFromCache 
  } = useCanvasStore();

  // Generate canvas preview
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // Configure context for pixel art
    ctx.imageSmoothingEnabled = false;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Render all layers in the same order as the main canvas
    layers.forEach(layer => {
      if (!layer.visible) return;
      
      if (layer.type === 'background') {
        // Fill entire canvas with background color/gradient
        if (layer.color?.includes('gradient')) {
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
            const FRAME_WIDTH = 4;
            const drawableSize = canvasSize - (FRAME_WIDTH * 2);
            ctx.drawImage(
              cachedImg,
              FRAME_WIDTH,
              FRAME_WIDTH,
              drawableSize,
              drawableSize
            );
            ctx.globalAlpha = 1;
          }
        }
        
        // Render layer pixels
        layer.pixels.forEach((color, key) => {
          const [x, y] = key.split(',').map(Number);
          const FRAME_WIDTH = 4;
          if (x >= FRAME_WIDTH && x < canvasSize - FRAME_WIDTH && 
              y >= FRAME_WIDTH && y < canvasSize - FRAME_WIDTH) {
            ctx.globalAlpha = layer.opacity;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
            ctx.globalAlpha = 1;
          }
        });
      }
    });

    // Draw frame
    if (selectedFrame) {
      const FRAME_WIDTH = 4;
      const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
      gradient.addColorStop(0, selectedFrame.colors[0]);
      gradient.addColorStop(0.5, selectedFrame.colors[1]);
      gradient.addColorStop(1, selectedFrame.colors[2] || selectedFrame.colors[0]);
      
      ctx.fillStyle = gradient;
      
      // Draw frame borders
      ctx.fillRect(0, 0, canvasSize, FRAME_WIDTH);
      ctx.fillRect(0, canvasSize - FRAME_WIDTH, canvasSize, FRAME_WIDTH);
      ctx.fillRect(0, 0, FRAME_WIDTH, canvasSize);
      ctx.fillRect(canvasSize - FRAME_WIDTH, 0, FRAME_WIDTH, canvasSize);
    }

    // Draw user pixels (drawing layer)
    pixels.forEach((color, key) => {
      const [x, y] = key.split(',').map(Number);
      const FRAME_WIDTH = 4;
      if (x >= FRAME_WIDTH && x < canvasSize - FRAME_WIDTH && 
          y >= FRAME_WIDTH && y < canvasSize - FRAME_WIDTH) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    });

  }, [isOpen, pixels, layers, selectedFrame, canvasSize, getImageFromCache]);

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    setIsDownloading(true);
    
    try {
      // Create high-res version for download (4x scale)
      const scale = 4;
      const downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = canvasSize * scale;
      downloadCanvas.height = canvasSize * scale;
      
      const ctx = downloadCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.imageSmoothingEnabled = false;
      ctx.scale(scale, scale);
      ctx.drawImage(canvasRef.current, 0, 0);
      
      // Download the image
      const dataURL = downloadCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${nftData.name.replace(/[^a-zA-Z0-9]/g, '_')}_avatar.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Avatar downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMint = async () => {
    setIsMinting(true);
    setIpfsUrl(null);
    try {
      // Create high-res version for upload (4x scale)
      if (!canvasRef.current) throw new Error('No canvas to mint');
      const scale = 4;
      const uploadCanvas = document.createElement('canvas');
      uploadCanvas.width = canvasSize * scale;
      uploadCanvas.height = canvasSize * scale;
      const ctx = uploadCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.imageSmoothingEnabled = false;
      ctx.scale(scale, scale);
      ctx.drawImage(canvasRef.current, 0, 0);
      // Convert to blob
      const blob: Blob = await new Promise((resolve, reject) => {
        uploadCanvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to create blob')), 'image/png');
      });
      // Convert blob to File
      const file = new File([blob], `${nftData.name.replace(/[^a-zA-Z0-9]/g, '_')}_avatar.png`, { type: 'image/png' });
      // Upload to Lighthouse
      // @ts-ignore
      const buffer = await file.arrayBuffer();
      // @ts-ignore
      const response = await lighthouse.uploadBuffer(Buffer.from(buffer), apiKey);
      if (!response || !response.data || !response.data.Hash) {
        throw new Error('Failed to upload to Lighthouse');
      }
      const LIGHTHOUSE_GATEWAY = 'https://gateway.lighthouse.storage/ipfs/';
      const url = LIGHTHOUSE_GATEWAY + response.data.Hash;
      setIpfsUrl(url);
      // Save profile metadata to localStorage
      const profileMetadata = {
        username: nftData.name,
        description: nftData.description,
        image: url
      };
      localStorage.setItem('shitter.profile', JSON.stringify(profileMetadata));
      setMintComplete(true);
      toast.success('NFT image uploaded to IPFS!');
      setTimeout(() => {
        onClose();
        setMintComplete(false);
        setIsMinting(false);
      }, 4000);
    } catch (error) {
      console.error('Minting failed:', error);
      toast.error('Minting failed. Please try again.');
      setIsMinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-gray-900 border-gray-700 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <ImageIcon className="w-5 h-5 text-purple-400" />
              Export Profile Picture
            </CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
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
                <div className="inline-block p-4 bg-gray-800 rounded-lg border border-gray-600">
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-500 rounded"
                    style={{
                      width: '200px',
                      height: '200px',
                      imageRendering: 'pixelated'
                    }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">Your Avatar Design</p>
              </div>

              {/* Export Options */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleDownload}
                  loading={isDownloading}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? 'Downloading...' : 'Download PNG'}
                </Button>
                
                <Button
                  onClick={handleMint}
                  loading={isMinting}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Upload className="w-4 h-4" />
                  {isMinting ? 'Uploading...' : 'Upload to IPFS'}
                </Button>
              </div>

              {/* NFT Details (only shown when minting) */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Avatar Name
                  </label>
                  <input
                    type="text"
                    value={nftData.name}
                    onChange={(e) => setNftData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Enter avatar name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={nftData.description}
                    onChange={(e) => setNftData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none"
                    placeholder="Describe your avatar"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-purple-300">
                    <p className="font-medium mb-1">Export Options</p>
                    <p>Download as PNG for immediate use, or mint as NFT to own it on the blockchain.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Mint Successful!</h3>
              <p className="text-gray-400 mb-4">
                Your avatar has been uploaded to IPFS as an NFT image.
              </p>
              {ipfsUrl && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-left break-all">
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">IPFS URL:</span>
                      <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="text-green-400 underline">{ipfsUrl}</a>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-left">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Token:</span>
                    <span className="text-green-400 font-mono">Gx7k...9mN2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-emerald-400">Gorbchain</span>
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
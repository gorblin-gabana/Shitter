import { create } from 'zustand';

export interface PixelData {
  x: number;
  y: number;
  color: string;
  timestamp: number;
  userId?: string;
}

export interface FrameConfig {
  type: 'classic' | 'modern' | 'neon' | 'wooden' | 'digital';
  colors: string[];
  pattern: string;
}

export interface Frame {
  type: string;
  colors: string[];
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  color?: string;
  type: 'background' | 'face' | 'eyes' | 'smile' | 'frame';
  pixels: Map<string, string>;
  imageUrl?: string; // For PNG layers
}

export interface BackgroundOption {
  id: string;
  name: string;
  value: string;
  type: 'solid' | 'gradient';
}

export interface CanvasState {
  pixels: Map<string, string>;
  currentTool: 'pen' | 'eraser' | 'splatter';
  currentColor: string;
  brushSize: number;
  showGrid: boolean;
  isDrawing: boolean;
  canvasSize: number;
  history: PixelData[];
  username: string;
  selectedFrame: FrameConfig;
  availableFrames: FrameConfig[];
  logoDesigns: string[];
  layers: Layer[];
  activeLayer: string;
  backgroundOptions: BackgroundOption[];
  
  // Actions
  setPixel: (x: number, y: number, color: string) => void;
  clearPixel: (x: number, y: number) => void;
  setTool: (tool: 'pen' | 'eraser' | 'splatter') => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  toggleGrid: () => void;
  setIsDrawing: (drawing: boolean) => void;
  clearCanvas: () => void;
  exportCanvas: () => string;
  importCanvas: (data: string) => void;
  addToHistory: (pixel: PixelData) => void;
  setUsername: (username: string) => void;
  setFrame: (frame: FrameConfig) => void;
  splatterLogo: (centerX?: number, centerY?: number) => void;
  generateRandomArt: () => void;
  loadLogoDesigns: () => Promise<void>;
  setActiveLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  updateLayerOpacity: (layerId: string, opacity: number) => void;
  updateLayerColor: (layerId: string, color: string) => void;
  setPixelOnLayer: (layerId: string, x: number, y: number, color: string) => void;
  clearPixelOnLayer: (layerId: string, x: number, y: number) => void;
  loadLayerImage: (layerId: string, imageUrl: string) => void;
}

const CANVAS_SIZE = 200; // 200x200 grid
const MIN_BRUSH_SIZE = 1; // Minimum 1 grid unit
const MAX_BRUSH_SIZE = 10;

const DEFAULT_FRAMES: FrameConfig[] = [
  {
    type: 'classic',
    colors: ['#8B4513', '#A0522D', '#CD853F'],
    pattern: 'wood-grain'
  },
  {
    type: 'modern',
    colors: ['#2F2F2F', '#4F4F4F', '#6F6F6F'],
    pattern: 'metallic'
  },
  {
    type: 'neon',
    colors: ['#00FFFF', '#FF00FF', '#FFFF00'],
    pattern: 'glow'
  },
  {
    type: 'wooden',
    colors: ['#DEB887', '#F4A460', '#D2691E'],
    pattern: 'natural'
  },
  {
    type: 'digital',
    colors: ['#00FF00', '#0080FF', '#FF0080'],
    pattern: 'pixel'
  }
];

const backgroundOptions: BackgroundOption[] = [
  // Solid colors
  { id: 'dark', name: 'Dark Blue', value: '#0F172A', type: 'solid' },
  { id: 'black', name: 'Pure Black', value: '#000000', type: 'solid' },
  { id: 'gray', name: 'Dark Gray', value: '#1F2937', type: 'solid' },
  { id: 'purple', name: 'Deep Purple', value: '#1E1B4B', type: 'solid' },
  { id: 'green', name: 'Forest Green', value: '#064E3B', type: 'solid' },
  
  // Gradients
  { id: 'sunset', name: 'Sunset', value: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)', type: 'gradient' },
  { id: 'ocean', name: 'Ocean', value: 'linear-gradient(135deg, #667eea, #764ba2)', type: 'gradient' },
  { id: 'forest', name: 'Forest', value: 'linear-gradient(135deg, #134E5E, #71B280)', type: 'gradient' },
  { id: 'fire', name: 'Fire', value: 'linear-gradient(135deg, #FF512F, #DD2476)', type: 'gradient' },
  { id: 'space', name: 'Space', value: 'linear-gradient(135deg, #000428, #004e92)', type: 'gradient' },
  { id: 'aurora', name: 'Aurora', value: 'linear-gradient(135deg, #00c6ff, #0072ff)', type: 'gradient' }
];

const defaultLayers: Layer[] = [
  {
    id: 'background',
    name: 'Background',
    visible: true,
    opacity: 100,
    color: '#0F172A',
    type: 'background',
    pixels: new Map()
  },
  {
    id: 'face',
    name: 'Face',
    visible: true,
    opacity: 100,
    color: '#10B981',
    type: 'face',
    pixels: new Map(),
    imageUrl: '/face_1.png' // Default face image
  },
  {
    id: 'eyes',
    name: 'Eyes',
    visible: true,
    opacity: 100,
    color: '#000000',
    type: 'eyes',
    pixels: new Map(),
    imageUrl: '/face_2.png' // Default eyes image
  },
  {
    id: 'smile',
    name: 'Smile',
    visible: true,
    opacity: 100,
    color: '#EF4444',
    type: 'smile',
    pixels: new Map(),
    imageUrl: '/face_3.png' // Default smile image
  },
  {
    id: 'frame',
    name: 'Frame',
    visible: true,
    opacity: 100,
    type: 'frame',
    pixels: new Map()
  }
];

export const useCanvasStore = create<CanvasState>((set, get) => ({
  pixels: new Map(),
  currentTool: 'pen',
  currentColor: '#10B981',
  brushSize: MIN_BRUSH_SIZE,
  showGrid: true,
  isDrawing: false,
  canvasSize: CANVAS_SIZE,
  history: [],
  username: '',
  selectedFrame: DEFAULT_FRAMES[0],
  availableFrames: DEFAULT_FRAMES,
  logoDesigns: [],
  layers: defaultLayers,
  activeLayer: 'face',
  backgroundOptions,

  setPixel: (x, y, color) => {
    const { activeLayer, layers } = get();
    const key = `${x},${y}`;
    
    // Set pixel on active layer
    set(state => {
      const newLayers = state.layers.map(layer => {
        if (layer.id === activeLayer) {
          const newPixels = new Map(layer.pixels);
          newPixels.set(key, color);
          return { ...layer, pixels: newPixels };
        }
        return layer;
      });
      
      // Also update main pixels map for rendering
      const newPixels = new Map(state.pixels);
      newPixels.set(key, color);
      
      return { layers: newLayers, pixels: newPixels };
    });
    
    get().addToHistory({ 
      x, 
      y, 
      color, 
      timestamp: Date.now(),
      userId: get().username || 'anonymous'
    });
  },

  clearPixel: (x, y) => {
    const { activeLayer } = get();
    const key = `${x},${y}`;
    
    set(state => {
      const newLayers = state.layers.map(layer => {
        if (layer.id === activeLayer) {
          const newPixels = new Map(layer.pixels);
          newPixels.delete(key);
          return { ...layer, pixels: newPixels };
        }
        return layer;
      });
      
      // Also update main pixels map
      const newPixels = new Map(state.pixels);
      newPixels.delete(key);
      
      return { layers: newLayers, pixels: newPixels };
    });
    
    get().addToHistory({ 
      x, 
      y, 
      color: 'transparent', 
      timestamp: Date.now(),
      userId: get().username || 'anonymous'
    });
  },

  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set({ currentColor: color }),
  setBrushSize: (size) => set({ brushSize: Math.max(MIN_BRUSH_SIZE, Math.min(MAX_BRUSH_SIZE, size)) }),
  toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setUsername: (username) => set({ username }),
  setFrame: (frame) => set({ selectedFrame: frame }),

  clearCanvas: () => {
    set(state => ({
      pixels: new Map(),
      layers: state.layers.map(layer => ({
        ...layer,
        pixels: new Map()
      })),
      history: []
    }));
  },

  exportCanvas: () => {
    const { pixels, username, selectedFrame, layers } = get();
    return JSON.stringify({
      pixels: Array.from(pixels.entries()),
      username,
      selectedFrame,
      layers: layers.map(layer => ({
        ...layer,
        pixels: Array.from(layer.pixels.entries())
      })),
      timestamp: Date.now()
    }, null, 2);
  },

  importCanvas: (data) => {
    try {
      const parsed = JSON.parse(data);
      const pixelsMap = new Map<string, string>((parsed.pixels as [string, string][]) || []);
      const layersData = parsed.layers || [];
      
      const importedLayers = layersData.map((layerData: any) => ({
        ...layerData,
        pixels: new Map<string, string>((layerData.pixels as [string, string][]) || [])
      }));
      
      set({
        pixels: pixelsMap,
        username: parsed.username || '',
        selectedFrame: parsed.selectedFrame || DEFAULT_FRAMES[0],
        layers: importedLayers.length > 0 ? importedLayers : defaultLayers
      });
    } catch (error) {
      console.error('Failed to import canvas:', error);
    }
  },

  addToHistory: (pixel) => {
    set(state => ({
      history: [...state.history, pixel].slice(-2000) // Keep last 2000 actions
    }));
  },

  splatterLogo: (centerX = 100, centerY = 100) => {
    const { canvasSize } = get();
    const newPixels = new Map();
    
    // Clear canvas first
    set({ pixels: new Map() });
    
    // Create Gorbagana frog pattern
    const patterns = [
      // Head outline
      { x: 0, y: -15, color: '#10B981' },
      { x: -5, y: -10, color: '#10B981' },
      { x: 5, y: -10, color: '#10B981' },
      { x: -8, y: -5, color: '#10B981' },
      { x: 8, y: -5, color: '#10B981' },
      { x: -10, y: 0, color: '#10B981' },
      { x: 10, y: 0, color: '#10B981' },
      { x: -8, y: 5, color: '#10B981' },
      { x: 8, y: 5, color: '#10B981' },
      { x: -5, y: 10, color: '#10B981' },
      { x: 5, y: 10, color: '#10B981' },
      { x: 0, y: 15, color: '#10B981' },
      
      // Eyes
      { x: -3, y: -5, color: '#000000' },
      { x: 3, y: -5, color: '#000000' },
      
      // Mouth
      { x: -2, y: 2, color: '#EF4444' },
      { x: -1, y: 3, color: '#EF4444' },
      { x: 0, y: 3, color: '#EF4444' },
      { x: 1, y: 3, color: '#EF4444' },
      { x: 2, y: 2, color: '#EF4444' },
    ];
    
    patterns.forEach(({ x, y, color }) => {
      const pixelX = centerX + x;
      const pixelY = centerY + y;
      
      if (pixelX >= 2 && pixelX < canvasSize - 2 && pixelY >= 2 && pixelY < canvasSize - 2) {
        newPixels.set(`${pixelX},${pixelY}`, color);
        
        // Add some randomness
        for (let i = 0; i < 3; i++) {
          const randomX = pixelX + (Math.random() - 0.5) * 4;
          const randomY = pixelY + (Math.random() - 0.5) * 4;
          const roundedX = Math.round(randomX);
          const roundedY = Math.round(randomY);
          
          if (roundedX >= 2 && roundedX < canvasSize - 2 && roundedY >= 2 && roundedY < canvasSize - 2) {
            newPixels.set(`${roundedX},${roundedY}`, color);
          }
        }
      }
    });
    
    set({ pixels: newPixels });
  },

  generateRandomArt: () => {
    const { canvasSize } = get();
    const colors = ['#10B981', '#22D3EE', '#A855F7', '#F59E0B', '#EF4444', '#8B5CF6'];
    const newPixels = new Map();
    
    // Generate random pixels
    for (let i = 0; i < 500; i++) {
      const x = Math.floor(Math.random() * (canvasSize - 4)) + 2; // Avoid frame area
      const y = Math.floor(Math.random() * (canvasSize - 4)) + 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      newPixels.set(`${x},${y}`, color);
    }
    
    set({ pixels: newPixels });
  },

  loadLogoDesigns: async () => {
    // Load Gorb designs from public folder
    const designs = [
      'gorb-classic.png',
      'gorb-neon.png', 
      'gorb-pixel.png',
      'gorb-splatter.png'
    ];
    
    set({ logoDesigns: designs });
  },

  setActiveLayer: (layerId) => set({ activeLayer: layerId }),

  toggleLayerVisibility: (layerId) => {
    set(state => ({
      layers: state.layers.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    }));
  },

  updateLayerOpacity: (layerId, opacity) => {
    set(state => ({
      layers: state.layers.map(layer =>
        layer.id === layerId ? { ...layer, opacity } : layer
      )
    }));
  },

  updateLayerColor: (layerId, color) => {
    set(state => ({
      layers: state.layers.map(layer =>
        layer.id === layerId ? { ...layer, color } : layer
      )
    }));
  },

  setPixelOnLayer: (layerId, x, y, color) => {
    const key = `${x},${y}`;
    set(state => ({
      layers: state.layers.map(layer => {
        if (layer.id === layerId) {
          const newPixels = new Map(layer.pixels);
          newPixels.set(key, color);
          return { ...layer, pixels: newPixels };
        }
        return layer;
      })
    }));
  },

  clearPixelOnLayer: (layerId, x, y) => {
    const key = `${x},${y}`;
    set(state => ({
      layers: state.layers.map(layer => {
        if (layer.id === layerId) {
          const newPixels = new Map(layer.pixels);
          newPixels.delete(key);
          return { ...layer, pixels: newPixels };
        }
        return layer;
      })
    }));
  },

  loadLayerImage: (layerId, imageUrl) => {
    set(state => ({
      layers: state.layers.map(layer =>
        layer.id === layerId ? { ...layer, imageUrl } : layer
      )
    }));
  }
}));
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
  type: 'background' | 'face' | 'eyes' | 'smile' | 'drawing';
  pixels: Map<string, string>;
  imageUrl?: string; // For PNG layers
}

export interface BackgroundOption {
  id: string;
  name: string;
  value: string;
  type: 'solid' | 'gradient';
}

// Image cache for preventing flickering
const imageCache = new Map<string, HTMLImageElement>();

export interface CanvasState {
  pixels: Map<string, string>; // Drawing layer pixels (brush strokes)
  currentTool: 'pen' | 'eraser' | 'splatter' | 'stamp';
  currentColor: string;
  currentStamp: string; // Selected stamp design
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
  setTool: (tool: 'pen' | 'eraser' | 'splatter' | 'stamp') => void;
  setColor: (color: string) => void;
  setStamp: (stamp: string) => void;
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
  preloadImage: (url: string) => Promise<HTMLImageElement>;
  getImageFromCache: (url: string) => HTMLImageElement | null;
  replaceLayerImage: (layerType: 'face' | 'eyes' | 'smile', imageUrl: string) => void;
  placeStamp: (x: number, y: number, stampText: string, color: string) => void;
}

const CANVAS_SIZE = 200; // 200x200 grid
const MIN_BRUSH_SIZE = 1; // Minimum 1 grid unit
const MAX_BRUSH_SIZE = 10;

const DEFAULT_FRAMES: FrameConfig[] = [
  {
    type: 'classic',
    colors: ['#10b981', '#059669', '#047857'],
    pattern: 'solid'
  },
  {
    type: 'modern',
    colors: ['#fbbf24', '#f59e0b', '#d97706'],
    pattern: 'metallic'
  },
  {
    type: 'neon',
    colors: ['#60a5fa', '#06b6d4', '#0891b2'],
    pattern: 'glow'
  },
  {
    type: 'wooden',
    colors: ['#f472b6', '#9333ea', '#7c3aed'],
    pattern: 'wood-grain'
  },
  {
    type: 'digital',
    colors: ['#f87171', '#ea580c', '#dc2626'],
    pattern: 'digital'
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

// Proper 4-layer system: background, face, eyes, smile (in rendering order)
const defaultLayers: Layer[] = [
  {
    id: 'background',
    name: 'Background',
    visible: true,
    opacity: 1.0,
    color: '#0F172A',
    type: 'background',
    pixels: new Map()
  },
  {
    id: 'face',
    name: 'Face',
    visible: true,
    opacity: 1.0,
    type: 'face',
    pixels: new Map(),
    imageUrl: '/face/face_1.png'
  },
  {
    id: 'eyes',
    name: 'Eyes',
    visible: true,
    opacity: 1.0,
    type: 'eyes',
    pixels: new Map(),
    imageUrl: '/eyes/eyes_1.png'
  },
  {
    id: 'smile',
    name: 'Smile',
    visible: true,
    opacity: 1.0,
    type: 'smile',
    pixels: new Map(),
    imageUrl: undefined // No default smile image
  }
];

export const useCanvasStore = create<CanvasState>((set, get) => ({
  pixels: new Map(), // Drawing layer (topmost - for brush strokes/signatures)
  currentTool: 'pen',
  currentColor: '#10B981',
  currentStamp: 'GM', // Default stamp
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
  activeLayer: 'drawing', // Start with drawing layer active for brush strokes
  backgroundOptions,

  preloadImage: async (url: string) => {
    if (imageCache.has(url)) {
      return imageCache.get(url)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  },

  getImageFromCache: (url: string) => {
    return imageCache.get(url) || null;
  },

  replaceLayerImage: (layerType: 'face' | 'eyes' | 'smile', imageUrl: string) => {
    console.log('Replacing layer image:', layerType, 'with:', imageUrl);
    
    // Preload the image first to ensure it's available
    get().preloadImage(imageUrl).then(() => {
      console.log('Image preloaded successfully:', imageUrl);
      
      set(state => {
        const newLayers = state.layers.map(layer => 
          layer.type === layerType 
            ? { ...layer, imageUrl, pixels: new Map() } // Clear pixels when replacing image
            : layer
        );
        
        console.log('Updated layers:', newLayers);
        return { layers: newLayers };
      });
      
      // Force a re-render by updating a timestamp or similar
      set(state => ({ ...state }));
    }).catch(error => {
      console.error('Failed to preload image:', imageUrl, error);
    });
  },

  setPixel: (x, y, color) => {
    const { activeLayer } = get();
    const key = `${x},${y}`;
    
    if (activeLayer === 'drawing') {
      // Drawing layer - update main pixels map (topmost layer)
      set(state => {
        const newPixels = new Map(state.pixels);
        newPixels.set(key, color);
        return { pixels: newPixels };
      });
    } else {
      // Other layers - update specific layer
      set(state => {
        const newLayers = state.layers.map(layer => {
          if (layer.id === activeLayer) {
            const newPixels = new Map(layer.pixels);
            newPixels.set(key, color);
            return { ...layer, pixels: newPixels };
          }
          return layer;
        });
        return { layers: newLayers };
      });
    }
    
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
    
    if (activeLayer === 'drawing') {
      // Drawing layer - clear from main pixels map
      set(state => {
        const newPixels = new Map(state.pixels);
        newPixels.delete(key);
        return { pixels: newPixels };
      });
    } else {
      // Other layers - clear from specific layer
      set(state => {
        const newLayers = state.layers.map(layer => {
          if (layer.id === activeLayer) {
            const newPixels = new Map(layer.pixels);
            newPixels.delete(key);
            return { ...layer, pixels: newPixels };
          }
          return layer;
        });
        return { layers: newLayers };
      });
    }
    
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
  setStamp: (stamp) => set({ currentStamp: stamp }),
  setBrushSize: (size) => set({ brushSize: Math.max(MIN_BRUSH_SIZE, Math.min(MAX_BRUSH_SIZE, size)) }),
  toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setUsername: (username) => set({ username }),
  setFrame: (frame) => {
    console.log('Setting frame in store:', frame);
    set({ selectedFrame: frame });
    // Force immediate re-render by triggering a state change
    const currentState = get();
    set({ ...currentState, selectedFrame: { ...frame } });
  },

  clearCanvas: () => {
    set(state => ({
      pixels: new Map(), // Clear drawing layer
      layers: state.layers.map(layer => ({
        ...layer,
        pixels: new Map() // Clear all layer pixels
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
      const frameWidth = 4;
      const pixelX = centerX + x;
      const pixelY = centerY + y;
      
      if (pixelX >= frameWidth && pixelX < canvasSize - frameWidth && 
          pixelY >= frameWidth && pixelY < canvasSize - frameWidth) {
        newPixels.set(`${pixelX},${pixelY}`, color);
        
        // Add some randomness
        for (let i = 0; i < 3; i++) {
          const randomX = pixelX + (Math.random() - 0.5) * 4;
          const randomY = pixelY + (Math.random() - 0.5) * 4;
          const roundedX = Math.round(randomX);
          const roundedY = Math.round(randomY);
          
          if (roundedX >= frameWidth && roundedX < canvasSize - frameWidth && 
              roundedY >= frameWidth && roundedY < canvasSize - frameWidth) {
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
    
    // Generate random pixels in drawable area only
    for (let i = 0; i < 500; i++) {
      const frameWidth = 4;
      const x = Math.floor(Math.random() * (canvasSize - frameWidth * 2)) + frameWidth;
      const y = Math.floor(Math.random() * (canvasSize - frameWidth * 2)) + frameWidth;
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
    // Preload the image
    get().preloadImage(imageUrl);
  },

  placeStamp: (x, y, stampText, color) => {
    const { canvasSize } = get();
    const FRAME_WIDTH = 4;
    
    console.log('Placing stamp at:', x, y, 'with color:', color, 'stamp:', stampText);
    
    // Only place stamp in drawable area
    if (x < FRAME_WIDTH || x >= canvasSize - FRAME_WIDTH || 
        y < FRAME_WIDTH || y >= canvasSize - FRAME_WIDTH) {
      console.log('Stamp outside drawable area');
      return;
    }

    // Create a larger 5x5 stamp pattern for better visibility
    const stampSize = 5;
    const halfSize = Math.floor(stampSize / 2);
    
    set(state => {
      const newPixels = new Map(state.pixels);
      
      // Create a more visible stamp pattern
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        for (let dy = -halfSize; dy <= halfSize; dy++) {
          const pixelX = x + dx;
          const pixelY = y + dy;
          
          if (pixelX >= FRAME_WIDTH && pixelX < canvasSize - FRAME_WIDTH && 
              pixelY >= FRAME_WIDTH && pixelY < canvasSize - FRAME_WIDTH) {
            // Create different patterns based on position
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= halfSize) {
              newPixels.set(`${pixelX},${pixelY}`, color);
            }
          }
        }
      }
      
      console.log('Stamp placed, pixels updated:', newPixels.size);
      return { pixels: newPixels };
    });
    
    get().addToHistory({ 
      x, 
      y, 
      color, 
      timestamp: Date.now(),
      userId: get().username || 'anonymous'
    });
  }
}));
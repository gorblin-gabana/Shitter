# 🐸 Gorbchain Avatar Creator

A pixel art avatar creation tool for the Shitter social media platform on Gorbchain blockchain. Create, customize, and mint unique profile pictures with built-in wallet integration and NFT capabilities.

![Gorbchain Avatar Creator](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/React-18.0+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Solana](https://img.shields.io/badge/Solana-Wallet%20Adapter-orange)

## ✨ Features

### 🎨 **Avatar Creation**
- **4-Layer System**: Background, Face, Eyes, Smile layers for complete customization
- **Dynamic Image Loading**: Auto-picks from `/public/face/`, `/public/eyes/`, and `/public/smile/` folders
- **Real-time Preview**: See changes instantly as you customize your avatar
- **Frame Selection**: 5 unique frame designs with enhanced visual effects
- **Drawing Tools**: Pen, Eraser, Splatter, and Stamp tools for personal touches

### 🖌️ **Drawing & Customization**
- **Pixel-Perfect Drawing**: 200x200 pixel canvas with grid overlay
- **Brush Size Control**: Adjustable brush sizes from 1-10 pixels
- **Color Palette**: 36-color palette with custom color picker
- **Stamp System**: 36 crypto/Gen Z stickers (GM, HODL, WAGMI, etc.)
- **Layer Management**: Toggle visibility and adjust opacity for each layer

### 💰 **Blockchain Integration**
- **Multi-Wallet Support**: TrashPack (official), Phantom, Solflare, Backpack
- **GORB Token Integration**: In-app wallet with GORB token balance
- **NFT Minting**: Export high-resolution PNG and mint as NFT
- **Transaction History**: Track all blockchain interactions

### 🎯 **Enhanced Frames**
- **Classic**: Double border with rounded corners
- **Gold**: Sharp edges with enhanced shadows
- **Ocean**: Glow effect with multiple gradient layers
- **Sunset**: Dashed border pattern
- **Fire**: Sharp pixelated border with digital noise

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Solana wallet (TrashPack recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/gorbpfp.git
   cd gorbpfp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🛠️ Project Structure

```
gorbpfp/
├── public/
│   ├── face/          # Face layer images (12 total)
│   ├── eyes/          # Eyes layer images (14 total)  
│   ├── smile/         # Smile layer images (14 total)
│   ├── gorb_logo.png  # Main logo
│   └── trashpack.png  # TrashPack wallet icon
├── src/
│   ├── components/    # React components
│   │   ├── ProfilePage.tsx      # Main avatar creator
│   │   ├── PixelCanvas.tsx      # Drawing canvas
│   │   ├── Header.tsx           # Navigation header
│   │   └── ui/                  # Reusable UI components
│   ├── stores/       # Zustand state management
│   │   ├── canvasStore.ts       # Canvas & drawing state
│   │   └── walletStore.ts       # Wallet & blockchain state
│   └── services/     # External services
└── injected.js       # TrashPack wallet integration
```

## 🎨 Usage Guide

### Creating Your Avatar

1. **Connect Wallet**
   - Click "Connect" and choose TrashPack (recommended) or other Solana wallet
   - Your wallet address and GORB balance will appear

2. **Customize Layers**
   - **Background**: Choose solid colors or gradients
   - **Face**: Select from 12 face styles
   - **Eyes**: Pick from 14 eye designs  
   - **Smile**: Choose from 14 smile options

3. **Add Personal Touches**
   - Use **Pen tool** for freehand drawing
   - **Eraser** to remove unwanted pixels
   - **Splatter** for random effects
   - **Stamp** to add crypto stickers (GM, HODL, WAGMI, etc.)

4. **Select Frame**
   - Choose from 5 enhanced frame designs
   - Each frame has unique visual effects and patterns

5. **Export & Mint**
   - **Download PNG**: High-resolution 800x800px export
   - **Mint NFT**: Create blockchain NFT of your avatar

### Drawing Tools

| Tool | Description | Usage |
|------|-------------|-------|
| **Pen** | Freehand pixel drawing | Click and drag to draw |
| **Eraser** | Remove pixels | Click and drag to erase |
| **Splatter** | Random pixel placement | Click for spray effect |
| **Stamp** | Place crypto stickers | Click to place selected stamp |

### Stamp Collection

**Crypto Terms**: GM, GN, GORB, HODL, WAGMI, NGMI, LFG, DEGEN, BTFD

**Trading**: 💎🙌 (Diamond Hands), 📄🙌 (Paper Hands), BULLISH, BEARISH

**Gen Z Slang**: BASED, COPE, SALTY, REKT, NO CAP, FACTS, SLAY, VIBE, BET

**Emojis**: 💎🚀🔥✅❌🌕🏎️📈📉🦍💪😎👑✨

## 🔧 Technical Details

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Blockchain**: Solana Web3.js
- **Wallet Integration**: Solana Wallet Adapter

### Canvas System
- **Resolution**: 200x200 pixels
- **Frame Width**: 4 pixels (192x192 drawable area)
- **Layer Order**: Background → Face → Eyes → Smile → Drawing
- **Image Caching**: Prevents flickering during layer changes

### Wallet Integration
- **TrashPack**: Official wallet with custom injection
- **Multi-Wallet**: Phantom, Solflare, Backpack support
- **Auto-Connect**: Remembers wallet connection state
- **Balance Display**: Real-time GORB token balance

## 🎯 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Adding New Assets

1. **Face Images**: Add PNG files to `/public/face/`
2. **Eye Images**: Add PNG files to `/public/eyes/`  
3. **Smile Images**: Add PNG files to `/public/smile/`
4. **Frames**: Update `frameOptions` in `ProfilePage.tsx`
5. **Stamps**: Add to `stampDesigns` array in `ProfilePage.tsx`

### State Management

**Canvas Store** (`src/stores/canvasStore.ts`)
- Drawing tools and pixel data
- Layer management and image caching
- Frame selection and rendering

**Wallet Store** (`src/stores/walletStore.ts`)
- Wallet connection state
- GORB token balance
- Transaction history

## 🌐 Blockchain Integration

### Supported Networks
- **Mainnet**: Gorbchain mainnet
- **RPC Endpoint**: `https://rpc.gorbchain.xyz`

### Token Integration
- **GORB Token**: Native token for transactions
- **In-App Wallet**: Simulated wallet for testing
- **NFT Minting**: Export and mint avatars as NFTs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Maintain responsive design
- Add comprehensive error handling
- Include console logging for debugging

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Gorbchain Team**: For blockchain infrastructure
- **Solana Foundation**: For wallet adapter libraries
- **React Community**: For excellent documentation and tools
- **Tailwind CSS**: For the utility-first CSS framework

## 📞 Support

- **Discord**: Join our community server
- **Twitter**: Follow [@Gorbchain](https://twitter.com/Gorbchain)
- **Website**: Visit [gorbchain.xyz](https://gorbchain.xyz)

---

**Built with ❤️ for the Gorbchain community**

*Express freely, create endlessly, mint boldly.* 
import React, { useEffect, useRef, useState } from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
  className?: string;
}

const sizeConfig = {
  small: {
    logoSize: 'w-8 h-8',
    textSize: 'text-2xl',
    gap: 'gap-2'
  },
  medium: {
    logoSize: 'w-12 h-12',
    textSize: 'text-4xl',
    gap: 'gap-3'
  },
  large: {
    logoSize: 'w-16 h-16',
    textSize: 'text-5xl',
    gap: 'gap-4'
  }
};

export function Logo({ size = 'medium', showAnimation = false, className = '' }: LogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const config = sizeConfig[size];

  useEffect(() => {
    if (!showAnimation || !containerRef.current) return;

    const container = containerRef.current;
    const logoElement = container.querySelector('img');
    const textElement = container.querySelector('h1');
    
    const createRotatingRectangle = () => {
      // Create portal rectangle container (wider for better effect)
      const portalContainer = document.createElement('div');
      portalContainer.style.cssText = `
        position: absolute;
        top: 50%;
        left: -120px;
        width: 120px;
        height: 100%;
        transform: translateY(-50%);
        perspective: 600px;
        z-index: 10;
        pointer-events: none;
        transition: all 4s cubic-bezier(0.25, 0.1, 0.25, 1);
      `;

      // Create the actual 3D rectangle frame with wobble capability
      const rectangle = document.createElement('div');
      rectangle.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        transition: all 4s cubic-bezier(0.25, 0.1, 0.25, 1);
        filter: drop-shadow(0 0 15px rgba(34, 197, 94, 0.3));
      `;

      // Create front face (main portal frame) - transparent center with borders
      const frontFace = document.createElement('div');
      frontFace.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        border: 6px solid rgba(34, 197, 94, 0.8);
        border-radius: 8px;
        box-shadow: 
          0 0 25px rgba(34, 197, 94, 0.4),
          inset 0 0 15px rgba(34, 197, 94, 0.2),
          0 0 40px rgba(34, 197, 94, 0.2);
        transform: translateZ(0px);
      `;

      // Create side face (gives 3D depth) - frame edge
      const sideFace = document.createElement('div');
      sideFace.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        width: 12px;
        height: 100%;
        background: linear-gradient(180deg, 
          rgba(16, 185, 129, 0.7) 0%, 
          rgba(34, 197, 94, 0.9) 50%, 
          rgba(16, 185, 129, 0.7) 100%
        );
        border: 2px solid rgba(34, 197, 94, 0.6);
        border-left: none;
        transform: rotateY(90deg) translateZ(6px);
        transform-origin: left center;
      `;

      // Create top face - frame edge
      const topFace = document.createElement('div');
      topFace.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 12px;
        background: linear-gradient(90deg, 
          rgba(6, 182, 212, 0.5) 0%, 
          rgba(34, 197, 94, 0.8) 50%, 
          rgba(6, 182, 212, 0.5) 100%
        );
        border: 2px solid rgba(34, 197, 94, 0.6);
        border-bottom: none;
        transform: rotateX(90deg) translateZ(6px);
        transform-origin: center top;
      `;

      // Create bottom face - frame edge
      const bottomFace = document.createElement('div');
      bottomFace.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 12px;
        background: linear-gradient(90deg, 
          rgba(6, 182, 212, 0.5) 0%, 
          rgba(34, 197, 94, 0.8) 50%, 
          rgba(6, 182, 212, 0.5) 100%
        );
        border: 2px solid rgba(34, 197, 94, 0.6);
        border-top: none;
        transform: rotateX(-90deg) translateZ(6px);
        transform-origin: center bottom;
      `;

      rectangle.appendChild(frontFace);
      rectangle.appendChild(sideFace);
      rectangle.appendChild(topFace);
      rectangle.appendChild(bottomFace);
      portalContainer.appendChild(rectangle);

      container.style.position = 'relative';
      container.style.overflow = 'visible';
      container.appendChild(portalContainer);

      // Initially hide logo and text with clip-path for National Geographic effect
      if (logoElement) {
        logoElement.style.opacity = '0';
        logoElement.style.clipPath = 'inset(0 100% 0 0)';
        logoElement.style.transition = 'all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
      }
      if (textElement) {
        textElement.style.opacity = '0';
        textElement.style.clipPath = 'inset(0 100% 0 0)';
        textElement.style.transition = 'all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
      }



      const runAnimation = () => {
        setIsAnimating(true);
        
        // Reset portal position and rotation (wide portal view)
        portalContainer.style.left = '-120px';
        portalContainer.style.width = '120px';
        rectangle.style.transform = 'rotateY(0deg)';
        rectangle.style.animation = 'none';
        
        // Hide content initially with clip-path
        if (logoElement) {
          logoElement.style.opacity = '0';
          logoElement.style.clipPath = 'inset(0 100% 0 0)';
        }
        if (textElement) {
          textElement.style.opacity = '0';
          textElement.style.clipPath = 'inset(0 100% 0 0)';
        }

        // Phase 1: Portal appearance - 1s
        setTimeout(() => {
          rectangle.style.transform = 'rotateY(75deg)';
          portalContainer.style.width = '25px';
        }, 800);

        // Phase 2: Portal movement to dots position - 3s
        setTimeout(() => {
          // Find the dots container position to stop portal there
          const dotsContainer = container.querySelector('.flex.flex-col.gap-1') as HTMLElement;
          const dotsPosition = dotsContainer ? dotsContainer.offsetLeft + dotsContainer.offsetWidth / 2 : container.offsetWidth;
          portalContainer.style.left = `${dotsPosition - 12.5}px`; // Center portal on dots
          
          // National Geographic style reveal - logo appears as portal passes over it
          setTimeout(() => {
            if (logoElement) {
              logoElement.style.opacity = '1';
              logoElement.style.clipPath = 'inset(0 0% 0 0)';
            }
          }, 800);
          
          // Text appears as portal continues moving
          setTimeout(() => {
            if (textElement) {
              textElement.style.opacity = '1';
              textElement.style.clipPath = 'inset(0 0% 0 0)';
            }
          }, 1600);
        }, 1800);

        // Phase 3: Content display hold - 2s
        setTimeout(() => {
          // Content is fully visible, portal stopped at dots
        }, 5300);

        // Phase 4: Reverse portal appears from right - 1s
        setTimeout(() => {
          const dotsContainer = container.querySelector('.flex.flex-col.gap-1') as HTMLElement;
          const dotsPosition = dotsContainer ? dotsContainer.offsetLeft + dotsContainer.offsetWidth / 2 : container.offsetWidth;
          portalContainer.style.left = `${dotsPosition - 12.5}px`; // Start at dots position
          portalContainer.style.width = '25px';
          rectangle.style.transform = 'rotateY(-75deg)';
        }, 7300);

        // Phase 5: Reverse portal moves left hiding content - 3s
        setTimeout(() => {
          portalContainer.style.left = '-120px';
          
          // Hide text first as reverse portal passes over it (National Geographic style)
          setTimeout(() => {
            if (textElement) {
              textElement.style.opacity = '0';
              textElement.style.clipPath = 'inset(0 100% 0 0)';
            }
          }, 800);
          
          // Hide logo as reverse portal continues moving
          setTimeout(() => {
            if (logoElement) {
              logoElement.style.opacity = '0';
              logoElement.style.clipPath = 'inset(0 100% 0 0)';
            }
          }, 1600);
        }, 8300);

        // Phase 6: Portal disappears - 1s
        setTimeout(() => {
          rectangle.style.transform = 'rotateY(-90deg)';
          portalContainer.style.width = '0px';
          
          // Complete cycle
          setTimeout(() => {
            setIsAnimating(false);
          }, 1000);
        }, 12300);
      };

      // Start first animation
      setTimeout(runAnimation, 500);

      // Loop every 14 seconds (optimized cycle with precise timing)
      const interval = setInterval(runAnimation, 14000);

      return () => {
        clearInterval(interval);
        if (container.contains(portalContainer)) {
          container.removeChild(portalContainer);
        }
        // Restore content visibility and remove clip-path
        if (logoElement) {
          logoElement.style.opacity = '1';
          logoElement.style.clipPath = 'none';
        }
        if (textElement) {
          textElement.style.opacity = '1';
          textElement.style.clipPath = 'none';
        }
      };
    };

    const cleanup = createRotatingRectangle();
    return cleanup;
  }, [showAnimation]);

  return (
    <div 
      ref={containerRef}
      className={`flex items-center ${config.gap} ${className}`}
    >
      {/* Logo Image */}
      <div className={`${config.logoSize} flex-shrink-0`}>
        <img 
          src="/logo.png" 
          alt="Shitter Logo" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Brand Text */}
      <div className="flex items-center gap-2">
        <h1 className={`${config.textSize} font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent`}>
          Shitter
        </h1>
        
        {/* Animated dots */}
        <div className="flex flex-col gap-1">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
} 
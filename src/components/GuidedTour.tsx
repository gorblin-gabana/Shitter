import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetId: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  spotlight?: boolean;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Shitter! 🚀',
    description: 'Your decentralized, uncensored social platform. Let\'s explore the key features that make this platform special.',
    targetId: 'tour-channels',
    position: 'right',
    spotlight: true
  },
      {
      id: 'tribes',
      title: 'Community Tribes',
      description: 'Browse different topic tribes like Discord. Each tribe has its own community and focused discussions. No algorithmic feed manipulation here!',
      targetId: 'tour-channels',
    position: 'right'
  },
  {
    id: 'profile',
    title: 'Your Pixel Art Profile',
    description: 'Click "Create Avatar" or the "Profile" button in the sidebar to access the avatar creator. Create unique NFTs as your profile picture with limited edition frames!',
    targetId: 'tour-profile',
    position: 'right'
  },
  {
    id: 'compose',
    title: 'Uncensored Posting',
    description: 'Post whatever you want without fear of censorship. Your thoughts, your voice, your freedom. Character limit keeps things concise.',
    targetId: 'tour-compose',
    position: 'bottom'
  },
  {
    id: 'feed',
    title: 'Community-Driven Feed',
    description: 'Real posts from real people in your chosen channel. No forced content, no hidden algorithms - just authentic community interaction.',
    targetId: 'tour-feed',
    position: 'top'
  },
  {
    id: 'messaging',
    title: 'Encrypted Private Messages',
    description: 'Send end-to-end encrypted messages that stay truly private. Your conversations are secured by blockchain technology.',
    targetId: 'tour-messaging',
    position: 'left'
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🎉',
          description: 'You\'ve completed the tour! Start posting, join tribes, create your pixel art, and connect with the uncensored community.',
    targetId: 'tour-feed',
    position: 'top',
    spotlight: true
  }
];

interface GuidedTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function GuidedTour({ isActive, onComplete, onSkip }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const step = tourSteps[currentStep];
    const element = document.getElementById(step.targetId);
    setHighlightedElement(element);

    if (element) {
      // Add highlight class
      element.classList.add('tour-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      if (element) {
        element.classList.remove('tour-highlight');
      }
    };
  }, [currentStep, isActive]);

  if (!isActive) return null;

  const currentTourStep = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTooltipPosition = () => {
    if (!highlightedElement) return { top: '50%', left: '50%' };

    const rect = highlightedElement.getBoundingClientRect();
    const position = currentTourStep.position;

    switch (position) {
      case 'right':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 20}px`,
          transform: 'translateY(-50%)'
        };
      case 'left':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - 320}px`,
          transform: 'translateY(-50%)'
        };
      case 'top':
        return {
          top: `${rect.top - 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)'
        };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/70 z-40" />
      
      {/* Spotlight effect for highlighted element */}
      {highlightedElement && currentTourStep.spotlight && (
        <div 
          className="fixed z-45 pointer-events-none"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 10,
            left: highlightedElement.getBoundingClientRect().left - 10,
            width: highlightedElement.getBoundingClientRect().width + 20,
            height: highlightedElement.getBoundingClientRect().height + 20,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.5)',
            borderRadius: '12px'
          }}
        />
      )}

      {/* Tour tooltip */}
      <div
        className="fixed z-50 bg-gray-900 border border-green-500/30 rounded-xl shadow-2xl p-6 max-w-sm"
        style={getTooltipPosition()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium text-sm">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-white font-bold text-lg mb-2">
          {currentTourStep.title}
        </h3>
        <p className="text-gray-300 text-sm leading-relaxed mb-6">
          {currentTourStep.description}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-2">
            <button
              onClick={onSkip}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              {isLastStep ? 'Complete' : 'Next'}
              {!isLastStep && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* CSS for highlighting */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 45;
          border-radius: 12px;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.2) !important;
        }
      `}</style>
    </>
  );
} 
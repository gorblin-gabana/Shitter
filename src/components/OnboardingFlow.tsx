import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Zap, Shield, Coins, ArrowRight, ArrowLeft, CheckCircle, Info, Wallet, Users, MessageCircle, Heart, Share2, ThumbsUp, ThumbsDown, AlertCircle, Eye, EyeOff, Lock, User, PenTool } from 'lucide-react';
import { useWalletStore } from '../stores/walletStore';
import { inAppWalletService } from '../services/sessionWalletService';
import { Logo } from './ui/Logo';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'goodshits-intro' | 'economics' | 'actions' | 'username' | 'signature' | 'in-app-wallet' | 'creating' | 'complete';

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { publicKey, signMessage } = useWallet();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [username, setUsername] = useState('');
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  

  // Auto-advance to session wallet creation if user has already seen intro
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('shitter-onboarding-intro');
    if (hasSeenIntro && currentStep === 'welcome') {
      setCurrentStep('in-app-wallet');
    }
  }, [currentStep]);

  const handleSignMessage = async () => {
    if (!publicKey || !signMessage) {
      setError('Wallet not connected properly');
      return;
    }

    setIsSigningMessage(true);
    setError('');

    try {
      const message = `Create username: ${username}\nSign to prove ownership of this wallet and generate your in-app wallet.\nTimestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);
      
      console.log('✅ Message signed successfully');
      
      // Move to next step
      setCurrentStep('in-app-wallet');
    } catch (error) {
      console.error('Failed to sign message:', error);
      setError((error as Error).message || 'Failed to sign message');
    } finally {
      setIsSigningMessage(false);
    }
  };

  const handleCreateInAppWallet = async () => {
    if (!publicKey) {
      setError('Wallet not connected properly');
      return;
    }

    if (pin.length < 4) {
      setError('PIN must be at least 4 characters');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsCreatingWallet(true);
    setCurrentStep('creating');
    setError('');

    try {
      // Create in-app wallet with PIN
      await inAppWalletService.createInAppWallet(publicKey.toString(), pin);
      
      // Mark onboarding as completed
      localStorage.setItem('shitter-onboarding-completed', 'true');
      localStorage.setItem('shitter-onboarding-intro', 'true');
      
      setCurrentStep('complete');
      
      // Auto-complete after showing success
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error) {
      console.error('Failed to create in-app wallet:', error);
      setError((error as Error).message || 'Failed to create in-app wallet');
      setCurrentStep('in-app-wallet');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const nextStep = () => {
    const steps: OnboardingStep[] = ['welcome', 'goodshits-intro', 'economics', 'actions', 'username', 'signature', 'in-app-wallet'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      if (currentStep === 'signature') {
        handleSignMessage();
      } else {
        setCurrentStep(steps[currentIndex + 1]);
      }
    } else if (currentStep === 'in-app-wallet') {
      handleCreateInAppWallet();
    }
  };

  const prevStep = () => {
    const steps: OnboardingStep[] = ['welcome', 'goodshits-intro', 'economics', 'actions', 'username', 'signature', 'in-app-wallet'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const skipIntro = () => {
    localStorage.setItem('shitter-onboarding-intro', 'true');
    setCurrentStep('in-app-wallet');
  };

  const handlePinChange = (value: string, isConfirm = false) => {
    // Allow only alphanumeric characters for PIN
    const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
    
    if (isConfirm) {
      setConfirmPin(cleanValue);
    } else {
      setPin(cleanValue);
    }
    
    if (error) setError('');
  };

  if (currentStep === 'creating') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-white">
        <div className="w-full max-w-md mx-auto text-center">
          <Logo size="large" showAnimation={true} />
          <div className="mt-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Creating Your In-App Wallet</h2>
            <p className="text-gray-400">Generating your secure in-app wallet with your PIN...</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-white">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to Shitter!</h2>
          <p className="text-gray-400 mb-6">Your in-app wallet has been created successfully. You're now ready to start sharing uncensored content!</p>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 mb-6">
            <div className="text-sm text-gray-300">
              <div className="flex justify-between mb-2">
                <span>Starting Balance:</span>
                <span className="text-yellow-400 font-semibold">100 GoodShits</span>
              </div>
              <div className="text-xs text-gray-500">
                Equal to 0.01 GORB - enough to start interacting!
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-white overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto my-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Setup Progress</span>
            <span className="text-sm text-gray-400">
              {currentStep === 'welcome' ? '1' : currentStep === 'goodshits-intro' ? '2' : currentStep === 'economics' ? '3' : currentStep === 'actions' ? '4' : currentStep === 'username' ? '5' : currentStep === 'signature' ? '6' : '7'}/7
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${
                  currentStep === 'welcome' ? 14 : 
                  currentStep === 'goodshits-intro' ? 28 : 
                  currentStep === 'economics' ? 42 : 
                  currentStep === 'actions' ? 57 : 
                  currentStep === 'username' ? 71 :
                  currentStep === 'signature' ? 85 : 100
                }%` 
              }}
            />
          </div>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-8">
          {currentStep === 'welcome' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Logo size="large" showAnimation={true} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Welcome to Shitter</h1>
              <p className="text-xl text-gray-300 mb-6">The only truly uncensored social platform</p>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                  <div className="text-2xl mb-2">🔒</div>
                  <h3 className="text-green-400 font-semibold mb-1">Encrypted</h3>
                  <p className="text-gray-400 text-sm">End-to-end privacy</p>
                </div>
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                  <div className="text-2xl mb-2">🚫</div>
                  <h3 className="text-red-400 font-semibold mb-1">Uncensored</h3>
                  <p className="text-gray-400 text-sm">No limits on speech</p>
                </div>
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="text-yellow-400 font-semibold mb-1">Lightning Fast</h3>
                  <p className="text-gray-400 text-sm">Instant interactions</p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <p className="text-blue-300 text-sm">
                  Connected wallet: <span className="font-mono">{publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={skipIntro}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  Skip Tutorial
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'goodshits-intro' && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Meet GoodShits</h2>
                <p className="text-gray-400">Your social currency on Gorbchain</p>
              </div>

              <div className="space-y-6">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                  <h3 className="text-yellow-400 font-semibold text-lg mb-3">What are GoodShits?</h3>
                  <p className="text-gray-300 mb-4">
                    GoodShits (GS) are the native token units of Gorbchain that power all social interactions on Shitter. 
                    Think of them as your "social energy" - every like, share, comment, and post costs GoodShits.
                  </p>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span className="text-white font-medium">1 GORB = 10,000 GoodShits</span>
                    </div>
                    <p className="text-gray-400 text-sm">You'll start with 100 GoodShits (0.01 GORB) to begin interacting!</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                    <div className="text-green-400 mb-2">💰 Earn GoodShits</div>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Receive likes and shares</li>
                      <li>• Quality content rewards</li>
                      <li>• Community engagement</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                    <div className="text-orange-400 mb-2">⚡ Spend GoodShits</div>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Like posts (1-2 GS)</li>
                      <li>• Share content (2-3 GS)</li>
                      <li>• Comment (3-4 GS)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'economics' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Token Economics</h2>
                <p className="text-gray-400">Understanding fees and rewards</p>
              </div>

              <div className="space-y-4 max-h-80 overflow-y-auto">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <h3 className="text-green-400 font-semibold text-lg mb-3">Zero Network Fees</h3>
                  <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">User Pays:</span>
                      <span className="text-green-400 font-bold">Base Cost Only</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      All network fees are covered by the platform. Users only pay the base interaction costs.
                    </p>
                  </div>
                  
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <h4 className="text-white font-medium mb-2">Example Transaction:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Like a post:</span>
                        <span className="text-white">1 GS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Network fees:</span>
                        <span className="text-green-400">FREE</span>
                      </div>
                      <div className="border-t border-gray-700 pt-2 flex justify-between font-semibold">
                        <span className="text-white">Total cost:</span>
                        <span className="text-green-400">1 GS</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <h3 className="text-blue-400 font-semibold text-lg mb-3">Earning Rewards</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-gray-800/30 rounded-lg p-3 flex items-center gap-3">
                      <Heart className="w-5 h-5 text-red-400" />
                      <div>
                        <div className="text-white font-medium">Quality Content</div>
                        <div className="text-gray-400 text-sm">Earn GS when people engage with your posts</div>
                      </div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3 flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-white font-medium">Community Building</div>
                        <div className="text-gray-400 text-sm">Get rewards for building active communities</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'actions' && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Social Actions & Costs</h2>
                <p className="text-gray-400">Every interaction has a cost - here's what you need to know</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <ThumbsUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Like</div>
                      <div className="text-green-400 text-sm font-mono">1 GS</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">No network fees</div>
                </div>

                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Share</div>
                      <div className="text-blue-400 text-sm font-mono">2 GS</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">No network fees</div>
                </div>

                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <ThumbsUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Good Shit</div>
                      <div className="text-purple-400 text-sm font-mono">2 GS</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">No network fees</div>
                </div>

                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <ThumbsDown className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Bad Shit</div>
                      <div className="text-red-400 text-sm font-mono">1 GS</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">No network fees</div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-yellow-400 font-semibold mb-1">Starting Balance</h3>
                    <p className="text-gray-300 text-sm">
                      You'll receive <span className="text-yellow-400 font-semibold">100 GoodShits</span> to start with - 
                      enough for 100 likes or 50 shares. Earn more by creating engaging content!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Create Username <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'username' && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Choose Your Username</h2>
                <p className="text-gray-400">This will be your unique identity on Shitter</p>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <h3 className="text-blue-400 font-semibold">Secured on Blockchain</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">
                    Your username will be minted as an NFT, giving you true ownership of your digital identity.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <div className="text-gray-400 mb-1">Length</div>
                      <div className="text-white font-medium">3-32 characters</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <div className="text-gray-400 mb-1">Allowed</div>
                      <div className="text-white font-medium">a-z, 0-9, _</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enter Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="satoshi_420"
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    maxLength={32}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-500">{username.length}/32 characters</div>
                    {username.length >= 3 && (
                      <div className="text-xs text-green-400">✓ Valid username</div>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-medium text-sm">Important</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Choose carefully! Usernames are permanent and cannot be changed once minted.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!username || username.length < 3}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'signature' && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PenTool className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Sign Account Creation</h2>
                <p className="text-gray-400">Sign a message to prove ownership and generate your secure wallet</p>
              </div>

              <div className="space-y-6">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-purple-400 font-semibold text-lg mb-4">Cryptographic Signature</h3>
                  <p className="text-gray-300 mb-4">
                    We'll ask you to sign a message with your wallet. This signature will be used to:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-800/30 rounded-lg p-3 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="text-white font-medium text-sm">Prove Ownership</div>
                        <div className="text-gray-400 text-xs">Verify you control this wallet</div>
                      </div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3 flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-white font-medium text-sm">Generate Wallet</div>
                        <div className="text-gray-400 text-xs">Create your deterministic in-app wallet</div>
                      </div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3 flex items-center gap-3">
                      <User className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-white font-medium text-sm">Mint Username</div>
                        <div className="text-gray-400 text-xs">Register '{username}' on the blockchain</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-yellow-400 font-semibold mb-1">No Transaction Fees</h3>
                      <p className="text-gray-300 text-sm">
                        This signature is free and doesn't send any transaction to the blockchain. 
                        It's only used to generate your secure in-app wallet deterministically.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <div className="text-red-400 text-sm">{error}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={prevStep}
                  disabled={isSigningMessage}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={isSigningMessage}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSigningMessage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <PenTool className="w-4 h-4" />
                      Sign Message
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'in-app-wallet' && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Secure Your In-App Wallet</h2>
                <p className="text-gray-400">Final step - add a PIN to your deterministic wallet for fast transactions</p>
              </div>

              <div className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                  <h3 className="text-green-400 font-semibold text-lg mb-4">What is an In-App Wallet?</h3>
                  <p className="text-gray-300 mb-4">
                    An in-app wallet is a persistent, secure wallet that enables lightning-fast social interactions 
                    without requiring external wallet approval for every action. It's generated deterministically from your 
                    connected wallet address and a secure PIN you create.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <Shield className="w-5 h-5 text-green-400 mb-2" />
                      <div className="text-white font-medium text-sm">Secure</div>
                      <div className="text-gray-400 text-xs">Generated from your wallet</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <Zap className="w-5 h-5 text-yellow-400 mb-2" />
                      <div className="text-white font-medium text-sm">Fast</div>
                      <div className="text-gray-400 text-xs">No popups for each action</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Create PIN (4+ characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={pin}
                        onChange={(e) => handlePinChange(e.target.value)}
                        placeholder="Enter your PIN"
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        maxLength={20}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm PIN
                    </label>
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={confirmPin}
                      onChange={(e) => handlePinChange(e.target.value, true)}
                      placeholder="Confirm your PIN"
                      className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      maxLength={20}
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Info className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-400 font-semibold">Important</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Your PIN will be used to recreate your in-app wallet each time you log in. 
                      Make sure it's something you can remember but others can't guess.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <div className="text-red-400 text-sm">{error}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={prevStep}
                  disabled={isCreatingWallet}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleCreateInAppWallet}
                  disabled={!pin || !confirmPin || pin !== confirmPin || pin.length < 4 || isCreatingWallet}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingWallet ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Create In-App Wallet
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
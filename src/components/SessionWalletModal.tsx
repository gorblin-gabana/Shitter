import React, { useState, useEffect } from 'react';
import { X, Lock, Shield, Zap, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface SessionWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWallet: (pin: string) => Promise<void>;
  userAddress: string;
  isCreating: boolean;
}

export function SessionWalletModal({ 
  isOpen, 
  onClose, 
  onCreateWallet, 
  userAddress, 
  isCreating 
}: SessionWalletModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'info' | 'create'>('info');

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setConfirmPin('');
      setError('');
      setStep('info');
      setShowPin(false);
    }
  }, [isOpen]);

  const handleCreateWallet = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 characters');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {
      await onCreateWallet(pin);
      onClose();
    } catch (error) {
      setError('Failed to create session wallet');
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Session Wallet</h2>
              <p className="text-sm text-gray-400">Fast transactions for social interactions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {step === 'info' ? (
            <>
              {/* Info Step */}
              <div className="space-y-4 mb-6">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-blue-400 font-semibold mb-1">What is a Session Wallet?</h3>
                      <p className="text-gray-300 text-sm">
                        A temporary wallet for instant social transactions using GoodShits (Gorbchain's native token units). 
                        1 GORB = 10,000 GoodShits. All transactions include a 20% network fee.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3">
                    <div className="text-green-400 mb-1">⚡ Fast</div>
                    <div className="text-xs text-gray-400">No wallet popups for social actions</div>
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3">
                    <div className="text-cyan-400 mb-1">🔒 Secure</div>
                    <div className="text-xs text-gray-400">Generated from your signature</div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-yellow-400 font-semibold mb-1">Session Only</h3>
                      <p className="text-gray-300 text-sm">
                        This wallet exists only during your session. Refreshing or leaving will require you to sign and create it again.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-800/20 rounded-lg p-3">
                  <div className="mb-1"><strong>Connected Wallet:</strong></div>
                  <div className="font-mono">{userAddress.slice(0, 8)}...{userAddress.slice(-8)}</div>
                </div>
              </div>

              <button
                onClick={() => setStep('create')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-200"
              >
                Create Session Wallet
              </button>
            </>
          ) : (
            <>
              {/* Create Step */}
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="text-lg font-semibold text-white mb-1">Create Your PIN</div>
                  <div className="text-sm text-gray-400">
                    This PIN will be combined with your signature to generate your session wallet
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Session PIN (4+ characters)
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

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep('info')}
                    disabled={isCreating}
                    className="flex-1 bg-gray-800/50 hover:bg-gray-800/70 text-gray-300 font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateWallet}
                    disabled={!pin || !confirmPin || pin !== confirmPin || pin.length < 4 || isCreating}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Create Wallet
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Activity, Settings, TrendingUp, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTransactionStore } from '../stores/transactionStore';
import { useWalletStore } from '../stores/walletStore';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Slider } from './ui/Slider';

export function TransactionPanel() {
  const [activeTab, setActiveTab] = useState<'history' | 'settings' | 'stats'>('history');
  
  const {
    transactions,
    settings,
    isProcessing,
    updateSettings,
    clearHistory,
    getStats
  } = useTransactionStore();

  const { tempBalance, mainBalance } = useWalletStore();

  const stats = getStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <Card className="w-80 h-full flex flex-col bg-gray-800/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Transactions
        </CardTitle>
        
        {/* Tab Navigation */}
        <div className="flex bg-gray-700 rounded-lg p-1 mt-4">
          {[
            { id: 'history', label: 'History', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'stats', label: 'Stats', icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {/* Wallet Info */}
        <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-400 mb-1">Balances</div>
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Game Wallet:</span>
              <span className="text-green-400">{tempBalance.toFixed(4)} GOR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Main Wallet:</span>
              <span className="text-blue-400">{mainBalance.toFixed(4)} GOR</span>
            </div>
          </div>
        </div>

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">
                Recent Activity ({transactions.length})
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-xs"
              >
                Clear
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No transactions yet</p>
                  <p className="text-xs">Start drawing to generate activity!</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-gray-700/30 rounded-lg p-3 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        <span className="font-medium text-gray-200">
                          {tx.type.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-400">{tx.details}</div>
                    {tx.signature && (
                      <div className="text-blue-400 font-mono mt-1 truncate">
                        {tx.signature.slice(0, 16)}...
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Transaction Mode</h4>
              <Slider
                label="Pixels per Transaction"
                value={settings.pixelsPerTransaction}
                onChange={(value) => updateSettings({ pixelsPerTransaction: value })}
                min={1}
                max={20}
                step={1}
              />
            </div>

            <div>
              <Slider
                label="Batch Size"
                value={settings.batchSize}
                onChange={(value) => updateSettings({ batchSize: value })}
                min={1}
                max={50}
                step={1}
              />
            </div>

            <div>
              <Slider
                label="Bundle Size"
                value={settings.bundleSize}
                onChange={(value) => updateSettings({ bundleSize: value })}
                min={1}
                max={10}
                step={1}
              />
            </div>

            <div>
              <Slider
                label="Max TPS"
                value={settings.maxTPS}
                onChange={(value) => updateSettings({ maxTPS: value })}
                min={1}
                max={100}
                step={1}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Auto Send</span>
              <button
                onClick={() => updateSettings({ autoSend: !settings.autoSend })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoSend ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoSend ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.sent}</div>
                <div className="text-xs text-gray-400">Total Sent</div>
              </div>
              <div className="bg-green-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.confirmed}</div>
                <div className="text-xs text-gray-400">Confirmed</div>
              </div>
              <div className="bg-red-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
                <div className="text-xs text-gray-400">Failed</div>
              </div>
              <div className="bg-yellow-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.avgConfirmTime.toFixed(1)}s
                </div>
                <div className="text-xs text-gray-400">Avg Time</div>
              </div>
            </div>

            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-gray-300">Performance</span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-green-400">
                    {stats.sent > 0 ? ((stats.confirmed / stats.sent) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current TPS:</span>
                  <span className="text-blue-400">
                    {isProcessing ? '...' : '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState } from 'react';
import { Lock, Unlock, Users, Eye, EyeOff, Shield } from 'lucide-react';

interface PrivatePostToggleProps {
  isPrivate: boolean;
  onToggle: (isPrivate: boolean) => void;
  recipients: string[];
  onRecipientsChange: (recipients: string[]) => void;
  disabled?: boolean;
}

export function PrivatePostToggle({ 
  isPrivate, 
  onToggle, 
  recipients, 
  onRecipientsChange,
  disabled = false
}: PrivatePostToggleProps) {
  const [showRecipients, setShowRecipients] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !recipients.includes(newRecipient.trim())) {
      onRecipientsChange([...recipients, newRecipient.trim()]);
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (recipient: string) => {
    onRecipientsChange(recipients.filter(r => r !== recipient));
  };

  return (
    <div className="space-y-3">
      {/* Privacy Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(!isPrivate)}
            disabled={disabled}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              isPrivate
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-gray-700/50 text-gray-400 border border-gray-600/30 hover:bg-gray-700/70'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {isPrivate ? 'Private Post' : 'Public Post'}
            </span>
          </button>
          
          {isPrivate && (
            <div className="flex items-center gap-1 text-xs text-orange-300">
              <Shield className="w-3 h-3" />
              <span>End-to-end encrypted</span>
            </div>
          )}
        </div>

        {isPrivate && (
          <button
            onClick={() => setShowRecipients(!showRecipients)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            <Users className="w-3 h-3" />
            <span>{recipients.length} recipients</span>
            {showRecipients ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Recipients Management */}
      {isPrivate && showRecipients && (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Lock className="w-4 h-4 text-orange-400" />
            <span>This post will be encrypted for specific recipients only</span>
          </div>

          {/* Add Recipient */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
              placeholder="Enter recipient public key..."
              className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={handleAddRecipient}
              disabled={!newRecipient.trim()}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Add
            </button>
          </div>

          {/* Recipients List */}
          {recipients.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-gray-400">Recipients ({recipients.length}):</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {recipients.map((recipient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-700/30 rounded px-3 py-2 text-sm"
                  >
                    <span className="text-gray-300 font-mono truncate">
                      {recipient.length > 20 ? `${recipient.slice(0, 10)}...${recipient.slice(-10)}` : recipient}
                    </span>
                    <button
                      onClick={() => handleRemoveRecipient(recipient)}
                      className="text-red-400 hover:text-red-300 ml-2 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recipients.length === 0 && (
            <div className="text-center py-3 text-gray-500 text-sm">
              No recipients added. Add public keys to encrypt this post.
            </div>
          )}

          {/* Warning */}
          <div className="text-xs text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded p-2">
            <strong>Note:</strong> Private posts are encrypted and only visible to specified recipients. 
            They cannot be decrypted without the recipient's private key.
          </div>
        </div>
      )}

      {/* Public Post Info */}
      {!isPrivate && (
        <div className="text-xs text-gray-500">
          This post will be visible to everyone on the platform
        </div>
      )}
    </div>
  );
}
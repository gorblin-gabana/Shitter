import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Lock, 
  Unlock, 
  Users, 
  Shield, 
  Key, 
  Send, 
  Plus,
  Settings,
  UserPlus,
  UserMinus,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { encryptionService, EncryptedMessage, ChatGroup } from '../services/encryptionService';
import { useWalletStore } from '../stores/walletStore';
import { toast } from 'sonner';

interface EncryptedMessagingProps {
  onClose: () => void;
}

type MessageType = 'direct' | 'group' | 'private';
type ChatMode = 'list' | 'direct-chat' | 'group-chat' | 'create-group';

interface Contact {
  publicKey: string;
  nickname: string;
  lastSeen: number;
  isOnline: boolean;
}

interface DirectChat {
  contactPublicKey: string;
  contactNickname: string;
  messages: EncryptedMessage[];
}

export function EncryptedMessaging({ onClose }: EncryptedMessagingProps) {
  const { mainWallet } = useWalletStore();
  const [mode, setMode] = useState<ChatMode>('list');
  const [messageType, setMessageType] = useState<MessageType>('direct');
  const [newMessage, setNewMessage] = useState('');
  const [recipientPublicKey, setRecipientPublicKey] = useState('');
  const [recipientNickname, setRecipientNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Chat state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [directChats, setDirectChats] = useState<DirectChat[]>([]);
  const [currentDirectChat, setCurrentDirectChat] = useState<DirectChat | null>(null);
  const [currentGroup, setCurrentGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<EncryptedMessage[]>([]);
  
  // Group creation
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<Array<{publicKey: string, nickname: string}>>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a demo private key for this session (in production, this would be derived from wallet)
    const demoKeypair = encryptionService.generateKeypair();
    setPrivateKey(demoKeypair.privateKey);
    
    // Load demo contacts
    setContacts([
      {
        publicKey: 'demo_alice_pub_key_123',
        nickname: 'Alice',
        lastSeen: Date.now() - 300000, // 5 minutes ago
        isOnline: true
      },
      {
        publicKey: 'demo_bob_pub_key_456',
        nickname: 'Bob',
        lastSeen: Date.now() - 600000, // 10 minutes ago
        isOnline: false
      },
      {
        publicKey: 'demo_charlie_pub_key_789',
        nickname: 'Charlie',
        lastSeen: Date.now() - 120000, // 2 minutes ago
        isOnline: true
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !privateKey) return;
    
    setLoading(true);
    try {
      let encryptedMessage: EncryptedMessage;
      
      switch (messageType) {
        case 'direct':
          if (!recipientPublicKey) {
            toast.error('Please enter recipient public key');
            return;
          }
          encryptedMessage = await encryptionService.encryptDirectMessage(
            newMessage,
            recipientPublicKey,
            privateKey,
            { 
              nickname: recipientNickname || 'Unknown',
              timestamp: Date.now()
            }
          );
          
          // Add to direct chat
          const existingChat = directChats.find(chat => chat.contactPublicKey === recipientPublicKey);
          if (existingChat) {
            existingChat.messages.push(encryptedMessage);
            setDirectChats([...directChats]);
          } else {
            const newChat: DirectChat = {
              contactPublicKey: recipientPublicKey,
              contactNickname: recipientNickname || 'Unknown',
              messages: [encryptedMessage]
            };
            setDirectChats([...directChats, newChat]);
          }
          break;
          
        case 'group':
          if (!currentGroup) {
            toast.error('Please select a group');
            return;
          }
          encryptedMessage = await encryptionService.encryptGroupMessage(
            newMessage,
            currentGroup,
            privateKey,
            { timestamp: Date.now() }
          );
          break;
          
        case 'private':
          encryptedMessage = await encryptionService.encryptPrivateNote(
            newMessage,
            privateKey,
            { timestamp: Date.now(), type: 'private_note' }
          );
          break;
      }
      
      setMessages(prev => [...prev, encryptedMessage]);
      setNewMessage('');
      
      toast.success(`${messageType === 'private' ? 'Private note' : 'Message'} encrypted successfully! 🔐`);
    } catch (error) {
      console.error('Failed to send encrypted message:', error);
      toast.error('Failed to encrypt message');
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptMessage = async (message: EncryptedMessage) => {
    if (!privateKey) {
      toast.error('Private key required for decryption');
      return;
    }
    
    try {
      let decrypted: string;
      
      switch (message.encryptionType) {
        case 'personal':
          decrypted = await encryptionService.decryptPrivateNote(message, privateKey);
          break;
        case 'direct':
          decrypted = await encryptionService.decryptDirectMessage(message, privateKey);
          break;
        case 'group':
          decrypted = await encryptionService.decryptGroupMessage(message, privateKey);
          break;
        default:
          throw new Error('Unsupported message type');
      }
      
      // Show decrypted message
      toast.success(
        <div className="max-w-xs">
          <div className="font-medium mb-1">Decrypted Message:</div>
          <div className="text-sm bg-gray-100 p-2 rounded break-words">{decrypted}</div>
        </div>,
        { duration: 8000 }
      );
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      toast.error('Failed to decrypt message');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !privateKey) return;
    
    setLoading(true);
    try {
      const group = await encryptionService.createGroupChat(
        groupName,
        privateKey,
        groupMembers.map(member => ({
          publicKey: member.publicKey,
          role: 'MEMBER' as any,
          nickname: member.nickname
        }))
      );
      
      setGroups(prev => [...prev, group]);
      setGroupName('');
      setGroupMembers([]);
      setMode('list');
      
      toast.success(`Group "${group.name}" created successfully! 🎉`);
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const renderMessageList = () => (
    <div className="space-y-4">
      {/* Private Key Section */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-medium">Session Private Key</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-800/50 rounded px-3 py-2 font-mono text-sm">
            {showPrivateKey ? privateKey : '*'.repeat(32)}
          </div>
          <button
            onClick={() => setShowPrivateKey(!showPrivateKey)}
            className="p-2 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white"
          >
            {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => copyToClipboard(privateKey)}
            className="p-2 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-yellow-300 mt-2">
          This key is used for encryption/decryption. In production, this would be derived from your wallet.
        </p>
      </div>

      {/* Message Types */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => { setMessageType('direct'); setMode('direct-chat'); }}
          className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg p-4 text-center transition-all"
        >
          <MessageCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-blue-400 font-medium">Direct Messages</div>
          <div className="text-xs text-gray-400 mt-1">{directChats.length} chats</div>
        </button>

        <button
          onClick={() => { setMessageType('group'); setMode('group-chat'); }}
          className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg p-4 text-center transition-all"
        >
          <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-green-400 font-medium">Group Chats</div>
          <div className="text-xs text-gray-400 mt-1">{groups.length} groups</div>
        </button>

        <button
          onClick={() => setMessageType('private')}
          className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg p-4 text-center transition-all"
        >
          <Lock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-purple-400 font-medium">Private Notes</div>
          <div className="text-xs text-gray-400 mt-1">Self-encrypted</div>
        </button>
      </div>

      {/* Contacts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Contacts</h3>
          <button
            onClick={() => setMode('create-group')}
            className="text-blue-400 hover:text-blue-300 p-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {contacts.map(contact => (
          <div
            key={contact.publicKey}
            onClick={() => {
              setRecipientPublicKey(contact.publicKey);
              setRecipientNickname(contact.nickname);
              setMessageType('direct');
              setMode('direct-chat');
            }}
            className="flex items-center gap-3 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-all"
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                {contact.nickname[0]}
              </div>
              {contact.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">{contact.nickname}</div>
              <div className="text-xs text-gray-400 font-mono truncate">
                {contact.publicKey.slice(0, 16)}...
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {contact.isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDirectChat = () => (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700/50">
        <button
          onClick={() => setMode('list')}
          className="text-gray-400 hover:text-white"
        >
          ←
        </button>
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
          {recipientNickname[0] || 'U'}
        </div>
        <div>
          <div className="text-white font-medium">{recipientNickname || 'Unknown'}</div>
          <div className="text-xs text-gray-400 font-mono">
            {recipientPublicKey.slice(0, 16)}...
          </div>
        </div>
        <div className="ml-auto">
          <Shield className="w-5 h-5 text-green-400" title="End-to-end encrypted" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {currentDirectChat?.messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === recipientPublicKey ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs p-3 rounded-lg cursor-pointer ${
                message.sender === recipientPublicKey
                  ? 'bg-gray-700/50 text-white'
                  : 'bg-blue-600/80 text-white ml-auto'
              }`}
              onClick={() => handleDecryptMessage(message)}
            >
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-3 h-3" />
                <span className="text-xs opacity-70">Encrypted</span>
              </div>
              <div className="text-sm">Click to decrypt</div>
              <div className="text-xs mt-1 opacity-50">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type an encrypted message..."
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={loading || !newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Encrypted Messaging</h2>
              <p className="text-sm text-gray-400">End-to-end encrypted communications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800/50 rounded-xl transition-colors text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {mode === 'list' && (
            <div className="h-full overflow-y-auto p-6">
              {renderMessageList()}
            </div>
          )}
          
          {mode === 'direct-chat' && renderDirectChat()}
          
          {/* Add other modes here */}
        </div>
      </div>
    </div>
  );
}
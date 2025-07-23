import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Hash, AtSign, Image, Smile, ThumbsUp, ThumbsDown, Coins, Sparkles, Send, Trash2, Edit2, HelpCircle, Settings as SettingsIcon, Bell, Search, Filter, Plus, X } from 'lucide-react';
import { useWalletStore } from '../stores/walletStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { sessionWalletService } from '../services/sessionWalletService';
import { sendMemoTransaction } from '../services/transactionService';
import { PublicKey } from '@solana/web3.js';
import type { ParsedTransactionWithMeta } from '@solana/web3.js';
import { toast } from 'sonner';
import lighthouse from '@lighthouse-web3/sdk';
// Import API key from Apikey.txt
// @ts-ignore
import apiKey from '../Apikey.txt';

interface TwitterFeedProps {
  onNavigateToProfile?: () => void;
  selectedTribe?: string;
  globalSearchQuery?: string;
}

interface Reply {
  id: string;
  author: {
    username: string;
    address: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  goodShits: number;
  badShits: number;
  isLiked: boolean;
  userUpvotes: number;
  userDownvotes: number;
}

interface Post {
  id: string;
  author: {
    username: string;
    address: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies: number;
  reposts: number;
  goodShits: number;
  badShits: number;
  isLiked: boolean;
  isReposted: boolean;
  userUpvotes: number;
  userDownvotes: number;
  isFrozen: boolean;
  images?: string[];
  channel?: string;
  replyList: Reply[];
  edited?: boolean;
}

interface VoteAnimation {
  id: string;
  type: 'upvote' | 'downvote';
  x: number;
  y: number;
}

const MEMO_SIZE_LIMIT = 1200; // bytes
const LOCAL_POSTS_KEY = 'local-posts';
const PRUNE_DAYS = 30;
const DELETED_POSTS_KEY = 'deleted-posts';
const LIGHTHOUSE_GATEWAY = 'https://gateway.lighthouse.storage/ipfs/';

export function TwitterFeed({ onNavigateToProfile, selectedTribe = 'general', globalSearchQuery = '' }: TwitterFeedProps) {
  // Basic state
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [onChainPosts, setOnChainPosts] = useState<Post[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showFeeNotice, setShowFeeNotice] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  
  // Scroll behavior state
  const [isPostBoxVisible, setIsPostBoxVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [mediaOnly, setMediaOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [hashtag, setHashtag] = useState('');
  const [hideOldPosts, setHideOldPosts] = useState(false);
  
  // Wallet and connection
  const { publicKey, signTransaction } = useWallet();
  const { connection, mainWallet, sessionWalletActive, addGoodShits } = useWalletStore();
  const walletAddress = mainWallet || publicKey?.toString() || '';
  
  // Fetch state
  const [isFetchingOnChain, setIsFetchingOnChain] = useState(false);

  // Session wallet interaction handlers
  const handleLike = (postId: string) => {
    if (!sessionWalletActive) {
      toast.error('Please create a session wallet to interact with posts');
      return;
    }

    const result = sessionWalletService.spendGoodShits(1, 'like');
    if (result.success) {
      // Update post likes locally
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1, isLiked: true }
          : post
      ));
      
      // Award the post author some GoodShits
      addGoodShits(2, 'received like');
      toast.success(`Post liked! 💖 (Cost: ${result.total} GS including ${result.fee} GS fee)`);
    } else {
      toast.error(`Insufficient balance. Need ${result.total} GS (${result.fee} GS fee included)`);
    }
  };

  const handleGoodShit = (postId: string) => {
    if (!sessionWalletActive) {
      toast.error('Please create a session wallet to interact with posts');
      return;
    }

    const result = sessionWalletService.spendGoodShits(2, 'good shit');
    if (result.success) {
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, goodShits: post.goodShits + 1, userUpvotes: post.userUpvotes + 1 }
          : post
      ));
      
      // Award the post author more GoodShits for quality content
      addGoodShits(5, 'received good shit');
      toast.success(`Good shit! 🔥 (Cost: ${result.total} GS)`);
    } else {
      toast.error(`Insufficient balance. Need ${result.total} GS`);
    }
  };

  const handleBadShit = (postId: string) => {
    if (!sessionWalletActive) {
      toast.error('Please create a session wallet to interact with posts');
      return;
    }

    const result = sessionWalletService.spendGoodShits(1, 'bad shit');
    if (result.success) {
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, badShits: post.badShits + 1, userDownvotes: post.userDownvotes + 1 }
          : post
      ));
      toast.success(`Feedback recorded 👎 (Cost: ${result.total} GS)`);
    } else {
      toast.error(`Insufficient balance. Need ${result.total} GS`);
    }
  };

  const handleShare = (postId: string) => {
    if (!sessionWalletActive) {
      toast.error('Please create a session wallet to interact with posts');
      return;
    }

    const result = sessionWalletService.spendGoodShits(2, 'share');
    if (result.success) {
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, reposts: post.reposts + 1 }
          : post
      ));
      
      // Award the post author for viral content
      addGoodShits(3, 'post shared');
      toast.success(`Post shared! 🚀 (Cost: ${result.total} GS)`);
    } else {
      toast.error(`Insufficient balance. Need ${result.total} GS`);
    }
  };
  const [hasMore, setHasMore] = useState(true);

  const currentTribe = {
    name: selectedTribe === 'general' ? 'General' : selectedTribe,
    members: '1,247',
    online: '89'
  };

  console.log('🎨 TwitterFeed render - walletAddress:', walletAddress, 'localPosts:', localPosts.length, 'onChainPosts:', onChainPosts.length);

  // Handle scroll behavior for post box
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      
      const currentScrollY = scrollContainerRef.current.scrollTop;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsPostBoxVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsPostBoxVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  // Load local posts on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_POSTS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLocalPosts(Array.isArray(parsed) ? parsed : []);
      } catch {
        setLocalPosts([]);
      }
    }
  }, []);

  // Upload to Lighthouse
  async function uploadToLighthouse(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    // @ts-ignore
    const response = await lighthouse.uploadBuffer(Buffer.from(buffer), apiKey);
    if (!response || !response.data || !response.data.Hash) {
      throw new Error('Failed to upload to Lighthouse');
    }
    return response.data.Hash;
  }

  // Handle media file selection
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle post submission
  const handleSubmit = () => {
    if (!newPost.trim()) return;
    
    const memoContent = newPost + (mediaFile ? ' [media]' : '');
    if (new TextEncoder().encode(memoContent).length > MEMO_SIZE_LIMIT) {
      setError(`Post too long. Maximum ${MEMO_SIZE_LIMIT} bytes allowed.`);
      return;
    }
    
    setError(null);
    setShowFeeNotice(true);
  };

  // Confirm and send post
  const confirmPost = async () => {
    if (!connection || !walletAddress || !signTransaction) {
      setError('Wallet not connected');
      return;
    }

    setIsPosting(true);
    setTxStatus(null);
    
    try {
      let mediaUrl: string | undefined = undefined;
      
      if (mediaFile) {
        setIsUploading(true);
        try {
          const cid = await uploadToLighthouse(mediaFile);
          mediaUrl = LIGHTHOUSE_GATEWAY + cid;
        } catch (e: any) {
          setError('Failed to upload image: ' + (e instanceof Error ? e.message : String(e)));
          setIsPosting(false);
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      let memo = newPost;
      if (mediaUrl) {
        memo = JSON.stringify({ text: newPost, media: mediaUrl });
      }

      setTxStatus('Sending transaction...');
      const txSignature = await sendMemoTransaction({
        connection,
        payer: new PublicKey(walletAddress),
        signTransaction,
        memo
      });

      const newPostObj: Post = {
        id: txSignature,
        author: {
          username: walletAddress.slice(0, 8),
          address: walletAddress,
          avatar: '🦍'
        },
        content: newPost,
        timestamp: 'now',
        likes: 0,
        replies: 0,
        reposts: 0,
        goodShits: 0,
        badShits: 0,
        isLiked: false,
        isReposted: false,
        userUpvotes: 0,
        userDownvotes: 0,
        isFrozen: false,
        images: mediaUrl ? [mediaUrl] : undefined,
        channel: selectedTribe,
        replyList: []
      };

      const updatedPosts = [newPostObj, ...localPosts];
      setLocalPosts(updatedPosts);
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(updatedPosts));

      setTxStatus(`Posted successfully! TX: ${txSignature.slice(0, 8)}...`);
      toast.success('Post sent to blockchain!');
      
      // Reset form
      setNewPost('');
      setMediaFile(null);
      setMediaPreview(null);
      setShowFeeNotice(false);
      
    } catch (e: any) {
      const message = e instanceof Error ? e.message : 'Failed to post';
      setError(message);
      toast.error('Failed to post: ' + message);
    } finally {
      setIsPosting(false);
      setIsUploading(false);
    }
  };

  // Fetch on-chain posts
  const fetchOnChainPosts = async (loadMore = false) => {
    if (!connection || !walletAddress) {
      console.log('🚫 No connection or wallet address for fetching posts');
      setOnChainPosts([]); // Set empty array instead of blocking
      return;
    }
    
    // Validate wallet address is a valid public key
    try {
      new PublicKey(walletAddress);
    } catch (e) {
      console.log('❌ Invalid wallet address for Solana public key:', walletAddress);
      setOnChainPosts([]); // Set empty array for invalid addresses
      return;
    }
    
    setIsFetchingOnChain(true);
    try {
      console.log('📡 Fetching on-chain posts for:', walletAddress);
      const signatures = await connection.getSignaturesForAddress(new PublicKey(walletAddress), { limit: 20 });
      console.log('📋 Found signatures:', signatures.length);
      
      const posts: Post[] = [];
      
      for (const sig of signatures) {
        try {
          const tx = await connection.getParsedTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
          if (tx?.meta?.logMessages) {
            for (const log of tx.meta.logMessages) {
              if (log.includes('Program log: Memo')) {
                const memo = log.split('Program log: Memo (len ')[1]?.split('): "')[1]?.split('"')[0];
                if (memo) {
                  let content = memo;
                  let images: string[] | undefined = undefined;
                  
                  try {
                    const parsed = JSON.parse(memo);
                    if (parsed.text) {
                      content = parsed.text;
                      if (parsed.media) images = [parsed.media];
                    }
                  } catch {
                    // Use memo as-is
                  }
                  
                  posts.push({
                    id: sig.signature,
                    author: {
                      username: walletAddress.slice(0, 8),
                      address: walletAddress,
                      avatar: '🦍'
                    },
                    content,
                    timestamp: new Date(sig.blockTime! * 1000).toLocaleDateString(),
                    likes: 0,
                    replies: 0,
                    reposts: 0,
                    goodShits: 0,
                    badShits: 0,
                    isLiked: false,
                    isReposted: false,
                    userUpvotes: 0,
                    userDownvotes: 0,
                    isFrozen: false,
                    images,
                    channel: selectedTribe,
                    replyList: []
                  });
                }
              }
            }
          }
        } catch (e) {
          console.error('Error parsing transaction:', e);
          // Continue processing other transactions
        }
      }
      
      console.log('✅ Successfully fetched', posts.length, 'posts');
      setOnChainPosts(posts);
    } catch (e) {
      console.error('Error fetching posts:', e);
      // Don't show toast for expected errors (e.g., no posts, new wallet)
      setOnChainPosts([]); // Set empty array instead of failing
    } finally {
      setIsFetchingOnChain(false);
    }
  };

  // Filter posts based on search and filters
  const filterPosts = (postsToFilter: Post[]) => {
    return postsToFilter.filter(post => {
      // Global search filter
      if (globalSearchQuery) {
        const query = globalSearchQuery.toLowerCase();
        const matches = 
          post.content.toLowerCase().includes(query) ||
          post.author.username.toLowerCase().includes(query) ||
          post.author.address.toLowerCase().includes(query);
        if (!matches) return false;
      }
      
      // Media only filter
      if (mediaOnly && (!post.images || post.images.length === 0)) return false;
      
      // Hashtag filter
      if (hashtag && !post.content.toLowerCase().includes(hashtag.toLowerCase())) return false;
      
      return true;
    });
  };

  // Merge and filter posts
  const allPosts = [...localPosts, ...onChainPosts];
  const uniquePosts = allPosts.filter((post, index, self) => 
    index === self.findIndex(p => p.id === post.id)
  );
  const filteredPosts = filterPosts(uniquePosts);

  // Load posts on mount - make this non-blocking
  useEffect(() => {
    if (walletAddress && connection) {
      console.log('🔄 Loading posts for wallet:', walletAddress);
      // Don't await - let this run in background
      fetchOnChainPosts().catch(e => {
        console.error('Non-blocking post fetch error:', e);
        // Component continues to render even if fetch fails
      });
    } else {
      console.log('⏭️ Skipping post fetch - no wallet or connection');
      setOnChainPosts([]); // Ensure empty array for clean state
    }
  }, [walletAddress, connection]);

  return (
    <div className="flex flex-col h-full">
      {/* Clean Header */}
      <div className="bg-gray-900/30 border-b border-gray-800/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{currentTribe.name}</h1>
              <div className="flex items-center gap-3 text-gray-400">
                <span>{currentTribe.members} members</span>
                <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                <span className="text-green-400">{currentTribe.online} online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Post Creation with Scroll Behavior */}
      <div 
        className={`bg-gray-900/20 border-b border-gray-800/20 p-6 transition-all duration-300 ${
          isPostBoxVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`} 
        id="tour-posting"
      >
        <div className="bg-gray-800/30 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl flex-shrink-0">
              🦍
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={`What's happening in ${currentTribe.name}?`}
                className="w-full bg-transparent text-white placeholder-gray-400 resize-none border-none outline-none text-lg leading-relaxed min-h-[80px]"
                rows={3}
              />
              
              {mediaPreview && (
                <div className="mt-4">
                  <div className="relative inline-block">
                    <img src={mediaPreview} alt="Media preview" className="max-h-40 rounded-xl" />
                    <button
                      onClick={() => {setMediaPreview(null); setMediaFile(null);}}
                      className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
                <div className="flex items-center gap-3">
                  <label
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 px-3 py-2 rounded-xl hover:bg-blue-500/10 transition-all cursor-pointer"
                    title="Upload an image"
                  >
                    <Image className="w-5 h-5" />
                    <span className="hidden sm:inline">Media</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleMediaChange} />
                  </label>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${newPost.length > 280 ? 'text-red-400' : 'text-gray-500'}`}>
                      {280 - newPost.length}
                    </span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!newPost.trim() || newPost.length > 280}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-full font-semibold transition-all disabled:cursor-not-allowed"
                  >
                    Post
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3">
                  {error}
                </div>
              )}
              
              {showFeeNotice && (
                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-xl p-4">
                  <div className="font-medium mb-2">Confirm Transaction</div>
                  <div className="text-sm text-yellow-400 mb-3">This post will be stored on-chain and incur a small transaction fee.</div>
                  <div className="flex gap-3">
                    <button 
                      onClick={confirmPost} 
                      disabled={isPosting} 
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      {isPosting ? 'Posting...' : 'Confirm & Post'}
                    </button>
                    <button 
                      onClick={() => setShowFeeNotice(false)} 
                      disabled={isPosting} 
                      className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {txStatus && (
                <div className="mt-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-3">
                  {txStatus}
                </div>
              )}
              
              {isUploading && (
                <div className="mt-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                    Uploading to IPFS...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Feed Controls */}
      <div className="bg-gray-900/20 border-b border-gray-800/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Social Feed</h2>
            <span className="text-sm text-gray-400">
              Latest posts from the community
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-full transition-colors ${
                showAdvancedFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
              title="Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={() => fetchOnChainPosts(false)}
              disabled={isFetchingOnChain}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {isFetchingOnChain ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 bg-gray-800/30 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={mediaOnly}
                onChange={() => setMediaOnly(v => !v)}
                className="accent-blue-500"
              />
              <span className="text-sm">Media Only</span>
            </label>
            <input
              type="text"
              value={hashtag}
              onChange={e => setHashtag(e.target.value)}
              placeholder="#hashtag"
              className="bg-gray-700/50 text-gray-200 px-3 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={hideOldPosts}
                onChange={() => setHideOldPosts(v => !v)}
                className="accent-blue-500"
              />
              <span className="text-sm">Hide old posts</span>
            </label>
          </div>
        )}
      </div>

      {/* Enhanced Posts Feed */}
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        {filteredPosts.map((post: Post) => (
          <div key={post.id} className={`border-b border-gray-800/20 p-6 hover:bg-gray-800/5 transition-all duration-200 group ${post.isFrozen ? 'opacity-60' : ''}`}>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
                {post.author.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-base">
                      {post.author.username}
                    </span>
                    <span className="text-gray-500 text-sm font-mono truncate max-w-[120px]">
                      {post.author.address}
                    </span>
                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                    <span className="text-gray-500 text-sm">{post.timestamp}</span>
                    {post.edited && (
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                        Edited
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-white mb-4 leading-relaxed text-lg">
                  {post.content}
                </p>
                
                {post.images && post.images.length > 0 && (
                  <div className="mb-4">
                    <img 
                      src={post.images[0]} 
                      alt="Post media" 
                      className="max-h-96 w-full object-cover rounded-2xl border border-gray-700/30" 
                    />
                  </div>
                )}
                
                {/* Engagement Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 group transition-colors text-sm ${
                        post.isLiked 
                          ? 'text-red-400' 
                          : 'text-gray-500 hover:text-red-400'
                      }`}
                    >
                      <div className="p-2 rounded-full group-hover:bg-red-400/10 transition-colors">
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      </div>
                      <span>{post.likes}</span>
                    </button>
                    
                    <button className="flex items-center gap-2 text-gray-500 hover:text-gray-300 group transition-colors text-sm">
                      <div className="p-2 rounded-full group-hover:bg-gray-600/20 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span>{post.replies}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleShare(post.id)}
                      className="flex items-center gap-2 text-gray-500 hover:text-green-400 group transition-colors text-sm"
                    >
                      <div className="p-2 rounded-full group-hover:bg-green-400/10 transition-colors">
                        <Repeat2 className="w-4 h-4" />
                      </div>
                      <span>{post.reposts}</span>
                    </button>
                  </div>
                  
                  {/* GoodShits Actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleGoodShit(post.id)}
                      className="flex items-center gap-1 text-gray-500 hover:text-green-400 group transition-colors text-sm"
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-green-400/10 transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </div>
                      <span>{post.goodShits}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleBadShit(post.id)}
                      className="flex items-center gap-1 text-gray-500 hover:text-orange-400 group transition-colors text-sm"
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-orange-400/10 transition-colors">
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </div>
                      <span>{post.badShits}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <MessageCircle className="w-16 h-16 mb-6 text-gray-600" />
            <h3 className="text-xl font-semibold mb-3 text-gray-300">Welcome to {currentTribe.name}!</h3>
            <p className="text-center text-gray-400 mb-4 max-w-md">
              {isFetchingOnChain 
                ? "Loading your posts from the blockchain..." 
                : walletAddress 
                  ? "No posts yet. Be the first to share something amazing!"
                  : "Connect your wallet to start posting and see your feed."
              }
            </p>
            {isFetchingOnChain && (
              <div className="flex items-center gap-2 mt-2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                <span className="text-blue-400 text-sm">Fetching on-chain posts...</span>
              </div>
            )}
            {!isFetchingOnChain && walletAddress && (
              <div className="mt-4 text-sm text-gray-500">
                <p>💡 Your posts are stored on the Solana blockchain</p>
                <p>🔐 Completely decentralized and censorship-resistant</p>
              </div>
            )}
          </div>
        )}
        
        {/* Load More Button */}
        {hasMore && filteredPosts.length > 0 && (
          <div className="flex justify-center py-6">
            <button
              onClick={() => fetchOnChainPosts(true)}
              disabled={isFetchingOnChain}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium disabled:opacity-50"
            >
              {isFetchingOnChain ? 'Loading...' : 'Load More Posts'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
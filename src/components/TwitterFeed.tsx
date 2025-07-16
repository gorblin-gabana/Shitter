import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Hash, AtSign, Image, Smile, ThumbsUp, ThumbsDown, Coins, Sparkles, Send } from 'lucide-react';
import { useWalletStore } from '../stores/walletStore';

interface TwitterFeedProps {
  onNavigateToProfile?: () => void;
  selectedTribe?: string;
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
}

interface VoteAnimation {
  id: string;
  type: 'upvote' | 'downvote';
  x: number;
  y: number;
}

const mockReplies: Reply[] = [
  {
    id: 'r1',
    author: {
      username: 'pixel_fan',
      address: '5kLm...2Bv4',
      avatar: '🎮'
    },
    content: 'This is amazing! How long did it take you to create?',
    timestamp: '1m',
    likes: 3,
    goodShits: 12,
    badShits: 0,
    isLiked: false,
    userUpvotes: 0,
    userDownvotes: 0
  },
  {
    id: 'r2',
    author: {
      username: 'nft_trader',
      address: '8nRx...3Ky7',
      avatar: '💎'
    },
    content: 'Interested in buying this as an NFT! DM me',
    timestamp: '30s',
    likes: 1,
    goodShits: 5,
    badShits: 0,
    isLiked: true,
    userUpvotes: 0,
    userDownvotes: 0
  }
];

const mockPosts: Post[] = [
  {
    id: '1',
    author: {
      username: 'gorb_alpha',
      address: '7xKXt...9Qm2',
      avatar: '🦍'
    },
    content: 'Just minted my first pixel art NFT on Gorbchain! The freedom to create without censorship is incredible. #GorbChain #PixelArt #Decentralized',
    timestamp: '2m',
    likes: 42,
    replies: 8,
    reposts: 12,
    goodShits: 156,
    badShits: 3,
    isLiked: false,
    isReposted: false,
    userUpvotes: 0,
    userDownvotes: 0,
    isFrozen: false,
    channel: 'general',
    replyList: mockReplies
  },
  {
    id: '2',
    author: {
      username: 'crypto_artist',
      address: '9mNx...4Kl8',
      avatar: '🎨'
    },
    content: 'Loving the end-to-end encryption on private messages here. Finally, a social platform that respects privacy! 🔒',
    timestamp: '16m',
    likes: 127,
    replies: 23,
    reposts: 45,
    goodShits: 89,
    badShits: 1,
    isLiked: true,
    isReposted: false,
    userUpvotes: 0,
    userDownvotes: 0,
    isFrozen: false,
    channel: 'art',
    replyList: []
  },
  {
    id: '3',
    author: {
      username: 'defi_degen',
      address: '3pQr...7Ng9',
      avatar: '💰'
    },
    content: 'GM! The uncensored feed algorithm is refreshing. No forced content, just pure community-driven posts. This is what social media should be.',
    timestamp: '1h',
    likes: 89,
    replies: 34,
    reposts: 67,
    goodShits: 234,
    badShits: 8,
    isLiked: false,
    isReposted: true,
    userUpvotes: 0,
    userDownvotes: 0,
    isFrozen: false,
    channel: 'defi',
    replyList: []
  }
];

const tribeData = {
  'general': { name: 'General', description: 'Main discussions & announcements', members: '1,247', online: '89' },
  'announcements': { name: 'Announcements', description: 'Official updates & news', members: '1,247', online: '23' },
  'introductions': { name: 'Introductions', description: 'Welcome new members', members: '892', online: '12' },
  'art': { name: 'Art & NFTs', description: 'Creative showcases & discussions', members: '734', online: '45' },
  'pixel-art': { name: 'Pixel Art', description: 'Pixel art creations & tutorials', members: '623', online: '67' },
  'showcases': { name: 'Showcases', description: 'Show off your work', members: '456', online: '34' },
  'defi': { name: 'DeFi & Trading', description: 'Decentralized finance discussions', members: '987', online: '78' },
  'nft-trading': { name: 'NFT Trading', description: 'Buy, sell, trade NFTs', members: '845', online: '56' },
  'yield-farming': { name: 'Yield Farming', description: 'Farming strategies & tips', members: '567', online: '23' },
  'tech': { name: 'Tech & Dev', description: 'Technical discussions', members: '1,123', online: '89' },
  'blockchain-dev': { name: 'Blockchain Dev', description: 'Blockchain development', members: '789', online: '45' },
  'tools': { name: 'Tools & Scripts', description: 'Development tools & automation', members: '456', online: '12' },
  'memes': { name: 'Memes & Fun', description: 'Humor & entertainment', members: '1,456', online: '134' },
  'gaming': { name: 'Gaming', description: 'Gaming discussions & events', members: '934', online: '78' },
  'off-topic': { name: 'Off Topic', description: 'Everything else', members: '678', online: '45' }
};

const tribes = Object.entries(tribeData).map(([id, data]) => ({
  id,
  ...data,
  superTribe: getSuperTribe(id)
}));

function getSuperTribe(tribeId: string): string {
  const superTribes: Record<string, string> = {
    'general': 'Community Hub',
    'announcements': 'Community Hub',
    'introductions': 'Community Hub',
    'art': 'Creative Collective',
    'pixel-art': 'Creative Collective',
    'showcases': 'Creative Collective',
    'defi': 'Financial Freedom',
    'nft-trading': 'Financial Freedom',
    'yield-farming': 'Financial Freedom',
    'tech': 'Builder Zone',
    'blockchain-dev': 'Builder Zone',
    'tools': 'Builder Zone',
    'memes': 'Entertainment Hub',
    'gaming': 'Entertainment Hub',
    'off-topic': 'Entertainment Hub'
  };
  return superTribes[tribeId] || 'Community Hub';
}

export function TwitterFeed({ onNavigateToProfile, selectedTribe = 'general' }: TwitterFeedProps) {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [newPost, setNewPost] = useState('');
  const [voteAnimations, setVoteAnimations] = useState<VoteAnimation[]>([]);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const { gameBalance, setGameBalance } = useWalletStore();

  const handleSubmit = () => {
    if (!newPost.trim()) return;
    
    const post: Post = {
      id: Date.now().toString(),
      author: {
        username: 'You',
        address: '7xKXt...9Qm2',
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
      channel: selectedTribe,
      replyList: []
    };
    
    setPosts([post, ...posts]);
    setNewPost('');
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleReplyLike = (postId: string, replyId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          replyList: post.replyList.map(reply =>
            reply.id === replyId
              ? { ...reply, isLiked: !reply.isLiked, likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1 }
              : reply
          )
        };
      }
      return post;
    }));
  };

  const toggleReplies = (postId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleReplySubmit = (postId: string) => {
    const replyContent = replyInputs[postId];
    if (!replyContent?.trim()) return;

    const newReply: Reply = {
      id: `r_${Date.now()}`,
      author: {
        username: 'You',
        address: '7xKXt...9Qm2',
        avatar: '🦍'
      },
      content: replyContent,
      timestamp: 'now',
      likes: 0,
      goodShits: 0,
      badShits: 0,
      isLiked: false,
      userUpvotes: 0,
      userDownvotes: 0
    };

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          replyList: [...post.replyList, newReply],
          replies: post.replies + 1
        };
      }
      return post;
    }));

    setReplyInputs({ ...replyInputs, [postId]: '' });
  };

  const createVoteAnimation = (event: React.MouseEvent, type: 'upvote' | 'downvote') => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const animation: VoteAnimation = {
      id: Date.now().toString(),
      type,
      x,
      y
    };
    
    setVoteAnimations(prev => [...prev, animation]);
    
    setTimeout(() => {
      setVoteAnimations(prev => prev.filter(a => a.id !== animation.id));
    }, 1500);
  };

  const handleUpvote = (postId: string, event: React.MouseEvent) => {
    if (gameBalance <= 0) {
      alert('Insufficient GORB balance to vote!');
      return;
    }

    createVoteAnimation(event, 'upvote');
    setGameBalance(gameBalance - 1);

    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newGoodShits = post.goodShits + 1;
        const newUserUpvotes = post.userUpvotes + 1;
        const isFrozen = post.badShits > newGoodShits;
        return { 
          ...post, 
          userUpvotes: newUserUpvotes,
          goodShits: newGoodShits,
          isFrozen
        };
      }
      return post;
    }));
  };

  const handleDownvote = (postId: string, event: React.MouseEvent) => {
    if (gameBalance <= 0) {
      alert('Insufficient GORB balance to vote!');
      return;
    }

    createVoteAnimation(event, 'downvote');
    setGameBalance(gameBalance - 1);

    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newBadShits = post.badShits + 1;
        const newUserDownvotes = post.userDownvotes + 1;
        const adjustedGoodShits = Math.max(0, post.goodShits - Math.floor(newBadShits / 5));
        const isFrozen = newBadShits > adjustedGoodShits;
        return { 
          ...post, 
          userDownvotes: newUserDownvotes,
          badShits: newBadShits,
          goodShits: adjustedGoodShits,
          isFrozen
        };
      }
      return post;
    }));
  };

  const currentTribe = tribes.find(t => t.id === selectedTribe) || tribes[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden max-w-7xl mx-auto w-full relative">
      {/* Vote Animations */}
      {voteAnimations.map((animation) => (
        <div
          key={animation.id}
          className={`fixed z-50 pointer-events-none text-lg font-bold animate-bounce ${
            animation.type === 'upvote' ? 'text-green-400' : 'text-red-400'
          }`}
          style={{
            left: animation.x,
            top: animation.y,
            transform: 'translate(-50%, -50%)',
            animation: 'float-up 1.5s ease-out forwards'
          }}
        >
          {animation.type === 'upvote' ? '+1' : '-1'}
        </div>
      ))}

      {/* Slightly Bigger Header */}
      <div className="bg-gray-900/20 border-b border-gray-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gray-700 rounded-md flex items-center justify-center">
              <Hash className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-white">{currentTribe.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{currentTribe.members} members</span>
                <span>•</span>
                <span className="text-green-500">{currentTribe.online} online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-500 text-sm">Live</span>
          </div>
        </div>
      </div>

      {/* Improved Post Creation */}
      <div className="bg-gray-800/10 border-b border-gray-800/30 p-4" id="tour-posting">
        <div className="bg-gray-800/20 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-base flex-shrink-0">
              🦍
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={`Share with ${currentTribe.name}...`}
                className="w-full bg-transparent text-white placeholder-gray-500 resize-none border-none outline-none text-base leading-relaxed"
                rows={2}
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-700/30 transition-colors text-sm">
                    <Image className="w-4 h-4" />
                    <span>Media</span>
                  </button>
                  <button className="flex items-center gap-1 text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-700/30 transition-colors text-sm">
                    <Hash className="w-4 h-4" />
                    <span>Tag</span>
                  </button>
                  <button className="flex items-center gap-1 text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-700/30 transition-colors text-sm">
                    <Smile className="w-4 h-4" />
                    <span>Emoji</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {/* AI Button - highlights when typing */}
                  {newPost.trim() && (
                    <button className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-sm transition-colors">
                      <Sparkles className="w-4 h-4" />
                      <span>Create with AI</span>
                    </button>
                  )}
                  <span className="text-sm text-gray-600">{280 - newPost.length}</span>
                  <button
                    onClick={handleSubmit}
                    disabled={!newPost.trim()}
                    className="bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-500 text-black px-4 py-2 rounded font-medium transition-colors text-sm"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Posts Feed with Replies */}
      <div className="flex-1 overflow-y-auto">
        {posts.map((post) => (
          <div key={post.id} className={`border-b border-gray-800/30 p-5 hover:bg-gray-800/10 transition-colors ${post.isFrozen ? 'opacity-60' : ''}`}>
            <div className="flex gap-4">
              <div className="w-11 h-11 bg-gray-700 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                {post.author.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-white text-base">{post.author.username}</span>
                  <span className="text-gray-500 text-sm font-mono">{post.author.address}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-500 text-sm">{post.timestamp}</span>
                  {post.channel && (
                    <>
                      <span className="text-gray-600">in</span>
                      <span className="text-gray-400 text-sm">#{post.channel}</span>
                    </>
                  )}
                  {post.isFrozen && (
                    <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">Frozen</span>
                  )}
                </div>
                <p className="text-white mb-4 leading-relaxed text-base">{post.content}</p>
                
                {/* Enhanced Engagement Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 group transition-colors text-sm ${post.isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
                    >
                      <div className="p-2 rounded-full group-hover:bg-red-400/10 transition-colors">
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      </div>
                      <span>{post.likes}</span>
                    </button>
                    
                    <button 
                      onClick={() => toggleReplies(post.id)}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-300 group transition-colors text-sm"
                    >
                      <div className="p-2 rounded-full group-hover:bg-gray-600/20 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span>{post.replies}</span>
                    </button>
                    
                    <button 
                      onClick={(e) => handleUpvote(post.id, e)}
                      disabled={gameBalance <= 0}
                      className={`flex items-center gap-2 group transition-colors text-sm ${
                        gameBalance <= 0 ? 'opacity-50 cursor-not-allowed' : 
                        post.userUpvotes > 0 ? 'text-green-400' : 'text-gray-500 hover:text-green-400'
                      }`}
                    >
                      <div className="p-2 rounded-full group-hover:bg-green-400/10 transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                      </div>
                      <span className="text-xs">
                        +1 GS {post.userUpvotes > 0 && `(${post.userUpvotes})`}
                      </span>
                    </button>
                    
                    <button 
                      onClick={(e) => handleDownvote(post.id, e)}
                      disabled={gameBalance <= 0}
                      className={`flex items-center gap-2 group transition-colors text-sm ${
                        gameBalance <= 0 ? 'opacity-50 cursor-not-allowed' : 
                        post.userDownvotes > 0 ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
                      }`}
                    >
                      <div className="p-2 rounded-full group-hover:bg-red-400/10 transition-colors">
                        <ThumbsDown className="w-4 h-4" />
                      </div>
                      <span className="text-xs">
                        -1 GS {post.userDownvotes > 0 && `(${post.userDownvotes})`}
                      </span>
                    </button>
                  </div>
                  
                  {/* Enhanced GoodShits/BadShits Display */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-gray-800/30 px-2 py-1 rounded text-sm">
                      <Coins className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">{post.goodShits}</span>
                      <span className="text-gray-500">GS</span>
                    </div>
                    {post.badShits > 0 && (
                      <div className="flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded text-sm">
                        <span className="text-red-400">{post.badShits}</span>
                        <span className="text-gray-500">BS</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reply Thread */}
                {expandedReplies.has(post.id) && (
                  <div className="mt-4 space-y-4">
                    {/* Reply Input */}
                    <div className="bg-gray-800/20 rounded-lg p-3">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                          🦍
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={replyInputs[post.id] || ''}
                            onChange={(e) => setReplyInputs({ ...replyInputs, [post.id]: e.target.value })}
                            placeholder="Write a reply..."
                            className="w-full bg-transparent text-white placeholder-gray-500 resize-none border-none outline-none text-sm leading-relaxed"
                            rows={2}
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleReplySubmit(post.id)}
                              disabled={!replyInputs[post.id]?.trim()}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Replies List */}
                    {post.replyList.map((reply) => (
                      <div key={reply.id} className="flex gap-3 ml-4 border-l border-gray-700/50 pl-4">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                          {reply.author.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white text-sm">{reply.author.username}</span>
                            <span className="text-gray-500 text-xs font-mono">{reply.author.address}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-500 text-xs">{reply.timestamp}</span>
                          </div>
                          <p className="text-white mb-2 leading-relaxed text-sm">{reply.content}</p>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleReplyLike(post.id, reply.id)}
                              className={`flex items-center gap-1 text-xs ${reply.isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'} transition-colors`}
                            >
                              <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                              <span>{reply.likes}</span>
                            </button>
                            <div className="flex items-center gap-1 bg-gray-800/30 px-2 py-1 rounded text-xs">
                              <Coins className="w-3 h-3 text-green-400" />
                              <span className="text-green-400">{reply.goodShits}</span>
                              <span className="text-gray-500">GS</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes float-up {
          0% {
            transform: translate(-50%, -50%) translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateY(-50px) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
} 
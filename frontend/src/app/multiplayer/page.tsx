'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DiceRoller } from '@/components/ui/dice-roller';
import { CharacterSheet } from '@/components/ui/character-sheet';
import { LinkupPanel } from '@/components/ui/linkup-panel';
import { useUser, getUserDisplayName, getUserExperienceLevel, isPremiumUser, mockLogin, mockLogout } from '@/lib/auth0';

interface AIPlayer {
  name: string;
  class: string;
  personality: string;
  voice_id: string;
  voice_description: string;
  level: number;
  hp: string;
  weapons: string[];
  personality_traits: string[];
  combat_style: string;
  roleplay_style: string;
}

interface GameTurn {
  player_name: string;
  action: string;
  dialogue: string;
  voice_id?: string;
  audio_file?: string;
  timestamp: string;
}

interface MultiplayerSession {
  session_id: string;
  human_player: string;
  party_members: any[];
  current_scene: string;
  turn_order: string[];
  current_turn: string;
  voice_mode: boolean;
  party_stats: any;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export default function MultiplayerPage() {
  // State Management
  const [session, setSession] = useState<MultiplayerSession | null>(null);
  const [aiPlayers, setAiPlayers] = useState<AIPlayer[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [currentAction, setCurrentAction] = useState('');
  const [currentDialogue, setCurrentDialogue] = useState('');
  const [gameHistory, setGameHistory] = useState<GameTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showGameGuide, setShowGameGuide] = useState(false);
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [showLinkupPanel, setShowLinkupPanel] = useState(false);
  const [playerCharacter, setPlayerCharacter] = useState(null);
  
  // Audio Management
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioQueue, setAudioQueue] = useState<Array<{text: string, speaker: string, audioUrl: string}>>([]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [volume, setVolume] = useState(0.8);

  // Auth0 integration
  const user = useUser();

  // Load AI Players on Mount
  useEffect(() => {
    loadAiPlayers();
    // Show game guide on first visit
    const hasSeenGuide = localStorage.getItem('dnd-guide-seen');
    if (!hasSeenGuide) {
      setShowGameGuide(true);
      localStorage.setItem('dnd-guide-seen', 'true');
    }
  }, []);

  // Auto-play audio queue
  useEffect(() => {
    if (audioQueue.length > 0 && !isPlayingSequence && !currentlyPlaying) {
      playNextInQueue();
    }
  }, [audioQueue, isPlayingSequence, currentlyPlaying]);

  const loadAiPlayers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/multiplayer/ai-players`);
      const data = await response.json();
      if (data.success) {
        setAiPlayers(data.ai_players);
      }
    } catch (error) {
      console.error('Failed to load AI players:', error);
    }
  };

  const createSession = async () => {
    // Use Auth0 user name if available, otherwise use manual input
    const effectivePlayerName = user.user ? getUserDisplayName(user.user) : playerName.trim();
    
    if (!effectivePlayerName) {
      alert('Please enter your character name or login with Auth0!');
      return;
    }

    setIsCreatingSession(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/multiplayer/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: effectivePlayerName,
          voice_mode: voiceMode,
          // Include Auth0 user metadata if available
          user_profile: user.user ? {
            auth0_id: user.user.sub,
            email: user.user.email,
            picture: user.user.picture,
            experience_level: getUserExperienceLevel(user.user),
            is_premium: isPremiumUser(user.user)
          } : null
        })
      });

      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        
        // Play opening scene audio if available and auto-queue it
        if (data.session.opening_scene?.audio_file && voiceMode) {
          setTimeout(() => {
            addToAudioQueue(
              data.session.opening_scene.description + ' ' + data.session.opening_scene.dm_welcome,
              'Dungeon Master',
              data.session.opening_scene.audio_file
            );
          }, 1000);
        }
        
        // Add opening to history
        setGameHistory([{
          player_name: 'Dungeon Master',
          action: 'campaign_start',
          dialogue: data.session.opening_scene.description + ' ' + data.session.opening_scene.dm_welcome,
          voice_id: 'dm_narrator',
          audio_file: data.session.opening_scene?.audio_file,
          timestamp: new Date().toISOString()
        }]);
      } else {
        alert('Failed to create session: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Make sure the backend server is running!');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const submitAction = async () => {
    if (!session || !currentAction.trim()) return;

    // Debug: Check session object
    console.log("🔍 Session object:", session);
    console.log("🔍 Human player field:", session.human_player);
    
    // Ensure we have a player name
    const sessionPlayerName = session.human_player || playerName || "Unknown Player";
    if (!sessionPlayerName || sessionPlayerName === "Unknown Player") {
      alert("Error: Player name not found in session. Please restart the session.");
      return;
    }

    setIsLoading(true);
    try {
      const requestBody = {
        session_id: session.session_id,
        player_name: sessionPlayerName,
        action: currentAction.trim(),
        dialogue: currentDialogue.trim(),
        generate_voice: voiceMode
      };
      
      console.log("🔍 Sending request body:", requestBody);

      const response = await fetch(`${BACKEND_URL}/api/multiplayer/player-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      // Better error handling
      if (!response.ok) {
        console.error('Server error:', response.status, data);
        let errorMessage = `Server error (${response.status})`;
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage += `: ${data.detail}`;
          } else if (Array.isArray(data.detail)) {
            // Handle Pydantic validation errors
            const errors = data.detail.map((err: any) => {
              return `${err.loc.join('.')}: ${err.msg}`;
            }).join(', ');
            errorMessage += `: ${errors}`;
          } else {
            errorMessage += `: ${JSON.stringify(data.detail)}`;
          }
        }
        
        alert(errorMessage);
        return;
      }
      
      if (data.success) {
        const newTurns: GameTurn[] = [];
        
        // Add human player turn
        newTurns.push({
          player_name: sessionPlayerName,
          action: currentAction,
          dialogue: currentDialogue,
          timestamp: new Date().toISOString()
        });

        // Add DM response and queue voice
        if (data.turn_result.dm_response) {
          const dmTurn = {
            player_name: 'Dungeon Master',
            action: 'dm_response',
            dialogue: data.turn_result.dm_response.dm_narration,
            voice_id: 'dm_narrator',
            audio_file: data.turn_result.dm_response.audio_file,
            timestamp: new Date().toISOString()
          };
          newTurns.push(dmTurn);
          
          // Auto-queue DM voice for playback if available
          if (voiceMode && data.turn_result.dm_response.audio_file) {
            setTimeout(() => {
              addToAudioQueue(
                data.turn_result.dm_response.dm_narration,
                'Dungeon Master',
                data.turn_result.dm_response.audio_file
              );
            }, 500);
          }
        }

        // Add AI player responses and queue voices
        if (data.turn_result.ai_responses) {
          data.turn_result.ai_responses.forEach((aiResponse: any, index: number) => {
            const aiTurn = {
              player_name: aiResponse.player_name,
              action: aiResponse.action_type,
              dialogue: aiResponse.response,
              voice_id: aiResponse.voice_id,
              audio_file: aiResponse.audio_file,
              timestamp: new Date().toISOString()
            };
            newTurns.push(aiTurn);
            
            // Auto-queue AI voices for playback if available
            if (voiceMode && aiResponse.audio_file) {
              setTimeout(() => {
                addToAudioQueue(
                  aiResponse.response,
                  aiResponse.player_name,
                  aiResponse.audio_file
                );
              }, 1000 + (index * 300)); // Stagger slightly
            }
          });
        }

        setGameHistory(prev => [...prev, ...newTurns]);
        setCurrentAction('');
        setCurrentDialogue('');
        
        // Show notification about voice playback
        if (voiceMode) {
          const audioCount = [
            data.turn_result.dm_response?.audio_file,
            ...(data.turn_result.ai_responses?.map((r: any) => r.audio_file) || [])
          ].filter(Boolean).length;
          
          if (audioCount > 0) {
            setTimeout(() => {
              const notification = document.createElement('div');
              notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 animate-bounce';
              notification.innerHTML = `
                <div class="flex items-center gap-2">
                  <span class="text-xl">🎤</span>
                  <div>
                    <div class="font-bold">Voice Acting Ready!</div>
                    <div class="text-sm">${audioCount} characters will speak with voices</div>
                  </div>
                </div>
              `;
              document.body.appendChild(notification);
              
              setTimeout(() => {
                if (document.body.contains(notification)) {
                  document.body.removeChild(notification);
                }
              }, 4000);
            }, 500);
          }
        }
      } else {
        console.error('Action failed:', data);
        alert('Action failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting action:', error);
      alert('Failed to submit action - Check console for details');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (audioUrl: string, speaker: string) => {
    if (!audioRef.current) return;
    
    try {
      setCurrentlyPlaying(speaker);
      audioRef.current.src = `${BACKEND_URL}${audioUrl}`;
      audioRef.current.volume = volume;
      await audioRef.current.play();
      
      // Add immersive effect - slight screen flash for dramatic moments
      if (speaker === 'Dungeon Master') {
        document.body.style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
        setTimeout(() => {
          document.body.style.backgroundColor = '';
        }, 200);
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      setCurrentlyPlaying(null);
    }
  };

  const addToAudioQueue = (text: string, speaker: string, audioUrl: string) => {
    setAudioQueue(prev => [...prev, { text, speaker, audioUrl }]);
  };

  const playNextInQueue = async () => {
    if (audioQueue.length === 0 || isPlayingSequence) return;
    
    setIsPlayingSequence(true);
    const nextAudio = audioQueue[0];
    setAudioQueue(prev => prev.slice(1));
    
    try {
      await playAudio(nextAudio.audioUrl, nextAudio.speaker);
    } catch (error) {
      console.error('Failed to play queued audio:', error);
      setCurrentlyPlaying(null);
      setIsPlayingSequence(false);
    }
  };

  const handleAudioEnded = () => {
    setCurrentlyPlaying(null);
    setIsPlayingSequence(false);
    // This will trigger the useEffect to play next in queue
  };

  const testVoice = async (characterType: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/multiplayer/voice-test/${characterType}`);
      const data = await response.json();
      
      if (data.success && data.voice_result?.audio_url) {
        playAudio(data.voice_result.audio_url, characterType);
      } else {
        alert('Voice test failed. Check if MiniMax API is configured.');
      }
    } catch (error) {
      console.error('Voice test failed:', error);
      alert('Voice test failed');
    }
  };

  // Session Creation UI
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-6 animate-pulse">
              🎮 Chronicles of AI: Multiplayer D&D
            </h1>
            <p className="text-2xl text-blue-200 mb-4">
              Join an epic adventure with AI companions and voice acting!
            </p>
            <div className="flex justify-center space-x-4 text-sm">
              <Badge variant="outline" className="bg-purple-600/20 border-purple-400">
                🏆 AWS MCP Agents Hackathon
              </Badge>
              <Badge variant="outline" className="bg-green-600/20 border-green-400">
                🎤 MiniMax Speech-02-HD
              </Badge>
              <Badge variant="outline" className="bg-yellow-600/20 border-yellow-400">
                💰 $2,750 + Ray-Ban Prize
              </Badge>
            </div>
            
            {/* Auth0 User Profile Section */}
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-900/30 to-orange-700/20 rounded-xl border border-orange-400/50">
              {user.user ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-3">
                    {user.user.picture && (
                      <img 
                        src={user.user.picture} 
                        alt="Profile" 
                        className="w-12 h-12 rounded-full border-2 border-orange-400"
                      />
                    )}
                    <div>
                      <div className="text-lg font-bold text-orange-300">
                        🔐 Welcome, {getUserDisplayName(user.user)}!
                      </div>
                      <div className="text-sm text-orange-200">
                        {isPremiumUser(user.user) && '👑 Premium • '}
                        Experience: {getUserExperienceLevel(user.user)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-orange-600/30 border-orange-400">
                      🔐 Mock Auth Active
                    </Badge>
                    <Button
                      onClick={mockLogout}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 text-sm"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="text-lg font-bold text-orange-300">🔐 Demo Authentication</div>
                  <p className="text-orange-200 text-sm">
                    Experience the D&D platform with demo user profiles (Auth0 integration in progress)
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={() => mockLogin('demo-user')}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      🔐 Login as Demo Player
                    </Button>
                    <Button
                      onClick={() => mockLogin('alex-dragonslayer')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      🐉 Login as Alex Dragon Slayer
                    </Button>
                    <Button
                      onClick={() => setPlayerName('Guest Player')}
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      🎮 Continue as Guest
                    </Button>
                  </div>
                  <div className="text-xs text-orange-200">
                    Try different user profiles to see Auth0-style authentication in action!
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Enhanced Session Creation */}
            <Card className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-lg border-blue-500/50 shadow-2xl transform hover:scale-105 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-3xl text-white flex items-center gap-3">
                  🚀 Start Your Adventure
                  <Badge variant="secondary" className="bg-blue-600/30">
                    New Session
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!user.user && (
                  <div className="space-y-3">
                    <label className="text-white font-medium text-lg flex items-center gap-2">
                      ⚔️ Your Character Name:
                    </label>
                    <Input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your heroic character name..."
                      className="text-lg p-4 bg-white/10 border-blue-400 text-white placeholder-blue-300 focus:border-blue-300 transition-all duration-300"
                    />
                    <div className="text-sm text-blue-200">
                      Choose a name worthy of legend! 🌟 (Or login with Auth0 for saved profiles)
                    </div>
                  </div>
                )}
                
                {user.user && (
                  <div className="space-y-3">
                    <div className="p-4 bg-green-600/20 rounded-lg border border-green-400/50">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-300 mb-2">
                          ⚔️ Ready to Adventure!
                        </div>
                        <div className="text-green-200">
                          Playing as: <strong>{getUserDisplayName(user.user)}</strong>
                        </div>
                        <div className="text-sm text-green-200 mt-1">
                          🔐 Authenticated with Auth0 • Profile automatically loaded
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 bg-purple-600/20 rounded-lg border border-purple-400/30">
                    <input
                      type="checkbox"
                      id="voice-mode"
                      checked={voiceMode}
                      onChange={(e) => setVoiceMode(e.target.checked)}
                      className="w-5 h-5 rounded accent-purple-500"
                    />
                    <label htmlFor="voice-mode" className="text-white text-lg flex items-center gap-2">
                      🎤 Enable Voice Acting
                      <Badge variant="outline" className="bg-purple-600/30 border-purple-400">
                        MiniMax Speech-02-HD
                      </Badge>
                    </label>
                  </div>
                  <div className="text-sm text-purple-200 pl-8">
                    Experience immersive D&D with AI character voices! 🎭
                  </div>
                </div>

                <Button 
                  onClick={createSession}
                  disabled={isCreatingSession || (!user.user && !playerName.trim())}
                  className="w-full text-xl p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                >
                  {isCreatingSession ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
                      🔄 Creating Epic Session...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {user.user ? '🔐 Begin Authenticated Adventure!' : '⚔️ Begin Epic Adventure!'}
                      <span className="animate-bounce">🌟</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Enhanced AI Companions Preview */}
            <Card className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-lg border-purple-500/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-3xl text-white flex items-center gap-3">
                  🤖 Your AI Companions
                  <Badge variant="secondary" className="bg-purple-600/30">
                    {aiPlayers.length} Heroes
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  {aiPlayers.map((player, index) => (
                    <div 
                      key={player.name} 
                      className="mb-4 p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-lg border border-white/20 hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-2">
                          <h4 className="text-white font-bold text-lg flex items-center gap-2">
                            {player.name}
                            <span className="text-sm">🏴‍☠️</span>
                          </h4>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="bg-blue-600/30">
                              {player.class}
                            </Badge>
                            <Badge variant="outline" className="bg-purple-600/20 border-purple-400">
                              {player.personality}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-300">
                            Level {player.level} | HP: {player.hp}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => testVoice(player.voice_id)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-110"
                        >
                          🎤 Test Voice
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <p className="text-blue-200 text-sm font-medium">{player.voice_description}</p>
                        <div className="text-xs text-purple-200 bg-purple-900/30 p-2 rounded">
                          💭 "{player.personality_traits[0] || 'Ready for adventure!'}"
                        </div>
                        <div className="flex gap-2 text-xs">
                          <Badge variant="outline" className="bg-red-600/20 border-red-400">
                            ⚔️ {player.weapons[0] || 'Weapon'}
                          </Badge>
                          <Badge variant="outline" className="bg-green-600/20 border-green-400">
                            🎭 {player.roleplay_style.split(' ')[0] || 'Roleplay'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Premium Sponsor Showcase */}
          <div className="mb-8 p-6 bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-lg rounded-xl border border-blue-500/30">
            <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
              🚀 Powered by Industry Leaders
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-orange-900/30 to-orange-700/20 rounded-lg border border-orange-400/50 hover:border-orange-300/70 transition-all duration-300 transform hover:scale-105">
                <div className="text-center space-y-2">
                  <div className="text-3xl">🔐</div>
                  <div className="font-bold text-orange-300">Auth0</div>
                  <div className="text-xs text-orange-200">Secure Authentication</div>
                  <Badge variant="outline" className="bg-orange-600/20 border-orange-400 text-xs">
                    {user.user ? '✅ Active' : 'User Profiles'}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-700/20 rounded-lg border border-blue-400/50 hover:border-blue-300/70 transition-all duration-300 transform hover:scale-105">
                <div className="text-center space-y-2">
                  <div className="text-3xl">🕷️</div>
                  <div className="font-bold text-blue-300">Apify</div>
                  <div className="text-xs text-blue-200">Web Scraping Platform</div>
                  <Badge variant="outline" className="bg-blue-600/20 border-blue-400 text-xs">
                    Dynamic Content
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-700/20 rounded-lg border border-green-400/50 hover:border-green-300/70 transition-all duration-300 transform hover:scale-105">
                <div className="text-center space-y-2">
                  <div className="text-3xl">🌐</div>
                  <div className="font-bold text-green-300">Browserbase</div>
                  <div className="text-xs text-green-200">AI Browser Automation</div>
                  <Badge variant="outline" className="bg-green-600/20 border-green-400 text-xs">
                    Smart Agents
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-700/20 rounded-lg border border-purple-400/50 hover:border-purple-300/70 transition-all duration-300 transform hover:scale-105">
                <div className="text-center space-y-2">
                  <div className="text-3xl">🔗</div>
                  <div className="font-bold text-purple-300">Linkup.so</div>
                  <div className="text-xs text-purple-200">Real-time D&D Content</div>
                  <Badge variant="outline" className="bg-green-600/20 border-green-400 text-xs animate-pulse">
                    ✅ ACTIVE
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-300 mb-3">
                🏆 <strong>Multi-Prize Strategy:</strong> Integrating cutting-edge technologies for maximum hackathon impact
              </p>
              <div className="flex justify-center space-x-2 text-xs">
                <Badge variant="outline" className="bg-red-600/20 border-red-400">Auth0 Prize Track</Badge>
                <Badge variant="outline" className="bg-blue-600/20 border-blue-400">Apify Challenge</Badge>
                <Badge variant="outline" className="bg-green-600/20 border-green-400">Browserbase Innovation</Badge>
                <Badge variant="outline" className="bg-purple-600/20 border-purple-400">✅ Linkup D&D Enhancement</Badge>
              </div>
            </div>
          </div>

          {/* Enhanced Feature Showcase */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-900/30 to-green-700/20 border-green-400/50 hover:border-green-300/70 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🎤</div>
                <h3 className="text-xl text-green-300 font-bold mb-2">MiniMax Voice Acting</h3>
                <div className="text-sm text-green-200 space-y-1">
                  <div>• Speech-02-HD: World's best TTS</div>
                  <div>• 8 Unique D&D character voices</div>
                  <div>• Real-time audio generation</div>
                  <div>• Emotional voice intelligence</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/30 to-blue-700/20 border-blue-400/50 hover:border-blue-300/70 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl text-blue-300 font-bold mb-2">AI Companions</h3>
                <div className="text-sm text-blue-200 space-y-1">
                  <div>• 4 Smart AI party members</div>
                  <div>• Unique personalities & voices</div>
                  <div>• Turn-based multiplayer</div>
                  <div>• Autonomous decision making</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/30 to-purple-700/20 border-purple-400/50 hover:border-purple-300/70 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl text-purple-300 font-bold mb-2">Hackathon Prize</h3>
                <div className="text-sm text-purple-200 space-y-1">
                  <div>• $2,750 cash prize target</div>
                  <div>• + Ray-Ban smart glasses</div>
                  <div>• AWS MCP Agents integration</div>
                  <div>• Professional voice demo</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card className="bg-gradient-to-r from-black/40 to-black/20 backdrop-blur-lg border-gray-500/30 shadow-xl">
            <CardContent className="p-6">
              <h3 className="text-2xl text-white font-bold mb-4 text-center">🔧 System Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-green-400 font-bold">✅ Backend API</div>
                  <div className="text-xs text-gray-300">Multiplayer Ready</div>
                </div>
                <div className="space-y-2">
                  <div className="text-green-400 font-bold">✅ MiniMax API</div>
                  <div className="text-xs text-gray-300">Voice Generation</div>
                </div>
                <div className="space-y-2">
                  <div className="text-green-400 font-bold">✅ AI Companions</div>
                  <div className="text-xs text-gray-300">4 Characters Ready</div>
                </div>
                <div className="space-y-2">
                  <div className="text-green-400 font-bold">✅ UI Components</div>
                  <div className="text-xs text-gray-300">Enhanced Design</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <audio 
          ref={audioRef} 
          onEnded={handleAudioEnded}
          onLoadStart={() => console.log("🎤 Loading audio...")}
          onCanPlay={() => console.log("🎤 Audio ready to play")}
          onError={(e) => console.error("🎤 Audio error:", e)}
          style={{ display: 'none' }}
        />
      </div>
    );
  }

  // Main Game UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-6 p-6 bg-black/40 backdrop-blur-lg rounded-xl border border-purple-500/30 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                🌟 {session.party_stats?.location || 'The Adventure Continues'}
              </h1>
              <div className="flex items-center space-x-4 text-white">
                <Badge variant="outline" className="bg-blue-600/20 border-blue-400">
                  🎮 Session: {session.session_id}
                </Badge>
                <Badge variant="outline" className="bg-green-600/20 border-green-400">
                  🎲 Turn: {session.party_stats?.total_turns || 0}
                </Badge>
                <Badge variant={voiceMode ? "default" : "secondary"} className={voiceMode ? "bg-purple-600 animate-pulse" : ""}>
                  {voiceMode ? '🎤 Voice Acting ON' : '🔇 Voice Off'}
                </Badge>
                <Badge variant="outline" className="bg-yellow-600/20 border-yellow-400">
                  ⚡ Current: {session.current_turn}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-purple-300 mb-2">🏆 Hackathon Demo</div>
              <div className="text-xs text-gray-400">MiniMax Speech-02-HD • $2,750 Prize</div>
              {/* NEW: Sponsor Tech Stack */}
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="bg-orange-600/20 border-orange-400 text-xs">
                  🔐 Auth0
                </Badge>
                <Badge variant="outline" className="bg-blue-600/20 border-blue-400 text-xs">
                  🕷️ Apify
                </Badge>
                <Badge variant="outline" className="bg-green-600/20 border-green-400 text-xs">
                  🌐 Browserbase
                </Badge>
                <Badge variant="outline" className="bg-purple-600/20 border-purple-400 text-xs">
                  🔗 Linkup.so
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Enhanced Party Members Panel */}
          <Card className="lg:col-span-1 bg-gradient-to-b from-black/40 to-black/20 backdrop-blur-lg border-blue-500/50 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                👥 Party Members
                <Badge variant="secondary" className="text-xs">{session.party_members.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                {session.party_members.map((member: any, index: number) => (
                  <div 
                    key={member.name} 
                    className={`mb-3 p-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                      member.name === session.current_turn 
                        ? 'bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border border-yellow-400/50 shadow-lg' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">
                          {member.name}
                          {member.name === session.current_turn && (
                            <span className="text-yellow-400 animate-bounce">⭐</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-300 capitalize">{member.class}</div>
                        {member.type === 'ai' && (
                          <div className="text-xs text-blue-300">HP: {member.hp} | Lv.{member.level}</div>
                        )}
                      </div>
                      <Badge 
                        variant={member.type === 'human' ? 'default' : 'secondary'}
                        className={member.type === 'human' ? 'bg-green-600' : 'bg-purple-600'}
                      >
                        {member.type === 'human' ? '👤 You' : '🤖 AI'}
                      </Badge>
                    </div>
                    {member.type === 'ai' && (
                      <div className="space-y-2">
                        <div className="text-xs text-purple-200">
                          🎭 {member.personality_traits?.[0] || 'Mysterious'}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => testVoice(member.voice_id)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs transition-all duration-300"
                        >
                          🎤 Test Voice
                        </Button>
                      </div>
                    )}
                    {member.type === 'human' && (
                      <div className="space-y-1 mt-2">
                        <Button
                          size="sm"
                          onClick={() => setShowCharacterSheet(true)}
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-xs transition-all duration-300"
                        >
                          📊 Character Sheet
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Enhanced Adventure Log */}
          <Card className="lg:col-span-2 bg-gradient-to-b from-black/40 to-black/20 backdrop-blur-lg border-purple-500/50 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                📜 Adventure Log
                <Badge variant="outline" className="text-xs">
                  {gameHistory.length} events
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {gameHistory.map((turn, index) => (
                  <div 
                    key={index} 
                    className="mb-4 p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-lg border border-white/20 hover:border-purple-400/50 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant="outline" 
                          className={`${
                            turn.player_name === 'Dungeon Master' 
                              ? 'bg-purple-600/30 border-purple-400' 
                              : turn.player_name === session.human_player 
                                ? 'bg-green-600/30 border-green-400' 
                                : 'bg-blue-600/30 border-blue-400'
                          }`}
                        >
                          {turn.player_name === 'Dungeon Master' ? '🎭' : 
                           turn.player_name === session.human_player ? '👤' : '🤖'}
                        </Badge>
                        <span className="text-white font-medium">{turn.player_name}</span>
                        {currentlyPlaying === turn.player_name && (
                          <Badge variant="default" className="animate-pulse bg-green-600">
                            🔊 Speaking
                          </Badge>
                        )}
                        {audioQueue.some(audio => audio.speaker === turn.player_name) && (
                          <Badge variant="secondary" className="animate-bounce bg-yellow-600">
                            ⏳ Queued
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {turn.audio_file && (
                          <Button
                            size="sm"
                            onClick={() => playAudio(turn.audio_file!, turn.player_name)}
                            disabled={currentlyPlaying !== null}
                            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all duration-300"
                          >
                            {currentlyPlaying === turn.player_name ? '🔊' : '🎤'} Play
                          </Button>
                        )}
                        <div className="text-xs text-gray-400">
                          {new Date(turn.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-white leading-relaxed">{turn.dialogue}</p>
                      {turn.action !== 'dm_response' && turn.action !== 'campaign_start' && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            ⚔️ {turn.action}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(isLoading) && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-400/50 animate-pulse">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant="outline" className="bg-purple-600/30 border-purple-400">🎭</Badge>
                      <span className="text-white font-medium">AI Processing...</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="animate-spin h-5 w-5 border-2 border-purple-300 border-t-transparent rounded-full"></div>
                      <p className="text-purple-200">
                        🧠 AI companions are thinking and responding...
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Enhanced Action Panel */}
          <Card className="lg:col-span-1 bg-gradient-to-b from-black/40 to-black/20 backdrop-blur-lg border-green-500/50 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                ⚔️ Your Turn
                {session.current_turn === session.human_player && (
                  <Badge variant="default" className="bg-green-600 animate-pulse">
                    Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium flex items-center gap-2 mb-2">
                  🎯 Action:
                </label>
                <Input
                  value={currentAction}
                  onChange={(e) => setCurrentAction(e.target.value)}
                  placeholder="investigate, attack, cast spell..."
                  className="bg-white/10 border-gray-600 text-white placeholder-gray-400 focus:border-green-400 transition-colors"
                  disabled={isLoading}
                />
                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => setCurrentAction('investigate')}
                    className="bg-blue-600/80 hover:bg-blue-600 text-xs"
                    disabled={isLoading}
                  >
                    🔍 Investigate
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentAction('attack')}
                    className="bg-red-600/80 hover:bg-red-600 text-xs"
                    disabled={isLoading}
                  >
                    ⚔️ Attack
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentAction('cast spell')}
                    className="bg-purple-600/80 hover:bg-purple-600 text-xs"
                    disabled={isLoading}
                  >
                    ✨ Cast Spell
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentAction('talk')}
                    className="bg-green-600/80 hover:bg-green-600 text-xs"
                    disabled={isLoading}
                  >
                    💬 Talk
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-white text-sm font-medium flex items-center gap-2 mb-2">
                  💬 Dialogue:
                </label>
                <Textarea
                  value={currentDialogue}
                  onChange={(e) => setCurrentDialogue(e.target.value)}
                  placeholder="What do you say or do?"
                  className="bg-white/10 border-gray-600 text-white placeholder-gray-400 focus:border-green-400 transition-colors"
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <Button
                onClick={submitAction}
                disabled={isLoading || !currentAction.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    🔄 Processing...
                  </div>
                ) : (
                  '🎲 Take Action!'
                )}
              </Button>

              <Separator className="bg-white/20" />

              {/* Voice Controls */}
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-white text-sm mb-2 font-medium">🎤 Audio Status:</p>
                  {currentlyPlaying ? (
                    <Badge variant="default" className="text-sm px-3 py-1 bg-green-600 animate-pulse">
                      🔊 {currentlyPlaying} Speaking
                    </Badge>
                  ) : audioQueue.length > 0 ? (
                    <Badge variant="secondary" className="text-sm px-3 py-1 bg-yellow-600 animate-bounce">
                      ⏳ {audioQueue.length} Voice{audioQueue.length !== 1 ? 's' : ''} Queued
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-gray-600/30">
                      🔇 Ready for Audio
                    </Badge>
                  )}
                </div>
                
                {audioQueue.length > 0 && (
                  <div className="text-center space-y-2">
                    <Button
                      size="sm"
                      onClick={() => setAudioQueue([])}
                      className="bg-red-600 hover:bg-red-700 text-xs"
                    >
                      🗑️ Clear Audio Queue
                    </Button>
                    <div className="text-xs text-purple-200">
                      Next: {audioQueue[0]?.speaker}
                    </div>
                  </div>
                )}
                
                {/* Volume Control */}
                <div className="space-y-2">
                  <label className="text-white text-xs font-medium flex items-center gap-2">
                    🔊 Voice Volume:
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">🔇</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value);
                        setVolume(newVolume);
                        if (audioRef.current) {
                          audioRef.current.volume = newVolume;
                        }
                      }}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-400">🔊</span>
                  </div>
                  <div className="text-xs text-center text-purple-200">
                    Volume: {Math.round(volume * 100)}%
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3">
                <div>
                  <p className="text-white text-sm mb-2 font-medium">Current Turn:</p>
                  <Badge 
                    variant="default" 
                    className={`text-lg px-4 py-2 ${
                      session.current_turn === session.human_player 
                        ? 'bg-green-600 animate-pulse' 
                        : 'bg-blue-600'
                    }`}
                  >
                    {session.current_turn}
                  </Badge>
                </div>
                
                <div className="text-xs text-gray-400 space-y-1">
                  <div>🏆 Prize Target: $2,750 + Ray-Ban</div>
                  <div>🎤 MiniMax Speech-02-HD</div>
                  <div>🤖 AWS MCP Agents</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => setShowGameGuide(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-sm"
                  >
                    📖 How to Play
                  </Button>
                  
                  <Button
                    onClick={() => setShowDiceRoller(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-sm"
                  >
                    🎲 Roll Dice
                  </Button>

                  <Button
                    onClick={() => setShowLinkupPanel(true)}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-sm"
                  >
                    🔗 Linkup D&D
                  </Button>
                </div>
                
                <Button
                  onClick={async () => {
                    try {
                      console.log("🔍 Current Session:", session);
                      const response = await fetch(`${BACKEND_URL}/api/multiplayer/debug/sessions`);
                      const data = await response.json();
                      console.log("🔍 Debug Sessions:", data);
                      alert(`Debug info logged to console. Session ID: ${session?.session_id}, Player: ${session?.human_player}`);
                    } catch (error) {
                      console.error("Debug error:", error);
                    }
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-xs"
                >
                  🔧 Debug Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Scene Description */}
        <Card className="mt-6 bg-gradient-to-r from-black/40 to-black/20 backdrop-blur-lg border-yellow-500/50 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              🌟 Current Scene
              <Badge variant="outline" className="bg-yellow-600/20 border-yellow-400">
                {session.campaign_title || 'Epic Adventure'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-6 rounded-lg border border-yellow-500/30">
              <p className="text-white text-lg leading-relaxed font-medium">
                {session.current_scene}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <audio 
        ref={audioRef} 
        onEnded={handleAudioEnded}
        onLoadStart={() => console.log("🎤 Loading audio...")}
        onCanPlay={() => console.log("🎤 Audio ready to play")}
        onError={(e) => console.error("🎤 Audio error:", e)}
        style={{ display: 'none' }}
      />
      
      {/* Dice Roller Modal */}
      {showDiceRoller && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  🎲 Advanced Dice Roller
                </h2>
                <Button
                  onClick={() => setShowDiceRoller(false)}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  ✕ Close
                </Button>
              </div>

              <DiceRoller
                onRollComplete={(result) => {
                  console.log("🎲 Dice roll result:", result);
                  // You can add the dice roll to game history or trigger AI responses
                  const newTurn = {
                    player_name: session?.human_player || 'Player',
                    action: 'dice_roll',
                    dialogue: `Rolled ${result.die}: ${result.roll} + ${result.modifier} = ${result.total}`,
                    timestamp: new Date().toISOString()
                  };
                  setGameHistory(prev => [newTurn, ...prev]);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Character Sheet Modal */}
      {showCharacterSheet && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  📊 Character Sheet
                </h2>
                <Button
                  onClick={() => setShowCharacterSheet(false)}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  ✕ Close
                </Button>
              </div>

              <CharacterSheet
                character={playerCharacter}
                onCharacterUpdate={(character) => {
                  setPlayerCharacter(character);
                  console.log("💾 Character updated:", character);
                }}
                onStatRoll={(stat, roll) => {
                  console.log(`🎲 ${stat} check:`, roll);
                  // Add stat roll to game history
                  const newTurn = {
                    player_name: session?.human_player || 'Player',
                    action: 'ability_check',
                    dialogue: `${stat.charAt(0).toUpperCase() + stat.slice(1)} check: ${roll}`,
                    timestamp: new Date().toISOString()
                  };
                  setGameHistory(prev => [newTurn, ...prev]);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Game Guide Modal */}
      {showGameGuide && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  📖 How to Play Multiplayer D&D
                </h2>
                <Button
                  onClick={() => setShowGameGuide(false)}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  ✕ Close
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Basic Actions */}
                <Card className="bg-black/30 border-blue-500/50">
                  <CardHeader>
                    <CardTitle className="text-white">⚔️ Basic Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-600/20 rounded">
                      <div className="text-blue-300 font-bold">🔍 Investigate</div>
                      <div className="text-gray-300">
                        • "I investigate the ancient door"<br/>
                        • "I search for traps"<br/>
                        • "I examine the mysterious runes"
                      </div>
                    </div>
                    <div className="p-3 bg-red-600/20 rounded">
                      <div className="text-red-300 font-bold">⚔️ Attack</div>
                      <div className="text-gray-300">
                        • "I attack the orc with my sword"<br/>
                        • "I cast fireball at the enemies"<br/>
                        • "I shoot my bow at the target"
                      </div>
                    </div>
                    <div className="p-3 bg-green-600/20 rounded">
                      <div className="text-green-300 font-bold">💬 Talk/Social</div>
                      <div className="text-gray-300">
                        • "I try to persuade the guard"<br/>
                        • "I ask the NPC about the quest"<br/>
                        • "I negotiate for better prices"
                      </div>
                    </div>
                    <div className="p-3 bg-purple-600/20 rounded">
                      <div className="text-purple-300 font-bold">✨ Cast Spell</div>
                      <div className="text-gray-300">
                        • "I cast healing light on my ally"<br/>
                        • "I use magic missile"<br/>
                        • "I cast detect magic"
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dialogue Examples */}
                <Card className="bg-black/30 border-purple-500/50">
                  <CardHeader>
                    <CardTitle className="text-white">💬 What to Say</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="p-3 bg-yellow-600/20 rounded">
                      <div className="text-yellow-300 font-bold">🗨️ In-Character Speech</div>
                      <div className="text-gray-300">
                        • "Hello, kind innkeeper! Do you have any rooms available?"<br/>
                        • "We're looking for information about the missing merchant."<br/>
                        • "Stand back, foul creature! We will not let you pass!"
                      </div>
                    </div>
                    <div className="p-3 bg-cyan-600/20 rounded">
                      <div className="text-cyan-300 font-bold">🎭 Roleplay Descriptions</div>
                      <div className="text-gray-300">
                        • "I cautiously approach the door, checking for any signs of danger."<br/>
                        • "I draw my sword and prepare for battle."<br/>
                        • "I smile warmly and extend my hand in friendship."
                      </div>
                    </div>
                    <div className="p-3 bg-pink-600/20 rounded">
                      <div className="text-pink-300 font-bold">🤝 Party Coordination</div>
                      <div className="text-gray-300">
                        • "Thorgar, can you tank this enemy while I heal?"<br/>
                        • "Elara, do you know any spells that could help here?"<br/>
                        • "Let's work together to solve this puzzle."
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Companions Guide */}
                <Card className="bg-black/30 border-green-500/50">
                  <CardHeader>
                    <CardTitle className="text-white">🤖 AI Companions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="p-2 bg-blue-600/20 rounded">
                      <div className="text-blue-300 font-bold">⚔️ Thorgar Ironbeard (Dwarf Warrior)</div>
                      <div className="text-gray-300 text-xs">Brave, loyal, great for combat and protection</div>
                    </div>
                    <div className="p-2 bg-purple-600/20 rounded">
                      <div className="text-purple-300 font-bold">✨ Elara Moonwhisper (Elf Mage)</div>
                      <div className="text-gray-300 text-xs">Wise, magical, perfect for spells and lore</div>
                    </div>
                    <div className="p-2 bg-green-600/20 rounded">
                      <div className="text-green-300 font-bold">🗡️ Zara Swiftblade (Human Rogue)</div>
                      <div className="text-gray-300 text-xs">Witty, clever, expert at stealth and traps</div>
                    </div>
                    <div className="p-2 bg-yellow-600/20 rounded">
                      <div className="text-yellow-300 font-bold">📚 Brother Marcus (Cleric)</div>
                      <div className="text-gray-300 text-xs">Protective, wise, provides healing and guidance</div>
                    </div>
                    <div className="mt-3 p-3 bg-gray-600/20 rounded">
                      <div className="text-gray-300 text-xs">
                        💡 <strong>Tip:</strong> Your AI companions will automatically respond to situations and help in combat. They have unique voices and personalities!
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Game Flow */}
                <Card className="bg-black/30 border-yellow-500/50">
                  <CardHeader>
                    <CardTitle className="text-white">🎲 Game Flow</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">1</span>
                        <span className="text-white">Read the scene description</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">2</span>
                        <span className="text-white">Choose an action (investigate, attack, talk, etc.)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">3</span>
                        <span className="text-white">Write what your character says or does</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">4</span>
                        <span className="text-white">Click "Take Action!" to submit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">5</span>
                        <span className="text-white">AI companions and DM respond with voice!</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-green-600/20 rounded">
                      <div className="text-green-300 font-bold text-xs">✨ Pro Tips:</div>
                      <div className="text-gray-300 text-xs space-y-1 mt-1">
                        • Be creative and descriptive!<br/>
                        • Work with your AI companions<br/>
                        • Listen to the voice acting with 🎤<br/>
                        • Ask questions to learn about the world<br/>
                        • Don't be afraid to try new things!
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 text-center">
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-4 rounded-lg border border-purple-400/30">
                  <h3 className="text-lg font-bold text-white mb-2">🏆 You're Playing in a Hackathon Demo!</h3>
                  <p className="text-gray-300 text-sm">
                    This is a cutting-edge AI D&D system featuring MiniMax Speech-02-HD voice acting, 
                    autonomous AI companions, and real-time multiplayer gameplay. Have fun exploring!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Linkup Panel Modal */}
      {showLinkupPanel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-green-500/50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                  🔗 Linkup.so D&D Enhancement
                </h2>
                <Button
                  onClick={() => setShowLinkupPanel(false)}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  ✕ Close
                </Button>
              </div>

              <LinkupPanel
                onContentAdded={(content, type) => {
                  console.log(`🔗 Linkup content added: ${type}`, content);
                  
                  // Add Linkup content to game history
                  const newTurn = {
                    player_name: '🔗 Linkup.so',
                    action: `web_search_${type}`,
                    dialogue: `📚 Found D&D content: ${content.substring(0, 200)}...`,
                    timestamp: new Date().toISOString()
                  };
                  setGameHistory(prev => [newTurn, ...prev]);
                  
                  // Show success notification
                  const notification = document.createElement('div');
                  notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 animate-bounce';
                  notification.innerHTML = `
                    <div class="flex items-center gap-2">
                      <span class="text-xl">🔗</span>
                      <div>
                        <div class="font-bold">Linkup Content Added!</div>
                        <div class="text-sm">Enhanced with real-time web content</div>
                      </div>
                    </div>
                  `;
                  document.body.appendChild(notification);
                  
                  setTimeout(() => {
                    if (document.body.contains(notification)) {
                      document.body.removeChild(notification);
                    }
                  }, 4000);
                  
                  // Auto-close modal after adding content
                  setTimeout(() => {
                    setShowLinkupPanel(false);
                  }, 1000);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
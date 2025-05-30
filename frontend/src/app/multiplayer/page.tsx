'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

// Enhanced interfaces with better typing
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
  id?: string; // Add unique ID for better React rendering
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

// Enhanced error types
interface AppError {
  type: 'network' | 'api' | 'validation' | 'audio' | 'unknown';
  message: string;
  details?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export default function MultiplayerPage() {
  // State Management with better organization
  const [session, setSession] = useState<MultiplayerSession | null>(null);
  const [aiPlayers, setAiPlayers] = useState<AIPlayer[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [currentAction, setCurrentAction] = useState('');
  const [currentDialogue, setCurrentDialogue] = useState('');
  const [gameHistory, setGameHistory] = useState<GameTurn[]>([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  
  // UI states
  const [voiceMode, setVoiceMode] = useState(true);
  const [showGameGuide, setShowGameGuide] = useState(false);
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [showLinkupPanel, setShowLinkupPanel] = useState(false);
  const [playerCharacter, setPlayerCharacter] = useState<any>(null);
  
  // Audio Management with better state handling
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioQueue, setAudioQueue] = useState<Array<{text: string, speaker: string, audioUrl: string, id: string}>>([]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Speech-to-Text functionality
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<'typing' | 'speaking'>('typing');

  // Auth0 integration
  const user = useUser();

  // Enhanced error handling function
  const handleError = useCallback((error: any, type: AppError['type'] = 'unknown') => {
    console.error(`${type} error:`, error);
    
    const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred';
    const errorDetails = error?.stack || error?.details;
    
    setError({
      type,
      message: errorMessage,
      details: errorDetails
    });

    // Auto-clear error after 10 seconds
    setTimeout(() => setError(null), 10000);
  }, []);

  // Enhanced connection check
  const checkBackendConnection = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetch(`${BACKEND_URL}/health`, { 
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        setConnectionStatus('connected');
        setError(null);
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      handleError(error, 'network');
    }
  }, [handleError]);

  // Load AI Players with better error handling
  const loadAiPlayers = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/multiplayer/ai-players`, {
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load AI players: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setAiPlayers(data.ai_players);
      } else {
        throw new Error(data.message || 'Failed to load AI players');
      }
    } catch (error) {
      handleError(error, 'api');
    }
  }, [handleError]);

  // Enhanced initialization
  useEffect(() => {
    const initializeApp = async () => {
      await checkBackendConnection();
      await loadAiPlayers();
      
      // Show game guide on first visit
      const hasSeenGuide = localStorage.getItem('dnd-guide-seen');
      if (!hasSeenGuide) {
        setShowGameGuide(true);
        localStorage.setItem('dnd-guide-seen', 'true');
      }
    };

    initializeApp();
  }, [checkBackendConnection, loadAiPlayers]);

  // Initialize speech recognition separately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsListening(true);
          setSpeechError(null);
        };
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setCurrentAction(transcript);
          // Show success notification in the UI
          setTimeout(() => {
            showNotification(`✅ Heard: "${transcript}"`, 'success', 3000);
          }, 100);
        };
        
        recognition.onerror = (event: any) => {
          setIsListening(false);
          setSpeechError(`Speech recognition error: ${event.error}`);
          setTimeout(() => {
            showNotification(`❌ Speech error: ${event.error}`, 'error');
          }, 100);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        setSpeechRecognition(recognition);
        setSpeechSupported(true);
      } else {
        setSpeechSupported(false);
        console.log('Speech recognition not supported in this browser');
      }
    }
  }, []);

  // Enhanced auto-play audio queue with error handling
  useEffect(() => {
    if (audioQueue.length > 0 && !isPlayingSequence && !currentlyPlaying) {
      playNextInQueue();
    }
  }, [audioQueue, isPlayingSequence, currentlyPlaying]);

  // Memoized quick action buttons for better performance
  const quickActionButtons = useMemo(() => [
    { action: 'investigate', label: '🔍 Investigate', color: 'bg-blue-600/80 hover:bg-blue-600' },
    { action: 'attack', label: '⚔️ Attack', color: 'bg-red-600/80 hover:bg-red-600' },
    { action: 'cast spell', label: '✨ Cast Spell', color: 'bg-purple-600/80 hover:bg-purple-600' },
    { action: 'talk', label: '💬 Talk', color: 'bg-green-600/80 hover:bg-green-600' }
  ], []);

  // Enhanced session creation with validation
  const createSession = useCallback(async () => {
    const effectivePlayerName = user.user ? getUserDisplayName(user.user) : playerName.trim();
    
    if (!effectivePlayerName) {
      setError({
        type: 'validation',
        message: 'Please enter your character name or login with Auth0!'
      });
      return;
    }

    if (connectionStatus === 'disconnected') {
      setError({
        type: 'network',
        message: 'Cannot create session: Backend server is not connected'
      });
      return;
    }

    setIsCreatingSession(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/multiplayer/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: effectivePlayerName,
          voice_mode: voiceMode,
          user_profile: user.user ? {
            auth0_id: user.user.sub,
            email: user.user.email,
            picture: user.user.picture,
            experience_level: getUserExperienceLevel(user.user),
            is_premium: isPremiumUser(user.user)
          } : null
        }),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error (${response.status})`);
      }

      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        
        // Enhanced audio queue with unique IDs
        if (data.session.opening_scene?.audio_file && voiceMode) {
          setTimeout(() => {
            addToAudioQueue(
              data.session.opening_scene.description + ' ' + data.session.opening_scene.dm_welcome,
              'Dungeon Master',
              data.session.opening_scene.audio_file
            );
          }, 1000);
        }
        
        // Add opening to history with unique ID
        const openingTurn: GameTurn = {
          id: `opening-${Date.now()}`,
          player_name: 'Dungeon Master',
          action: 'campaign_start',
          dialogue: data.session.opening_scene.description + ' ' + data.session.opening_scene.dm_welcome,
          voice_id: 'dm_narrator',
          audio_file: data.session.opening_scene?.audio_file,
          timestamp: new Date().toISOString()
        };
        setGameHistory([openingTurn]);
        
        // Success notification
        showNotification('Session created successfully!', 'success');
      } else {
        throw new Error(data.message || 'Unknown error occurred');
      }
    } catch (error) {
      handleError(error, 'api');
    } finally {
      setIsCreatingSession(false);
    }
  }, [user.user, playerName, voiceMode, connectionStatus, handleError]);

  // Enhanced notification system
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 4000) => {
    const notification = document.createElement('div');
    const colors = {
      success: 'bg-green-600',
      error: 'bg-red-600', 
      info: 'bg-blue-600'
    };
    
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300`;
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-lg">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <div class="font-medium">${message}</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, duration);
  }, []);

  // Speech control functions
  const startListening = useCallback(() => {
    if (speechRecognition && !isListening) {
      try {
        speechRecognition.start();
        showNotification('🎤 Listening... Speak now!', 'info', 2000);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setSpeechError('Failed to start speech recognition');
        showNotification('❌ Speech recognition failed to start', 'error');
      }
    }
  }, [speechRecognition, isListening, showNotification]);

  const stopListening = useCallback(() => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
    }
  }, [speechRecognition, isListening]);

  // Enhanced audio functions with better error handling
  const addToAudioQueue = useCallback((text: string, speaker: string, audioUrl: string) => {
    const audioItem = {
      text,
      speaker,
      audioUrl,
      id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setAudioQueue(prev => [...prev, audioItem]);
  }, []);

  const playAudio = useCallback(async (audioUrl: string, speaker: string) => {
    if (!audioRef.current) return;
    
    try {
      setCurrentlyPlaying(speaker);
      setAudioError(null);
      
      audioRef.current.src = `${BACKEND_URL}${audioUrl}`;
      audioRef.current.volume = volume;
      
      await audioRef.current.play();
      
      // Visual feedback for DM narration
      if (speaker === 'Dungeon Master') {
        document.body.style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
        setTimeout(() => {
          document.body.style.backgroundColor = '';
        }, 200);
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      setAudioError(`Failed to play audio for ${speaker}`);
      setCurrentlyPlaying(null);
      handleError(error, 'audio');
    }
  }, [volume, handleError]);

  const playNextInQueue = useCallback(async () => {
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
  }, [audioQueue, isPlayingSequence, playAudio]);

  const handleAudioEnded = useCallback(() => {
    setCurrentlyPlaying(null);
    setIsPlayingSequence(false);
    setAudioError(null);
  }, []);

  // Enhanced action submission with better validation and error handling
  const submitAction = useCallback(async () => {
    if (!session || !currentAction.trim()) {
      setError({
        type: 'validation',
        message: 'Please enter an action before submitting'
      });
      return;
    }

    const sessionPlayerName = session.human_player || playerName || "Unknown Player";
    if (!sessionPlayerName || sessionPlayerName === "Unknown Player") {
      setError({
        type: 'validation',
        message: "Player name not found in session. Please restart the session."
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSpeechError(null); // Clear any speech errors when submitting
    
    // Show different feedback based on conversation mode
    if (conversationMode === 'speaking') {
      showNotification('🎮 Processing your spoken command...', 'info', 2000);
    }
    
    try {
      const requestBody = {
        session_id: session.session_id,
        player_name: sessionPlayerName,
        action: currentAction.trim(),
        dialogue: currentDialogue.trim(),
        generate_voice: voiceMode,
        interaction_mode: conversationMode // Add conversation mode to track user preference
      };

      const response = await fetch(`${BACKEND_URL}/api/multiplayer/player-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000) // 30 second timeout for AI processing
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        let errorMessage = `Server error (${response.status})`;
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage += `: ${data.detail}`;
          } else if (Array.isArray(data.detail)) {
            const errors = data.detail.map((err: any) => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
            errorMessage += `: ${errors}`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const newTurns: GameTurn[] = [];
        
        // Add human player turn with unique ID
        newTurns.push({
          id: `player-${Date.now()}`,
          player_name: sessionPlayerName,
          action: currentAction,
          dialogue: currentDialogue,
          timestamp: new Date().toISOString()
        });

        // Add DM response and queue voice
        if (data.turn_result.dm_response) {
          const dmTurn: GameTurn = {
            id: `dm-${Date.now()}`,
            player_name: 'Dungeon Master',
            action: 'dm_response',
            dialogue: data.turn_result.dm_response.dm_narration,
            voice_id: 'dm_narrator',
            audio_file: data.turn_result.dm_response.audio_file,
            timestamp: new Date().toISOString()
          };
          newTurns.push(dmTurn);
          
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

        // Add AI player responses with unique IDs
        if (data.turn_result.ai_responses) {
          data.turn_result.ai_responses.forEach((aiResponse: any, index: number) => {
            const aiTurn: GameTurn = {
              id: `ai-${Date.now()}-${index}`,
              player_name: aiResponse.player_name,
              action: aiResponse.action_type,
              dialogue: aiResponse.response,
              voice_id: aiResponse.voice_id,
              audio_file: aiResponse.audio_file,
              timestamp: new Date().toISOString()
            };
            newTurns.push(aiTurn);
            
            if (voiceMode && aiResponse.audio_file) {
              setTimeout(() => {
                addToAudioQueue(
                  aiResponse.response,
                  aiResponse.player_name,
                  aiResponse.audio_file
                );
              }, 1000 + (index * 300));
            }
          });
        }

        setGameHistory(prev => [...prev, ...newTurns]);
        setCurrentAction('');
        setCurrentDialogue('');
        
        // Enhanced voice notification
        if (voiceMode) {
          const audioCount = [
            data.turn_result.dm_response?.audio_file,
            ...(data.turn_result.ai_responses?.map((r: any) => r.audio_file) || [])
          ].filter(Boolean).length;
          
          if (audioCount > 0) {
            showNotification(`🎤 ${audioCount} character voices ready to play!`, 'success');
          }
        }
      } else {
        throw new Error(data.message || 'Action failed');
      }
    } catch (error) {
      handleError(error, 'api');
    } finally {
      setIsLoading(false);
    }
  }, [session, currentAction, currentDialogue, playerName, voiceMode, addToAudioQueue, showNotification, handleError, conversationMode]);

  // Enhanced voice testing with error handling
  const testVoice = useCallback(async (characterType: string) => {
    try {
      setAudioError(null);
      const response = await fetch(`${BACKEND_URL}/api/multiplayer/voice-test/${characterType}`, {
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`Voice test failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.voice_result?.audio_url) {
        await playAudio(data.voice_result.audio_url, characterType);
        showNotification(`🎤 Testing ${characterType} voice`, 'info');
      } else {
        throw new Error('Voice test failed. Check if MiniMax API is configured.');
      }
    } catch (error) {
      handleError(error, 'audio');
      showNotification('Voice test failed', 'error');
    }
  }, [playAudio, showNotification, handleError]);

  // Enhanced error display component
  const ErrorDisplay = ({ error }: { error: AppError }) => (
    <div className="fixed top-4 left-4 right-4 bg-red-900/90 border border-red-500 text-red-100 p-4 rounded-lg shadow-lg z-50 max-w-md mx-auto">
      <div className="flex items-start gap-3">
        <span className="text-red-400 text-lg">❌</span>
        <div className="flex-1">
          <div className="font-bold text-red-300">
            {error.type === 'network' ? 'Connection Error' :
             error.type === 'api' ? 'Server Error' :
             error.type === 'validation' ? 'Input Error' :
             error.type === 'audio' ? 'Audio Error' : 'Error'}
          </div>
          <div className="text-sm mt-1">{error.message}</div>
          {error.details && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer text-red-300">Show details</summary>
              <pre className="text-xs mt-1 text-red-200 whitespace-pre-wrap">{error.details}</pre>
            </details>
          )}
        </div>
        <Button
          onClick={() => setError(null)}
          className="text-red-300 hover:text-red-100 p-1"
          variant="ghost"
          size="sm"
        >
          ✕
        </Button>
      </div>
    </div>
  );

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className={`fixed top-4 left-4 px-3 py-1 rounded-full text-xs font-medium z-40 ${
      connectionStatus === 'connected' ? 'bg-green-600 text-white' :
      connectionStatus === 'connecting' ? 'bg-yellow-600 text-white animate-pulse' :
      'bg-red-600 text-white'
    }`}>
      {connectionStatus === 'connected' ? '🟢 Connected' :
       connectionStatus === 'connecting' ? '🟡 Connecting...' :
       '🔴 Disconnected'}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/fantasy-bg.jpg')] bg-cover bg-center opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-blue-500/10"></div>
        <div className="absolute animate-pulse top-1/4 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute animate-pulse delay-1000 bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Enhanced Audio Player with improved error handling */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={(e) => {
          console.error('Audio error:', e);
          setAudioError('Audio playback failed');
          setCurrentlyPlaying(null);
          setIsPlayingSequence(false);
        }}
        className="hidden"
      />

      {/* Audio Controls & Status */}
      {(currentlyPlaying || audioError || audioQueue.length > 0) && (
        <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-lg border border-purple-500/50 rounded-lg p-4 z-40 max-w-sm">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              {currentlyPlaying && (
                <div className="text-sm">
                  <div className="text-green-400 font-medium">🎤 Playing:</div>
                  <div className="text-white truncate">{currentlyPlaying}</div>
                </div>
              )}
              {audioError && (
                <div className="text-red-400 text-sm">
                  <div className="font-medium">❌ Audio Error:</div>
                  <div>{audioError}</div>
                </div>
              )}
              {audioQueue.length > 0 && !currentlyPlaying && (
                <div className="text-yellow-400 text-sm">
                  <div className="font-medium">⏳ Queue:</div>
                  <div>{audioQueue.length} voices waiting</div>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-16 h-2"
                title="Volume"
              />
              <div className="text-xs text-center text-gray-400">
                {Math.round(volume * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 bg-black/30 backdrop-blur-lg border border-purple-500/50 rounded-2xl px-8 py-4">
            <div className="text-4xl">🎲</div>
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                NeuroDungeon
              </h1>
              <p className="text-gray-300 mt-1">AI-Powered Multiplayer D&D Adventure</p>
            </div>
            <div className="text-4xl">⚔️</div>
          </div>
        </div>

        {!session ? (
          // Enhanced Session Creation UI
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-lg border-purple-500/50 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  🎲 Create Your Adventure
                </CardTitle>
                <p className="text-gray-300 mt-2">
                  Join an AI-powered D&D session with voice-acting companions
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Auth Section */}
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-6 rounded-lg border border-purple-400/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">👤 Player Identity</h3>
                    {user.user ? (
                      <Badge className="bg-green-600 text-white">
                        ✅ {getUserDisplayName(user.user)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                        Guest Mode
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {user.user ? (
                      <div className="bg-green-600/20 p-4 rounded border border-green-400/50">
                        <div className="flex items-center gap-3 mb-2">
                          {user.user?.picture && (
                            <img 
                              src={user.user.picture} 
                              alt="Profile" 
                              className="w-10 h-10 rounded-full border-2 border-green-400"
                            />
                          )}
                          <div>
                            <div className="text-green-300 font-bold">
                              Welcome, {getUserDisplayName(user.user)}!
                            </div>
                            <div className="text-green-400 text-sm">
                              Experience: {getUserExperienceLevel(user.user)} | 
                              {isPremiumUser(user.user) ? ' Premium User 👑' : ' Standard User'}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={mockLogout}
                          variant="outline"
                          size="sm"
                          className="border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
                        >
                          🚪 Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-white font-medium mb-2 block">Character Name:</label>
                          <Input
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Enter your D&D character name..."
                            className="bg-white/10 border-purple-400 text-white placeholder-purple-300 focus:border-purple-300"
                            disabled={isCreatingSession}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 text-sm mb-3">Or sign in for enhanced features:</p>
                          <Button
                            onClick={() => mockLogin()}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            disabled={isCreatingSession}
                          >
                            🔐 Login with Auth0
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Game Settings */}
                <div className="bg-gradient-to-r from-green-600/20 to-teal-600/20 p-6 rounded-lg border border-green-400/30">
                  <h3 className="text-lg font-bold text-white mb-4">⚙️ Game Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                      <div>
                        <div className="text-white font-medium">🎤 Voice Acting Mode</div>
                        <div className="text-gray-400 text-sm">
                          AI companions speak with unique voices using MiniMax Speech-02-HD
                        </div>
                      </div>
                      <Button
                        onClick={() => setVoiceMode(!voiceMode)}
                        className={voiceMode ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}
                        disabled={isCreatingSession}
                      >
                        {voiceMode ? '🔊 Enabled' : '🔇 Disabled'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => setShowGameGuide(true)}
                        variant="outline"
                        className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black"
                        disabled={isCreatingSession}
                      >
                        📖 How to Play
                      </Button>
                      <Button
                        onClick={() => setShowCharacterSheet(true)}
                        variant="outline" 
                        className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black"
                        disabled={isCreatingSession}
                      >
                        📜 Character Sheet
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Enhanced Start Button */}
                <div className="text-center">
                  <Button
                    onClick={createSession}
                    disabled={isCreatingSession || connectionStatus === 'disconnected'}
                    className="w-full py-4 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 shadow-lg transition-all duration-300 hover:shadow-purple-500/25"
                  >
                    {isCreatingSession ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Creating Adventure...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl">🚀</span>
                        Start Your Adventure!
                        <span className="text-2xl">⚔️</span>
                      </div>
                    )}
                  </Button>
                  
                  {connectionStatus === 'disconnected' && (
                    <div className="mt-2 text-red-400 text-sm">
                      ⚠️ Cannot start: Backend server disconnected
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Enhanced Game Session UI - Compact Single-View Layout
          <div className="grid grid-cols-2 gap-4 h-[calc(100vh-180px)]">
            {/* Top Left: Adventure Chronicle */}
            <Card className="bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-lg border-purple-500/50 shadow-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    📜 Adventure Chronicle
                    <Badge variant="outline" className="bg-purple-600/20 border-purple-400 text-xs">
                      {gameHistory.length} turns
                    </Badge>
                  </CardTitle>
                  {isLoading && (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <div className="animate-spin w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                      <span className="text-xs">AI Thinking...</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(50vh-120px)]">
                  <div className="space-y-2">
                    {gameHistory.map((turn, index) => (
                      <div
                        key={turn.id || `turn-${index}`}
                        className={`p-2 rounded-lg border-l-4 transition-all duration-300 hover:shadow-lg ${
                          turn.player_name === 'Dungeon Master'
                            ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-l-purple-400 hover:from-purple-600/30 hover:to-indigo-600/30'
                            : turn.player_name === session.human_player
                            ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-l-blue-400 hover:from-blue-600/30 hover:to-cyan-600/30'
                            : 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-l-green-400 hover:from-green-600/30 hover:to-emerald-600/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-white text-xs">
                              {turn.player_name === 'Dungeon Master' ? '🎭' : 
                               turn.player_name === session.human_player ? '👤' : '🤖'} 
                              {turn.player_name}
                            </span>
                            {turn.voice_id && (
                              <Badge variant="outline" className="text-xs bg-blue-600/20 border-blue-400 px-1 py-0">
                                🎤
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(turn.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        {turn.action && turn.action !== 'dm_response' && turn.action !== 'campaign_start' && (
                          <div className="text-xs text-gray-300 mb-1">
                            <strong>Action:</strong> {turn.action}
                          </div>
                        )}
                        
                        <div className="text-white text-xs leading-relaxed">
                          {turn.dialogue}
                        </div>
                        
                        {turn.audio_file && voiceMode && (
                          <div className="mt-1 flex items-center gap-1">
                            <Button
                              size="sm"
                              onClick={() => playAudio(turn.audio_file!, turn.player_name)}
                              disabled={currentlyPlaying === turn.player_name}
                              className="bg-blue-600/80 hover:bg-blue-600 text-xs px-1 py-0.5 h-6"
                            >
                              {currentlyPlaying === turn.player_name ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 animate-pulse bg-white rounded-full"></div>
                                  Playing
                                </div>
                              ) : (
                                <>🎤</>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Top Right: Your Turn */}
            <Card className="bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-lg border-green-500/50 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  ⚡ Your Turn
                  {session.current_turn && (
                    <Badge className="bg-green-600 text-xs">
                      {session.current_turn === session.human_player ? 'Your Turn!' : `${session.current_turn}'s Turn`}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white font-medium text-sm">What do you want to do?</label>
                    {speechSupported && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => setConversationMode(conversationMode === 'typing' ? 'speaking' : 'typing')}
                          className={`transition-all duration-300 text-xs px-2 py-1 h-6 ${
                            conversationMode === 'speaking' 
                              ? 'bg-purple-600 hover:bg-purple-700' 
                              : 'bg-gray-600 hover:bg-gray-700'
                          }`}
                        >
                          {conversationMode === 'speaking' ? '🎤 Voice' : '⌨️ Type'}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {conversationMode === 'speaking' ? (
                    <div className="space-y-2">
                      <div className={`relative border-2 rounded-lg p-4 transition-all duration-300 ${
                        isListening 
                          ? 'border-green-500 bg-green-500/10 animate-pulse' 
                          : 'border-purple-500 bg-purple-500/10'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {isListening ? (
                              <div className="text-green-400 font-medium text-sm">
                                🎤 Listening... Speak now!
                              </div>
                            ) : (
                              <div className="text-purple-400 font-medium text-sm">
                                🎙️ Click to speak with your AI companions
                              </div>
                            )}
                            {speechError && (
                              <div className="text-red-400 text-xs mt-1">
                                ❌ {speechError}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={isListening ? stopListening : startListening}
                            disabled={!speechSupported}
                            className={`transition-all duration-300 ${
                              isListening 
                                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                            size="sm"
                          >
                            {isListening ? (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                                Stop
                              </div>
                            ) : (
                              <>🎤 Speak</>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {currentAction && (
                        <div className="bg-blue-600/20 border border-blue-400 rounded-lg p-3">
                          <div className="text-blue-300 font-medium text-xs mb-1">Your spoken action:</div>
                          <div className="text-white text-sm">{currentAction}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input
                      value={currentAction}
                      onChange={(e) => setCurrentAction(e.target.value)}
                      placeholder="Describe your action (e.g., 'investigate the mysterious door')"
                      className="bg-white/10 border-green-400 text-white placeholder-green-300 focus:border-green-300 text-sm"
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && currentAction.trim()) {
                          e.preventDefault();
                          submitAction();
                        }
                      }}
                    />
                  )}
                  
                  {conversationMode === 'typing' && (
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {quickActionButtons.map((button) => (
                        <Button
                          key={button.action}
                          size="sm"
                          onClick={() => setCurrentAction(button.action)}
                          className={`${button.color} text-xs transition-all duration-200 hover:scale-105 py-1 px-2 h-7`}
                          disabled={isLoading}
                        >
                          {button.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-white font-medium mb-1 block text-sm">What do you say? (Optional)</label>
                  <Textarea
                    value={currentDialogue}
                    onChange={(e) => setCurrentDialogue(e.target.value)}
                    placeholder="Add dialogue or roleplay description..."
                    className="bg-white/10 border-green-400 text-white placeholder-green-300 focus:border-green-300 min-h-[60px] text-sm"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={submitAction}
                  disabled={isLoading || !currentAction.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-300 hover:shadow-green-500/25 py-2"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">⚡</span>
                      Take Action!
                      <span className="text-lg">🎲</span>
                    </div>
                  )}
                </Button>

                {/* Game Tools */}
                <div className="grid grid-cols-3 gap-1 mt-3">
                  <Button
                    onClick={() => setShowDiceRoller(true)}
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 text-xs py-1 h-8"
                  >
                    🎲 Dice
                  </Button>
                  <Button
                    onClick={() => setShowCharacterSheet(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 text-xs py-1 h-8"
                  >
                    📜 Sheet
                  </Button>
                  <Button
                    onClick={() => setShowLinkupPanel(true)}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 transition-all duration-300 hover:scale-105 animate-pulse text-xs py-1 h-8"
                  >
                    🔗 D&D
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Left: AI Companions */}
            <Card className="bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-lg border-blue-500/50 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  🤖 AI Companions
                  <Badge variant="outline" className="bg-blue-600/20 border-blue-400 text-xs">
                    {aiPlayers.length} Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 h-[calc(50vh-120px)] overflow-y-auto">
                  {aiPlayers.map((player, index) => (
                    <div key={index} className="p-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-400/30 transition-all duration-300 hover:from-blue-600/30 hover:to-cyan-600/30">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <div className="text-white font-bold text-sm">{player.name}</div>
                          <div className="text-blue-300 text-xs">{player.class} (Level {player.level})</div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => testVoice(player.voice_id)}
                          disabled={currentlyPlaying === player.voice_id}
                          className="bg-blue-600/80 hover:bg-blue-600 text-xs px-1 py-0.5 h-6"
                        >
                          {currentlyPlaying === player.voice_id ? '🔊' : '🎤'}
                        </Button>
                      </div>
                      <div className="text-xs text-gray-300 mb-1">{player.personality}</div>
                      <div className="text-xs text-blue-200 truncate">{player.voice_description}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bottom Right: Session Info */}
            <Card className="bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-lg border-purple-500/50 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">📊 Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-gray-400 text-xs">Session ID</div>
                    <div className="text-white font-mono text-xs">{session.session_id.slice(0, 8)}...</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Player</div>
                    <div className="text-white text-xs">{session.human_player}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Voice Mode</div>
                    <div className={voiceMode ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
                      {voiceMode ? '🔊 Enabled' : '🔇 Disabled'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Input Mode</div>
                    <div className={`text-xs ${conversationMode === 'speaking' ? 'text-purple-400' : 'text-blue-400'}`}>
                      {conversationMode === 'speaking' ? '🎤 Voice' : '⌨️ Typing'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Companions</div>
                    <div className="text-blue-400 text-xs">{aiPlayers.length} Active</div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-gray-400 text-xs">Current Turn</div>
                  <div className="text-green-400 text-sm font-bold">
                    {session.current_turn === session.human_player ? 'Your Turn!' : `${session.current_turn}'s Turn`}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-gray-400 text-xs">Turn History</div>
                  <div className="text-white text-xs">
                    {gameHistory.length} actions taken
                  </div>
                </div>

                <Separator className="bg-purple-500/30" />
                
                <Button
                  onClick={() => {
                    setSession(null);
                    setGameHistory([]);
                    setCurrentAction('');
                    setCurrentDialogue('');
                    setAudioQueue([]);
                    setCurrentlyPlaying(null);
                    setIsPlayingSequence(false);
                    setError(null);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-all duration-300 py-1 text-xs"
                >
                  🚪 End Session
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sponsor Showcase - Moved to Bottom */}
        {session && (
          <div className="mt-8 mb-4">
            <div className="bg-gradient-to-r from-black/30 to-black/10 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-3">
              <h2 className="text-sm font-medium text-yellow-400 mb-2 text-center">
                🏆 AWS MCP Agents Hackathon - Multi-Sponsor Integration
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  {
                    name: "MiniMax Speech-02-HD",
                    status: "ACTIVE",
                    prize: "$2,750 + Ray-Ban",
                    feature: "Voice AI",
                    color: "from-red-500/60 to-orange-500/60"
                  },
                  {
                    name: "Linkup.so",
                    status: "ACTIVE", 
                    prize: "D&D Enhancement",
                    feature: "Real-time Content",
                    color: "from-green-500/60 to-teal-500/60"
                  },
                  {
                    name: "Auth0",
                    status: "INTEGRATED",
                    prize: "Swag Pack",
                    feature: "Authentication",
                    color: "from-blue-500/60 to-indigo-500/60"
                  },
                  {
                    name: "Apify",
                    status: "READY",
                    prize: "Web Tools",
                    feature: "Dynamic Content",
                    color: "from-purple-500/60 to-pink-500/60"
                  }
                ].map((sponsor, index) => (
                  <div key={index} className={`bg-gradient-to-br ${sponsor.color} p-0.5 rounded`}>
                    <div className="bg-black/70 p-2 rounded h-full">
                      <div className="text-white font-medium text-xs mb-0.5">{sponsor.name}</div>
                      <div className="text-xs text-gray-400">{sponsor.status}</div>
                      <div className="text-xs text-yellow-300">{sponsor.prize}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Modal Components */}
      {showDiceRoller && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-lg rounded-xl max-w-md w-full border border-red-500/50 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-red-400">🎲 Dice Roller</h2>
                <Button
                  onClick={() => setShowDiceRoller(false)}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  ✕
                </Button>
              </div>
              <DiceRoller />
            </div>
          </div>
        </div>
      )}

      {showCharacterSheet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-lg rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/50 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-purple-400">📜 Character Sheet</h2>
                <Button
                  onClick={() => setShowCharacterSheet(false)}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  ✕
                </Button>
              </div>
              <CharacterSheet
                character={playerCharacter}
                onCharacterUpdate={setPlayerCharacter}
              />
            </div>
          </div>
        </div>
      )}

      {/* Game Guide Modal */}
      {showGameGuide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-lg rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-blue-500/50 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  📖 How to Play D&D with AI
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

                {/* Voice Features */}
                <Card className="bg-black/30 border-purple-500/50">
                  <CardHeader>
                    <CardTitle className="text-white">🎤 Voice Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="p-3 bg-purple-600/20 rounded">
                      <div className="text-purple-300 font-bold">🎭 Natural Conversation</div>
                      <div className="text-gray-300">
                        Click the voice toggle to speak directly to your AI companions! Just press "🎤 Speak" and talk naturally:
                        <br/>• "Hey everyone, I want to investigate that door"
                        <br/>• "Can we attack the creature together?"
                        <br/>• "What do you think we should do next?"
                      </div>
                    </div>
                    <div className="p-3 bg-green-600/20 rounded">
                      <div className="text-green-300 font-bold">🔊 Speech Recognition</div>
                      <div className="text-gray-300">
                        • Speak clearly in a quiet environment<br/>
                        • The system converts your speech to text automatically<br/>
                        • Edit the text if needed before submitting<br/>
                        • Works best in Chrome, Safari, and Edge browsers
                      </div>
                    </div>
                    <div className="p-3 bg-yellow-600/20 rounded">
                      <div className="text-yellow-300 font-bold">⚡ MiniMax Speech-02-HD</div>
                      <div className="text-gray-300">
                        Experience the world's most advanced text-to-speech technology with unique character voices for each AI companion and the Dungeon Master.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 text-center">
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-4 rounded-lg border border-purple-400/30">
                  <h3 className="text-lg font-bold text-white mb-2">🏆 You're Playing a Hackathon Demo!</h3>
                  <p className="text-gray-300 text-sm">
                    This cutting-edge AI D&D system showcases MiniMax Speech-02-HD, Linkup.so real-time content, 
                    Auth0 authentication, and autonomous AI companions in an epic multiplayer adventure!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Linkup Panel Modal */}
      {showLinkupPanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-lg rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-green-500/50 shadow-2xl">
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
                  
                  // Add Linkup content to game history with unique ID
                  const newTurn: GameTurn = {
                    id: `linkup-${Date.now()}`,
                    player_name: '🔗 Linkup.so',
                    action: `web_search_${type}`,
                    dialogue: `📚 Found D&D content: ${content.substring(0, 200)}...`,
                    timestamp: new Date().toISOString()
                  };
                  setGameHistory(prev => [newTurn, ...prev]);
                  
                  // Show enhanced success notification
                  showNotification('🔗 Linkup content added to game!', 'success');
                  
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

      {/* Error Notification */}
      {error && (
        <ErrorDisplay error={error} />
      )}

      {/* Connection Status Indicator */}
      <ConnectionStatus />
    </div>
  );
} 
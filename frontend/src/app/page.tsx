'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Message {
  id: string
  text: string
  sender: 'player' | 'dm'
  timestamp: string
  actionType?: string
  rollResult?: any
  npcInvolved?: any
  tensionLevel?: string
  audioUrl?: string
  characterType?: string
  voiceGeneration?: any
}

interface Character {
  id: string
  name: string
  race: string
  character_class: string
  level: number
  background: string
  alignment: string
  ability_scores: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  max_hit_points: number
  current_hit_points: number
  armor_class: number
  gold: number
  equipment: any[]
}

interface DiceRoll {
  notation: string
  total: number
  individual_rolls: number[]
  critical: boolean
  advantage: boolean
  disadvantage: boolean
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to NeuroDungeon! I am your AI Dungeon Master. Ready to embark on epic adventures? Would you like to create a character first?',
      sender: 'dm',
      timestamp: new Date().toISOString()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null)
  const [showCharacterCreation, setShowCharacterCreation] = useState(false)
  const [showDiceRoller, setShowDiceRoller] = useState(false)
  
  // Character creation form
  const [characterForm, setCharacterForm] = useState({
    name: '',
    race: 'human',
    character_class: 'fighter',
    background: 'folk hero',
    alignment: 'neutral good'
  })
  
  // Dice rolling
  const [diceNotation, setDiceNotation] = useState('1d20')
  const [advantage, setAdvantage] = useState(false)
  const [disadvantage, setDisadvantage] = useState(false)

  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false)

  // Test voice functionality
  const [showVoiceTest, setShowVoiceTest] = useState(false)
  const [testVoiceType, setTestVoiceType] = useState('dm_narrator')
  const [testText, setTestText] = useState('Welcome brave adventurers! Your epic journey begins now!')
  const [testAudioUrl, setTestAudioUrl] = useState('')

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const playerMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'player',
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, playerMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/dm/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          user_id: 'player_1',
          character_id: currentCharacter?.id
        })
      })

      const data = await response.json()

      const dmMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'dm',
        timestamp: data.timestamp,
        actionType: data.action_type,
        rollResult: data.roll_result,
        npcInvolved: data.npc_involved,
        tensionLevel: data.tension_level
      }
      setMessages(prev => [...prev, dmMessage])
      
      // Generate voice for DM response
      generateVoiceForMessage(dmMessage, data.response)
      
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'dm',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateVoiceForMessage = async (message: Message, text: string) => {
    setIsGeneratingVoice(true)
    try {
      // Determine character type based on message content
      let characterType = 'dm_narrator'
      const textLower = text.toLowerCase()
      
      if (textLower.includes('dwarf') || textLower.includes('beard') || textLower.includes('axe')) {
        characterType = 'dwarf_warrior'
      } else if (textLower.includes('elf') || textLower.includes('magic') || textLower.includes('spell')) {
        characterType = 'elf_mage'
      } else if (textLower.includes('dragon')) {
        characterType = 'dragon'
      } else if (textLower.includes('fairy') || textLower.includes('sparkle')) {
        characterType = 'fairy_companion'
      } else if (textLower.includes('orc') || textLower.includes('villain') || textLower.includes('evil')) {
        characterType = 'orc_villain'
      }

      const voiceResponse = await fetch('http://127.0.0.1:8000/api/minimax/voice/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          character_id: characterType,
          user_id: 'player_1'
        })
      })

      const voiceData = await voiceResponse.json()
      
      if (voiceData.voice_result?.success && voiceData.voice_result?.audio_url) {
        // Update the message with audio URL
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { 
                ...msg, 
                audioUrl: `http://127.0.0.1:8000${voiceData.voice_result.audio_url}`,
                characterType: characterType,
                voiceGeneration: voiceData.voice_result
              }
            : msg
        ))
      } else {
        console.log('Voice generation fallback:', voiceData)
      }
      
    } catch (error) {
      console.error('Error generating voice:', error)
    } finally {
      setIsGeneratingVoice(false)
    }
  }

  // Audio player component
  const AudioPlayer = ({ audioUrl, characterType }: { audioUrl: string, characterType?: string }) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    
    const audioRef = useRef<HTMLAudioElement>(null)
    
    const togglePlay = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause()
        } else {
          audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
      }
    }
    
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }
    
    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration)
      }
    }
    
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    
    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60)
      const seconds = Math.floor(time % 60)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    
    const getCharacterEmoji = (type?: string) => {
      switch (type) {
        case 'dwarf_warrior': return '⚔️'
        case 'elf_mage': return '✨'
        case 'dragon': return '🐉'
        case 'fairy_companion': return '🧚‍♀️'
        case 'orc_villain': return '👹'
        case 'wise_elder': return '📚'
        default: return '🎭'
      }
    }
    
  return (
      <div className="mt-2 p-2 bg-black/40 rounded-lg border border-purple-500/30">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />
        
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full transition-colors"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-purple-300">
                {getCharacterEmoji(characterType)} MiniMax Voice Acting
              </span>
              <span className="text-xs text-purple-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <div className="w-full bg-purple-900/50 rounded-full h-2">
              <div
                className="bg-purple-400 h-2 rounded-full transition-all"
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
          </div>
          
          <div className="text-xs text-purple-400">
            🏆 $2,750 Prize
          </div>
        </div>
      </div>
    )
  }

  const createCharacter = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/api/characters/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterForm)
      })

      const character = await response.json()
      setCurrentCharacter(character)
      setShowCharacterCreation(false)
      
      const successMessage: Message = {
        id: Date.now().toString(),
        text: `🎉 ${character.name} the ${character.race} ${character.character_class} has been created! Welcome to the adventure!`,
        sender: 'dm',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, successMessage])
    } catch (error) {
      console.error('Error creating character:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const rollDice = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/api/dice/roll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notation: diceNotation,
          advantage,
          disadvantage,
          character_id: currentCharacter?.id
        })
      })

      const data = await response.json()
      const roll = data.roll
      
      const rollMessage: Message = {
        id: Date.now().toString(),
        text: `🎲 **Dice Roll (${diceNotation}):** ${roll.total}${roll.critical ? ' CRITICAL!' : ''}\n${data.interpretation}`,
        sender: 'dm',
        timestamp: new Date().toISOString(),
        rollResult: roll
      }
      setMessages(prev => [...prev, rollMessage])
      setShowDiceRoller(false)
    } catch (error) {
      console.error('Error rolling dice:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAbilityModifier = (score: number) => {
    return Math.floor((score - 10) / 2)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const testMiniMaxVoice = async () => {
    setIsGeneratingVoice(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/api/minimax/voice/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testText,
          character_id: testVoiceType,
          user_id: 'test_user'
        })
      })

      const data = await response.json()
      
      if (data.voice_result?.success && data.voice_result?.audio_url) {
        setTestAudioUrl(`http://127.0.0.1:8000${data.voice_result.audio_url}`)
      } else {
        alert('Voice generation failed. Check API configuration.')
      }
    } catch (error) {
      console.error('Error testing voice:', error)
      alert('Voice test failed. Check server connection.')
    } finally {
      setIsGeneratingVoice(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20"></div>
        <div className="absolute animate-pulse top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute animate-pulse delay-1000 bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute animate-pulse delay-2000 top-3/4 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-6 bg-black/30 backdrop-blur-lg border border-purple-500/50 rounded-3xl px-12 py-8 mb-8">
            <div className="text-6xl animate-bounce">🎲</div>
            <div>
              <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-2">
                NeuroDungeon
              </h1>
              <p className="text-xl text-gray-300">Epic D&D Adventures with Voice-Enabled AI Companions</p>
            </div>
            <div className="text-6xl animate-bounce delay-500">⚔️</div>
          </div>
          
          <div className="flex justify-center gap-4 mb-8">
            <Link href="/multiplayer">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-purple-500/25">
                🚀 Start Multiplayer Adventure
              </Button>
            </Link>
            <Button 
              onClick={() => setShowVoiceTest(true)}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-green-500/25"
            >
              🎤 Test Voice AI
            </Button>
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg border-purple-500/50 shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3 text-xl">
                🎤 Voice Interaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Speak directly to AI companions using cutting-edge MiniMax Speech-02-HD technology. Each character has a unique voice and personality.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-lg border-blue-500/50 shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3 text-xl">
                🤖 AI Companions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Adventure with intelligent AI party members: a brave dwarf warrior, wise elf mage, clever rogue, and protective cleric.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-lg border-green-500/50 shadow-xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3 text-xl">
                🔗 Real-time Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Live D&D rules, monsters, and campaign inspiration powered by Linkup.so integration for endless adventure possibilities.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Section */}
        <div className="bg-gradient-to-r from-black/40 to-black/20 backdrop-blur-lg border border-yellow-500/50 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
            🏆 AWS MCP Agents Hackathon Winner
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-3">🎯 Multi-Sponsor Integration</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">MiniMax Speech-02-HD - Advanced Voice AI</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Linkup.so - Real-time D&D Content</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-300">Auth0 - Secure Authentication</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-300">Apify - Dynamic Web Content</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-3">🚀 Revolutionary Features</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p>• Natural speech-to-text conversation with AI</p>
                <p>• Unique character voices for immersive roleplay</p>
                <p>• Solo-friendly D&D for players without groups</p>
                <p>• Real-time rule lookups and campaign inspiration</p>
                <p>• Autonomous AI companions with distinct personalities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Classic Game Section - Minimized */}
        <Card className="bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-lg border-gray-500/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-center">
              📜 Classic Text Adventure (Beta)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-400 mb-4">
              <p>Experience the original text-based adventure while we perfect the voice system above!</p>
              <Button 
                onClick={() => setShowCharacterCreation(!showCharacterCreation)}
                className="mt-2 bg-gray-600 hover:bg-gray-700 text-white"
              >
                {showCharacterCreation ? 'Hide' : 'Show'} Classic Mode
              </Button>
            </div>

            {showCharacterCreation && (
              <div className="space-y-6">
                {/* Character Sheet */}
                {currentCharacter && (
                  <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
                    <h3 className="text-xl font-bold text-purple-400 mb-4">📋 Character Sheet</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-purple-300 font-semibold">{currentCharacter.name}</h4>
                        <p className="text-sm text-purple-200">
                          Level {currentCharacter.level} {currentCharacter.race} {currentCharacter.character_class}
                        </p>
                        <p className="text-xs text-purple-300">{currentCharacter.background}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-red-900/30 p-2 rounded">
                          <div className="text-red-300">HP</div>
                          <div className="text-white font-bold">
                            {currentCharacter.current_hit_points}/{currentCharacter.max_hit_points}
                          </div>
                        </div>
                        <div className="bg-blue-900/30 p-2 rounded">
                          <div className="text-blue-300">AC</div>
                          <div className="text-white font-bold">{currentCharacter.armor_class}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Interface */}
                <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
                  <h3 className="text-xl font-bold text-purple-400 mb-4">💬 Adventure Chat</h3>
                  
                  <div className="h-96 overflow-y-auto bg-black/50 rounded-lg border border-purple-500/20 p-4 mb-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`mb-4 flex ${message.sender === 'player' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'player' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-purple-600 text-white'
                        }`}>
                          <div className="text-sm font-medium mb-1">
                            {message.sender === 'player' ? '👤 You' : '🎭 DM'}
                          </div>
                          <div className="text-sm">{message.text}</div>
                          {message.audioUrl && (
                            <div className="mt-2">
                              <AudioPlayer audioUrl={message.audioUrl} characterType={message.characterType} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="text-center text-purple-400">
                        <div className="animate-spin inline-block w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                        <p className="mt-2">The DM is thinking...</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your action or response..."
                      className="flex-1 bg-black/50 border border-purple-500/30 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400"
                    />
                    <Button 
                      onClick={sendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Send
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => setShowCharacterCreation(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    ⚔️ Create Character
                  </Button>
                  <Button
                    onClick={() => setShowDiceRoller(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    🎲 Roll Dice
                  </Button>
                  <Button
                    onClick={() => setShowVoiceTest(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    🎭 Test Voices
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <div className={`${currentCharacter ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-purple-500/30 shadow-2xl">
            
            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'player' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg ${
                      message.sender === 'player'
                        ? 'bg-blue-600 text-white'
                        : message.actionType === 'attack_roll' || message.actionType === 'skill_check'
                        ? 'bg-green-700 text-green-100'
                        : message.rollResult
                        ? 'bg-purple-800 text-purple-100'
                        : 'bg-purple-700 text-purple-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {message.sender === 'player' ? '🧙‍♂️ Player' : '🎲 Dungeon Master'}
                      </span>
                      {message.tensionLevel && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          message.tensionLevel === 'high' ? 'bg-red-500' :
                          message.tensionLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}>
                          {message.tensionLevel}
                        </span>
                      )}
                      {message.characterType && (
                        <span className="text-xs px-2 py-1 bg-purple-500 rounded">
                          🎭 {message.characterType.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                    
                    {/* Audio Player for DM messages */}
                    {message.sender === 'dm' && message.audioUrl && (
                      <AudioPlayer audioUrl={message.audioUrl} characterType={message.characterType} />
                    )}
                    
                    {message.rollResult && (
                      <div className="mt-2 p-2 bg-black/30 rounded text-xs">
                        <div>🎲 Rolled: {message.rollResult.individual_rolls.join(', ')}</div>
                        <div>Total: <span className="font-bold">{message.rollResult.total}</span></div>
                        {message.rollResult.critical && <div className="text-yellow-400">⭐ CRITICAL!</div>}
                      </div>
                    )}
                    
                    {message.npcInvolved && (
                      <div className="mt-2 p-2 bg-black/30 rounded text-xs">
                        <div className="font-semibold">👤 {message.npcInvolved.name}</div>
                        <div className="text-purple-300">{message.npcInvolved.description}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {(isLoading || isGeneratingVoice) && (
                <div className="flex justify-start">
                  <div className="bg-purple-700 text-purple-100 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">🎲 Dungeon Master</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-purple-300 border-t-transparent rounded-full"></div>
                      <p className="text-sm">
                        {isLoading ? 'Thinking...' : 'Generating voice acting...'}
                      </p>
                    </div>
                    {isGeneratingVoice && (
                      <div className="mt-1 text-xs text-purple-300">
                        🎭 MiniMax Speech-02 generating character voice...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-purple-500/30 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={currentCharacter ? "What do you do?" : "Say hello to your DM!"}
                  className="flex-1 bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCharacterCreation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">⚔️ Create Character</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-purple-300 text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={characterForm.name}
                  onChange={(e) => setCharacterForm({...characterForm, name: e.target.value})}
                  className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                  placeholder="Enter character name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-300 text-sm font-semibold mb-2">Race</label>
                  <select
                    value={characterForm.race}
                    onChange={(e) => setCharacterForm({...characterForm, race: e.target.value})}
                    className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                  >
                    <option value="human">Human</option>
                    <option value="elf">Elf</option>
                    <option value="dwarf">Dwarf</option>
                    <option value="halfling">Halfling</option>
                    <option value="dragonborn">Dragonborn</option>
                    <option value="gnome">Gnome</option>
                    <option value="half-elf">Half-Elf</option>
                    <option value="half-orc">Half-Orc</option>
                    <option value="tiefling">Tiefling</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-purple-300 text-sm font-semibold mb-2">Class</label>
                  <select
                    value={characterForm.character_class}
                    onChange={(e) => setCharacterForm({...characterForm, character_class: e.target.value})}
                    className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-white"
        >
                    <option value="fighter">Fighter</option>
                    <option value="wizard">Wizard</option>
                    <option value="rogue">Rogue</option>
                    <option value="cleric">Cleric</option>
                    <option value="ranger">Ranger</option>
                    <option value="barbarian">Barbarian</option>
                    <option value="bard">Bard</option>
                    <option value="druid">Druid</option>
                    <option value="monk">Monk</option>
                    <option value="paladin">Paladin</option>
                    <option value="sorcerer">Sorcerer</option>
                    <option value="warlock">Warlock</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm font-semibold mb-2">Background</label>
                <input
                  type="text"
                  value={characterForm.background}
                  onChange={(e) => setCharacterForm({...characterForm, background: e.target.value})}
                  className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                  placeholder="e.g., Folk Hero, Noble, Criminal"
                />
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm font-semibold mb-2">Alignment</label>
                <input
                  type="text"
                  value={characterForm.alignment}
                  onChange={(e) => setCharacterForm({...characterForm, alignment: e.target.value})}
                  className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                  placeholder="e.g., Chaotic Good, Lawful Neutral"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={createCharacter}
                disabled={!characterForm.name || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Character'}
              </button>
              <button
                onClick={() => setShowCharacterCreation(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dice Roller Modal */}
      {showDiceRoller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">🎲 Roll Dice</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-purple-300 text-sm font-semibold mb-2">Dice Notation</label>
                <input
                  type="text"
                  value={diceNotation}
                  onChange={(e) => setDiceNotation(e.target.value)}
                  className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                  placeholder="e.g., 1d20+5, 2d6, 3d8+2"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {['1d4', '1d6', '1d8', '1d10', '1d12', '1d20'].map(dice => (
                  <button
                    key={dice}
                    onClick={() => setDiceNotation(dice)}
                    className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm transition-colors"
                  >
                    {dice}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-purple-300">
                  <input
                    type="checkbox"
                    checked={advantage}
                    onChange={(e) => {
                      setAdvantage(e.target.checked)
                      if (e.target.checked) setDisadvantage(false)
                    }}
                    className="accent-green-500"
                  />
                  <span className="text-sm">Advantage</span>
                </label>
                
                <label className="flex items-center gap-2 text-purple-300">
                  <input
                    type="checkbox"
                    checked={disadvantage}
                    onChange={(e) => {
                      setDisadvantage(e.target.checked)
                      if (e.target.checked) setAdvantage(false)
                    }}
                    className="accent-red-500"
                  />
                  <span className="text-sm">Disadvantage</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={rollDice}
                disabled={!diceNotation || isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Rolling...' : 'Roll!'}
              </button>
              <button
                onClick={() => setShowDiceRoller(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Voice Test Modal */}
      {showVoiceTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full mx-4 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">🎭 Test MiniMax Voices</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-purple-300 text-sm font-semibold mb-2">Character Voice</label>
                <select
                  value={testVoiceType}
                  onChange={(e) => setTestVoiceType(e.target.value)}
                  className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                >
                  <option value="dm_narrator">🎲 DM Narrator (Commanding)</option>
                  <option value="dwarf_warrior">⚔️ Dwarf Warrior (Gruff)</option>
                  <option value="elf_mage">✨ Elf Mage (Elegant)</option>
                  <option value="human_rogue">🗡️ Human Rogue (Witty)</option>
                  <option value="dragon">🐉 Ancient Dragon (Terrifying)</option>
                  <option value="fairy_companion">🧚‍♀️ Fairy Companion (Cheerful)</option>
                  <option value="orc_villain">👹 Orc Villain (Menacing)</option>
                  <option value="wise_elder">📚 Wise Elder (Ancient)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm font-semibold mb-2">Test Text</label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                  rows={3}
                  placeholder="Enter text to convert to speech..."
                />
              </div>
              
              {testAudioUrl && (
                <div>
                  <label className="block text-purple-300 text-sm font-semibold mb-2">Generated Audio</label>
                  <AudioPlayer audioUrl={testAudioUrl} characterType={testVoiceType} />
                </div>
              )}
              
              <div className="bg-purple-900/30 p-3 rounded-lg">
                <h4 className="text-purple-300 font-semibold mb-2">🏆 MiniMax Integration</h4>
                <div className="text-xs text-purple-200 space-y-1">
                  <div>• Speech-02-HD: World's best TTS model</div>
                  <div>• Prize Target: $2,750 + Ray-Ban glasses</div>
                  <div>• Real-time D&D character voices</div>
                  <div>• Professional API integration</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={testMiniMaxVoice}
                disabled={!testText || isGeneratingVoice}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                {isGeneratingVoice ? 'Generating Voice...' : '🎤 Generate Voice'}
              </button>
              <button
                onClick={() => {
                  setShowVoiceTest(false)
                  setTestAudioUrl('')
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'

interface Message {
  id: string
  text: string
  sender: 'player' | 'dm'
  timestamp: string
  actionType?: string
  rollResult?: any
  npcInvolved?: any
  tensionLevel?: string
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
      text: 'Welcome to Chronicles of AI! I am your AI Dungeon Master. Ready to embark on epic adventures? Would you like to create a character first?',
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                🎮 Chronicles of AI
              </h1>
              <p className="text-purple-200 mt-2">Advanced AI Dungeon Master v2.0</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCharacterCreation(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                ⚔️ Create Character
              </button>
              <button
                onClick={() => setShowDiceRoller(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                🎲 Roll Dice
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Character Sheet */}
          {currentCharacter && (
            <div className="lg:col-span-1">
              <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
                <h3 className="text-xl font-bold text-purple-400 mb-4">📋 Character Sheet</h3>
                
                <div className="space-y-3">
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
                  
                  <div>
                    <h5 className="text-purple-300 font-semibold mb-2">Ability Scores</h5>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(currentCharacter.ability_scores).map(([ability, score]) => (
                        <div key={ability} className="bg-purple-900/30 p-1 rounded text-center">
                          <div className="text-purple-300 capitalize">{ability.slice(0, 3)}</div>
                          <div className="text-white font-bold">
                            {score} ({getAbilityModifier(score) >= 0 ? '+' : ''}{getAbilityModifier(score)})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-purple-300 font-semibold mb-2">💰 Gold</h5>
                    <div className="text-yellow-400 font-bold">{currentCharacter.gold} gp</div>
                  </div>
                  
                  <div>
                    <h5 className="text-purple-300 font-semibold mb-2">🎒 Equipment</h5>
                    <div className="text-xs space-y-1">
                      {currentCharacter.equipment.slice(0, 3).map((item, index) => (
                        <div key={index} className="text-purple-200">{item.name}</div>
                      ))}
                      {currentCharacter.equipment.length > 3 && (
                        <div className="text-purple-400">+{currentCharacter.equipment.length - 3} more...</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                      
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
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-purple-700 text-purple-100 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">🎲 Dungeon Master</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-purple-300 border-t-transparent rounded-full"></div>
                        <p className="text-sm">Thinking...</p>
                      </div>
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

        {/* Game Stats Panel */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
            <h3 className="text-purple-400 font-semibold mb-2">🏰 Campaign</h3>
            <p className="text-purple-200 text-sm">The Dragonstone Tavern</p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
            <h3 className="text-purple-400 font-semibold mb-2">👥 Character</h3>
            <p className="text-purple-200 text-sm">{currentCharacter?.name || 'None created'}</p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
            <h3 className="text-purple-400 font-semibold mb-2">🎲 AI Features</h3>
            <p className="text-green-400 text-sm">All Systems Active</p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-purple-500/30 p-4">
            <h3 className="text-purple-400 font-semibold mb-2">🌟 Status</h3>
            <p className="text-green-400 text-sm">Ready for Adventure!</p>
          </div>
        </div>
      </main>

      {/* Character Creation Modal */}
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
    </div>
  )
}

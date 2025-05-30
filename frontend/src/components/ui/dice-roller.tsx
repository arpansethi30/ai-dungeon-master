import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface DiceResult {
  die: string;
  roll: number;
  modifier: number;
  total: number;
  isMax: boolean;
  isMin: boolean;
  timestamp: string;
}

interface DiceRollerProps {
  onRollComplete?: (result: DiceResult) => void;
  className?: string;
}

export function DiceRoller({ onRollComplete, className = "" }: DiceRollerProps) {
  const [selectedDie, setSelectedDie] = useState<string>('d20');
  const [modifier, setModifier] = useState<number>(0);
  const [advantage, setAdvantage] = useState<boolean>(false);
  const [disadvantage, setDisadvantage] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastRoll, setLastRoll] = useState<DiceResult | null>(null);
  const [rollHistory, setRollHistory] = useState<DiceResult[]>([]);

  const diceTypes = [
    { name: 'd4', sides: 4, color: 'bg-blue-600' },
    { name: 'd6', sides: 6, color: 'bg-green-600' },
    { name: 'd8', sides: 8, color: 'bg-yellow-600' },
    { name: 'd10', sides: 10, color: 'bg-orange-600' },
    { name: 'd12', sides: 12, color: 'bg-red-600' },
    { name: 'd20', sides: 20, color: 'bg-purple-600' },
    { name: 'd100', sides: 100, color: 'bg-pink-600' }
  ];

  const rollDice = async () => {
    setIsRolling(true);
    
    const dieType = diceTypes.find(d => d.name === selectedDie);
    if (!dieType) return;

    // Simulate rolling animation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    let rolls: number[] = [];
    
    if (advantage || disadvantage) {
      // Roll twice for advantage/disadvantage
      rolls = [
        Math.floor(Math.random() * dieType.sides) + 1,
        Math.floor(Math.random() * dieType.sides) + 1
      ];
    } else {
      // Single roll
      rolls = [Math.floor(Math.random() * dieType.sides) + 1];
    }

    // Apply advantage/disadvantage
    let finalRoll: number;
    if (advantage) {
      finalRoll = Math.max(...rolls);
    } else if (disadvantage) {
      finalRoll = Math.min(...rolls);
    } else {
      finalRoll = rolls[0];
    }

    const result: DiceResult = {
      die: selectedDie,
      roll: finalRoll,
      modifier: modifier,
      total: finalRoll + modifier,
      isMax: finalRoll === dieType.sides,
      isMin: finalRoll === 1,
      timestamp: new Date().toISOString()
    };

    setLastRoll(result);
    setRollHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 rolls
    setIsRolling(false);

    if (onRollComplete) {
      onRollComplete(result);
    }

    // Reset advantage/disadvantage after roll
    setAdvantage(false);
    setDisadvantage(false);
  };

  const getDieEmoji = (dieName: string): string => {
    const emojiMap: {[key: string]: string} = {
      'd4': '🔺',
      'd6': '⚃',
      'd8': '🎲',
      'd10': '🔟',
      'd12': '🎯',
      'd20': '🌟',
      'd100': '💯'
    };
    return emojiMap[dieName] || '🎲';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dice Selection */}
      <Card className="bg-black/40 border-blue-500/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            🎲 Dice Roller
            <Badge variant="outline" className="bg-blue-600/20 border-blue-400">
              D&D Essential
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dice Type Selection */}
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Choose Your Die:</label>
            <div className="grid grid-cols-4 gap-2">
              {diceTypes.map((die) => (
                <Button
                  key={die.name}
                  onClick={() => setSelectedDie(die.name)}
                  className={`text-xs p-2 transition-all duration-300 ${
                    selectedDie === die.name 
                      ? `${die.color} scale-110 shadow-lg` 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  {getDieEmoji(die.name)} {die.name.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Modifier Input */}
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Modifier:</label>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setModifier(Math.max(modifier - 1, -10))}
                className="bg-red-600 hover:bg-red-700"
              >
                -
              </Button>
              <div className="bg-black/50 px-4 py-2 rounded border border-gray-600 text-white min-w-[60px] text-center">
                {modifier >= 0 ? '+' : ''}{modifier}
              </div>
              <Button
                size="sm"
                onClick={() => setModifier(Math.min(modifier + 1, 10))}
                className="bg-green-600 hover:bg-green-700"
              >
                +
              </Button>
            </div>
          </div>

          {/* Advantage/Disadvantage */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setAdvantage(!advantage);
                setDisadvantage(false);
              }}
              className={`flex-1 text-xs ${
                advantage ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              ⬆️ Advantage
            </Button>
            <Button
              onClick={() => {
                setDisadvantage(!disadvantage);
                setAdvantage(false);
              }}
              className={`flex-1 text-xs ${
                disadvantage ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              ⬇️ Disadvantage
            </Button>
          </div>

          {/* Roll Button */}
          <Button
            onClick={rollDice}
            disabled={isRolling}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 p-4 text-lg font-bold transition-all duration-300 transform hover:scale-105"
          >
            {isRolling ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                🎲 Rolling...
              </div>
            ) : (
              `🎲 Roll ${selectedDie.toUpperCase()}!`
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Current Roll Result */}
      {lastRoll && (
        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse">
                {lastRoll.total}
              </div>
              <div className="text-white space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Badge className={`${lastRoll.isMax ? 'bg-green-600' : lastRoll.isMin ? 'bg-red-600' : 'bg-blue-600'} text-lg px-3 py-1`}>
                    {getDieEmoji(lastRoll.die)} {lastRoll.roll}
                  </Badge>
                  {lastRoll.modifier !== 0 && (
                    <>
                      <span className="text-gray-300">+</span>
                      <Badge variant="outline" className="bg-purple-600/30 border-purple-400 text-lg px-3 py-1">
                        {lastRoll.modifier >= 0 ? '+' : ''}{lastRoll.modifier}
                      </Badge>
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-300">
                  {lastRoll.isMax && '🎉 Maximum Roll! '}
                  {lastRoll.isMin && '💀 Critical Fail! '}
                  {advantage && '⬆️ Advantage '}
                  {disadvantage && '⬇️ Disadvantage '}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roll History */}
      {rollHistory.length > 0 && (
        <Card className="bg-black/40 border-gray-500/50">
          <CardHeader>
            <CardTitle className="text-white text-sm">📜 Roll History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {rollHistory.map((roll, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                >
                  <div className="text-white">
                    {getDieEmoji(roll.die)} {roll.die} = {roll.roll}
                    {roll.modifier !== 0 && ` ${roll.modifier >= 0 ? '+' : ''}${roll.modifier}`}
                  </div>
                  <Badge variant="outline" className="bg-purple-600/20 border-purple-400">
                    {roll.total}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
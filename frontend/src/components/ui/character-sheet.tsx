import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Textarea } from './textarea';
import { Separator } from './separator';

interface CharacterStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

interface Character {
  name: string;
  class: string;
  level: number;
  race: string;
  background: string;
  hp: number;
  maxHp: number;
  ac: number;
  proficiencyBonus: number;
  stats: CharacterStats;
  skills: Record<string, boolean>;
  equipment: string[];
  spells: string[];
  notes: string;
}

interface CharacterSheetProps {
  character?: Character;
  onCharacterUpdate?: (character: Character) => void;
  onStatRoll?: (stat: string, roll: number) => void;
  className?: string;
}

export function CharacterSheet({ 
  character, 
  onCharacterUpdate, 
  onStatRoll, 
  className = "" 
}: CharacterSheetProps) {
  const [editMode, setEditMode] = useState(false);
  const [localCharacter, setLocalCharacter] = useState<Character>(
    character || {
      name: "New Character",
      class: "Fighter",
      level: 1,
      race: "Human",
      background: "Adventurer",
      hp: 10,
      maxHp: 10,
      ac: 10,
      proficiencyBonus: 2,
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
      skills: {},
      equipment: ["Sword", "Shield", "Leather Armor"],
      spells: [],
      notes: ""
    }
  );

  useEffect(() => {
    if (character) {
      setLocalCharacter(character);
    }
  }, [character]);

  const getModifier = (stat: number): number => {
    return Math.floor((stat - 10) / 2);
  };

  const getModifierString = (stat: number): string => {
    const mod = getModifier(stat);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const rollForStat = (statName: string, statValue: number) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = getModifier(statValue);
    const total = roll + modifier;
    
    if (onStatRoll) {
      onStatRoll(statName, total);
    }

    // Show roll result notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white p-3 rounded-lg shadow-lg z-50 animate-bounce';
    notification.innerHTML = `
      <div class="text-center">
        <div class="font-bold">${statName.toUpperCase()} Check</div>
        <div class="text-sm">🎲 ${roll} + ${modifier} = ${total}</div>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  };

  const saveCharacter = () => {
    setEditMode(false);
    if (onCharacterUpdate) {
      onCharacterUpdate(localCharacter);
    }
  };

  const dndClasses = [
    "Barbarian", "Bard", "Cleric", "Druid", "Fighter", 
    "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", 
    "Warlock", "Wizard"
  ];

  const dndRaces = [
    "Human", "Elf", "Dwarf", "Halfling", "Dragonborn",
    "Gnome", "Half-Elf", "Half-Orc", "Tiefling"
  ];

  const skillsList = [
    "Acrobatics", "Animal Handling", "Arcana", "Athletics",
    "Deception", "History", "Insight", "Intimidation",
    "Investigation", "Medicine", "Nature", "Perception",
    "Performance", "Persuasion", "Religion", "Sleight of Hand",
    "Stealth", "Survival"
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Character Header */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              ⚔️ Character Sheet
              <Badge variant="outline" className="bg-purple-600/20 border-purple-400">
                Level {localCharacter.level}
              </Badge>
            </CardTitle>
            <Button
              onClick={() => editMode ? saveCharacter() : setEditMode(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editMode ? '💾 Save' : '✏️ Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-white text-sm font-medium">Character Name:</label>
              {editMode ? (
                <Input
                  value={localCharacter.name}
                  onChange={(e) => setLocalCharacter({...localCharacter, name: e.target.value})}
                  className="bg-white/10 border-gray-600 text-white"
                />
              ) : (
                <div className="text-2xl font-bold text-white">{localCharacter.name}</div>
              )}
            </div>
            <div>
              <label className="text-white text-sm font-medium">Class:</label>
              {editMode ? (
                <select
                  value={localCharacter.class}
                  onChange={(e) => setLocalCharacter({...localCharacter, class: e.target.value})}
                  className="w-full p-2 bg-white/10 border border-gray-600 rounded text-white"
                >
                  {dndClasses.map(cls => (
                    <option key={cls} value={cls} className="bg-gray-800">{cls}</option>
                  ))}
                </select>
              ) : (
                <div className="text-xl text-blue-300">{localCharacter.class}</div>
              )}
            </div>
            <div>
              <label className="text-white text-sm font-medium">Race:</label>
              {editMode ? (
                <select
                  value={localCharacter.race}
                  onChange={(e) => setLocalCharacter({...localCharacter, race: e.target.value})}
                  className="w-full p-2 bg-white/10 border border-gray-600 rounded text-white"
                >
                  {dndRaces.map(race => (
                    <option key={race} value={race} className="bg-gray-800">{race}</option>
                  ))}
                </select>
              ) : (
                <div className="text-xl text-green-300">{localCharacter.race}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ability Scores */}
        <Card className="bg-black/40 border-blue-500/50">
          <CardHeader>
            <CardTitle className="text-white">📊 Ability Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(localCharacter.stats).map(([stat, value]) => (
                <div
                  key={stat}
                  className="p-3 bg-white/5 rounded-lg border border-white/20 hover:border-blue-400/50 transition-all duration-300 group"
                >
                  <div className="text-center space-y-2">
                    <div className="text-white font-medium capitalize text-sm">
                      {stat}
                    </div>
                    {editMode ? (
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={value}
                        onChange={(e) => setLocalCharacter({
                          ...localCharacter,
                          stats: { ...localCharacter.stats, [stat]: parseInt(e.target.value) || 10 }
                        })}
                        className="w-full bg-white/10 border-gray-600 text-white text-center"
                      />
                    ) : (
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-blue-300">{value}</div>
                        <Badge 
                          variant="outline" 
                          className="bg-purple-600/20 border-purple-400 cursor-pointer group-hover:scale-110 transition-transform"
                          onClick={() => rollForStat(stat, value)}
                        >
                          {getModifierString(value)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Combat Stats */}
        <Card className="bg-black/40 border-red-500/50">
          <CardHeader>
            <CardTitle className="text-white">⚔️ Combat Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <label className="text-white text-sm font-medium block mb-2">Hit Points</label>
                <div className="flex items-center justify-center gap-2">
                  {editMode ? (
                    <>
                      <Input
                        type="number"
                        value={localCharacter.hp}
                        onChange={(e) => setLocalCharacter({...localCharacter, hp: parseInt(e.target.value) || 0})}
                        className="w-16 bg-white/10 border-gray-600 text-white text-center"
                      />
                      <span className="text-white">/</span>
                      <Input
                        type="number"
                        value={localCharacter.maxHp}
                        onChange={(e) => setLocalCharacter({...localCharacter, maxHp: parseInt(e.target.value) || 0})}
                        className="w-16 bg-white/10 border-gray-600 text-white text-center"
                      />
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-red-400">
                      {localCharacter.hp} / {localCharacter.maxHp}
                    </div>
                  )}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(localCharacter.hp / localCharacter.maxHp) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center">
                <label className="text-white text-sm font-medium block mb-2">Armor Class</label>
                {editMode ? (
                  <Input
                    type="number"
                    value={localCharacter.ac}
                    onChange={(e) => setLocalCharacter({...localCharacter, ac: parseInt(e.target.value) || 10})}
                    className="w-20 bg-white/10 border-gray-600 text-white text-center mx-auto"
                  />
                ) : (
                  <div className="text-2xl font-bold text-blue-400">{localCharacter.ac}</div>
                )}
              </div>
            </div>

            <div className="text-center">
              <label className="text-white text-sm font-medium block mb-2">Proficiency Bonus</label>
              <Badge variant="outline" className="bg-green-600/20 border-green-400 text-lg px-3 py-1">
                +{localCharacter.proficiencyBonus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills */}
      <Card className="bg-black/40 border-green-500/50">
        <CardHeader>
          <CardTitle className="text-white">🎯 Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {skillsList.map(skill => {
              const isProficient = localCharacter.skills[skill] || false;
              const relatedStat = getRelatedStat(skill);
              const modifier = getModifier(localCharacter.stats[relatedStat as keyof CharacterStats]);
              const skillBonus = modifier + (isProficient ? localCharacter.proficiencyBonus : 0);
              
              return (
                <div
                  key={skill}
                  className={`p-2 rounded border transition-all duration-300 cursor-pointer ${
                    isProficient 
                      ? 'bg-green-600/20 border-green-400 hover:bg-green-600/30' 
                      : 'bg-white/5 border-white/20 hover:border-green-400/50'
                  }`}
                  onClick={() => {
                    if (editMode) {
                      setLocalCharacter({
                        ...localCharacter,
                        skills: { ...localCharacter.skills, [skill]: !isProficient }
                      });
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">{skill}</span>
                    <Badge variant="outline" className="bg-purple-600/20 border-purple-400 text-xs">
                      {skillBonus >= 0 ? '+' : ''}{skillBonus}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Equipment */}
      <Card className="bg-black/40 border-yellow-500/50">
        <CardHeader>
          <CardTitle className="text-white">🎒 Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <Textarea
              value={localCharacter.equipment.join('\n')}
              onChange={(e) => setLocalCharacter({
                ...localCharacter, 
                equipment: e.target.value.split('\n').filter(item => item.trim())
              })}
              placeholder="Enter equipment items (one per line)"
              className="bg-white/10 border-gray-600 text-white"
              rows={6}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {localCharacter.equipment.map((item, index) => (
                <div
                  key={index}
                  className="p-2 bg-white/5 rounded border border-white/20 text-white text-sm"
                >
                  • {item}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="bg-black/40 border-purple-500/50">
        <CardHeader>
          <CardTitle className="text-white">📝 Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <Textarea
              value={localCharacter.notes}
              onChange={(e) => setLocalCharacter({...localCharacter, notes: e.target.value})}
              placeholder="Character backstory, goals, relationships..."
              className="bg-white/10 border-gray-600 text-white"
              rows={4}
            />
          ) : (
            <div className="text-white whitespace-pre-wrap">
              {localCharacter.notes || "No notes yet..."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get related stat for skills
function getRelatedStat(skill: string): string {
  const skillStatMap: Record<string, string> = {
    "Acrobatics": "dexterity",
    "Animal Handling": "wisdom",
    "Arcana": "intelligence",
    "Athletics": "strength",
    "Deception": "charisma",
    "History": "intelligence",
    "Insight": "wisdom",
    "Intimidation": "charisma",
    "Investigation": "intelligence",
    "Medicine": "wisdom",
    "Nature": "intelligence",
    "Perception": "wisdom",
    "Performance": "charisma",
    "Persuasion": "charisma",
    "Religion": "intelligence",
    "Sleight of Hand": "dexterity",
    "Stealth": "dexterity",
    "Survival": "wisdom"
  };
  
  return skillStatMap[skill] || "strength";
} 
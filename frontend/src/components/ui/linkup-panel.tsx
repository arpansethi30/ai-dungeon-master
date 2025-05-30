'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LinkupResponse, formatLinkupSources, truncateAnswer } from '@/lib/linkup';

// Enhanced interfaces for better type safety
interface LinkupPanelProps {
  onContentAdded?: (content: string, type: string) => void;
}

export function LinkupPanel({ onContentAdded }: LinkupPanelProps) {
  // Enhanced state management
  const [activeTab, setActiveTab] = useState('rules');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LinkupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state with validation
  const [rulesQuery, setRulesQuery] = useState('');
  const [rulesContext, setRulesContext] = useState('');
  const [monsterCR, setMonsterCR] = useState('');
  const [monsterEnvironment, setMonsterEnvironment] = useState('');
  const [spellName, setSpellName] = useState('');
  const [spellLevel, setSpellLevel] = useState('');
  const [spellClass, setSpellClass] = useState('');
  const [itemType, setItemType] = useState('');
  const [itemRarity, setItemRarity] = useState('');
  const [campaignTheme, setCampaignTheme] = useState('');
  const [campaignSetting, setCampaignSetting] = useState('');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  // Enhanced tabs with better icons and descriptions
  const tabs = [
    { 
      id: 'rules', 
      label: 'Rules', 
      icon: '🎲', 
      color: 'from-blue-500 to-indigo-500',
      description: 'D&D 5e rules and mechanics'
    },
    { 
      id: 'monsters', 
      label: 'Monsters', 
      icon: '🐲', 
      color: 'from-red-500 to-orange-500',
      description: 'Find creatures for encounters'
    },
    { 
      id: 'spells', 
      label: 'Spells', 
      icon: '✨', 
      color: 'from-purple-500 to-pink-500',
      description: 'Magic spells and effects'
    },
    { 
      id: 'items', 
      label: 'Items', 
      icon: '⚔️', 
      color: 'from-yellow-500 to-orange-500',
      description: 'Equipment and magic items'
    },
    { 
      id: 'inspiration', 
      label: 'Campaigns', 
      icon: '🗺️', 
      color: 'from-green-500 to-teal-500',
      description: 'Campaign ideas and inspiration'
    },
    { 
      id: 'news', 
      label: 'News', 
      icon: '📰', 
      color: 'from-indigo-500 to-purple-500',
      description: 'Latest D&D news and updates'
    }
  ];

  // Enhanced search function with better error handling
  const handleSearch = async (searchType: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      let response: Response;
      let data: LinkupResponse;

      switch (searchType) {
        case 'rules':
          if (!rulesQuery.trim()) {
            throw new Error('Please enter a rules query');
          }
          response = await fetch(`${BACKEND_URL}/api/linkup/rules-lookup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: rulesQuery, context: rulesContext })
          });
          break;

        case 'monsters':
          response = await fetch(`${BACKEND_URL}/api/linkup/monster-search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ challenge_rating: monsterCR, environment: monsterEnvironment })
          });
          break;

        case 'spells':
          response = await fetch(`${BACKEND_URL}/api/linkup/spell-lookup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ spell_name: spellName, spell_level: spellLevel, character_class: spellClass })
          });
          break;

        case 'items':
          response = await fetch(`${BACKEND_URL}/api/linkup/item-search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ item_type: itemType, rarity: itemRarity })
          });
          break;

        case 'inspiration':
          response = await fetch(`${BACKEND_URL}/api/linkup/campaign-inspiration`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ theme: campaignTheme, setting: campaignSetting })
          });
          break;

        case 'news':
          response = await fetch(`${BACKEND_URL}/api/linkup/dnd-news`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          break;

        default:
          throw new Error('Invalid search type');
      }

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      data = await response.json();
      setResults(data);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-lg">🔗</span>
          <div class="text-sm font-medium">Linkup search complete!</div>
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
      }, 3000);
    } catch (err: any) {
      const errorMessage = err?.message || 'Search failed. Please try again.';
      setError(errorMessage);
      console.error('Linkup search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    
    return (
      <div className="space-y-4">
        {/* Tab Header with description */}
        <div className={`p-4 rounded-lg bg-gradient-to-r ${currentTab?.color || 'from-gray-500 to-gray-600'} bg-opacity-20 border border-opacity-30`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{currentTab?.icon}</span>
            <div>
              <h3 className="text-lg font-bold text-white">{currentTab?.label}</h3>
              <p className="text-sm text-gray-300">{currentTab?.description}</p>
            </div>
          </div>
        </div>

        {/* Tab-specific content */}
        {renderTabSpecificContent()}
      </div>
    );
  };

  const renderTabSpecificContent = () => {
    switch (activeTab) {
      case 'rules':
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block flex items-center gap-2">
                  🎯 Rules Query: <span className="text-red-400">*</span>
                </label>
                <Input
                  value={rulesQuery}
                  onChange={(e) => setRulesQuery(e.target.value)}
                  placeholder="e.g., How does initiative work in combat?"
                  className="bg-white/10 border-blue-400 text-white placeholder-blue-300 focus:border-blue-300 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  📝 Context (Optional):
                </label>
                <Input
                  value={rulesContext}
                  onChange={(e) => setRulesContext(e.target.value)}
                  placeholder="e.g., combat, spellcasting, social encounters"
                  className="bg-white/10 border-blue-400 text-white placeholder-blue-300 focus:border-blue-300 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>
            </div>
            <Button 
              onClick={() => handleSearch('rules')}
              disabled={isLoading || !rulesQuery.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Searching Rules...
                </div>
              ) : (
                '🎲 Search Rules'
              )}
            </Button>
          </div>
        );

      case 'monsters':
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  ⚔️ Challenge Rating:
                </label>
                <Input
                  value={monsterCR}
                  onChange={(e) => setMonsterCR(e.target.value)}
                  placeholder="e.g., 1/4, 1, 5, 10+"
                  className="bg-white/10 border-red-400 text-white placeholder-red-300 focus:border-red-300 focus:ring-2 focus:ring-red-400/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  🌲 Environment:
                </label>
                <Input
                  value={monsterEnvironment}
                  onChange={(e) => setMonsterEnvironment(e.target.value)}
                  placeholder="forest, dungeon, urban, desert"
                  className="bg-white/10 border-red-400 text-white placeholder-red-300 focus:border-red-300 focus:ring-2 focus:ring-red-400/20"
                />
              </div>
            </div>
            <Button 
              onClick={() => handleSearch('monsters')}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Finding Monsters...
                </div>
              ) : (
                '🐲 Find Monsters'
              )}
            </Button>
          </div>
        );

      case 'spells':
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  ✨ Spell Name:
                </label>
                <Input
                  value={spellName}
                  onChange={(e) => setSpellName(e.target.value)}
                  placeholder="fireball, healing word, counterspell"
                  className="bg-white/10 border-purple-400 text-white placeholder-purple-300 focus:border-purple-300 focus:ring-2 focus:ring-purple-400/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    📊 Spell Level:
                  </label>
                  <Input
                    value={spellLevel}
                    onChange={(e) => setSpellLevel(e.target.value)}
                    placeholder="1, 2, 3..."
                    className="bg-white/10 border-purple-400 text-white placeholder-purple-300 focus:border-purple-300 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    🧙 Class:
                  </label>
                  <Input
                    value={spellClass}
                    onChange={(e) => setSpellClass(e.target.value)}
                    placeholder="wizard, cleric, sorcerer"
                    className="bg-white/10 border-purple-400 text-white placeholder-purple-300 focus:border-purple-300 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>
              </div>
            </div>
            <Button 
              onClick={() => handleSearch('spells')}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Searching Spells...
                </div>
              ) : (
                '✨ Search Spells'
              )}
            </Button>
          </div>
        );

      case 'items':
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  🗡️ Item Type:
                </label>
                <Input
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  placeholder="weapon, armor, potion, wondrous item"
                  className="bg-white/10 border-yellow-400 text-white placeholder-yellow-300 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  💎 Rarity:
                </label>
                <Input
                  value={itemRarity}
                  onChange={(e) => setItemRarity(e.target.value)}
                  placeholder="common, uncommon, rare, legendary"
                  className="bg-white/10 border-yellow-400 text-white placeholder-yellow-300 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/20"
                />
              </div>
            </div>
            <Button 
              onClick={() => handleSearch('items')}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Finding Items...
                </div>
              ) : (
                '⚔️ Find Items'
              )}
            </Button>
          </div>
        );

      case 'inspiration':
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  🎭 Campaign Theme:
                </label>
                <Input
                  value={campaignTheme}
                  onChange={(e) => setCampaignTheme(e.target.value)}
                  placeholder="mystery, horror, adventure, intrigue"
                  className="bg-white/10 border-green-400 text-white placeholder-green-300 focus:border-green-300 focus:ring-2 focus:ring-green-400/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  🗺️ Setting:
                </label>
                <Input
                  value={campaignSetting}
                  onChange={(e) => setCampaignSetting(e.target.value)}
                  placeholder="forgotten realms, eberron, homebrew"
                  className="bg-white/10 border-green-400 text-white placeholder-green-300 focus:border-green-300 focus:ring-2 focus:ring-green-400/20"
                />
              </div>
            </div>
            <Button 
              onClick={() => handleSearch('inspiration')}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Getting Inspiration...
                </div>
              ) : (
                '🗺️ Get Inspiration'
              )}
            </Button>
          </div>
        );

      case 'news':
        return (
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-lg border border-indigo-400/50">
              <div className="text-4xl mb-3">📰</div>
              <h3 className="text-lg font-bold text-indigo-300 mb-2">Latest D&D News</h3>
              <p className="text-indigo-200 text-sm mb-4">
                Get the latest Dungeons & Dragons news, updates, and releases from around the web
              </p>
              <Button 
                onClick={() => handleSearch('news')}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Fetching News...
                  </div>
                ) : (
                  '📰 Get Latest News'
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!results) return null;

    if (!results.success) {
      return (
        <Card className="bg-red-900/30 border-red-500/50">
          <CardContent className="p-4">
            <div className="text-red-300">
              <strong>❌ Search Failed:</strong> {results.error}
            </div>
          </CardContent>
        </Card>
      );
    }

    const formattedSources = formatLinkupSources(results.sources);

    return (
      <Card className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-lg border-green-500/50">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center gap-2">
            🔗 Linkup.so Results
            <Badge variant="outline" className="bg-green-600/20 border-green-400">
              {results.type}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Answer */}
          <div className="p-4 bg-green-600/10 rounded-lg border border-green-400/30">
            <h4 className="text-green-300 font-medium mb-2">📝 Answer:</h4>
            <p className="text-white leading-relaxed">
              {results.answer}
            </p>
          </div>

          {/* Sources */}
          {formattedSources.length > 0 && (
            <div>
              <h4 className="text-green-300 font-medium mb-2">📚 Sources:</h4>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {formattedSources.map((source, index) => (
                    <div key={index} className="p-2 bg-white/5 rounded border border-white/10">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-white font-medium text-sm">
                          {source.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {source.domain}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-xs">{source.snippet}</p>
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 text-xs underline"
                      >
                        🔗 Read more
                      </a>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Add to Game Button */}
          {onContentAdded && (
            <Button
              onClick={() => onContentAdded?.(results.answer || '', results.type || '')}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              ➕ Add to Game
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-black/40 to-black/20 backdrop-blur-lg border-blue-500/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            🔗 Linkup.so D&D Enhancement
            <Badge variant="outline" className="bg-blue-600/20 border-blue-400">
              Real-time Web Content
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            variant={activeTab === tab.id ? "default" : "outline"}
            className={
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-white/10 text-white border-white/30 hover:bg-white/20"
            }
            size="sm"
          >
            {tab.icon} {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <Card className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-lg border-purple-500/50">
        <CardContent className="p-4">
          {renderTabContent()}
        </CardContent>
      </Card>

      {/* Results */}
      {renderResults()}
    </div>
  );
} 
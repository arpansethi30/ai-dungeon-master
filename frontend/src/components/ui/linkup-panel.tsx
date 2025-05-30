'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  linkupService, 
  type LinkupResponse, 
  formatLinkupSources, 
  truncateAnswer 
} from '@/lib/linkup';

interface LinkupPanelProps {
  onContentAdded?: (content: string, type: string) => void;
}

export function LinkupPanel({ onContentAdded }: LinkupPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('rules');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LinkupResponse | null>(null);
  
  // Form states
  const [rulesQuery, setRulesQuery] = useState('');
  const [rulesContext, setRulesContext] = useState('');
  const [monsterCR, setMonsterCR] = useState('');
  const [monsterEnv, setMonsterEnv] = useState('');
  const [spellName, setSpellName] = useState('');
  const [spellLevel, setSpellLevel] = useState('');
  const [spellClass, setSpellClass] = useState('');
  const [itemType, setItemType] = useState('');
  const [itemRarity, setItemRarity] = useState('');
  const [campaignTheme, setCampaignTheme] = useState('');
  const [campaignSetting, setCampaignSetting] = useState('');

  const handleSearch = async (searchType: string) => {
    setIsLoading(true);
    setResults(null);
    
    try {
      let result: LinkupResponse;
      
      switch (searchType) {
        case 'rules':
          result = await linkupService.searchRules({
            query: rulesQuery,
            context: rulesContext
          });
          break;
          
        case 'monsters':
          result = await linkupService.searchMonsters({
            challenge_rating: monsterCR,
            environment: monsterEnv
          });
          break;
          
        case 'spells':
          result = await linkupService.searchSpells({
            spell_name: spellName,
            spell_level: spellLevel,
            character_class: spellClass
          });
          break;
          
        case 'items':
          result = await linkupService.searchItems({
            item_type: itemType,
            rarity: itemRarity
          });
          break;
          
        case 'inspiration':
          result = await linkupService.getCampaignInspiration({
            theme: campaignTheme,
            setting: campaignSetting
          });
          break;
          
        case 'news':
          result = await linkupService.getDnDNews();
          break;
          
        default:
          throw new Error(`Unknown search type: ${searchType}`);
      }
      
      setResults(result);
      
      // Optionally add content to game if callback provided
      if (result.success && result.answer && onContentAdded) {
        onContentAdded(result.answer, searchType);
      }
      
    } catch (error) {
      console.error(`Linkup ${searchType} search failed:`, error);
      setResults({
        success: false,
        error: `Search failed: ${error}`,
        type: searchType
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'rules', label: '🎲 Rules', icon: '📚' },
    { id: 'monsters', label: '🐲 Monsters', icon: '👹' },
    { id: 'spells', label: '✨ Spells', icon: '🔮' },
    { id: 'items', label: '⚔️ Items', icon: '💎' },
    { id: 'inspiration', label: '🗺️ Campaigns', icon: '📜' },
    { id: 'news', label: '📰 News', icon: '📡' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'rules':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                🎲 Rules Question:
              </label>
              <Input
                value={rulesQuery}
                onChange={(e) => setRulesQuery(e.target.value)}
                placeholder="How does initiative work? What are spell slots?"
                className="bg-white/10 border-blue-400 text-white placeholder-blue-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                📝 Context (optional):
              </label>
              <Input
                value={rulesContext}
                onChange={(e) => setRulesContext(e.target.value)}
                placeholder="combat, spellcasting, etc."
                className="bg-white/10 border-blue-400 text-white placeholder-blue-300"
              />
            </div>
            <Button 
              onClick={() => handleSearch('rules')}
              disabled={isLoading || !rulesQuery.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? '🔍 Searching...' : '🔍 Look Up Rules'}
            </Button>
          </div>
        );

      case 'monsters':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                🐲 Challenge Rating:
              </label>
              <Input
                value={monsterCR}
                onChange={(e) => setMonsterCR(e.target.value)}
                placeholder="1, 5, 10, 20"
                className="bg-white/10 border-red-400 text-white placeholder-red-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                🌍 Environment:
              </label>
              <Input
                value={monsterEnv}
                onChange={(e) => setMonsterEnv(e.target.value)}
                placeholder="forest, dungeon, desert, underdark"
                className="bg-white/10 border-red-400 text-white placeholder-red-300"
              />
            </div>
            <Button 
              onClick={() => handleSearch('monsters')}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              {isLoading ? '🔍 Searching...' : '🐲 Find Monsters'}
            </Button>
          </div>
        );

      case 'spells':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                ✨ Spell Name:
              </label>
              <Input
                value={spellName}
                onChange={(e) => setSpellName(e.target.value)}
                placeholder="fireball, cure wounds, magic missile"
                className="bg-white/10 border-purple-400 text-white placeholder-purple-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  🎯 Level:
                </label>
                <Input
                  value={spellLevel}
                  onChange={(e) => setSpellLevel(e.target.value)}
                  placeholder="1, 2, 3..."
                  className="bg-white/10 border-purple-400 text-white placeholder-purple-300"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  👤 Class:
                </label>
                <Input
                  value={spellClass}
                  onChange={(e) => setSpellClass(e.target.value)}
                  placeholder="wizard, cleric"
                  className="bg-white/10 border-purple-400 text-white placeholder-purple-300"
                />
              </div>
            </div>
            <Button 
              onClick={() => handleSearch('spells')}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isLoading ? '🔍 Searching...' : '✨ Find Spells'}
            </Button>
          </div>
        );

      case 'items':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                ⚔️ Item Type:
              </label>
              <Input
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                placeholder="sword, armor, ring, potion"
                className="bg-white/10 border-yellow-400 text-white placeholder-yellow-300"
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
                className="bg-white/10 border-yellow-400 text-white placeholder-yellow-300"
              />
            </div>
            <Button 
              onClick={() => handleSearch('items')}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
            >
              {isLoading ? '🔍 Searching...' : '⚔️ Find Items'}
            </Button>
          </div>
        );

      case 'inspiration':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                🎭 Campaign Theme:
              </label>
              <Input
                value={campaignTheme}
                onChange={(e) => setCampaignTheme(e.target.value)}
                placeholder="mystery, horror, adventure, intrigue"
                className="bg-white/10 border-green-400 text-white placeholder-green-300"
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
                className="bg-white/10 border-green-400 text-white placeholder-green-300"
              />
            </div>
            <Button 
              onClick={() => handleSearch('inspiration')}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              {isLoading ? '🔍 Searching...' : '🗺️ Get Inspiration'}
            </Button>
          </div>
        );

      case 'news':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-lg border border-indigo-400/50">
              <h3 className="text-lg font-bold text-indigo-300 mb-2">📰 Latest D&D News</h3>
              <p className="text-indigo-200 text-sm mb-4">
                Get the latest Dungeons & Dragons news, updates, and releases from around the web
              </p>
              <Button 
                onClick={() => handleSearch('news')}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isLoading ? '🔍 Fetching...' : '📰 Get Latest News'}
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
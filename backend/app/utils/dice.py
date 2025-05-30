import random
import re
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass

@dataclass
class DiceRoll:
    """Represents a single dice roll result"""
    dice_notation: str
    individual_rolls: List[int]
    total: int
    modifier: int = 0
    advantage: bool = False
    disadvantage: bool = False
    critical: bool = False

class DiceEngine:
    """Advanced dice rolling engine for D&D mechanics"""
    
    @staticmethod
    def roll_single_die(sides: int) -> int:
        """Roll a single die with specified number of sides"""
        return random.randint(1, sides)
    
    @staticmethod
    def parse_dice_notation(notation: str) -> Tuple[int, int, int]:
        """
        Parse dice notation like '2d6+3' into (count, sides, modifier)
        Returns: (number_of_dice, die_sides, modifier)
        """
        # Remove spaces and convert to lowercase
        notation = notation.replace(" ", "").lower()
        
        # Regular expression to parse dice notation
        pattern = r'(\d+)?d(\d+)([+-]\d+)?'
        match = re.match(pattern, notation)
        
        if not match:
            raise ValueError(f"Invalid dice notation: {notation}")
        
        count = int(match.group(1)) if match.group(1) else 1
        sides = int(match.group(2))
        modifier = int(match.group(3)) if match.group(3) else 0
        
        return count, sides, modifier
    
    @staticmethod
    def roll_dice(notation: str, advantage: bool = False, disadvantage: bool = False) -> DiceRoll:
        """
        Roll dice using standard D&D notation
        
        Args:
            notation: Dice notation (e.g., "1d20+5", "2d6", "1d4-1")
            advantage: Roll twice, take higher (for d20 only)
            disadvantage: Roll twice, take lower (for d20 only)
        """
        count, sides, modifier = DiceEngine.parse_dice_notation(notation)
        
        # Handle advantage/disadvantage for d20 rolls
        if (advantage or disadvantage) and sides == 20 and count == 1:
            roll1 = DiceEngine.roll_single_die(sides)
            roll2 = DiceEngine.roll_single_die(sides)
            
            if advantage:
                selected_roll = max(roll1, roll2)
                individual_rolls = [roll1, roll2, f"(advantage: {selected_roll})"]
            else:  # disadvantage
                selected_roll = min(roll1, roll2)
                individual_rolls = [roll1, roll2, f"(disadvantage: {selected_roll})"]
            
            total = selected_roll + modifier
            critical = selected_roll == 20
            
        else:
            # Standard rolling
            individual_rolls = [DiceEngine.roll_single_die(sides) for _ in range(count)]
            total = sum(individual_rolls) + modifier
            critical = sides == 20 and len(individual_rolls) == 1 and individual_rolls[0] == 20
        
        return DiceRoll(
            dice_notation=notation,
            individual_rolls=individual_rolls,
            total=total,
            modifier=modifier,
            advantage=advantage,
            disadvantage=disadvantage,
            critical=critical
        )
    
    @staticmethod
    def roll_ability_scores() -> Dict[str, int]:
        """Roll 4d6, drop lowest for each ability score"""
        abilities = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
        scores = {}
        
        for ability in abilities:
            # Roll 4d6, drop lowest
            rolls = [DiceEngine.roll_single_die(6) for _ in range(4)]
            rolls.sort(reverse=True)
            score = sum(rolls[:3])  # Take highest 3
            scores[ability] = score
            
        return scores
    
    @staticmethod
    def roll_hit_points(hit_die: str, constitution_modifier: int, level: int) -> int:
        """Roll hit points for a character"""
        if level == 1:
            # First level gets max hit die + con modifier
            sides = int(hit_die.split('d')[1])
            return sides + constitution_modifier
        else:
            # Subsequent levels roll the hit die + con modifier
            roll = DiceEngine.roll_dice(hit_die)
            return max(1, roll.total + constitution_modifier)  # Minimum 1 HP per level
    
    @staticmethod
    def roll_initiative(dexterity_modifier: int) -> DiceRoll:
        """Roll initiative (1d20 + dex modifier)"""
        roll = DiceEngine.roll_dice("1d20")
        roll.total += dexterity_modifier
        roll.modifier = dexterity_modifier
        return roll
    
    @staticmethod
    def roll_skill_check(base_bonus: int, advantage: bool = False, disadvantage: bool = False) -> DiceRoll:
        """Roll a skill check (1d20 + bonus)"""
        roll = DiceEngine.roll_dice("1d20", advantage=advantage, disadvantage=disadvantage)
        roll.total += base_bonus
        roll.modifier = base_bonus
        return roll
    
    @staticmethod
    def roll_attack(attack_bonus: int, advantage: bool = False, disadvantage: bool = False) -> DiceRoll:
        """Roll an attack roll (1d20 + attack bonus)"""
        return DiceEngine.roll_skill_check(attack_bonus, advantage, disadvantage)
    
    @staticmethod
    def roll_damage(damage_dice: str, critical: bool = False) -> DiceRoll:
        """
        Roll damage dice, doubling on critical hits
        
        Args:
            damage_dice: Damage notation (e.g., "1d8+3", "2d6")
            critical: Whether this is a critical hit (doubles dice)
        """
        if critical:
            # On critical hits, double the number of dice
            count, sides, modifier = DiceEngine.parse_dice_notation(damage_dice)
            critical_notation = f"{count * 2}d{sides}+{modifier}"
            roll = DiceEngine.roll_dice(critical_notation)
            roll.critical = True
            return roll
        else:
            return DiceEngine.roll_dice(damage_dice)
    
    @staticmethod
    def roll_saving_throw(save_bonus: int, advantage: bool = False, disadvantage: bool = False) -> DiceRoll:
        """Roll a saving throw (1d20 + save bonus)"""
        return DiceEngine.roll_skill_check(save_bonus, advantage, disadvantage)

# Convenience functions
def roll(notation: str, **kwargs) -> DiceRoll:
    """Quick dice roll function"""
    return DiceEngine.roll_dice(notation, **kwargs)

def d20(modifier: int = 0, advantage: bool = False, disadvantage: bool = False) -> DiceRoll:
    """Quick d20 roll"""
    notation = f"1d20+{modifier}" if modifier >= 0 else f"1d20{modifier}"
    return DiceEngine.roll_dice(notation, advantage=advantage, disadvantage=disadvantage)

def d6(count: int = 1, modifier: int = 0) -> DiceRoll:
    """Quick d6 roll"""
    notation = f"{count}d6+{modifier}" if modifier >= 0 else f"{count}d6{modifier}"
    return DiceEngine.roll_dice(notation)

def d4(count: int = 1, modifier: int = 0) -> DiceRoll:
    """Quick d4 roll"""
    notation = f"{count}d4+{modifier}" if modifier >= 0 else f"{count}d4{modifier}"
    return DiceEngine.roll_dice(notation)

def d8(count: int = 1, modifier: int = 0) -> DiceRoll:
    """Quick d8 roll"""
    notation = f"{count}d8+{modifier}" if modifier >= 0 else f"{count}d8{modifier}"
    return DiceEngine.roll_dice(notation)

def d10(count: int = 1, modifier: int = 0) -> DiceRoll:
    """Quick d10 roll"""
    notation = f"{count}d10+{modifier}" if modifier >= 0 else f"{count}d10{modifier}"
    return DiceEngine.roll_dice(notation)

def d12(count: int = 1, modifier: int = 0) -> DiceRoll:
    """Quick d12 roll"""
    notation = f"{count}d12+{modifier}" if modifier >= 0 else f"{count}d12{modifier}"
    return DiceEngine.roll_dice(notation) 
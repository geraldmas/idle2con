export default class Generator {
  constructor(rank, baseCost, growthRates) {
    this.rank = rank;
    this.baseCost = baseCost;
    this.growthRates = growthRates; // { generator: 1.2, states: 1.2 }
    this.count = 0;
    this._isUnlocked = rank === 1; // Seul le générateur 1 est débloqué au départ
    this.unlockRequirement = null;
    this.unlockedFeatures = new Set();
  }

  getCost() {
    // Coût en états selon la spécification
    const baseStateCost = this.rank === 1 ? 1 : 10;
    const growthRate = this.rank === 1 ? 1.2 : 
                      this.rank === 2 ? 1.3 :
                      this.rank === 3 ? 1.4 : 1.5;
    return Math.floor(baseStateCost * Math.pow(growthRate, this.count));
  }

  getGeneratorCost() {
    // Coût en générateurs précédents selon la spécification
    if (this.rank === 1) {
      return 0; // Le générateur 1 ne coûte pas d'autres générateurs
    }
    const baseGeneratorCost = 10;
    const growthRate = this.rank === 2 ? 1.1 :
                      this.rank === 3 ? 1.2 : 1.3;
    return Math.floor(baseGeneratorCost * Math.pow(growthRate, this.count));
  }

  canAfford(resources, generators) {
    // Logs de débogage pour canAfford - Supprimés
    // if (this.rank === 2) {
    //     ...
    // }

    if (this.rank > 1 && (!generators || generators.length === 0)) {
      return false;
    }

    const stateCost = this.getCost();
    const currentState = resources?.value ?? 0;
    
    if (!resources || currentState < stateCost) {
      return false;
    }
    
    if (this.rank > 1) {
      const previousGenerator = generators[this.rank - 2];
      const generatorCost = this.getGeneratorCost();

      if (!previousGenerator || previousGenerator.count < generatorCost) {
        return false;
      }
    }
    
    return true;
  }

  purchase(resources, generators) {
    if (!this.isUnlocked() || !this.canAfford(resources, generators)) {
      return false;
    }

    // Déduire le coût en états
    resources.value -= this.getCost();

    // Déduire le coût en générateurs précédents si applicable
    if (this.rank > 1) {
      // Utiliser l'index correct pour le générateur précédent
      const previousGeneratorIndex = this.rank - 2;
      if (previousGeneratorIndex >= 0 && previousGeneratorIndex < generators.length) {
          const previousGenerator = generators[previousGeneratorIndex];
          const costToDeduct = this.getGeneratorCost();
          
          // Logs détaillés avant déduction
          console.log(`Purchase (Gen ${this.rank}): État avant déduction:`);
          console.log(`- Générateur ${previousGenerator.rank}: count=${previousGenerator.count}, coût à déduire=${costToDeduct}`);
          console.log(`- Générateur ${this.rank}: count=${this.count}`);
          
          // Modifier le compteur du générateur précédent
          previousGenerator.count -= costToDeduct;

          // Logs détaillés après déduction
          console.log(`Purchase (Gen ${this.rank}): État après déduction:`);
          console.log(`- Générateur ${previousGenerator.rank}: count=${previousGenerator.count}`);
          console.log(`- Générateur ${this.rank}: count=${this.count}`);
      } else {
          return false; // Annuler l'achat si l'index est invalide
      }
    }
    
    this.count++;
    this.checkFeatureUnlocks();
    
    return true;
  }

  getProduction() {
    // Production de base par tick par générateur
    const productionPerGenerator = (1/16);
    let totalProduction = this.count * productionPerGenerator;

    // Appliquer les bonus des paliers de puissance
    // Paliers : 10, 25, 50, 100, puis tous les 100 jusqu'à 1000
    const milestones = [10, 25, 50, 100];
    for (let i = 2; i <= 10; i++) {
        milestones.push(i * 100);
    }

    let bonusMultiplier = 1;
    milestones.forEach(milestone => {
        if (this.count >= milestone) {
            // Chaque palier atteint double la production
            bonusMultiplier *= 2;
        }
    });

    return totalProduction * bonusMultiplier;
  }

  checkUnlockCondition(generators) {
    if (this.rank === 1) return true;
    
    // Pour un générateur de rang N, le générateur précédent est de rang N-1.
    // Si les générateurs sont dans un tableau indexé de 0 à N-1,
    // le générateur de rang N est à l'index N-1.
    // Le générateur précédent (rang N-1) est donc à l'index (N-1) - 1 = N - 2.
    const previousGeneratorIndex = this.rank - 2;

    // S'assurer que l'index est valide
    if (previousGeneratorIndex < 0 || previousGeneratorIndex >= generators.length) {
        return false; // Index invalide, pas de générateur précédent
    }

    const previousGenerator = generators[previousGeneratorIndex];
    return previousGenerator && previousGenerator.count >= 10;
  }

  updateUnlockStatus(generators) {
    this._isUnlocked = this.checkUnlockCondition(generators);
  }

  isUnlocked() {
    return this._isUnlocked;
  }

  setUnlockRequirement(requirement) {
    this.unlockRequirement = requirement;
  }

  checkFeatureUnlocks() {
    // Déblocage des fonctionnalités selon la spécification
    if (this.rank === 2 && this.count >= 1) {
      this.unlockedFeatures.add('observations');
    }
    else if (this.rank === 3 && this.count >= 1) {
      this.unlockedFeatures.add('fusion');
      this.unlockedFeatures.add('observations_gen2');
    }
    else if (this.rank === 4 && this.count >= 1) {
      this.unlockedFeatures.add('improvements');
      this.unlockedFeatures.add('observations_gen3');
    }
  }

  hasFeature(feature) {
    return this.unlockedFeatures.has(feature);
  }

  getPowerMilestone(milestone) {
    return Math.floor(this.count / milestone) * milestone;
  }

  getMilestoneBonus(milestone) {
    const reachedMilestone = this.getPowerMilestone(milestone);
    return reachedMilestone > 0 ? Math.pow(2, reachedMilestone / milestone) : 1;
  }
} 
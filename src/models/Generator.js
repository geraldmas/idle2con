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
    // Pour la compatibilité avec le code existant, on retourne le coût en états
    return Math.floor(this.baseCost.states * Math.pow(this.growthRates.states, this.count));
  }

  getGeneratorCost() {
    return Math.floor(this.baseCost.generator * Math.pow(this.growthRates.generator, this.count));
  }

  canAfford(resources, generators) {
    // Vérifier si le tableau de générateurs est défini pour éviter les erreurs lors de l'accès aux générateurs précédents
    // Pour le rang 1, generators peut être indéfini ou vide, ce qui est normal.
    if (this.rank > 1 && (!generators || generators.length === 0)) {
      console.error(`Generators array is missing or empty for Generator ${this.rank} in canAfford`);
      return false; // Impossible d'acheter si le tableau de générateurs n'est pas disponible pour les rangs > 1
    }

    // Vérifier si on a assez d'états (en utilisant la propriété 'value')
    const stateCost = this.getCost();
    // L'objet resource passé a la valeur dans sa propriété 'value'
    const currentState = resources?.value ?? 0;
    
    console.log(`Generator ${this.rank} Can Afford Check: States Needed=${stateCost}, Current States=${currentState}, Resource Object:`, resources, `Generators Object:`, generators);

    // Vérification de base pour les états
    if (!resources || currentState < stateCost) {
      console.log(`Generator ${this.rank} CANNOT Afford: Not enough states. Have ${currentState}, Need ${stateCost}`);
      return false; 
    }
    
    // Vérifier si on a assez de générateurs du rang précédent (pour rangs > 1)
    if (this.rank > 1) {
      // Le générateur précédent est à l'index (rank - 1) - 1 = rank - 2 dans l'array si l'array est 0-indexed par rang.
      // Si generators est l'array generators.value, l'index est this.rank - 2.
      const previousGeneratorIndex = this.rank - 2; // assuming 0-indexed array where index 0 is rank 1
      
      // Assurons-nous que l'index est valide et que le générateur existe
      if (previousGeneratorIndex < 0 || previousGeneratorIndex >= generators.length) {
        console.error(`Invalid index for previous generator (${previousGeneratorIndex}) for Generator ${this.rank}`);
        return false; // Index invalide
      }

      const previousGenerator = generators[previousGeneratorIndex];
      const generatorCost = this.getGeneratorCost();

      if (!previousGenerator || previousGenerator.count < generatorCost) {
        console.log(`Generator ${this.rank} CANNOT Afford: Not enough previous generators. Have ${previousGenerator?.count ?? 0} (rank ${this.rank - 1}), Need ${generatorCost}`);
        return false;
      }
    }
    
    console.log(`Generator ${this.rank} CAN Afford!`);
    return true;
  }

  purchase(resources, generators) {
    if (!this.isUnlocked() || !this.canAfford(resources, generators)) {
      return false;
    }

    // Déduire les coûts
    resources.states -= this.getCost();
    if (this.rank > 1) {
      generators[this.rank - 1].count -= this.getGeneratorCost();
    }
    
    this.count++;
    
    // Vérifier les déblocages de fonctionnalités
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
    
    const previousGenerator = generators[this.rank - 1];
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
    // Déblocage des fonctionnalités selon le rang
    switch(this.rank) {
      case 2:
        if (this.count >= 1) this.unlockedFeatures.add('observations');
        break;
      case 3:
        if (this.count >= 1) {
          this.unlockedFeatures.add('fusion');
          this.unlockedFeatures.add('observations_gen2');
        }
        break;
      case 4:
        if (this.count >= 1) {
          this.unlockedFeatures.add('improvements');
          this.unlockedFeatures.add('observations_gen3');
        }
        break;
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
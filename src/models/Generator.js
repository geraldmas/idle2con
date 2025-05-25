import TickService from '../services/TickService';
import { ref } from 'vue';

export default class Generator {
  constructor(rank, baseCost, growthRates) {
    this.rank = rank;
    this.baseCost = baseCost;
    this.growthRates = growthRates; // { generator: 1.2, states: 1.2 }
    this._count = ref(0);
    this._isUnlocked = ref(rank === 1);
    this.unlockRequirement = null;
    this.unlockedFeatures = new Set();
    this._maxCount = ref(0);
    this._manualPurchases = ref(0);
  }

  get count() {
    return this._count.value;
  }

  set count(value) {
    this._count.value = value;
    if (value > this._maxCount.value) {
      this._maxCount.value = value;
    }
  }

  get maxCount() {
    return this._maxCount.value;
  }

  set maxCount(value) {
    this._maxCount.value = value;
  }

  get manualPurchases() {
    return this._manualPurchases.value;
  }

  set manualPurchases(value) {
    this._manualPurchases.value = value;
  }

  get isUnlocked() {
    return this._isUnlocked.value;
  }

  set isUnlocked(value) {
    this._isUnlocked.value = value;
  }

  getCost(gameState) {
    // Coût en états selon la spécification
    // Appliquer le diviseur de coûts provenant des antiparticules
    const costDivider = gameState?.antiparticleEffects?.costDivider || 1;

    const baseStateCost = this.rank === 1 ? 1 : // Coût de base en états pour G1
                          this.rank === 2 ? 10 :
                          this.rank === 3 ? 50 :
                          this.rank === 4 ? 200 : 0; // Coûts de base pour G2, G3, G4

    const growthRate = this.rank === 1 ? 1.2 :
                      this.rank === 2 ? 1.3 :
                      this.rank === 3 ? 1.4 :
                      this.rank === 4 ? 1.5 : 1; // Default to 1 if rank is somehow out of expected range

    // Utiliser manualPurchases pour la croissance exponentielle du coût
    const calculatedCost = baseStateCost * Math.pow(growthRate, this.manualPurchases);

    return Math.floor(calculatedCost / costDivider); // Appliquer le diviseur de coûts
  }

  getGeneratorCost(gameState) {
    // Coût en générateurs précédents selon la spécification
    // Appliquer le diviseur de coûts provenant des antiparticules
    const costDivider = gameState?.antiparticleEffects?.costDivider || 1;

    if (this.rank === 1) {
      return 0; // Le générateur 1 ne coûte pas d'autres générateurs
    }
    const baseGeneratorCost = 10; // Coût de base en générateurs précédents
    const growthRate = this.rank === 2 ? 1.1 :
                      this.rank === 3 ? 1.2 : 1.3; // Taux de croissance en générateurs
                      
    // Utiliser manualPurchases pour la croissance exponentielle du coût
    const calculatedCost = baseGeneratorCost * Math.pow(growthRate, this.manualPurchases);

    return Math.floor(calculatedCost / costDivider); // Appliquer le diviseur de coûts
  }

  canAfford(resources, generators, gameState) {
    if (this.rank > 1 && (!generators || generators.length === 0)) {
      return false;
    }

    // Si le mode debug est activé, ignorer les coûts
    if (TickService.debug) {
      return true; // Toujours abordable en mode debug
    }

    // Utiliser les méthodes getCost et getGeneratorCost qui prennent en compte les effets
    const stateCost = this.getCost(gameState);
    const currentState = resources?.value ?? 0;
    
    if (!resources || currentState < stateCost) {
      return false;
    }
    
    if (this.rank > 1) {
      const previousGenerator = generators[this.rank - 2];
      const generatorCost = this.getGeneratorCost(gameState); // Utiliser la méthode qui prend en compte les effets

      if (!previousGenerator || previousGenerator.count < generatorCost) {
        return false;
      }
    }
    
    return true;
  }

  purchase(resources, generators, gameState) {
    if (!this.isUnlocked) {
      return false;
    }

    // Si le mode debug est activé, ignorer les coûts
    if (TickService.debug) {
      this.count++;
      if (this.count > this.maxCount) {
        this.maxCount = this.count;
      }
      this.manualPurchases++;
      this.checkFeatureUnlocks(); // Passez gameState si nécessaire ici
      this.updateUnlockStatus(generators); // Mettre à jour l'état de déblocage immédiatement après l'achat
      return true;
    }

    // Utiliser canAfford qui prend en compte gameState
    if (!this.canAfford(resources, generators, gameState)) {
      return false;
    }

    // Déduire le coût en états en utilisant la méthode getCost qui prend en compte les effets
    resources.value -= this.getCost(gameState);

    // Déduire le coût en générateurs précédents si applicable
    if (this.rank > 1) {
      const previousGeneratorIndex = this.rank - 2;
      if (previousGeneratorIndex >= 0 && previousGeneratorIndex < generators.length) {
          const previousGenerator = generators[previousGeneratorIndex];
          // Utiliser la méthode getGeneratorCost qui prend en compte les effets
          const costToDeduct = this.getGeneratorCost(gameState);
          
          previousGenerator.count -= costToDeduct;
      } else {
          // Cela ne devrait normalement pas arriver si canAfford a été appelé avant
          console.error('Erreur logique: impossible de trouver le générateur précédent pour déduire le coût.');
          return false; 
      }
    }
    
    this.count++;
    // Mettre à jour le nombre maximum si nécessaire
    if (this.count > this.maxCount) {
      this.maxCount = this.count;
    }
    // Incrémenter le compteur d'achats manuels
    this.manualPurchases++;
    this.checkFeatureUnlocks(); // Passez gameState si nécessaire ici
    // L'état de déblocage est mis à jour par le TickService
    
    return true;
  }

  getProduction(gameState) {
    // Production de base par tick par générateur
    const baseProductionPerGenerator = 1/32; // Utiliser 1/32 selon la spec Potentiel

    // Obtenir le bonus des paliers de puissance (basé sur maxCount)
    const milestoneBonus = this.getMilestoneBonus();

    // Obtenir le multiplicateur global des antiparticules
    const antiparticleProductionMultiplier = gameState?.antiparticleEffects?.generatorProductionMultiplier || 1;

    // Production totale avec une meilleure précision
    const totalProduction = Number((this.count * baseProductionPerGenerator * milestoneBonus * antiparticleProductionMultiplier).toFixed(10));

    return totalProduction;
  }

  getProductionPerGenerator(gameState) {
    // Production de base par tick par générateur
    const baseProductionPerGenerator = 1/32; // Utiliser 1/32 selon la spec Potentiel

    // Obtenir le bonus des paliers de puissance (basé sur maxCount)
    const milestoneBonus = this.getMilestoneBonus();

    // Obtenir le multiplicateur global des antiparticules
    const antiparticleProductionMultiplier = gameState?.antiparticleEffects?.generatorProductionMultiplier || 1;

    // Production par générateur avec une meilleure précision
    const productionPerGenerator = Number((baseProductionPerGenerator * milestoneBonus * antiparticleProductionMultiplier).toFixed(10));

    return productionPerGenerator;
  }

  getBaseProduction() {
    // Cette méthode devrait peut-être être renommée ou clarifiée.
    // Si elle renvoie la production *sans* bonus, elle reste 1/16 (ou 1/32).
    // Si elle est censée être utilisée pour l'affichage de la production de BASE dans l'UI,
    // elle devrait peut-être inclure le multiplicateur global si celui-ci est considéré comme BASE.
    // En l'état, elle renvoie la production de base par unité, sans bonus.
    return 1/32; // Production de base par générateur par tick
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
    if (this.rank === 1) {
      this._isUnlocked.value = true;
      return;
    }
    
    const previousGenerator = generators?.find(gen => gen.rank === this.rank - 1);
    // Mettre à jour la valeur réactive _isUnlocked
    this._isUnlocked.value = previousGenerator && previousGenerator.count >= 10;
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

  getMilestoneBonus() {
    const reachedMilestones = this.getReachedMilestones();
    // Le bonus est un multiplicateur pour CHAQUE palier atteint
    return Math.pow(2, reachedMilestones.length); // Double la production pour chaque palier atteint
  }

  getPowerMilestones() {
    // Paliers par puissance de 10 : 10, 100, 1000, ...
    const milestones = [];
    let currentMilestone = 10;
    const maxMilestone = 10000000000; // Limite à 10^10

    while (currentMilestone <= maxMilestone) {
      milestones.push(currentMilestone);
      currentMilestone *= 3;
    }

    return milestones;
  }

  getReachedMilestones() {
    // Utiliser maxCount au lieu de count pour déterminer les paliers atteints
    return this.getPowerMilestones().filter(milestone => this.maxCount >= milestone);
  }

  getNextMilestone() {
    // Utiliser maxCount pour déterminer le prochain palier
    return this.getPowerMilestones().find(milestone => this.maxCount < milestone);
  }

  getMilestoneProgress() {
    const nextMilestone = this.getNextMilestone();
    if (!nextMilestone) return 1; // Tous les paliers sont atteints
    // Utiliser maxCount pour la progression
    return this.maxCount / nextMilestone;
  }
} 
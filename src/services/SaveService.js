import { ParticleStorage } from './ParticleStorage';

export class SaveService {
  constructor() {
    this.storageKey = 'quantum_factory_save';
    this.particleStorage = new ParticleStorage();
  }

  saveGame(gameState) {
    try {
      console.log('Sauvegarde du jeu - État actuel:', gameState);
      
      const saveData = {
        resources: Array.from(gameState.resources.entries()).map(([name, resource]) => {
          console.log(`Sauvegarde de la ressource ${name}:`, resource);
          return {
            name,
            value: resource.value,
            totalEarned: resource.totalEarned,
            nextStateMilestone: resource.nextStateMilestone,
            generators: resource.generators
          };
        }),
        generators: gameState.generators.map(generator => {
          console.log(`Sauvegarde du générateur ${generator.rank}:`, generator);
          return {
            rank: generator.rank,
            count: generator.count,
            reachedMilestones: generator.reachedMilestones,
            maxCount: generator.maxCount, // Add this line
            manualPurchases: generator.manualPurchases // Add this line
          };
        }),
        particles: this.particleStorage.getParticles().map(p => p.toJSON()),
        prestigeLevel: gameState.prestigeLevel || 0,
        prestigeMultiplier: gameState.prestigeMultiplier || 1,
        antiparticlesUnlocked: gameState.antiparticlesUnlocked || false,
        supersymmetricParticlesUnlocked: gameState.supersymmetricParticlesUnlocked || false,
        antipotential: gameState.antipotential || 0,
        observationCount: gameState.observationCount || 0,
        antiparticleObservationCount: gameState.antiparticleObservationCount || 0
      };

      console.log('Données à sauvegarder:', saveData);
      localStorage.setItem(this.storageKey, JSON.stringify(saveData));
      console.log('Sauvegarde terminée avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du jeu:', error);
    }
  }

  loadGame() {
    try {
      const saveData = localStorage.getItem(this.storageKey);
      if (!saveData) {
        console.log('Aucune sauvegarde trouvée');
        return null;
      }

      const parsedData = JSON.parse(saveData);
      console.log('Données chargées:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('Erreur lors du chargement de la sauvegarde:', error);
      return null;
    }
  }

  clearSave() {
    try {
      localStorage.removeItem(this.storageKey);
      this.particleStorage.clear();
      console.log('Sauvegarde effacée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la sauvegarde:', error);
    }
  }
} 
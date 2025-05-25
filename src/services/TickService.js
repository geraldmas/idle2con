import GameState from '../models/GameState';
import { reactive } from 'vue';

class TickService {
  constructor() {
    // Initialisation par défaut - ces collections seront remplacées par celles d'App.vue
    this.resources = reactive(new Map());
    // On n'a plus besoin d'une instance interne de GameState ici
    // this.gameState = reactive(new GameState()); 
    this.isRunning = false;
    this.debug = false;
    this.dt = 0.1; // dt fixe à 0.1 seconde
    this.intervalId = null; // Pour stocker l'ID de l'intervalle

    // Variables pour stocker les collections réactives passées par App.vue
    this.gameStateResources = null;
    this.gameStateGenerators = null;
  }

  // Nouvelle méthode pour recevoir les collections réactives d'App.vue
  setGameStateCollections(resourcesMap, generatorsArray) {
    this.gameStateResources = resourcesMap;
    this.gameStateGenerators = generatorsArray;
  }

  // Les méthodes addResource et addGenerator ne sont plus nécessaires ici,
  // car App.vue gère l'initialisation et passe les collections complètes.
  // addResource(resource) { ... }
  // addGenerator(generator) { ... }

  // getResourcesMap renvoie maintenant la map passée par App.vue
  getResourcesMap() {
      return this.gameStateResources;
  }

  getResource(name) {
    // Utiliser la map passée par App.vue
    return this.gameStateResources?.get(name);
  }

  // getGeneratorsArray renvoie maintenant le tableau passé par App.vue
  getGeneratorsArray() {
      return this.gameStateGenerators;
  }

  // getGameState n'est plus pertinent si GameState est géré par App.vue
  // getGameState() { ... }

  getDt() {
    return this.dt;
  }

  setDebug(value) {
    this.debug = value;
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.intervalId = setInterval(() => this.tick(), this.dt * 1000);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  tick() {
    if (!this.isRunning || !this.gameStateResources || !this.gameStateGenerators) return;

    // Logs de débogage : afficher les compteurs de tous les générateurs à chaque tick
    if (this.debug) {
        let generatorCounts = 'Compteurs Générateurs: ';
        this.gameStateGenerators.forEach(gen => {
            generatorCounts += `${gen.name}: ${gen.count} | `;
        });
        console.log(generatorCounts);
    }

    // Mettre à jour le Potentiel
    const potentiel = this.getResource('Potentiel');
    if (potentiel) {
      // La production de potentiel vient uniquement des générateurs de rang 1
      const gen1 = this.gameStateGenerators.find(gen => gen.rank === 1);
      if (gen1) {
        // Mettre à jour le N (nombre de générateurs) dans la ressource Potentiel
        potentiel.setGenerators(gen1.count);
        const production = gen1.getProduction();
        
        const currentValue = potentiel.getValue();
        potentiel.setValue(currentValue + production * this.dt);
      }

      // Vérifier les paliers de puissance pour les États
      const etats = this.getResource('États');
      const potentielValue = potentiel.getValue();

      if (etats && potentiel) {
        const currentEtatsValue = etats.getValue();
        let nextStateThreshold = Math.pow(2, etats.totalEarned / 10);

        while (potentielValue >= nextStateThreshold) {
          etats.value += 1;
          etats.totalEarned += 1;
          nextStateThreshold = Math.pow(2, etats.totalEarned / 10);
        }

        etats.updateNextStateMilestone(potentielValue);
      }
    }

    // Production de Générateurs I par les Générateurs II
    const gen1 = this.gameStateGenerators.find(gen => gen.rank === 1);
    const gen2 = this.gameStateGenerators.find(gen => gen.rank === 2);
    
    if (gen1 && gen2 && gen2.count > 0) {
      // Chaque Générateur II produit 0.1 Générateur I par seconde
      const gen1Production = gen2.count * 0.1 * this.dt;
      gen1.count += gen1Production;
      
      if (this.debug) {
        console.log(`Production de Générateurs I: +${gen1Production.toFixed(3)} (${gen2.count} Générateurs II)`);
      }
    }

    // Logique pour vérifier et débloquer les générateurs
    this.gameStateGenerators.forEach((generator, index) => {
        generator.updateUnlockStatus(this.gameStateGenerators);
    });

    if (this.debug) {
      console.log('Tick:', {
        dt: this.dt,
        potentiel: potentiel?.getValue(),
        etats: this.getResource('États')?.getValue(),
      });
    }
  }
}

export default new TickService(); 
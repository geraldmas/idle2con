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
    if (!this.isRunning || !this.gameStateResources || !this.gameStateGenerators) return; // S'assurer que les collections sont définies

    // Mettre à jour le Potentiel
    const potentiel = this.getResource('Potentiel');
    if (potentiel) {
      // La production de potentiel vient uniquement des générateurs de rang 1
      // Utiliser le tableau de générateurs passé par App.vue
      const gen1 = this.gameStateGenerators.find(gen => gen.rank === 1);
      // S'assurer que gen1 est défini et a une méthode getProduction
      const production = (gen1 && typeof gen1.getProduction === 'function') ? gen1.getProduction() : 0;
      
      // Utiliser le dt fixe ici
      const currentValue = potentiel.getValue();
      potentiel.setValue(currentValue + production * this.dt);

      // Vérifier les paliers de puissance pour les États
      const etats = this.getResource('États');
      const potentielValue = potentiel.getValue();

      if (etats && potentiel) {
        const currentEtatsValue = etats.getValue();

        // Utiliser totalEarned pour calculer le seuil du prochain état
        const nextStateThreshold = Math.pow(1.2, etats.totalEarned + 1);

         // Tant que le potentiel accumulé est supérieur ou égal au seuil du prochain état à gagner
         while (potentielValue >= nextStateThreshold) {
           // Gagner un état : incrémenter le nombre possédé ET le total gagné
           etats.value += 1;
           etats.totalEarned += 1;

           // Recalculer le seuil pour le prochain état à gagner basé sur le nouveau totalEarned
           nextStateThreshold = Math.pow(1.2, etats.totalEarned + 1);

           // Mettre à jour le prochain palier d'état pour l'affichage dans la ressource États
           // Cette méthode sera appelée après la boucle pour s'assurer que l'affichage est correct.
           // etats.updateNextStateMilestone(potentielValue); // Appel déplacé après la boucle
         }

         // Mettre à jour le prochain palier d'état pour l'affichage, basé sur le potentiel actuel
         // etats.updateNextStateMilestone(potentielValue);
         // Note : L'appel à updateNextStateMilestone est déjà fait dans la boucle while.
         // Assurons-nous qu'elle est appelée au moins une fois même si aucun état n'est gagné dans ce tick.
         etats.updateNextStateMilestone(potentielValue); // Appel ici pour l'affichage initial ou si aucun état gagné

      }
    }

    // Logique pour vérifier et débloquer les générateurs
    this.gameStateGenerators.forEach(generator => {
        // Utiliser updateUnlockStatus qui appelle checkUnlockCondition en interne
        generator.updateUnlockStatus(this.gameStateGenerators);
        
        // La logique d'unlock dans TickService n'est plus nécessaire car updateUnlockStatus gère _isUnlocked
        // et l'interface utilisateur réagit à isUnlocked().
        // if (!generator.isUnlocked() && generator.unlockRequirement) {
        //     const requirementMet = generator.unlockRequirement.check({
        //         getGeneratorCount: (index) => { ... }
        //     });
        //    if (requirementMet) {
        //        generator.unlock();
        //    }
        // }
    });


    if (this.debug) {
      console.log('Tick:', {
        dt: this.dt,
        potentiel: potentiel?.getValue(),
        etats: this.getResource('États')?.getValue(),
        // Production totale n'est plus une méthode de GameState, il faut la calculer si nécessaire pour le log
        // production: this.gameState.getTotalProduction()
      });
    }
  }
}

export default new TickService(); 
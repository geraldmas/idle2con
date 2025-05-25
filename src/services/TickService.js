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
      if (etats) {
        const potentielValue = potentiel.getValue();
        const currentEtatsValue = etats.getValue();
        
        // Trouver la prochaine puissance de 2 supérieure ou égale à la valeur actuelle des États + 1
        // Gérer le cas initial pour 0 états, premier palier à 2 potentiel pour gagner 1 état (0->1)
        // Puis les paliers sont 2, 4, 8, 16, ... pour gagner l'état suivant (1->2, 2->3, 3->4)
        // La formule est 2^(nombre d'états actuels) pour le palier *suivant*. Si on a 0 état, le prochain palier est 2^1 = 2.
        // Si on a 1 état, le prochain palier est 2^2 = 4. Etc.
        let nextEtatsThreshold = Math.pow(2, currentEtatsValue + 1);

        // Tant que le potentiel dépasse le palier *actuel* (basé sur le nombre d'états), on gagne un état.
        // On doit vérifier par rapport à Math.pow(2, nbrEtatsActuels) pour gagner le nbrEtatsActuels + 1 ème état.
        // Le palier pour obtenir l'état N (où l'on a N-1 états) est 2^N.
        // Donc si on a 0 états, on gagne le 1er état (N=1) au palier 2^1=2 Potentiel.
        // Si on a 1 état, on gagne le 2ème état (N=2) au palier 2^2=4 Potentiel.

         // La logique correcte est de vérifier si le potentiel >= au palier pour l'état suivant (currentEtatsValue + 1)
         let thresholdForNextState = Math.pow(2, currentEtatsValue + 1);

         while (potentielValue >= thresholdForNextState) {
           etats.setValue(etats.getValue() + 1);
           // Recalculer le seuil pour le prochain état à gagner
           thresholdForNextState = Math.pow(2, etats.getValue() + 1);
         }
      }
    }

    // Logique pour vérifier et débloquer les générateurs
    this.gameStateGenerators.forEach(generator => {
        if (!generator.isUnlocked() && generator.unlockRequirement) {
            // Nous n'avons plus d'instance de GameState dans TickService,
            // il faut passer l'état nécessaire à la méthode check ou trouver une alternative.
            // Pour l'instant, je vais laisser la logique de déblocage en commentaire ou l'adapter.
            // Il faut accéder au nombre de générateurs via gameStateGenerators.

            // Adapter la logique de déblocage pour utiliser gameStateGenerators
             const requirementMet = generator.unlockRequirement.check({
                 getGeneratorCount: (index) => {
                     // S'assurer que l'index existe dans le tableau
                     if (index >= 0 && index < this.gameStateGenerators.length) {
                          return this.gameStateGenerators[index].count; // Accéder au count de l'objet réactif
                     }
                    return 0; // Retourner 0 si l'index est invalide
                 }
             });

            if (requirementMet) {
                generator.unlock(); // Appeler la méthode unlock du générateur
            }
        }
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
import { reactive } from 'vue';

class TickService {
  constructor() {
    // Initialisation par défaut - ces collections seront remplacées par celles d'App.vue
    // this.resources = reactive(new Map()); // Non utilisé directement pour les collections globales
    this.isRunning = false;
    this.debug = false;
    this.dt = 0.1; // dt fixe à 0.1 seconde
    this.intervalId = null; // Pour stocker l'ID de l'intervalle

    // Variable pour stocker l'état du jeu complet passé par App.vue
    this.gameState = null;
  }

  // Nouvelle méthode pour recevoir l'état du jeu complet d'App.vue
  setGameState(gameState) {
    this.gameState = gameState;
  }

  // Les méthodes addResource et addGenerator ne sont plus nécessaires ici,
  // car App.vue gère l'initialisation et passe les collections complètes.
  // addResource(resource) { ... }
  // addGenerator(generator) { ... }

  // getResourcesMap renvoie maintenant la map passée par App.vue
  getResourcesMap() {
      return this.gameState?.resources;
  }

  getResource(name) {
    // Utiliser la map passée par App.vue
    return this.gameState?.resources.get(name);
  }

  // getGeneratorsArray renvoie maintenant le tableau passé par App.vue
  getGeneratorsArray() {
      return this.gameState?.generators;
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
    if (this.isRunning) {
      this.isRunning = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  }

  tick() {
    try {
      if (!this.isRunning || !this.gameState) return;

      // Calculate totalParticleDtMultiplier from active particles
      let totalParticleDtMultiplier = 1.0;
      if (this.gameState && this.gameState.particleStorageInstance) {
          const activeParticles = this.gameState.particleStorageInstance.getParticles(); // Assuming getParticles() returns all stored/active particles
          if (activeParticles) {
              for (const particle of activeParticles) {
                  totalParticleDtMultiplier *= particle.getDtMultiplier();
              }
          }
      }

      // Logs de débogage : afficher les compteurs de tous les générateurs à chaque tick
      if (this.debug) {
          let generatorCounts = 'Compteurs Générateurs: ';
          // Accéder aux générateurs via gameState
          this.gameState.generators.forEach(gen => {
              generatorCounts += `${gen.name}: ${gen.count.toFixed(2)} | `; // Utiliser toFixed pour l'affichage
          });
          console.log(generatorCounts);
      }

      // Met à jour l'état du jeu à chaque tick
      // Appliquer les effets des antiparticules avant de mettre à jour les ressources et générateurs
      const antiparticleEffects = this.gameState.antiparticleEffects || {};

      // Mettre à jour les générateurs (leur logique de déblocage et de coût pourrait dépendre des effets)
      // Accéder aux générateurs via gameState
      this.gameState.generators.forEach((generator, index) => {
        // Revenir à l'appel direct, en attendant une meilleure solution
        if (typeof generator.updateUnlockStatus === 'function') {
          // Mettre à jour l'état de déblocage de chaque générateur
          generator.updateUnlockStatus(this.gameState.generators); // Passer tous les générateurs pour vérification
        }
      });

      // Production des générateurs de rang supérieur (produisent des générateurs de rang inférieur)
      this.gameState.generators.forEach(generator => {
        if (typeof generator.runHigherRankProduction === 'function') {
          generator.runHigherRankProduction(this.dt, this.gameState.generators, antiparticleEffects);
        }
      });

      // Mettre à jour le Potentiel après avoir mis à jour tous les générateurs
      const potentielResource = this.gameState.resources.get('Potentiel');
      const gen1ForPotentiel = this.gameState.generators.find(gen => gen.rank === 1); 
      if (potentielResource && gen1ForPotentiel) {
        potentielResource.setGenerators(gen1ForPotentiel.count);
        // Utiliser getBaseProduction() pour la production de base, comme suggéré
        const baseProduction = gen1ForPotentiel.getBaseProduction ? gen1ForPotentiel.getBaseProduction() : 1/32;
        const milestoneBonus = gen1ForPotentiel.getMilestoneBonus();
        const antiparticleMultiplier = antiparticleEffects?.generatorProductionMultiplier || 1;

        // Calculer la production totale
        // existing antiparticleEffects.dtExponent logic
        const currentDtExponent = antiparticleEffects?.dtExponent || 1;
        // Apply the particle dtMultiplier to the base dt BEFORE exponentiation
        const effectiveDt = Math.pow(this.dt * totalParticleDtMultiplier, currentDtExponent);
        
        const potentielProduction = Number((gen1.count * baseProduction * milestoneBonus * antiparticleMultiplier * effectiveDt).toFixed(10));
        
        // Mettre à jour la valeur du potentiel

        potentielResource.value = Number((potentielResource.value + potentielProduction).toFixed(10));

        if (this.debug) {
          console.log('Production Potentiel:', {
            count: gen1ForPotentiel.count,
            baseProduction,
            milestoneBonus,
            antiparticleMultiplier,
            dt: this.dt, // Log original dt
            totalParticleDtMultiplier, // Log particle multiplier
            currentDtExponent, // Log exponent
            effectiveDt, // Log effective Dt
            production: potentielProduction,
            total: potentielResource.value
          });
        }
      }

      // Vérifier les paliers d'état pour la ressource Potentiel et ajouter des États si nécessaire
      const etatsResource = this.gameState.resources.get('États');
      if (potentielResource && etatsResource) {
        etatsResource.checkStateMilestone(potentielResource.getValue());
        etatsResource.updateNextStateMilestone(potentielResource.getValue(), antiparticleEffects);
      }

      if (this.debug) {
        console.log('Tick:', {
          dt: this.dt,
          potentiel: potentielResource?.getValue(),
          etats: etatsResource?.getValue(),
        });
      }
    } catch (error) {
      console.error('Erreur dans le tick:', error);
      this.stop(); // Arrêter le tick en cas d'erreur pour éviter les boucles infinies de plantage
    }
  }

  addResource(resource) {
    // this.resources.set(resource.name, resource);
  }

  getResources() {
    // return Array.from(this.resources.values());
  }

  setTickRate(rate) {
     // Si la vitesse de tick doit être affectée par les antiparticules, la logique serait ici.
     // Par exemple, ajuster this.dt * 1000 dans setInterval en fonction des effets.
     // Pour l'instant, on utilise un dt fixe de 0.1.
     // this.dt = ... calcule basé sur les effets si nécessaire ...
     // this.restartInterval(); // Méthode pour clear et reset l'intervalle avec le nouveau dt
  }

  // Méthode utilitaire pour redémarrer l'intervalle si le tick rate change
  restartInterval() {
      if (this.intervalId) {
          clearInterval(this.intervalId);
      }
      if (this.isRunning) {
          this.intervalId = setInterval(() => this.tick(), this.dt * 1000); // Utiliser le dt interne
      }
  }

  // L'ancienne méthode update est fusionnée dans tick
  // update() { ... }
}

export default new TickService(); 
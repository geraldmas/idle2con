<template>
  <div class="app">
    <header class="app-header">
      <h1>Quantum Factory</h1>
      <div class="debug-controls">
        <button @click="toggleDebug" class="debug-button">
          {{ isDebugEnabled ? 'Désactiver Debug' : 'Activer Debug' }}
        </button>
        <button @click="resetGame" class="reset-button">
          Reset Game
        </button>
      </div>
    </header>

    <div class="game-container">
      <!-- Section Production -->
      <section class="game-section production-section">
        <h2>Production</h2>
        <div class="resources-panel">
          <div v-for="resource in gameState.resources.values()" :key="resource.name" class="resource">
            <span class="resource-name">{{ resource.name }}</span>
            <span class="resource-value">{{ formatNumber(resource.getValue()) }}</span>
            <span v-if="resource.name === 'Potentiel'" class="resource-details">
              (N * a * dt /s)
              <br>
              (N: {{ Math.floor(resource.generators) }}, a: {{ formatNumber(resource.baseProduction, 3) }}, dt: {{ formatNumber(TickService.getDt(), 3) }})
            </span>
            <span v-if="resource.name === 'États' && resource.nextStateMilestone !== null" class="resource-next-milestone">
              Prochain état à {{ formatNumber(resource.nextStateMilestone) }} Potentiel
            </span>
          </div>
        </div>
        <h3>Générateurs</h3>
        <div class="generators-panel">
          <Generator
            v-for="(generator, index) in gameState.generators"
            :key="generator.name"
            :name="generator.name"
            :generator="generator"
            :unlock-requirement="generator.unlockRequirement"
            :milestone-progress="generator.getMilestoneProgress()"
            :next-milestone="generator.getNextMilestone()"
            :milestone-bonus="generator.getMilestoneBonus()"
            :reached-milestones="generator.getReachedMilestones()"
            @buy="handleBuyGenerator(index, $event)"
          />
        </div>
      </section>

      <!-- Section Particules -->
      <section class="game-section particles-section">
        <h2>Particules</h2>

        <!-- Sous-section Obtention de Particules -->
        <div class="subsection observation-subsection">
          <h3>Obtention de Particules</h3>
          <ParticleObservation
            :generators="gameState.generators"
            :is-debug-mode="isDebugEnabled"
            @particle-observed="handleParticleObserved"
          />
        </div>

        <!-- Sous-section Collection et Effets -->
        <div class="subsection collection-effects-subsection">
          <h3>Collection et Effets</h3>
          <ParticleCollection
            :particles="gameState.particles"
            @fuse-particles="handleParticleFusion"
          />
        </div>
      </section>

      <!-- Section Progression -->
      <section class="game-section progression-section">
        <h2>Progression</h2>
        <!-- Ajoutez ici les composants ou éléments liés aux améliorations et au prestige -->
        <!-- Par exemple: <Upgrades /> ou <Prestige /> -->
      </section>

      <section class="game-section prestige-section">
        <Prestige />
      </section>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, reactive, provide, inject } from 'vue';
import { markRaw } from 'vue';
import Resource from './models/Resource';
import Generator from './models/Generator';
import { Particle } from './models/Particle';
import TickService from './services/TickService';
import GeneratorComponent from './views/Generator.vue';
import ParticleCollection from './components/ParticleCollection.vue';
import ParticleObservation from './components/ParticleObservation.vue';
import { ParticleInitializer } from './services/ParticleInitializer';
import { ParticleFusion } from './services/ParticleFusion';
import Prestige from './components/Prestige.vue';
import { ParticleStorage } from './services/ParticleStorage';
import { SaveService } from './services/SaveService';
import { PrestigeService } from './services/PrestigeService';

// Créer un bus d'événements global
export const eventBus = {
    listeners: new Map(),
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    },
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    },
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }
};

export default {
  name: 'App',
  components: {
    Generator: GeneratorComponent,
    ParticleCollection,
    ParticleObservation,
    ParticleFusion,
    Prestige
  },
  setup() {
    const saveService = new SaveService();
    const particleStorage = new ParticleStorage();
    const prestigeService = new PrestigeService();

    // État local réactif pour l'affichage
    const gameState = reactive({
      resources: new Map(),
      generators: [],
      particles: [],
      prestigeLevel: 0,
      prestigeMultiplier: 1,
      antiparticlesUnlocked: false,
      supersymmetricParticlesUnlocked: false,
      antiparticleEffects: {},
      antipotential: 0, // Ensure this was already there or add it
      observationCount: 0, // New counter for normal particles
      antiparticleObservationCount: 0 // New counter for antiparticles
    });

    const isDebugEnabled = ref(false);
    let updateInterval;
    let saveInterval;

    const formatNumber = (num, decimals = 2) => {
      if (num === undefined || num === null) return '0';
      if (num >= 1000000) {
        return (num / 1000000).toFixed(decimals) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(decimals) + 'K';
      }
      return num.toFixed(decimals);
    };

    const toggleDebug = () => {
      isDebugEnabled.value = !isDebugEnabled.value;
      TickService.setDebug(isDebugEnabled.value);
    };

    const buyGenerator = (index) => {
      // Cette fonction n'est plus utilisée car la logique d'achat est déplacée dans handleBuyGenerator
      // const generator = gameState.generators[index];
      // const states = gameState.resources.get('États');
      // const purchaseSuccessful = states && generator.purchase(states, gameState.generators);
      // if (purchaseSuccessful) {
      //     console.log(`Achat de ${generator.name} réussi.`);
      // } else {
      //     console.log(`Achat de ${generator.name} échoué.`);
      // }
    };

    // Nouvelle méthode pour gérer l'événement 'buy' du composant Generator
    const handleBuyGenerator = (index, eventData) => {
        const generator = eventData.generator; // L'objet generator est passé dans l'événement
        const gameState = eventData.gameState; // L'état du jeu est passé dans l'événement

        const states = gameState.resources.get('États');
        
        // Appeler la méthode purchase du generator avec les ressources et gameState
        const purchaseSuccessful = states && generator.purchase(states, gameState.generators, gameState);

        if (purchaseSuccessful) {
             console.log(`Achat de ${generator.name} réussi.`);
            // Mettre à jour la ressource Potentiel si le générateur affecte le nombre de générateurs de rang 1
            if (generator.rank === 1) {
                 const potentielResource = gameState.resources.get('Potentiel');
                 if (potentielResource) {
                      potentielResource.setGenerators(generator.count); // S'assurer que Potentiel utilise le count mis à jour
                 }
            }
        } else {
             console.log(`Achat de ${generator.name} échoué.`);
             // Afficher un message à l'utilisateur si nécessaire (pas assez de ressources, etc.)
        }
    };

    // Cette fonction n'initialise plus directement l'état global, mais crée les instances
    const initializeGameData = () => {
       // Initialiser les ressources
      const potentiel = new Resource('Potentiel', 0);
      const etats = new Resource('États', 0);

      // Initialiser les générateurs
      const initialGenerators = [
        markRaw(new Generator(1, { generator: 0, states: 1 }, { generator: 1, states: 1.2 })), // Générateur 1: coût initial 1 état
        markRaw(new Generator(2, { generator: 10, states: 10 }, { generator: 1.1, states: 1.3 })), // Générateur 2: débloqué à 10 Gén. I, coût 10 Gén. I + 10 états
        markRaw(new Generator(3, { generator: 10, states: 50 }, { generator: 1.2, states: 1.4 })), // Générateur 3: débloqué à 10 Gén. II, coût 10 Gén. II + 50 états
        markRaw(new Generator(4, { generator: 10, states: 200 }, { generator: 1.3, states: 1.5 })), // Générateur 4: débloqué à 10 Gén. III, coût 10 Gén. III + 200 états
      ];

      // Configurer les noms des générateurs
      initialGenerators[0].name = 'Générateur Quantique I';
      initialGenerators[1].name = 'Générateur Quantique II';
      initialGenerators[2].name = 'Générateur Quantique III';
      initialGenerators[3].name = 'Générateur Quantique IV';

      // Configurer les conditions de déblocage
      initialGenerators[1].setUnlockRequirement('10 Gén. I');
      initialGenerators[2].setUnlockRequirement('10 Gén. II');
      initialGenerators[3].setUnlockRequirement('10 Gén. III');

      // Ajuster le count du premier générateur à 1 pour le démarrage
      const initialGen1 = initialGenerators.find(gen => gen.rank === 1);
      if (initialGen1) {
          initialGen1.count = 1; // Le joueur commence avec 1 générateur de rang 1
          // Configurer la ressource Potentiel pour utiliser ce count initial
          potentiel.setGenerators(initialGen1.count);
          // Initialiser la valeur du Potentiel
          potentiel.value = 0;
          potentiel.baseProduction = 1/32;
      }

       return { resources: new Map([[potentiel.name, potentiel], [etats.name, etats]]), generators: initialGenerators };
    };

    const resetGame = () => {
      if (confirm('Êtes-vous sûr de vouloir réinitialiser le jeu ? Toutes les données seront perdues.')) {
        saveService.clearSave();
        particleStorage.clear();
        
        // Réinitialiser l'état du jeu
        const initialData = initializeGameData();
        // Rendre les objets réactifs à nouveau après réinitialisation
        gameState.resources = reactive(initialData.resources);
        gameState.generators = reactive(initialData.generators);
        gameState.particles = [];
        gameState.prestigeLevel = 0;
        gameState.prestigeMultiplier = 1;
        gameState.antiparticlesUnlocked = false;
        gameState.supersymmetricParticlesUnlocked = false;

        // Réinitialiser le TickService
        TickService.setGameState(gameState);
        
        // Mettre à jour le PrestigeService avec le nouvel état
        // Pas besoin de reset si le service est stateless et reçoit l'état en argument
      }
    };

    const loadSavedGame = () => {
      const savedData = saveService.loadGame();
      if (savedData) {
        console.log('Chargement des données sauvegardées:', savedData);

        // Recréer les instances de classe à partir des données sauvegardées
        const loadedResources = new Map();
        savedData.resources.forEach(resourceData => {
            const resource = markRaw(new Resource(resourceData.name, resourceData.value));
            // Copier les autres propriétés sauvegardées
            resource.totalEarned = resourceData.totalEarned;
            resource.nextStateMilestone = resourceData.nextStateMilestone;
            if (resourceData.generators !== undefined) {
                 resource.generators = resourceData.generators;
            }
            loadedResources.set(resource.name, resource);
        });

        const loadedGenerators = savedData.generators.map(generatorData => {
             const generator = markRaw(new Generator(generatorData.rank, generatorData.baseCost, generatorData.growthRates));
             // Copier les autres propriétés sauvegardées
             generator.count = generatorData.count;
             generator.reachedMilestones = generatorData.reachedMilestones;
             generator.maxCount = generatorData.maxCount || 0; // S'assurer de charger maxCount, default to 0
             generator.manualPurchases = generatorData.manualPurchases || 0; // S'assurer de charger manualPurchases, default to 0
             // Note: _isUnlocked est une ref, elle sera initialisée correctement dans le constructor
             // et mise à jour par le tick après le chargement de tous les générateurs.
             return generator;
        });

        const loadedParticles = (savedData.particles || []).map(p => Particle.fromJSON(p));

        // Mettre à jour l'état du jeu avec les nouvelles instances réactives
        // Utiliser Object.assign ou copier manuellement les propriétés pour conserver la réactivité de gameState
        // Option 1: copier manuellement (plus sûr pour la réactivité racine)
        gameState.resources = reactive(loadedResources);
        gameState.generators = reactive(loadedGenerators);
        gameState.particles = loadedParticles; // particles est déjà géré comme un tableau
        gameState.prestigeLevel = savedData.prestigeLevel || 0;
        gameState.prestigeMultiplier = savedData.prestigeMultiplier || 1;
        gameState.antiparticlesUnlocked = savedData.antiparticlesUnlocked || false;
        gameState.supersymmetricParticlesUnlocked = savedData.supersymmetricParticlesUnlocked || false;
        gameState.antipotential = savedData.antipotential || 0; // Ensure antipotential is loaded
        gameState.observationCount = savedData.observationCount || 0;
        gameState.antiparticleObservationCount = savedData.antiparticleObservationCount || 0;
         // antiparticleEffects sera recalculé au premier tick

        // Mettre à jour particleStorage avec les particules chargées
        particleStorage.particles = loadedParticles;

        // Ensure Gen1 always exists
        let gen1Instance = gameState.generators.find(gen => gen.rank === 1);
        if (!gen1Instance) {
            console.warn("Gen1 was missing from loaded save data or save data was empty. Re-initializing Gen1.");
            // Create a default Gen1, matching the structure from initializeGameData
            // Growth rates here are for consistency, actual ones are from Generator class methods
            const defaultGen1 = markRaw(new Generator(1, { generator: 0, states: 1 }, { generator: 1, states: 1.05 })); 
            defaultGen1.name = 'Générateur Quantique I';
            defaultGen1.count = 1; // Default to 1 as it's essential. If save had it as 0, it would have loaded as 0.
                                   // This path is for when Gen1 is *missing* entirely.
            
            // Add the new Gen1 and re-sort if necessary to maintain rank order
            gameState.generators.push(defaultGen1); // Add then sort is safer than unshift if array was empty
            gameState.generators.sort((a, b) => a.rank - b.rank);
            gen1Instance = defaultGen1; // gen1Instance is now the newly created one
        }

        // Ensure Potentiel resource 'generators' count (n) is updated immediately after load
        const potentielResource = gameState.resources.get('Potentiel');
        if (potentielResource) {
            const currentGen1 = gameState.generators.find(gen => gen.rank === 1);
            if (currentGen1) {
                potentielResource.setGenerators(currentGen1.count);
            } else {
                // Should not happen if the above check and fix for Gen1 works
                console.error("Critical error: Gen1 still missing after load and attempted fix.");
                potentielResource.setGenerators(0); // Fallback to 0 production
            }
        }
      }
    };

    const saveGame = () => {
      saveService.saveGame(gameState);
    };

    onMounted(() => {
      // Initialiser les données du jeu (ressources et générateurs)
      const initialData = initializeGameData();
      
      // Peupler l'état local réactif avec les données initiales
      // Les instances sont déjà markRaw, la collection Map/Array est réactive.
      gameState.resources = reactive(initialData.resources); // La Map elle-même est réactive
      gameState.generators = reactive(initialData.generators); // Le tableau lui-même est réactif

      // Passer l'état du jeu au TickService
      TickService.setGameState(gameState);

      // Charger la sauvegarde si elle existe
      loadSavedGame();

      // Initialiser les particules
      const particleInitializer = new ParticleInitializer();
      particleInitializer.initialize();

      // Calculer les effets initiaux des antiparticules
      gameState.antiparticleEffects = PrestigeService.calculateAntiparticleEffects(gameState);

      // Le PrestigeService est maintenant géré ici et n'a pas besoin d'être passé explicitement
      // Ses méthodes recevront gameState en argument si nécessaire.

      // Démarrer le système de ticks
      TickService.start();

      // Sauvegarder toutes les 5 secondes
      saveInterval = setInterval(saveGame, 5000);
    });

    onUnmounted(() => {
      TickService.stop();
      clearInterval(saveInterval);
      saveGame(); // Sauvegarder une dernière fois avant de quitter
    });

    const handleParticleObserved = (data) => {
      console.log('Particule observée:', data);
      // Mettre à jour l'état des particules dans gameState
      gameState.particles.push(data.particle);

      // Consommer les générateurs du rang approprié (IF NOT ANTIPARTICLE)
      if (!data.isAntiparticle && data.rank) { // Check if it's a normal particle observation
        // const generator = gameState.generators.find(g => g.rank === data.rank);
        // if (generator) {
          // This is now done in ParticleObservation.vue, so REMOVE from here
          // generator.count -= data.cost; 
          // if (generator.count < 0) generator.count = 0;
        // }
      }
      // Antiparticle cost (antipotential) is also handled in ParticleObservation.vue

      // Sauvegarder la particule dans le stockage
      particleStorage.addParticle(data.particle);
      
      // Émettre un événement pour notifier du changement
      eventBus.emit('particles-changed', gameState.particles);
    };

    const handleParticleFusion = (data) => {
      console.log('Tentative de fusion de particules de type:', data.type);
      const fusionService = new ParticleFusion();
      fusionService.setParticles(gameState.particles);
      
      try {
        const newParticle = fusionService.fuseParticles(data.type);
        if (newParticle) {
          // Mettre à jour la liste des particules avec les nouvelles données
          gameState.particles = fusionService.particles;
          console.log('Particule fusionnée ajoutée:', newParticle);
          
          // Émettre un événement pour notifier du changement
          eventBus.emit('particles-changed', gameState.particles);
        }
      } catch (error) {
        console.error('Erreur lors de la fusion:', error);
      }
    };

    const getTotalDtMultiplier = () => {
      return gameState.particles.reduce((total, particle) => {
        // S'assurer que particle et getDtMultiplier existent
        if (particle && typeof particle.getDtMultiplier === 'function') {
             return total * (1 + particle.getDtMultiplier());
        }
        return total;
      }, 1);
    };

    const getTotalGeneratorBonus = () => {
      return gameState.particles.reduce((total, particle) => {
         // S'assurer que particle et getGeneratorBonus existent
         if (particle && typeof particle.getGeneratorBonus === 'function') {
             return total * (1 + particle.getGeneratorBonus());
         }
        return total;
      }, 1);
    };

    const getTotalCostReduction = () => {
      return gameState.particles.reduce((total, particle) => {
         // S'assurer que particle et getCostReduction existent
        if (particle && typeof particle.getCostReduction === 'function') {
             return total * (1 - particle.getCostReduction());
        }
        return total;
      }, 1);
    };

    // Fournir l'état du jeu aux composants enfants
    provide('gameState', gameState);

    // Retourner l'état local réactif pour l'affichage
    return {
      gameState,
      isDebugEnabled,
      formatNumber,
      toggleDebug,
      TickService,
      handleParticleObserved,
      handleParticleFusion,
      resetGame,
      handleBuyGenerator
    };
  }
}
</script>

<style>
/* Styles globaux pour le corps et l'application */
body {
  font-family: 'Roboto', sans-serif;
  background-color: #0f0e17;
  color: #fffffe;
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: #1a1a2e;
  padding: 15px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  color: #00ff9d; /* Couleur vive pour le titre */
  font-size: 1.8em;
}

.debug-controls .debug-button {
  padding: 5px 10px;
  background: #2a2a4a;
  color: #ff9d00;
  border: 1px solid #ff9d00;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Roboto Mono', monospace;
  transition: all 0.2s;
}

.debug-controls .debug-button:hover {
  background: #ff9d00;
  color: #1a1a2e;
}

.game-container {
  display: flex;
  flex-wrap: wrap; /* Permettre aux sections de passer à la ligne sur petits écrans */
  padding: 20px;
  gap: 20px; /* Espacement entre les sections */
  flex-grow: 1;
}

.game-section {
  background: #1a1a2e;
  border: 1px solid #3a3a5a;
  border-radius: 8px;
  padding: 20px;
  flex: 1; /* Permettre aux sections de prendre l'espace disponible */
  min-width: 300px; /* Largeur minimale pour les sections */
  display: flex;
  flex-direction: column;
}

.game-section h2 {
  color: #00ff9d;
  margin-top: 0;
  border-bottom: 1px solid #3a3a5a;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

/* Styles pour les sous-sections (Observation, Collection, etc.) */
.subsection {
  background: #16213e; /* Couleur de fond légèrement différente */
  border: 1px solid #0f3460;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px; /* Espacement entre les sous-sections */
}

.subsection:last-child {
    margin-bottom: 0; /* Supprimer la marge inférieure de la dernière sous-section */
}

.subsection h3 {
  color: #e94560; /* Couleur d'accent pour les sous-titres */
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #0f3460;
  padding-bottom: 8px;
}

/* Styles spécifiques aux panneaux (resources, generators) */
.resources-panel, .generators-panel {
  margin-bottom: 20px;
}

.resources-panel .resource {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.resource-name {
  color: #a9b3c1;
  font-weight: bold;
}

.resource-value {
  color: #e6e6e6;
  font-family: 'Roboto Mono', monospace;
}

.resource-details {
  font-size: 0.8em;
  color: #a9b3c1;
  margin-left: 10px;
}

.resource-next-milestone {
   font-size: 0.9em;
  color: #00ff9d;
  margin-left: 10px;
}

/* Media Queries pour le Responsive Design */
@media (max-width: 768px) {
  .game-container {
    flex-direction: column; /* Empiler les sections sur petits écrans */
    padding: 10px;
    gap: 10px;
  }

  .game-section {
    min-width: auto; /* Supprimer la largeur minimale sur petits écrans */
  }

  .app-header {
    flex-direction: column;
    gap: 10px;
  }

  .app-header h1 {
    font-size: 1.5em;
  }

  .subsection {
    margin-bottom: 10px; /* Réduire la marge inférieure des sous-sections sur petits écrans */
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 10px;
  }

  .game-section {
    padding: 15px;
  }

  .subsection {
    padding: 10px;
  }

  .resources-panel .resource,
  .generators-panel .generator {
    flex-direction: column;
    align-items: flex-start;
  }

  .resource-details, .resource-next-milestone {
    margin-left: 0;
    margin-top: 5px;
  }
}

.prestige-section {
  grid-column: 1 / -1;
  margin-top: 20px;
}

.debug-controls {
  display: flex;
  gap: 10px;
}

.reset-button {
  padding: 5px 10px;
  background: #2a2a4a;
  color: #ff4757;
  border: 1px solid #ff4757;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Roboto Mono', monospace;
  transition: all 0.2s;
}

.reset-button:hover {
  background: #ff4757;
  color: #1a1a2e;
}
</style> 
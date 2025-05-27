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
      <div class="tabs-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="changeTab(tab.id)"
          :class="{ 'active-tab': activeTab === tab.id }"
          class="tab-button" 
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Section Production -->
      <section v-if="activeTab === 'production'" class="game-section production-section">
        <h2>Production</h2>
        <div class="resources-panel">
          <div v-for="resource in gameState.resources.values()" :key="resource.name" class="resource">
            <span class="resource-name">{{ resource.name }}</span>
            <span class="resource-value">{{ formatNumber(resource.getValue()) }}</span>
            <span v-if="resource.name === 'Potentiel'" class="resource-details">
              <span>Formule: {{ dynamicFormulaText }}</span><br>
              <span>(N: {{ formatNumber(Math.floor(gen1?.count || 0), 0) }}, a: {{ baseProductionDisplay }}, dt: {{ dtDisplay }})</span>
              <template v-if="(gen1 && gen1.getMilestoneBonus() > 1) || (gameState.antiparticleEffects?.generatorProductionMultiplier || 1) > 1">
                <br><span>(</span><template v-if="gen1 && gen1.getMilestoneBonus() > 1">Bonus MS: {{ milestoneBonusDisplay }}</template><template v-if="(gen1 && gen1.getMilestoneBonus() > 1) && (gameState.antiparticleEffects?.generatorProductionMultiplier || 1) > 1">, </template><template v-if="(gameState.antiparticleEffects?.generatorProductionMultiplier || 1) > 1">Bonus AP: {{ antiparticleMultiplierDisplay }}</template><span>)</span>
              </template>
              <br><span>Prod. par tick: {{ actualCalculatedProduction }}</span>
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
      <section v-if="activeTab === 'particles'" class="game-section particles-section">
        <h2>Particules</h2>

        <!-- Sous-section Obtention de Particules -->
        <div class="subsection observation-subsection">
          <ParticleObservation
            :generators="gameState.generators"
            :is-debug-mode="isDebugEnabled"
            @particle-observed="handleParticleObserved"
            :particle-storage="particleStorage" <!-- Pass particleStorage as a prop -->
          />
        </div>

        <!-- Sous-section Collection et Effets -->
        <div class="subsection collection-effects-subsection">
          <h3>Collection et Effets</h3>
          <ParticleCollection
            :particles="gameState.particles"
            :total-dt-multiplier="getTotalDtMultiplier()"
            :total-generator-bonus="getTotalGeneratorBonus()"
            :total-cost-reduction="getTotalCostReduction()"
            @fuse-particles="handleParticleFusion"
          />
        </div>
      </section>

      <!-- Section Progression -->
      <section v-if="activeTab === 'progression'" class="game-section progression-section">
        <h2>Progression</h2>
        <!-- Ajoutez ici les composants ou éléments liés aux améliorations et au prestige -->
        <!-- Par exemple: <Upgrades /> ou <Prestige /> -->
      </section>

      <section v-if="activeTab === 'prestige'" class="game-section prestige-section">
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
import { formatNumber } from './utils/format';

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

    // Tab navigation
    const activeTab = ref('production'); // Default active tab
    const tabs = ref([
      { id: 'production', label: 'Production' },
      { id: 'particles', label: 'Particules' },
      { id: 'progression', label: 'Progression' },
      { id: 'prestige', label: 'Prestige' }
    ]);

    const changeTab = (tabId) => {
      activeTab.value = tabId;
    };

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
      particleStorageInstance: particleStorage // Provide particleStorage to gameState
    });

    const gen1 = computed(() => gameState.generators.find(gen => gen.rank === 1));

    const isDebugEnabled = ref(false);
    let updateInterval;
    let saveInterval;

    const toggleDebug = () => {
      isDebugEnabled.value = !isDebugEnabled.value;
      TickService.setDebug(isDebugEnabled.value);
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
      const pointsObservation = new Resource("Points d'Observation", 0); // Initialize Points d'Observation

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

      // Set production outputs for Gen > 1
      // Gen2 produces Gen1
      const gen2Instance = initialGenerators.find(gen => gen.rank === 2);
      if (gen2Instance) {
        gen2Instance.setProductionOutput(1, 0.1); // Produces Rank 1 at 0.1/sec
      }

      // Gen3 produces Gen2
      const gen3Instance = initialGenerators.find(gen => gen.rank === 3);
      if (gen3Instance) {
        gen3Instance.setProductionOutput(2, 0.1); // Produces Rank 2 at 0.1/sec
      }

      // Gen4 produces Gen3
      const gen4Instance = initialGenerators.find(gen => gen.rank === 4);
      if (gen4Instance) {
        gen4Instance.setProductionOutput(3, 0.1); // Produces Rank 3 at 0.1/sec
      }

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

       return { resources: new Map([[potentiel.name, potentiel], [etats.name, etats], ["Points d'Observation", pointsObservation]]), generators: initialGenerators };
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

        // Ensure "Points d'Observation" is loaded or initialized
        if (!loadedResources.has("Points d'Observation")) {
            const pointsObservation = new Resource("Points d'Observation", 0);
            loadedResources.set("Points d'Observation", markRaw(pointsObservation));
        }

        const loadedGenerators = savedData.generators.map(generatorData => {
             const generator = markRaw(new Generator(generatorData.rank, generatorData.baseCost, generatorData.growthRates));
             // Copier les autres propriétés sauvegardées
             generator.count = generatorData.count;
             generator.reachedMilestones = generatorData.reachedMilestones;
             generator.maxCount = generatorData.maxCount; // S'assurer de charger maxCount
             generator.manualPurchases = generatorData.manualPurchases; // S'assurer de charger manualPurchases
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
         // antiparticleEffects sera recalculé au premier tick

        // Mettre à jour particleStorage avec les particules chargées
        particleStorage.particles = loadedParticles;
      }
    };

    const saveGame = () => {
      saveService.saveGame(gameState);
    };

    const updateGameState = () => {
      // Mettre à jour les ressources
      gameState.resources.forEach(resource => {
        // Ne pas mettre à jour le Potentiel ici car il sera mis à jour plus tard
        if (resource.name !== 'Potentiel' && typeof resource.update === 'function') {
          resource.update(TickService.getDt(), gameState.antiparticleEffects);
        }
      });

      // Mettre à jour les générateurs
      gameState.generators.forEach(generator => {
        if (typeof generator.updateUnlockStatus === 'function') {
          generator.updateUnlockStatus(gameState.generators);
        }
      });

      // Calculer et stocker les effets des antiparticules
      gameState.antiparticleEffects = prestigeService.calculateAntiparticleEffects(gameState);
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

      // Consommer les générateurs du rang approprié
      const generator = gameState.generators.find(g => g.rank === data.rank);
      if (generator) {
        generator.count -= data.cost;
        // Assurez-vous que le count ne devient pas négatif
        if (generator.count < 0) generator.count = 0;
      }

      // Sauvegarder la particule dans le stockage
      particleStorage.addParticle(data.particle);
      
      // Émettre un événement pour notifier du changement
      // eventBus.emit('particles-changed', gameState.particles); // Removed as per task
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
          // eventBus.emit('particles-changed', gameState.particles); // Removed as per task
        }
      } catch (error) {
        console.error('Erreur lors de la fusion:', error);
      }
    };

    const getTotalDtMultiplier = computed(() => {
      return gameState.particles.reduce((total, particle) => {
        if (particle && typeof particle.getDtMultiplier === 'function') {
          return total * (1 + particle.getDtMultiplier());
        }
        return total;
      }, 1);
    });

    const getTotalGeneratorBonus = computed(() => {
      return gameState.particles.reduce((total, particle) => {
        if (particle && typeof particle.getGeneratorBonus === 'function') {
          return total * (1 + particle.getGeneratorBonus());
        }
        return total;
      }, 1);
    });

    const getTotalCostReduction = computed(() => {
      return gameState.particles.reduce((total, particle) => {
        if (particle && typeof particle.getCostReduction === 'function') {
          return total * (1 - particle.getCostReduction());
        }
        return total;
      }, 1);
    });

    // Fournir l'état du jeu aux composants enfants
    provide('gameState', gameState);

    const baseProductionDisplay = computed(() => formatNumber(1/32, 3));
    const milestoneBonusDisplay = computed(() => {
      if (!gen1.value) return "1x";
      const bonus = gen1.value.getMilestoneBonus();
      return bonus === 1 ? "1x" : `${formatNumber(bonus, 2)}x`;
    });
    const antiparticleMultiplierDisplay = computed(() => {
      const multiplier = gameState.antiparticleEffects?.generatorProductionMultiplier || 1;
      return multiplier === 1 ? "1x" : `${formatNumber(multiplier, 2)}x`;
    });
    const dtDisplay = computed(() => formatNumber(TickService.getDt(), 3));

    const dynamicFormulaText = computed(() => {
      let formula = `N × a`;
      if (gen1.value && gen1.value.getMilestoneBonus() > 1) {
        formula += ` × BonusMS`;
      }
      if ((gameState.antiparticleEffects?.generatorProductionMultiplier || 1) > 1) {
        formula += ` × BonusAP`;
      }
      formula += ` × dt`;
      return formula;
    });

    const actualCalculatedProduction = computed(() => {
      if (!gen1.value) return formatNumber(0);
      const baseProd = 1/32;
      const milestoneBonus = gen1.value.getMilestoneBonus();
      const antiparticleMultiplier = gameState.antiparticleEffects?.generatorProductionMultiplier || 1;
      const dt = TickService.getDt();
      const production = gen1.value.count * baseProd * milestoneBonus * antiparticleMultiplier * dt;
      return formatNumber(production, 3);
    });

    // Retourner l'état local réactif pour l'affichage
    return {
      gameState,
      gen1,
      particleStorage, // Expose particleStorage for the template to pass as prop
      isDebugEnabled,
      formatNumber,
      toggleDebug,
      TickService,
      handleParticleObserved,
      handleParticleFusion,
      resetGame,
      handleBuyGenerator,
      // Dynamic formula parts
      baseProductionDisplay,
      milestoneBonusDisplay,
      antiparticleMultiplierDisplay,
      dtDisplay,
      dynamicFormulaText,
      actualCalculatedProduction,
      // Particle effect totals
      getTotalDtMultiplier,
      getTotalGeneratorBonus,
      getTotalCostReduction,
      // Tab navigation
      activeTab,
      tabs,
      changeTab,
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
  line-height: 1.5; /* Reduced line-height */
}

/* Tab Navigation Styles */
.tabs-nav {
  display: flex;
  margin-bottom: 0; /* Adjusted to 0 as game-section will connect */
  border-bottom: 2px solid #3a3a5a;
  padding-left: 10px; /* Align with game-section padding */
}

.tab-button {
  padding: 10px 15px;
  border: none; 
  background-color: #2a2a4a; /* Inactive tab background */
  color: #a9b3c1;
  cursor: pointer;
  font-size: 1em;
  margin-right: 5px;
  border-radius: 4px 4px 0 0;
  position: relative;
  bottom: -2px; /* Overlap the .tabs-nav border-bottom */
  transition: background-color 0.2s, color 0.2s;
}

.tab-button:hover {
  background-color: #3a3a5a; /* Slightly lighter for hover */
  color: #fffffe;
}

.tab-button.active-tab {
  background-color: #1a1a2e; /* Same as game-section background */
  color: #00ff9d;
  font-weight: bold;
  border: 2px solid #3a3a5a; /* Sides and top border */
  border-bottom: 2px solid #1a1a2e; /* "Merge" with content pane */
}
/* End Tab Navigation Styles */

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: #1a1a2e;
  padding: 10px 15px; /* Reduced padding */
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
  flex-direction: column; /* Stack tabs-nav and game-section vertically */
  padding: 15px; 
  /* flex-wrap: wrap; /* No longer needed for direct children */
  /* gap: 15px; /* No longer needed for direct children */
  flex-grow: 1;
}

.game-section {
  background: #1a1a2e;
  border: 2px solid #3a3a5a; /* Match tab nav border thickness */
  border-top: none; /* Remove top border to connect with tabs-nav */
  border-radius: 0 0 8px 8px; /* Adjust border-radius for top connection */
  padding: 15px; 
  flex: 1; /* Permettre aux sections de prendre l'espace disponible */
  min-width: 300px; /* Largeur minimale pour les sections */
  display: flex;
  flex-direction: column;
}

.game-section h2 {
  color: #00ff9d;
  margin-top: 0;
  border-bottom: 1px solid #3a3a5a;
  padding-bottom: 8px; /* Reduced padding-bottom */
  margin-bottom: 15px; /* Reduced margin-bottom */
}

/* Styles pour les sous-sections (Observation, Collection, etc.) */
.subsection {
  background: #16213e; /* Couleur de fond légèrement différente */
  border: 1px solid #0f3460;
  border-radius: 6px;
  padding: 10px; /* Reduced padding */
  margin-bottom: 10px; /* Reduced margin-bottom */
}

.subsection:last-child {
    margin-bottom: 0; /* Supprimer la marge inférieure de la dernière sous-section */
}

.subsection h3 {
  color: #e94560; /* Couleur d'accent pour les sous-titres */
  margin-top: 0;
  margin-bottom: 10px; /* Reduced margin-bottom */
  border-bottom: 1px solid #0f3460;
  padding-bottom: 6px; /* Reduced padding-bottom */
}

/* Styles spécifiques aux panneaux (resources, generators) */
.resources-panel, .generators-panel {
  margin-bottom: 10px; /* Reduced margin-bottom for generators-panel */
}

.resources-panel .resource {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 4px;
  padding: 8px; /* Reduced padding */
  margin-bottom: 8px; /* Reduced margin-bottom */
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* Changed to flex-start for multi-line details */
  flex-wrap: wrap; /* Allow wrapping for smaller screens / long details */
}

.resource-name {
  color: #a9b3c1;
  font-weight: bold;
  margin-right: 10px; /* Add some space between name and value/details */
}

.resource-value {
  color: #e6e6e6;
  font-family: 'Roboto Mono', monospace;
  font-weight: 600; /* Slightly bolder */
  text-align: right; /* Align to right if it wraps below name */
  flex-grow: 1; /* Allow it to take space */
}

.resource-details {
  font-size: 0.75em; /* Maintained reduced font-size */
  color: #a9b3c1;
  margin-left: 0; /* Removed margin, will be child of flex container */
  line-height: 1.2; /* Further reduced line-height for compactness */
  width: 100%; /* Take full width for details block */
  margin-top: 4px; /* Add a small top margin */
}

.resource-next-milestone {
  font-size: 0.8em; /* Reduced font-size */
  color: #00ff9d;
  margin-left: 0; /* Removed margin */
  width: 100%; /* Take full width */
  margin-top: 4px; /* Add a small top margin */
}

/* Media Queries pour le Responsive Design */
@media (max-width: 768px) {
  .game-container {
    /* flex-direction: column; /* Already column from base style */
    padding: 10px; /* Adjust padding for smaller screens */
    /* gap: 10px; /* No longer needed for direct children */
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
  /* Specific adjustments for Potentiel formula display on small screens */
  .resources-panel .resource .resource-details {
    line-height: 1.3; /* Slightly more space for readability */
    word-break: break-word; /* Prevent overflow from long unbroken strings */
  }

  .tabs-nav {
    /* flex-wrap: wrap; /* Removed for horizontal scrolling */
    overflow-x: auto; /* Enable horizontal scrolling */
    white-space: nowrap; /* Keep buttons in a single line */
    padding-left: 5px;
    /* margin-bottom: 10px; /* Removed as tabs won't wrap and push content down */
    /* Default margin-bottom: 0 from .tabs-nav desktop style should apply */
  }
  .tab-button {
    padding: 8px 10px;
    font-size: 0.9em;
    /* margin-bottom: 5px; /* Removed as tabs won't wrap */
    display: inline-block; /* Ensure buttons flow in a line with white-space: nowrap */
    flex-shrink: 0; /* Prevent buttons from shrinking */
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
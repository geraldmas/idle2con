<template>
  <div class="app">
    <header class="app-header">
      <h1>Quantum Factory</h1>
      <div class="debug-controls">
        <button @click="toggleDebug" class="debug-button">
          {{ isDebugEnabled ? 'Désactiver Debug' : 'Activer Debug' }}
        </button>
      </div>
    </header>

    <div class="game-container">
      <!-- Section Production -->
      <section class="game-section production-section">
        <h2>Production Quantique</h2>
        <div class="resources-panel">
          <div v-for="resource in gameState.resources.values()" :key="resource.name" class="resource">
            <span class="resource-name">{{ resource.name }}</span>
            <span class="resource-value">{{ formatNumber(resource.getValue()) }}</span>
            <span v-if="resource.name === 'Potentiel'" class="resource-potential">
              (Formule: {{ resource.generators }} * 1/16 * {{ formatNumber(resource.dt) }} /s)
              <br>
              (dt: {{ formatNumber(resource.dt) }})
            </span>
            <span v-if="resource.name === 'Potentiel'" class="resource-generators">
              Générateurs: {{ resource.generators }}
            </span>
            <span v-if="resource.name === 'États' && resource.nextStateMilestone !== null" class="resource-next-milestone">
              Prochain état à {{ formatNumber(resource.nextStateMilestone) }} Potentiel
            </span>
          </div>
        </div>
        <div class="generators-panel">
          <h3>Générateurs</h3>
          <Generator
            v-for="(generator, index) in gameState.generators"
            :key="generator.name"
            :name="generator.name"
            :count="generator.count"
            :production="generator.getProduction()"
            :cost="generator.getCost()"
            :generator-cost="generator.getGeneratorCost()"
            :is-unlocked="generator.isUnlocked()"
            :unlock-requirement="generator.rank > 1 ? '10 générateurs précédents' : ''"
            :can-afford="generator.canAfford(gameState.resources.get('États'), gameState.generators)"
            @buy="buyGenerator(index)"
          />
        </div>
      </section>

      <!-- Section Collection -->
      <section class="game-section collection-section">
        <h2>Collection de Particules</h2>
        <div class="particles-panel">
          <div class="particles-grid">
            <!-- Les particules seront affichées ici -->
          </div>
        </div>
        <div class="fusion-panel">
          <h3>Fusion</h3>
          <!-- Interface de fusion à venir -->
        </div>
      </section>

      <!-- Section Prestige -->
      <section class="game-section prestige-section">
        <h2>Prestige Quantique</h2>
        <div class="prestige-panel">
          <!-- Interface de prestige à venir -->
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue';
import Resource from './models/Resource';
import Generator from './models/Generator';
import TickService from './services/TickService';
import GeneratorComponent from './views/Generator.vue';

export default {
  name: 'App',
  components: {
    Generator: GeneratorComponent
  },
  setup() {
    // État local réactif pour l'affichage
    const gameState = reactive({
      resources: new Map(),
      generators: []
    });

    const isDebugEnabled = ref(false);
    let updateInterval;

    const formatNumber = (num) => {
      if (num === undefined || num === null) return '0';
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
      }
      return num.toFixed(2);
    };

    const toggleDebug = () => {
      isDebugEnabled.value = !isDebugEnabled.value;
      TickService.setDebug(isDebugEnabled.value);
    };

    const buyGenerator = (index) => {
      // Obtenir le générateur depuis l'état local
      const generator = gameState.generators[index];
      // Obtenir la ressource États depuis l'état local
      const states = gameState.resources.get('États');
      
      // Appeler la méthode purchase avec les objets réactifs de l'état local
      if (states && generator.purchase(states, gameState.generators)) {
        // La modification de l'état se fait directement dans purchase
        // L'interface se mettra à jour grâce à la réactivité de gameState
      }
    };

    // Cette fonction n'initialise plus directement l'état global, mais crée les instances
    const initializeGameData = () => {
       // Initialiser les ressources
      const potentiel = new Resource('Potentiel', 0);
      const etats = new Resource('États', 0);

      // Initialiser les générateurs
      const initialGenerators = [
        reactive(new Generator(1, { generator: 0, states: 1 }, { generator: 1, states: 1.2 })), // Générateur 1
        reactive(new Generator(2, { generator: 10, states: 10 }, { generator: 1.1, states: 1.3 })), // Générateur 2
        reactive(new Generator(3, { generator: 10, states: 50 }, { generator: 1.2, states: 1.4 })), // Générateur 3
        reactive(new Generator(4, { generator: 10, states: 200 }, { generator: 1.3, states: 1.5 })), // Générateur 4
      ];

      // Ajuster le count du premier générateur à 1 pour le démarrage
      const initialGen1 = initialGenerators.find(gen => gen.rank === 1);
      if (initialGen1) {
          initialGen1.count = 1; // Le joueur commence avec 1 générateur de rang 1
           // Configurer la ressource Potentiel pour utiliser ce count initial
          potentiel.setGenerators(initialGen1.count);
      }

       return { resources: new Map([[potentiel.name, potentiel], [etats.name, etats]]), generators: initialGenerators };
    };


    onMounted(() => {
      // Initialiser les données du jeu (ressources et générateurs)
      const initialData = initializeGameData();
      
      // Peupler l'état local réactif et le TickService avec les données initiales
      gameState.resources = reactive(initialData.resources); // Rendre la map de ressources réactive dans l'état local
      gameState.generators = reactive(initialData.generators); // Rendre le tableau de générateurs réactif dans l'état local

      // Passer les collections réactives au TickService pour qu'il puisse les manipuler
      TickService.setGameStateCollections(gameState.resources, gameState.generators);

      // Démarrer le système de ticks
      TickService.start();
      
      // On aura peut-être besoin d'une manière pour le TickService de notifier les changements
      // ou l'interface se mettra à jour si les objets réactifs sont modifiés directement par le service.

    });

    onUnmounted(() => {
      TickService.stop();
    });

    // Retourner l'état local réactif pour l'affichage
    return {
      gameState,
      isDebugEnabled,
      formatNumber,
      toggleDebug,
      buyGenerator,
      TickService // Exposer le service si nécessaire
    };
  }
}
</script>

<style>
.app {
  font-family: 'Roboto Mono', monospace;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: #1a1a2e;
  color: #e6e6e6;
  min-height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #2a2a4a;
}

h1 {
  color: #00ff9d;
  font-size: 2.5em;
  margin: 0;
  text-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
}

h2 {
  color: #00ff9d;
  font-size: 1.8em;
  margin-bottom: 20px;
  border-bottom: 1px solid #2a2a4a;
  padding-bottom: 10px;
}

h3 {
  color: #00ff9d;
  font-size: 1.4em;
  margin: 15px 0;
}

.game-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.game-section {
  background: #2a2a4a;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.resources-panel {
  margin-bottom: 20px;
}

.resource {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #1a1a2e;
  border-radius: 4px;
  margin-bottom: 8px;
  border: 1px solid #3a3a5a;
}

.resource-name {
  font-weight: bold;
  width: 150px;
  color: #00ff9d;
}

.resource-value {
  flex: 1;
  text-align: right;
  margin-right: 10px;
  font-family: 'Roboto Mono', monospace;
}

.resource-potential {
  color: #00ff9d;
  font-size: 0.9em;
  margin-right: 10px;
}

.resource-generators {
  color: #ff9d00;
  font-size: 0.9em;
}

.resource-next-milestone {
  color: #ff9d00;
  font-size: 0.9em;
}

.debug-button {
  padding: 8px 16px;
  background-color: #2a2a4a;
  color: #00ff9d;
  border: 1px solid #00ff9d;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
}

.debug-button:hover {
  background-color: #00ff9d;
  color: #1a1a2e;
}

.particles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 15px;
}

.prestige-panel {
  background: #1a1a2e;
  border-radius: 4px;
  padding: 15px;
  border: 1px solid #3a3a5a;
}
</style> 
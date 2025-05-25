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
          <div v-for="resource in resourcesData" :key="resource.name" class="resource">
            <span class="resource-name">{{ resource.name }}</span>
            <span class="resource-value">{{ formatNumber(resource.value) }}</span>
            <span class="resource-potential">(+{{ formatNumber(resource.potential) }}/s)</span>
            <span v-if="resource.name === 'Potentiel'" class="resource-generators">
              Générateurs: {{ resource.generators }}
            </span>
          </div>
        </div>
        <div class="generators-panel">
          <h3>Générateurs</h3>
          <Generator
            v-for="(generator, index) in generators"
            :key="generator.name"
            :name="generator.name"
            :count="generator.count"
            :production="generator.getProduction()"
            :cost="generator.getCost()"
            :is-unlocked="generator.isUnlocked(TickService.getGameState())"
            :unlock-requirement="generator.unlockRequirement ? '10 générateurs précédents' : ''"
            :can-afford="generator.canAfford(resourcesData.find(r => r.name === 'États')?.value || 0)"
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
import { ref, onMounted, onUnmounted } from 'vue';
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
    const resourcesData = ref([]);
    const isDebugEnabled = ref(false);
    const generators = ref([]);
    let updateInterval;

    const formatNumber = (num) => {
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

    const updateResources = () => {
      resourcesData.value = TickService.getResources().map(resource => ({
        name: resource.name,
        value: resource.getValue(),
        potential: resource.getPotential(),
        generators: resource.getGenerators()
      }));
    };

    const buyGenerator = (index) => {
      const generator = generators.value[index];
      const states = TickService.getResource('États');
      
      if (states && generator.buy(states.getValue())) {
        states.setValue(states.getValue() - generator.getCost());
        updateResources();
      }
    };

    const initializeGenerators = () => {
      // Générateur 1
      const gen1 = new Generator('Générateur Quantique I', 1, 1, 1.2);
      generators.value.push(gen1);
      TickService.addGenerator(gen1);

      // Générateur 2
      const gen2 = new Generator('Générateur Quantique II', 10, 5, 1.3);
      gen2.setUnlockRequirement({
        check: (gameState) => gameState.getGeneratorCount(0) >= 10
      });
      generators.value.push(gen2);
      TickService.addGenerator(gen2);

      // Générateur 3
      const gen3 = new Generator('Générateur Quantique III', 50, 25, 1.4);
      gen3.setUnlockRequirement({
        check: (gameState) => gameState.getGeneratorCount(1) >= 10
      });
      generators.value.push(gen3);
      TickService.addGenerator(gen3);

      // Générateur 4
      const gen4 = new Generator('Générateur Quantique IV', 200, 100, 1.5);
      gen4.setUnlockRequirement({
        check: (gameState) => gameState.getGeneratorCount(2) >= 10
      });
      generators.value.push(gen4);
      TickService.addGenerator(gen4);
    };

    onMounted(() => {
      // Initialiser le Potentiel avec 1 générateur de départ
      const potentiel = new Resource('Potentiel', 0);
      potentiel.setGenerators(1);
      
      // Initialiser les États
      const etats = new Resource('États', 0);
      
      TickService.addResource(potentiel);
      TickService.addResource(etats);
      
      initializeGenerators();
      updateResources();
      
      // Démarrer le système de ticks
      TickService.start();
      
      // Mettre à jour l'affichage toutes les 100ms
      updateInterval = setInterval(updateResources, 100);
    });

    onUnmounted(() => {
      TickService.stop();
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    });

    return {
      resourcesData,
      generators,
      isDebugEnabled,
      formatNumber,
      toggleDebug,
      buyGenerator,
      TickService
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
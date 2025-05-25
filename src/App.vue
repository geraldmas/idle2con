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
        <div class="generators-panel">
          <h3>Générateurs</h3>
          <Generator
            v-for="(generator, index) in gameState.generators"
            :key="generator.name"
            :name="generator.name"
            :count="generator.count"
            :production="generator.getProduction() / generator.getMilestoneBonus()"
            :cost="generator.getCost()"
            :generator-cost="generator.getGeneratorCost()"
            :is-unlocked="generator.isUnlocked()"
            :unlock-requirement="generator.rank > 1 ? '10 générateurs précédents' : ''"
            :can-afford="generator.canAfford(gameState.resources.get('États'), gameState.generators)"
            :milestone-progress="generator.getMilestoneProgress()"
            :next-milestone="generator.getNextMilestone()"
            :milestone-bonus="generator.getMilestoneBonus()"
            :reached-milestones="generator.getReachedMilestones()"
            @buy="buyGenerator(index)"
          />
        </div>
      </section>

      <!-- Section Observation et Fusion -->
      <section class="game-section observation-fusion-section">
        <h2>Observation et Fusion</h2>
        
        <!-- Sous-section Observation -->
        <div class="collection-subsection">
          <h3>Observation Quantique</h3>
          <ParticleObservation 
            :generators="gameState.generators"
            @particle-observed="handleParticleObserved"
          />
        </div>

        <!-- Sous-section Fusion -->
        <div class="collection-subsection">
          <h3>Fusion de Particules</h3>
          <ParticleFusion 
            :particles="gameState.particles"
            @particle-fused="handleParticleFused"
          />
        </div>
      </section>

      <!-- Section Collection et Effets -->
      <section class="game-section collection-effects-section">
        <h2>Collection et Effets</h2>

        <!-- Sous-section Collection -->
        <div class="collection-subsection">
          <h3>Collection de Particules</h3>
          <div class="particles-grid">
            <div v-for="particle in gameState.particles" :key="particle.id" class="particle-card">
              <span class="particle-name">{{ particle.name }}</span>
              <span class="particle-generation">Génération {{ particle.generation }}</span>
              <span class="particle-type">Type: {{ particle.type }}</span>
              <span class="particle-effect">{{ particle.getEffectDescription() }}</span>
            </div>
          </div>
        </div>

        <!-- Sous-section Effets -->
        <div class="collection-subsection">
          <h3>Effets des Particules</h3>
          <div class="effects-grid">
            <div class="effect-category">
              <h4>Production</h4>
              <div class="effect-item">
                <span class="effect-name">Multiplicateur dt:</span>
                <span class="effect-value">{{ formatNumber(getTotalDtMultiplier(), 3) }}x</span>
              </div>
              <div class="effect-item">
                <span class="effect-name">Bonus générateurs:</span>
                <span class="effect-value">{{ formatNumber(getTotalGeneratorBonus(), 3) }}x</span>
              </div>
            </div>
            <div class="effect-category">
              <h4>Coûts</h4>
              <div class="effect-item">
                <span class="effect-name">Réduction coûts:</span>
                <span class="effect-value">{{ formatNumber(getTotalCostReduction(), 3) }}x</span>
              </div>
            </div>
          </div>
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
import ParticleCollection from './components/ParticleCollection.vue';
import ParticleObservation from './components/ParticleObservation.vue';
import { ParticleInitializer } from './services/ParticleInitializer';
import ParticleFusion from './components/ParticleFusion.vue';

export default {
  name: 'App',
  components: {
    Generator: GeneratorComponent,
    ParticleCollection,
    ParticleObservation,
    ParticleFusion
  },
  setup() {
    // État local réactif pour l'affichage
    const gameState = reactive({
      resources: new Map(),
      generators: [],
      particles: []
    });

    const isDebugEnabled = ref(false);
    let updateInterval;

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
      // Obtenir le générateur depuis l'état local
      const generator = gameState.generators[index];
      // Obtenir la ressource États depuis l'état local
      const states = gameState.resources.get('États');
      
      // Appeler la méthode purchase avec les objets réactifs de l'état local
      const purchaseSuccessful = states && generator.purchase(states, gameState.generators);
      
      if (purchaseSuccessful) {
          console.log(`Achat de ${generator.name} réussi.`);
          // La modification de l'état se fait directement dans purchase
          // L'interface se mettra à jour grâce à la réactivité de gameState
      } else {
          console.log(`Achat de ${generator.name} échoué.`);
      }
    };

    // Cette fonction n'initialise plus directement l'état global, mais crée les instances
    const initializeGameData = () => {
       // Initialiser les ressources
      const potentiel = new Resource('Potentiel', 0);
      const etats = new Resource('États', 0);

      // Initialiser les générateurs
      const initialGenerators = [
        reactive(new Generator(1, { generator: 0, states: 1 }, { generator: 1, states: 1.2 })), // Générateur 1: coût initial 1 état
        reactive(new Generator(2, { generator: 10, states: 10 }, { generator: 1.1, states: 1.3 })), // Générateur 2: débloqué à 10 Gén. I, coût 10 Gén. I + 10 états
        reactive(new Generator(3, { generator: 10, states: 50 }, { generator: 1.2, states: 1.4 })), // Générateur 3: débloqué à 10 Gén. II, coût 10 Gén. II + 50 états
        reactive(new Generator(4, { generator: 10, states: 200 }, { generator: 1.3, states: 1.5 })), // Générateur 4: débloqué à 10 Gén. III, coût 10 Gén. III + 200 états
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
      }

       return { resources: new Map([[potentiel.name, potentiel], [etats.name, etats]]), generators: initialGenerators };
    };


    onMounted(() => {
      // Initialiser les données du jeu (ressources et générateurs)
      const initialData = initializeGameData();
      
      // Peupler l'état local réactif et le TickService avec les données initiales
      gameState.resources = reactive(initialData.resources);
      gameState.generators = reactive(initialData.generators);

      // Passer les collections réactives au TickService
      TickService.setGameStateCollections(gameState.resources, gameState.generators);

      // Initialiser les particules
      const particleInitializer = new ParticleInitializer();
      particleInitializer.initialize();

      // Démarrer le système de ticks
      TickService.start();
    });

    onUnmounted(() => {
      TickService.stop();
    });

    const handleParticleFused = (newParticle) => {
      console.log('Nouvelle particule fusionnée:', newParticle);
      // Ici, nous pourrions mettre à jour l'état du jeu si nécessaire
    };

    const handleParticleObserved = (data) => {
      console.log('Nouvelle particule observée:', data);
      
      // Consommer les générateurs du rang approprié
      const generator = gameState.generators.find(g => g.rank === data.rank);
      if (generator) {
        generator.count -= data.cost;
      }

      // Ajouter la particule à la collection
      gameState.particles.push(data.particle);
    };

    const getTotalDtMultiplier = () => {
      return gameState.particles.reduce((total, particle) => {
        return total * (1 + particle.getDtMultiplier());
      }, 1);
    };

    const getTotalGeneratorBonus = () => {
      return gameState.particles.reduce((total, particle) => {
        return total * (1 + particle.getGeneratorBonus());
      }, 1);
    };

    const getTotalCostReduction = () => {
      return gameState.particles.reduce((total, particle) => {
        return total * (1 - particle.getCostReduction());
      }, 1);
    };

    // Retourner l'état local réactif pour l'affichage
    return {
      gameState,
      isDebugEnabled,
      formatNumber,
      toggleDebug,
      buyGenerator,
      TickService,
      handleParticleFused,
      handleParticleObserved,
      getTotalDtMultiplier,
      getTotalGeneratorBonus,
      getTotalCostReduction
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
  grid-template-columns: repeat(2, 1fr);
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.particle-card {
  background: #2a2a4a;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  padding: 15px;
}

.particle-name {
  color: #00ff9d;
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
}

.particle-generation {
  color: #ff9d00;
  font-size: 0.9em;
  display: block;
  margin-bottom: 5px;
}

.particle-type {
  color: #ff9d00;
  font-size: 0.9em;
  display: block;
  margin-bottom: 5px;
}

.particle-effect {
  color: #a0a0a0;
  font-size: 0.9em;
  display: block;
}

.prestige-panel {
  background: #1a1a2e;
  border-radius: 4px;
  padding: 15px;
  border: 1px solid #3a3a5a;
}

.collection-section {
  background: #16213e;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.collection-subsection {
  background: #1a1a2e;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #3a3a5a;
}

.collection-subsection:last-child {
  margin-bottom: 0;
}

.collection-subsection h3 {
  color: #00ff9d;
  margin-bottom: 15px;
  font-size: 1.4em;
  border-bottom: 1px solid #3a3a5a;
  padding-bottom: 10px;
}

.effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.effect-category {
  background: #2a2a4a;
  border-radius: 4px;
  padding: 15px;
}

.effect-category h4 {
  color: #00ff9d;
  margin-bottom: 10px;
  font-size: 1.1em;
}

.effect-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.effect-name {
  color: #a0a0a0;
}

.effect-value {
  color: #00ff9d;
  font-weight: bold;
}

.fusion-section {
  background: #16213e;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.observation-fusion-section {
  background: #16213e;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.collection-effects-section {
  background: #16213e;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style> 
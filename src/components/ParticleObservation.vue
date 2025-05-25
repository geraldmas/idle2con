<template>
  <div class="observation-panel">
    <h2>Observation Quantique</h2>
    
    <div class="observation-controls">
      <div v-for="rank in 3" :key="rank" class="observation-rank">
        <h3>Générateur Quantique {{ rank }}</h3>
        <div class="observation-info">
          <span class="cost">Coût: {{ getObservationCost() }} générateurs de rang {{ rank }}</span>
          <span class="generator-count">
            Générateurs disponibles: {{ getGeneratorCount(rank) }}
          </span>
          <span class="chances">
            Chances:
            <template v-if="rank === 1">
              G1: 100%
            </template>
            <template v-else-if="rank === 2">
              G1: 80%, G2: 20%
            </template>
            <template v-else>
              G1: 50%, G2: 35%, G3: 15%
            </template>
          </span>
        </div>
        <button 
          @click="observe(rank)"
          :disabled="!canObserve(rank)"
          :class="{ 'disabled': !canObserve(rank) }"
        >
          Observer
        </button>
      </div>
    </div>

    <div v-if="lastObservation" class="observation-result">
      <h3>Dernière Observation</h3>
      <div class="particle-card">
        <span class="particle-name">{{ lastObservation.particle.name }}</span>
        <span class="particle-generation">Génération {{ lastObservation.particle.generation }}</span>
        <span class="observation-cost">Coût: {{ lastObservation.cost }} générateurs de rang {{ lastObservation.rank }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { ObservationService } from '../services/ObservationService';

export default {
  name: 'ParticleObservation',
  props: {
    generators: {
      type: Array,
      required: true
    },
    isDebugMode: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const observationService = new ObservationService();
    const lastObservation = ref(null);

    const getObservationCost = (rank) => {
      return props.isDebugMode ? 0 : observationService.getObservationCost(rank);
    };

    const getGeneratorCount = (rank) => {
      const generator = props.generators.find(g => g.rank === rank);
      return generator ? generator.count : 0;
    };

    const canObserve = (rank) => {
      if (props.isDebugMode) return true;

      const generator = props.generators.find(g => g.rank === rank);
      if (!generator) return false;

      const hasEnoughGenerators = observationService.canObserve(rank, generator.count);

      if (rank < 3) {
        const nextRank = rank + 1;
        const nextGenerator = props.generators.find(g => g.rank === nextRank);
        const hasNextGenerator = nextGenerator && nextGenerator.count > 0;
        return hasEnoughGenerators && hasNextGenerator;
      } else {
        return hasEnoughGenerators;
      }
    };

    const observe = (rank) => {
      try {
        const result = observationService.observe(rank);
        lastObservation.value = { ...result, rank };
        
        emit('particle-observed', {
          particle: result.particle,
          rank: rank,
          cost: props.isDebugMode ? 0 : result.cost
        });
      } catch (error) {
        console.error('Erreur lors de l\'observation:', error);
      }
    };

    return {
      getObservationCost,
      getGeneratorCount,
      canObserve,
      observe,
      lastObservation
    };
  }
};
</script>

<style scoped>
.observation-panel {
  background: #2a2a4a;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.observation-panel h2 {
    margin-top: 0;
    color: #00ff9d;
    border-bottom: 1px solid #3a3a5a;
    padding-bottom: 10px;
    margin-bottom: 15px;
}

.observation-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.observation-rank {
  background: #1a1a2e;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #3a3a5a;
  display: flex;
  flex-direction: column;
}

.observation-rank h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #e94560;
    font-size: 1.1em;
}

.observation-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin: 8px 0;
  font-size: 0.8em;
  color: #a0a0a0;
  flex-grow: 1;
}

.cost {
  color: #ff9d00;
  font-weight: bold;
}

.generator-count {
  color: #00ff9d;
}

.chances {
  font-style: italic;
}

.observation-info span {
    display: block;
}

button {
  width: 100%;
  padding: 8px;
  background: #00ff9d;
  color: #1a1a2e;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Roboto Mono', monospace;
  font-weight: bold;
  transition: all 0.2s;
  font-size: 0.9em;
  margin-top: 10px;
}

button:hover:not(.disabled) {
  background: #00cc7d;
  transform: translateY(-2px);
}

button.disabled {
  background: #3a3a5a;
  color: #666;
  cursor: not-allowed;
}

.observation-result {
  margin-top: 15px;
  padding: 10px;
  background: #1a1a2e;
  border-radius: 6px;
  border: 1px solid #3a3a5a;
}

.observation-result h3 {
    margin-top: 0;
    color: #e94560;
    font-size: 1em;
    margin-bottom: 10px;
}

.particle-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  background: #2a2a4a;
  border-radius: 4px;
  margin-top: 8px;
}

.particle-name {
  color: #00ff9d;
  font-weight: bold;
  font-size: 0.9em;
}

.particle-generation {
    font-size: 0.8em;
    color: #a0a0a0;
}

.observation-cost {
     font-size: 0.8em;
    color: #a0a0a0;
}

@media (max-width: 480px) {
  .observation-controls {
    grid-template-columns: 1fr;
  }
}
</style> 
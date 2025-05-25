<template>
  <div class="observation-panel">
    <h2>Observation Quantique</h2>
    
    <div class="observation-controls">
      <div v-for="rank in 3" :key="rank" class="observation-rank">
        <h3>Générateur Quantique {{ rank }}</h3>
        <div class="observation-info">
          <span class="cost">Coût: {{ getObservationCost(rank) }} générateurs de rang {{ rank }}</span>
          <span class="chances">
            Chances d'obtenir:
            <template v-if="rank === 1">
              <ul>
                <li>100% Particule de Génération 1</li>
              </ul>
            </template>
            <template v-else-if="rank === 2">
              <ul>
                <li>80% Particule de Génération 1</li>
                <li>20% Particule de Génération 2</li>
              </ul>
            </template>
            <template v-else>
              <ul>
                <li>50% Particule de Génération 1</li>
                <li>35% Particule de Génération 2</li>
                <li>15% Particule de Génération 3</li>
              </ul>
            </template>
          </span>
          <span class="generator-count">
            Générateurs disponibles: {{ getGeneratorCount(rank) }}
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
    }
  },
  setup(props, { emit }) {
    const observationService = new ObservationService();
    const lastObservation = ref(null);

    const getObservationCost = (rank) => {
      return observationService.getObservationCost(rank);
    };

    const getGeneratorCount = (rank) => {
      const generator = props.generators.find(g => g.rank === rank);
      return generator ? generator.count : 0;
    };

    const canObserve = (rank) => {
      const generator = props.generators.find(g => g.rank === rank);
      return generator && observationService.canObserve(rank, generator.count);
    };

    const observe = (rank) => {
      try {
        const result = observationService.observe(rank);
        lastObservation.value = { ...result, rank };
        
        // Émettre l'événement avec le rang pour la consommation des générateurs
        emit('particle-observed', {
          particle: result.particle,
          rank: rank,
          cost: result.cost
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
  padding: 20px;
  margin-bottom: 20px;
}

.observation-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.observation-rank {
  background: #1a1a2e;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #3a3a5a;
}

.observation-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 10px 0;
  font-size: 0.9em;
  color: #a0a0a0;
}

.cost {
  color: #ff9d00;
  font-weight: bold;
}

.generator-count {
  color: #00ff9d;
}

button {
  width: 100%;
  padding: 10px;
  background: #00ff9d;
  color: #1a1a2e;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Roboto Mono', monospace;
  font-weight: bold;
  transition: all 0.2s;
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
  margin-top: 20px;
  padding: 15px;
  background: #1a1a2e;
  border-radius: 6px;
  border: 1px solid #3a3a5a;
}

.particle-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: #2a2a4a;
  border-radius: 4px;
  margin-top: 10px;
}

.particle-name {
  color: #00ff9d;
  font-weight: bold;
}

.particle-generation {
  color: #ff9d00;
}

.observation-cost {
  color: #a0a0a0;
  font-size: 0.9em;
}

.chances ul {
  list-style: none;
  padding-left: 10px;
  margin: 5px 0;
}

.chances li {
  color: #a0a0a0;
  font-size: 0.9em;
  margin: 3px 0;
}
</style> 
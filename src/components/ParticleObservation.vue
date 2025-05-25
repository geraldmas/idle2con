<template>
  <div class="observation-panel">
    <h2>Observation Quantique</h2>
    
    <div class="observation-controls">
      <!-- Contrôles pour observer les particules normales -->
      <div v-for="rank in 3" :key="rank" class="observation-rank">
        <h3>Générateur Quantique {{ rank }}</h3>
        <div class="observation-info">
          <span class="cost">Coût: {{ getParticleObservationCostDisplay() }} générateurs de rang {{ rank }}</span>
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
          @click="observeParticle(rank)"
          :disabled="!canObserveParticle(rank)"
          :class="{ 'disabled': !canObserveParticle(rank) }"
        >
          Observer Particule (G{{ rank }})
        </button>
      </div>

      <!-- Contrôles pour observer les antiparticules -->
      <div class="observation-antiparticle" v-if="areAntiparticlesUnlocked">
          <h3>Observation d'Antiparticule</h3>
          <div class="observation-info">
              <span class="cost">Coût: {{ getAntiparticleObservationCostDisplay() }} Antipotentiel</span>
              <span class="antipotential-count">
                  Antipotentiel disponible: {{ formatNumber(currentAntipotential) }}
              </span>
               <span class="chances">
                Chances: Anti-G1: 100% (distribution égale entre types)
              </span>
          </div>
           <button 
            @click="observeAntiparticle()"
            :disabled="!canObserveAntiparticle"
            :class="{ 'disabled': !canObserveAntiparticle }"
          >
            Observer Antiparticule
          </button>
      </div>

    </div>

    <div v-if="lastObservation" class="observation-result">
      <h3>Dernière Observation</h3>
      <div class="particle-card">
        <span class="particle-name">{{ lastObservation.item.name }}</span>
        <span class="particle-generation">Génération {{ lastObservation.item.generation }}</span>
        <span class="observation-cost">Coût: {{ lastObservation.cost }} {{ lastObservation.isAntiparticle ? 'Antipotentiel' : `générateurs de rang ${lastObservation.rank}` }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue';
import { ObservationService } from '../services/ObservationService';
import { PrestigeService } from '../services/PrestigeService';
import { eventBus } from '../App.vue';

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
    const gameState = inject('gameState');
    const observationService = new ObservationService();
    const prestigeService = new PrestigeService();

    const lastObservation = ref(null);
    
    const currentAntipotential = computed(() => gameState?.antipotential || 0);
    const areAntiparticlesUnlocked = computed(() => prestigeService.isAntiparticlesUnlocked(gameState));

    const getGeneratorCount = (rank) => {
      const generator = props.generators.find(g => g.rank === rank);
      return generator ? generator.count : 0;
    };

    const canObserveParticle = (rank) => {
      const generator = props.generators.find(g => g.rank === rank);
      return generator ? observationService.canObserveParticle(rank, generator.count, gameState) : false;
    };

    const getParticleObservationCostDisplay = () => {
        // gameState is injected and available
        return observationService.getParticleObservationCost(gameState.observationCount);
    };

    const canObserveAntiparticle = computed(() => {
        return observationService.canObserveAntiparticle(gameState, prestigeService);
    });

     const getAntiparticleObservationCostDisplay = () => {
        // gameState and prestigeService are available
        return observationService.getAntiparticleObservationCost(prestigeService, gameState.antiparticleObservationCount);
    };

    const observeParticle = (rank) => {
      const generator = props.generators.find(g => g.rank === rank);
      // canObserveParticle already uses gameState.observationCount via the service method.
      if (generator && canObserveParticle(rank)) { 
        try {
          // gameState is passed, observe will use gameState.observationCount internally for cost calc.
          const observationResult = observationService.observe(gameState, prestigeService, false, rank, generator.count);
          lastObservation.value = { ...observationResult, rank }; // Store full result for display

          // Consume generator resources
          generator.count -= observationResult.cost;
          if (generator.count < 0) generator.count = 0; // Ensure not negative

          // Update the observationCount in gameState
          gameState.observationCount = observationResult.newObservationCount;

          // Emit event for App.vue to handle particle addition to list and storage
          emit('particle-observed', { 
            particle: observationResult.item, 
            rank, // rank of generator used
            cost: observationResult.cost 
          });

        } catch (error) {
          console.error('Error observing particle:', error);
          // Optionally, emit an error event or show a user notification
        }
      }
    };

    const observeAntiparticle = () => {
        // canObserveAntiparticle already uses gameState.antiparticleObservationCount via the service method
        if (canObserveAntiparticle.value) { 
            try {
                // gameState is passed, observe will use gameState.antiparticleObservationCount internally for cost calc.
                const observationResult = observationService.observe(gameState, prestigeService, true);
                lastObservation.value = observationResult; // Store full result for display

                // Deduct cost from antipotential
                if (gameState.antipotential !== undefined) {
                    gameState.antipotential -= observationResult.cost;
                    if (gameState.antipotential < 0) gameState.antipotential = 0;
                }

                // Update the antiparticleObservationCount in gameState
                gameState.antiparticleObservationCount = observationResult.newAntiparticleObservationCount;
                
                // Emit event for App.vue to handle particle addition
                emit('particle-observed', { 
                  particle: observationResult.item, 
                  isAntiparticle: true, 
                  cost: observationResult.cost 
                });

            } catch (error) {
                 console.error('Error observing antiparticle:', error);
                 // Optionally, emit an error event or show a user notification
            }
        }
    };

    const formatNumber = (num) => {
      if (num === undefined || num === null) return '0';
       if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'G';
      }
      if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
      }
      return Math.floor(num).toString();
    };

    return {
      lastObservation,
      getGeneratorCount,
      canObserveParticle,
      getParticleObservationCostDisplay,
      observeParticle,
      currentAntipotential,
      areAntiparticlesUnlocked,
      canObserveAntiparticle,
      getAntiparticleObservationCostDisplay,
      observeAntiparticle,
      formatNumber
    };
  }
};
</script>

<style scoped>
.observation-panel {
  padding: 15px;
  background: #1a1a2e;
  color: #e6e6e6;
  border-radius: 8px;
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

.observation-rank,
.observation-antiparticle {
  background: #1a1a2e;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #3a3a5a;
  display: flex;
  flex-direction: column;
}

.observation-rank h3,
.observation-antiparticle h3 {
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

.generator-count,
.antipotential-count {
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
<template>
  <div class="generator" :class="{ 'locked': !isUnlocked }">
    <div class="generator-header">
      <h4>{{ name }}</h4>
      <!-- Count is moved below -->
    </div>
    
    <div class="generator-info">
      <div class="generator-main-stats">
        <div class="stat-item stat-count">
          <span class="label">Possédés:</span>
          <span class="value main-count-value">{{ formatNumber(count, 0) }}</span>
        </div>
        <div class="stat-item stat-cost">
          <span class="label">Coût:</span>
          <span class="value">
            {{ formatNumber(stateCost) }} États
            <span v-if="generatorCost > 0"><br>+ {{ formatNumber(generatorCost) }} {{ getPreviousGeneratorName }}</span>
          </span>
        </div>
      </div>

      <div class="production">
        <span class="label">Production Totale:</span>
        <span class="value prod-value">+{{ formatNumber(totalProduction) }}/s</span>
      </div>
      <div class="production-per-generator">
        <span class="label">Par Générateur:</span>
        <span class="value prod-value">+{{ formatNumber(productionPerGenerator) }}/s</span>
      </div>
      
      <div class="milestones" v-if="isUnlocked">
        <div class="milestone-progress">
          <div class="milestone-progress-display">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${milestoneProgress * 100}%` }"></div>
            </div>
            <span class="milestone-text">
              Prochain: {{ formatNumber(nextMilestone) }} (x{{ formatNumber(milestoneBonus) }})
            </span>
          </div>
        </div>
        <div class="reached-milestones" v-if="reachedMilestones.length > 0">
          <span class="label">Paliers (x2):</span>
          <span class="value">{{ reachedMilestones.join(', ') }}</span>
        </div>
      </div>
    </div>

    <button 
      class="buy-button" 
      :disabled="!isUnlocked || (!canAfford && !TickService.debug)"
      @click="buyGenerator"
    >
      <span v-if="!isUnlocked">Débloqué à {{ unlockRequirement }}</span>
      <span v-else-if="!canAfford && !TickService.debug">Coût: {{ formatNumber(stateCost) }} États<span v-if="generatorCost > 0"> + {{ formatNumber(generatorCost) }} {{ getPreviousGeneratorName }}</span></span>
      <span v-else>Acheter</span>
    </button>
  </div>
</template>

<script>
import { computed, inject } from 'vue';
import TickService from '../services/TickService';

export default {
  name: 'Generator',
  components: {
    // ParticleFusion // Uncomment if ParticleFusion is used here
  },
  props: {
    name: {
      type: String,
      required: true
    },
    generator: {
      type: Object,
      required: true
    },
    unlockRequirement: {
      type: String,
      default: ''
    },
    milestoneProgress: {
      type: Number,
      default: 0
    },
    nextMilestone: {
      type: Number,
      default: 0
    },
    milestoneBonus: {
      type: Number,
      default: 1
    },
    reachedMilestones: {
      type: Array,
      default: () => []
    }
  },
  emits: ['buy'],
  setup(props, { emit }) {
    const gameState = inject('gameState');

    const totalProduction = computed(() => props.generator ? props.generator.getProduction(gameState) : 0);
    const productionPerGenerator = computed(() => props.generator ? props.generator.getProductionPerGenerator(gameState) : 0);
    const stateCost = computed(() => props.generator ? props.generator.getCost(gameState) : 0);
    const generatorCost = computed(() => props.generator ? props.generator.getGeneratorCost(gameState) : 0);
    
    const canAfford = computed(() => props.generator ? props.generator.canAfford(gameState?.resources.get('États'), gameState?.generators, gameState) : false);

    const getPreviousGeneratorName = computed(() => {
      if (props.generator && props.generator.rank > 1 && gameState?.generators) {
        const previousGenerator = gameState.generators.find(g => g.rank === props.generator.rank - 1);
        return previousGenerator ? previousGenerator.name : '';
      }
      return '';
    });

    const formatNumber = (num, decimals = 2) => { // Added decimals parameter
       if (num === undefined || num === null) return '0.00';
       if (num >= 1e9) {
        return (num / 1e9).toFixed(decimals) + 'G';
      }
      if (num >= 1e6) {
        return (num / 1e6).toFixed(decimals) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(decimals) + 'K';
      }
      return num.toFixed(decimals);
    };

    const buyGenerator = () => {
       emit('buy', { generator: props.generator, gameState });
    };

    const name = computed(() => props.name);
    const count = computed(() => props.generator ? props.generator.count : 0);
    const isUnlocked = computed(() => props.generator && props.generator._isUnlocked ? props.generator._isUnlocked.value : false);
    const milestoneProgress = computed(() => props.generator ? props.generator.getMilestoneProgress() : 0);
    const nextMilestone = computed(() => props.generator ? props.generator.getNextMilestone() : 0);
    const milestoneBonus = computed(() => props.generator ? props.generator.getMilestoneBonus() : 1);
    const reachedMilestones = computed(() => props.generator ? props.generator.getReachedMilestones() : []);

    return {
      totalProduction,
      productionPerGenerator,
      stateCost,
      generatorCost,
      canAfford,
      getPreviousGeneratorName,
      formatNumber,
      buyGenerator,
      name,
      count,
      isUnlocked,
      unlockRequirement: props.unlockRequirement,
      milestoneProgress,
      nextMilestone,
      milestoneBonus,
      reachedMilestones,
      TickService
    };
  }
}
</script>

<style scoped>
.generator {
  background: #1a1a2e;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  padding: 10px; /* Reduced padding */
  margin-bottom: 8px; /* Reduced margin-bottom */
  transition: all 0.3s ease;
  display: flex; /* Added flex for better internal layout control */
  flex-direction: column; /* Stack children vertically */
}

.generator.locked {
  opacity: 0.6;
  filter: grayscale(0.8);
}

.generator-header {
  display: flex;
  justify-content: space-between; /* Title to the left, (formerly count to the right) */
  align-items: center;
  margin-bottom: 6px; /* Slightly reduced margin */
}

.generator-header h4 {
  color: #00ff9d;
  margin: 0;
  font-size: 1.1em; 
}

/* Count is no longer in header */
/* .generator-count { ... } */

.generator-info {
  margin-bottom: 8px; /* Slightly reduced margin */
  flex-grow: 1; 
}

.generator-main-stats {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* Align to top in case cost wraps */
  margin-bottom: 6px; /* Space below this row */
}

.stat-item {
  display: flex;
  flex-direction: column; /* Label on top of value */
  align-items: flex-start;
}
.stat-item .label {
  font-size: 0.8em;
  color: #888;
  margin-bottom: 1px;
}
.stat-item .value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.95em;
  font-weight: 600; /* Make values a bit bolder */
}
.stat-cost {
  align-items: flex-end; /* Align cost to the right */
}
.stat-cost .value {
  text-align: right;
}
.main-count-value {
  color: #ff9d00; /* Highlight count value */
}


.production, .production-per-generator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px; /* Reduced margin */
  font-size: 0.9em; /* Base size for production lines */
}
.production .label, .production-per-generator .label {
  margin-right: 5px;
  color: #888;
}
.production .value.prod-value, .production-per-generator .value.prod-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 1em; /* Relative to parent's 0.9em */
  color: #e6e6e6;
}
.production-per-generator {
  font-size: 0.8em; /* Further reduced for secondary prod info */
}


.buy-button {
  width: 100%;
  padding: 6px; /* Reduced padding */
  background: #2a2a4a;
  color: #00ff9d;
  border: 1px solid #00ff9d;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.95em; /* Slightly reduced font-size */
  margin-top: auto; /* Push button to bottom if generator info is short */
}

.buy-button:hover:not(:disabled) {
  background: #00ff9d;
  color: #1a1a2e;
}

.buy-button:disabled {
  opacity: 1;
  cursor: not-allowed;
  border-color: #3a3a5a;
  background-color: #2a2a4a;
}

.buy-button:disabled span {
  color: #e6e6e6;
}

.milestones {
  margin-top: 6px; /* Reduced margin */
  padding-top: 6px; /* Reduced padding */
  border-top: 1px solid #3a3a5a;
}

.milestone-progress {
  margin-bottom: 4px; /* Reduced margin */
}

.milestone-progress-display {
  display: flex;
  align-items: center;
  gap: 8px; /* Gap between bar and text */
}

.progress-bar {
  flex-grow: 1; /* Allow bar to take space */
  height: 6px; 
  background: #2a2a4a;
  border-radius: 4px;
  overflow: hidden;
  /* margin-bottom: 3px; /* Removed, handled by gap in flex container */
}

.progress-fill {
  height: 100%;
  background: #00ff9d;
  transition: width 0.3s ease;
}

.milestone-text {
  font-size: 0.8em; /* Reduced font-size */
  color: #00ff9d;
  flex-shrink: 1; /* Allow text to shrink if needed */
  text-align: right;
}

.reached-milestones {
  font-size: 0.8em; /* Reduced font-size */
  color: #ff9d00;
  line-height: 1.3; /* Compact line height for list */
}

.reached-milestones .label {
  margin-right: 5px;
}

@media (max-width: 420px) { /* Breakpoint for very narrow screens */
  .generator-main-stats {
    flex-direction: column;
    align-items: flex-start; /* Align items to the start (left) */
    gap: 4px; /* Add some gap between stacked items */
  }

  .stat-item {
    width: 100%; /* Allow stat items to take full width if needed */
  }

  .stat-cost {
    align-items: flex-start; /* Ensure cost section aligns to start */
  }

  .stat-cost .value {
    text-align: left; /* Align cost value to left */
  }
}
</style> 
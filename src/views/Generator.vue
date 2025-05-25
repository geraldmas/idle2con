<template>
  <div class="generator" :class="{ 'locked': !isUnlocked }">
    <div class="generator-header">
      <h4>{{ name }}</h4>
      <span class="generator-count">{{ formatNumber(count) }}</span>
    </div>
    
    <div class="generator-info">
      <div class="production">
        <span class="label">Production:</span>
        <span class="value">+{{ formatNumber(production) }}/s</span>
      </div>
      <div class="cost">
        <span class="label">Coût:</span>
        <span class="value">
          {{ formatNumber(cost) }} États
          <span v-if="generatorCost > 0">+ {{ formatNumber(generatorCost) }} {{ getPreviousGeneratorName }}</span>
        </span>
      </div>
    </div>

    <button 
      class="buy-button" 
      :disabled="!canAfford || !isUnlocked"
      @click="buyGenerator"
    >
      <span v-if="!isUnlocked">Débloqué à {{ unlockRequirement }}</span>
      <span v-else-if="!canAfford">Coût: {{ formatNumber(cost) }} États<span v-if="generatorCost > 0"> + {{ formatNumber(generatorCost) }} {{ getPreviousGeneratorName }}</span></span>
      <span v-else>Acheter</span>
    </button>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'Generator',
  props: {
    name: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    },
    production: {
      type: Number,
      required: true
    },
    cost: {
      type: Number, // Coût en états
      required: true
    },
    generatorCost: {
      type: Number, // Coût en générateurs précédents
      default: 0
    },
    isUnlocked: {
      type: Boolean,
      default: true
    },
    unlockRequirement: {
      type: String,
      default: ''
    },
    canAfford: {
      type: Boolean,
      default: false
    }
  },
  emits: ['buy'],
  setup(props, { emit }) {
    const getPreviousGeneratorName = computed(() => {
      if (props.name.includes('II')) return 'Gén. I';
      if (props.name.includes('III')) return 'Gén. II';
      if (props.name.includes('IV')) return 'Gén. III';
      return '';
    });

    const formatNumber = (num) => {
      if (num === undefined || num === null) return '0';
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
      }
      return Math.floor(num); // Afficher uniquement la partie entière
    };

    const buyGenerator = () => {
      if (props.canAfford && props.isUnlocked) {
        emit('buy');
      }
    };

    return {
      formatNumber,
      buyGenerator,
      getPreviousGeneratorName
    };
  }
}
</script>

<style scoped>
.generator {
  background: #1a1a2e;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.generator.locked {
  opacity: 0.6;
  filter: grayscale(0.8);
}

.generator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.generator-header h4 {
  color: #00ff9d;
  margin: 0;
  font-size: 1.2em;
}

.generator-count {
  background: #2a2a4a;
  color: #ff9d00;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
}

.generator-info {
  margin-bottom: 15px;
}

.production, .cost {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.label {
  color: #888;
}

.value {
  color: #e6e6e6;
  font-family: 'Roboto Mono', monospace;
  filter: none;
}

.cost .value {
  color: #e6e6e6;
}

.buy-button {
  width: 100%;
  padding: 8px;
  background: #2a2a4a;
  color: #00ff9d;
  border: 1px solid #00ff9d;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
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
</style> 
<template>
  <div class="generator" :class="{ 'locked': !isUnlocked }">
    <div class="generator-header">
      <h4>{{ name }}</h4>
      <span class="generator-count">{{ count }}</span>
    </div>
    
    <div class="generator-info">
      <div class="production">
        <span class="label">Production:</span>
        <span class="value">+{{ formatNumber(production) }}/s</span>
      </div>
      <div class="cost">
        <span class="label">Coût:</span>
        <span class="value">{{ formatNumber(cost) }} {{ costResource }}</span>
      </div>
    </div>

    <button 
      class="buy-button" 
      :disabled="!canAfford || !isUnlocked"
      @click="buyGenerator"
    >
      {{ isUnlocked ? 'Acheter' : 'Débloqué à ' + unlockRequirement }}
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
      type: Number,
      required: true
    },
    costResource: {
      type: String,
      default: 'États'
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
  setup(props, { emit }) {
    const formatNumber = (num) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
      }
      return num.toFixed(2);
    };

    const buyGenerator = () => {
      if (props.canAfford && props.isUnlocked) {
        emit('buy');
      }
    };

    return {
      formatNumber,
      buyGenerator
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
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #3a3a5a;
  color: #3a3a5a;
}
</style> 
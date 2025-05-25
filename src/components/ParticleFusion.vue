<template>
  <div class="fusion-panel">
    <h2>Fusion de Particules</h2>
    
    <div class="fusion-info">
      <p>Fusionnez 3 particules identiques pour obtenir une particule de génération supérieure.</p>
      <div class="effect-preview" v-if="selectedParticles.length === 3">
        <h3>Effet de la fusion</h3>
        <div class="effect-details">
          <div class="current-effect">
            <span class="label">Effet actuel:</span>
            <span class="value">{{ formatTotalEffect(selectedParticles[0]) }}</span>
          </div>
          <div class="fusion-arrow">→</div>
          <div class="future-effect">
            <span class="label">Effet après fusion:</span>
            <span class="value">{{ formatFusionEffect(selectedParticles[0]) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="fusion-interface">
      <div class="particles-grid">
        <div 
          v-for="particle in availableParticles" 
          :key="particle.id"
          class="particle-card"
          :class="{ 
            'selected': selectedParticles.includes(particle),
            'fusion-ready': canFuse && selectedParticles.length === 3
          }"
          @click="toggleParticleSelection(particle)"
        >
          <span class="particle-name">{{ particle.name }}</span>
          <span class="particle-generation">Génération {{ particle.generation }}</span>
          <div class="particle-effect">
            <span class="effect-label">Effet:</span>
            <span class="effect-value">{{ particle.getEffectDescription() }}</span>
          </div>
          <div class="particle-count">
            <span class="count-label">Disponibles:</span>
            <span class="count-value">x{{ getParticleCount(particle) }}</span>
          </div>
        </div>
      </div>

      <div class="fusion-controls">
        <div class="selected-particles">
          <h3>Particules sélectionnées ({{ selectedParticles.length }}/3)</h3>
          <div class="selected-list">
            <div v-for="(particle, index) in selectedParticles" :key="index" class="selected-particle">
              <div class="particle-info">
                <span class="name">{{ particle.name }}</span>
                <span class="effect">{{ particle.getEffectDescription() }}</span>
              </div>
              <button @click="removeParticle(index)" class="remove-button">×</button>
            </div>
          </div>
        </div>

        <button 
          @click="fuseParticles"
          :disabled="!canFuse"
          :class="{ 'disabled': !canFuse, 'ready': canFuse }"
        >
          {{ canFuse ? 'Fusionner' : 'Sélectionnez 3 particules' }}
        </button>
      </div>
    </div>

    <div v-if="lastFusion" class="fusion-result">
      <h3>Dernière Fusion</h3>
      <div class="particle-card fusion-animation">
        <span class="particle-name">{{ lastFusion.name }}</span>
        <span class="particle-generation">Génération {{ lastFusion.generation }}</span>
        <div class="particle-effect">
          <span class="effect-label">Nouvel effet:</span>
          <span class="effect-value">{{ lastFusion.getEffectDescription() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { ParticleFusion } from '../services/ParticleFusion';

export default {
  name: 'ParticleFusion',
  props: {
    particles: {
      type: Array,
      required: true
    }
  },
  setup(props, { emit }) {
    const fusionService = new ParticleFusion();
    const selectedParticles = ref([]);
    const lastFusion = ref(null);

    const availableParticles = computed(() => {
      return props.particles.filter(particle => {
        const count = getParticleCount(particle);
        return count >= 3;
      });
    });

    const getParticleCount = (particle) => {
      return props.particles.filter(p => p.type === particle.type).length;
    };

    const canFuse = computed(() => {
      return selectedParticles.value.length === 3 && 
             fusionService.canFuse(selectedParticles.value);
    });

    const toggleParticleSelection = (particle) => {
      const index = selectedParticles.value.findIndex(p => p.id === particle.id);
      if (index === -1 && selectedParticles.value.length < 3) {
        selectedParticles.value.push(particle);
      } else if (index !== -1) {
        selectedParticles.value.splice(index, 1);
      }
    };

    const removeParticle = (index) => {
      selectedParticles.value.splice(index, 1);
    };

    const fuseParticles = () => {
      if (!canFuse.value) return;

      try {
        const result = fusionService.fuse(selectedParticles.value);
        lastFusion.value = result;
        selectedParticles.value = [];
        emit('particle-fused', result);
      } catch (error) {
        console.error('Erreur lors de la fusion:', error);
      }
    };

    const formatTotalEffect = (particle) => {
      if (!particle) return '0%';
      const baseEffect = particle.getEffectValue();
      const totalEffect = Math.pow(1 + baseEffect, 3) - 1;
      return `${(totalEffect * 100).toFixed(1)}%`;
    };

    const formatFusionEffect = (particle) => {
      if (!particle) return '0%';
      const fusionService = new ParticleFusion();
      const ResultClass = fusionService.getFusionResult(particle.type);
      if (!ResultClass) return 'Fusion impossible';
      const newParticle = new ResultClass();
      return `${(newParticle.getEffectValue() * 100).toFixed(1)}%`;
    };

    return {
      selectedParticles,
      lastFusion,
      availableParticles,
      getParticleCount,
      canFuse,
      toggleParticleSelection,
      removeParticle,
      fuseParticles,
      formatTotalEffect,
      formatFusionEffect
    };
  }
};
</script>

<style scoped>
.fusion-panel {
  background: #2a2a4a;
  border-radius: 8px;
  padding: 20px;
}

.fusion-info {
  margin-bottom: 20px;
  color: #a0a0a0;
  font-size: 0.9em;
}

.fusion-interface {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.particles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.particle-card {
  background: #1a1a2e;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.particle-card:hover {
  transform: translateY(-2px);
  border-color: #00ff9d;
}

.particle-card.selected {
  border-color: #00ff9d;
  background: #1a2e2a;
}

.particle-card.fusion-ready {
  border-color: #00ff9d;
  box-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
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

.particle-effect {
  color: #a0a0a0;
  font-size: 0.9em;
  display: block;
  margin-bottom: 5px;
}

.particle-count {
  color: #00ff9d;
  font-weight: bold;
  font-size: 0.9em;
}

.fusion-controls {
  background: #1a1a2e;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #3a3a5a;
}

.selected-particles {
  margin-bottom: 20px;
}

.selected-list {
  margin-top: 10px;
}

.selected-particle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #2a2a4a;
  border-radius: 4px;
  margin-bottom: 5px;
}

.remove-button {
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  font-size: 1.2em;
  padding: 0 5px;
}

button {
  width: 100%;
  padding: 12px;
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

.fusion-result {
  margin-top: 20px;
  padding: 15px;
  background: #1a1a2e;
  border-radius: 6px;
  border: 1px solid #3a3a5a;
}

.effect-preview {
  background: #1a1a2e;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  padding: 15px;
  margin-top: 15px;
}

.effect-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.current-effect, .future-effect {
  flex: 1;
  text-align: center;
}

.fusion-arrow {
  color: #00ff9d;
  font-size: 1.5em;
  margin: 0 20px;
}

.effect-label, .count-label {
  color: #8b8b8b;
  font-size: 0.9em;
  margin-right: 5px;
}

.effect-value, .count-value {
  color: #00ff9d;
  font-weight: bold;
}

.particle-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.particle-info .name {
  color: #00ff9d;
  font-weight: bold;
}

.particle-info .effect {
  color: #8b8b8b;
  font-size: 0.9em;
}

.fusion-animation {
  animation: fusionPulse 1s ease-in-out;
}

@keyframes fusionPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(0, 255, 157, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 20px 10px rgba(0, 255, 157, 0.2);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(0, 255, 157, 0);
  }
}

.fusion-ready {
  border-color: #00ff9d;
  box-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
}

button.ready {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 255, 157, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 255, 157, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 255, 157, 0);
  }
}
</style> 
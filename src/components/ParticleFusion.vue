<template>
  <div class="fusion-panel">
    <h2>Fusion de Particules</h2>
    
    <div class="fusion-info">
      <p>Fusionnez 3 particules identiques pour obtenir une particule de génération supérieure.</p>
    </div>

    <div class="fusion-interface">
      <div class="particles-grid">
        <div 
          v-for="particle in availableParticles" 
          :key="particle.id"
          class="particle-card"
          :class="{ 'selected': selectedParticles.includes(particle) }"
          @click="toggleParticleSelection(particle)"
        >
          <span class="particle-name">{{ particle.name }}</span>
          <span class="particle-generation">Génération {{ particle.generation }}</span>
          <span class="particle-effect">{{ particle.getEffectDescription() }}</span>
          <span class="particle-count">x{{ getParticleCount(particle) }}</span>
        </div>
      </div>

      <div class="fusion-controls">
        <div class="selected-particles">
          <h3>Particules sélectionnées ({{ selectedParticles.length }}/3)</h3>
          <div class="selected-list">
            <div v-for="(particle, index) in selectedParticles" :key="index" class="selected-particle">
              {{ particle.name }}
              <button @click="removeParticle(index)" class="remove-button">×</button>
            </div>
          </div>
        </div>

        <button 
          @click="fuseParticles"
          :disabled="!canFuse"
          :class="{ 'disabled': !canFuse }"
        >
          Fusionner
        </button>
      </div>
    </div>

    <div v-if="lastFusion" class="fusion-result">
      <h3>Dernière Fusion</h3>
      <div class="particle-card">
        <span class="particle-name">{{ lastFusion.name }}</span>
        <span class="particle-generation">Génération {{ lastFusion.generation }}</span>
        <span class="particle-effect">{{ lastFusion.getEffectDescription() }}</span>
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

    return {
      selectedParticles,
      lastFusion,
      availableParticles,
      getParticleCount,
      canFuse,
      toggleParticleSelection,
      removeParticle,
      fuseParticles
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
</style> 
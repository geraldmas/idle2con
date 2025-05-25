<template>
  <div class="particle-collection">
    <h2>Collection de Particules</h2>
    
    <div class="total-effects-summary">
      <div class="effect-category">
        <span class="label">Multiplicateur dt total:</span>
        <span class="value">{{ formatGlobalEffect('dt') }}</span>
      </div>
      <div class="effect-category">
        <span class="label">Bonus générateurs total:</span>
        <span class="value">{{ formatGlobalEffect('generator') }}</span>
      </div>
      <div class="effect-category">
        <span class="label">Réduction coûts totale:</span>
        <span class="value">{{ formatGlobalEffect('cost') }}</span>
      </div>
    </div>

    <div class="particles-grid">
      <div 
        v-for="particle in groupedParticles" 
        :key="particle.type"
        class="particle-card"
        :class="[particle.type, `generation-${particle.generation}`]"
      >
        <div class="particle-header">
          <h3>{{ particle.name }}</h3>
          <span class="generation-badge">G{{ particle.generation }}</span>
          <span v-if="particle.count > 1" class="particle-count-badge">{{ particle.count }}</span>
        </div>
        
        <div class="particle-details">
          <div class="effect">
            <span class="label">Effet:</span>
            <span class="value">{{ formatEffect(particle.firstParticle) }}</span>
          </div>
          <div class="total-effect" v-if="particle.count > 1">
            <span class="label">Effet total:</span>
            <span class="value">{{ formatTotalEffect(particle) }}</span>
          </div>
        </div>

        <div class="particle-actions">
          <button 
            v-if="canFuse(particle.type)"
            @click="prepareFusion(particle.type)"
            class="fuse-button"
          >
            Fusionner ({{ particle.count }}/3)
          </button>
        </div>
      </div>
    </div>

    <div v-if="showFusionModal" class="fusion-modal">
      <div class="modal-content">
        <h3>Fusion de Particules</h3>
        <p>Fusionner 3 {{ fusionParticleType }} en une particule de génération supérieure ?</p>
        <div class="modal-actions">
          <button @click="confirmFusion" class="confirm-button">Confirmer</button>
          <button @click="showFusionModal = false" class="cancel-button">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { ParticleStorage } from '../services/ParticleStorage';
import { ParticleFusion } from '../services/ParticleFusion';

export default {
  name: 'ParticleCollection',
  props: {
    particles: {
      type: Array,
      required: true
    }
  },
  setup(props, { emit }) {
    const fusionService = new ParticleFusion();
    const showFusionModal = ref(false);
    const fusionParticleType = ref('');
    const fusionError = ref('');

    watch(() => props.particles, (newParticles) => {
      fusionService.setParticles(newParticles);
    }, { immediate: true });

    const groupedParticles = computed(() => {
      const grouped = {};
      props.particles.forEach(particle => {
        if (!grouped[particle.type]) {
          grouped[particle.type] = {
            type: particle.type,
            name: particle.name,
            generation: particle.generation,
            count: 0,
            firstParticle: particle
          };
        }
        grouped[particle.type].count++;
      });
      return Object.values(grouped);
    });

    const canFuse = (type) => {
      return fusionService.canFuseParticles(type);
    };

    const formatEffect = (particle) => {
      if (!particle || typeof particle.getEffectDescription !== 'function') {
        return 'Effet inconnu ou méthode manquante';
      }
      return particle.getEffectDescription();
    };

    const formatTotalEffect = (particle) => {
      if (!particle || !particle.firstParticle) return '';
      const baseEffect = particle.firstParticle.getEffectValue();
      const totalEffect = Math.pow(1 + baseEffect, particle.count) - 1;
      return `${(totalEffect * 100).toFixed(1)}%`;
    };

    const calculateGlobalEffect = (effectType) => {
      let totalEffect = 1;
      props.particles.forEach(particle => {
        let effect = 0;
        switch(effectType) {
          case 'dt':
            effect = particle.getDtMultiplier();
            break;
          case 'generator':
            effect = particle.getGeneratorBonus();
            break;
          case 'cost':
            effect = particle.getCostReduction();
            break;
        }
        if (effect > 0) {
          totalEffect *= (1 + effect);
        }
      });
      return totalEffect - 1;
    };

    const formatGlobalEffect = (effectType) => {
      const effect = calculateGlobalEffect(effectType);
      return `${(effect * 100).toFixed(1)}%`;
    };

    const prepareFusion = (type) => {
      fusionParticleType.value = type;
      const particleGroup = groupedParticles.value.find(p => p.type === type);
      const currentCount = particleGroup ? particleGroup.count : 0;

      if (fusionService.canFuseParticles(type, currentCount)) {
        showFusionModal.value = true;
      } else {
        fusionError.value = `Il faut 3 particules pour fusionner`;
      }
    };

    const confirmFusion = () => {
      try {
        emit('fuse-particles', { type: fusionParticleType.value });
        showFusionModal.value = false;
        fusionError.value = '';
      } catch (error) {
        console.error('Erreur lors de la fusion:', error);
        fusionError.value = error.message;
      }
    };

    return {
      groupedParticles,
      showFusionModal,
      fusionParticleType,
      fusionError,
      canFuse,
      formatEffect,
      formatTotalEffect,
      formatGlobalEffect,
      prepareFusion,
      confirmFusion
    };
  }
};
</script>

<style scoped>
.particle-collection {
  padding: 15px;
  background: #1a1a2e;
  color: #e6e6e6;
  border-radius: 8px;
}

.total-effects-summary {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.effect-category {
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
  font-size: 1em;
}

.effect-category .label {
  color: #8b8b8b;
}

.effect-category .value {
  color: #00ff9d;
  font-family: 'Roboto Mono', monospace;
  font-weight: bold;
}

.particles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.particle-card {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  padding: 10px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 120px;
}

.particle-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(233, 69, 96, 0.2);
}

.particle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 5px;
}

.particle-header h3 {
  margin: 0;
  font-size: 1em;
  flex-grow: 1;
  margin-right: 5px;
  word-break: break-word;
}

.generation-badge {
  background: #e94560;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.7em;
  flex-shrink: 0;
}

.particle-count-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #00ff9d;
  color: #1a1a2e;
  border-radius: 50%;
  padding: 4px 6px;
  font-size: 0.7em;
  font-weight: bold;
  min-width: 18px;
  text-align: center;
  border: 1px solid #1a1a2e;
  z-index: 1;
}

.particle-details {
  margin: 8px 0;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.effect, .total-effect {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.9em;
}

.effect .label, .total-effect .label {
  color: #8b8b8b;
  font-size: 0.9em;
}

.effect .value, .total-effect .value {
  color: #e6e6e6;
  font-family: 'Roboto Mono', monospace;
  word-break: break-word;
  line-height: 1.3;
}

.particle-actions {
  margin-top: auto;
  padding-top: 8px;
}

.fuse-button {
  width: 100%;
  padding: 6px;
  background: #e94560;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
}

.fuse-button:hover {
  background: #d13b54;
}

.fusion-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a2e;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  color: #e6e6e6;
}

.modal-content h3 {
  color: #00ff9d;
  margin-top: 0;
  margin-bottom: 15px;
}

.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

.confirm-button, .cancel-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-button {
  background: #00ff9d;
  color: #1a1a2e;
}

.confirm-button:hover {
  background: #00cc7a;
}

.cancel-button {
  background: #e94560;
  color: white;
}

.cancel-button:hover {
  background: #d13b54;
}

/* Styles pour les différentes générations */
.particle-card.generation-1 {
  border-left: 4px solid #e94560; /* Rouge pour la génération 1 */
}

.particle-card.generation-2 {
  border-left: 4px solid #00ff9d; /* Vert pour la génération 2 */
}

.particle-card.generation-3 {
  border-left: 4px solid #ff9d00; /* Orange pour la génération 3 */
}

.generation-1 .generation-badge {
  background: #e94560;
}

.generation-2 .generation-badge {
  background: #00ff9d;
  color: #1a1a2e;
}

.generation-3 .generation-badge {
  background: #ff9d00;
  color: #1a1a2e;
}

@media (max-width: 480px) {
  .particles-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .particle-card {
    min-height: 100px;
    padding: 8px;
  }

  .particle-header h3 {
    font-size: 1em;
  }

  .generation-badge {
    padding: 0 4px;
    font-size: 0.6em;
  }

  .effect .value, .total-effect .value {
    font-size: 0.8em;
  }

  .fuse-button {
    font-size: 0.8em;
    padding: 5px;
  }
}
</style> 
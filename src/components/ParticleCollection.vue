<template>
  <div class="particle-collection">
    <h2>Collection de Particules</h2>
    
    <div class="generation-tabs">
      <button 
        v-for="gen in 3" 
        :key="gen"
        :class="{ active: currentGeneration === gen }"
        @click="currentGeneration = gen"
      >
        Génération {{ gen }}
      </button>
    </div>

    <div class="particles-grid">
      <div 
        v-for="particle in filteredParticles" 
        :key="particle.id"
        class="particle-card"
        :class="particle.type"
      >
        <div class="particle-header">
          <h3>{{ particle.name }}</h3>
          <span class="generation-badge">G{{ particle.generation }}</span>
        </div>
        
        <div class="particle-details">
          <div class="effect">
            <span class="label">Effet:</span>
            <span class="value">{{ formatEffect(particle) }}</span>
          </div>
          <div class="quantity">
            <span class="label">Quantité:</span>
            <span class="value">{{ getParticleCount(particle.type) }}</span>
          </div>
        </div>

        <div class="particle-actions">
          <button 
            v-if="canFuse(particle.type)"
            @click="prepareFusion(particle.type)"
            class="fuse-button"
          >
            Fusionner ({{ getParticleCount(particle.type) }}/3)
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
import { ref, computed } from 'vue';
import { ParticleStorage } from '../services/ParticleStorage';
import { ParticleFusion } from '../services/ParticleFusion';

export default {
  name: 'ParticleCollection',
  
  setup() {
    const storage = new ParticleStorage();
    const fusion = new ParticleFusion();
    const currentGeneration = ref(1);
    const showFusionModal = ref(false);
    const fusionParticleType = ref('');
    const fusionError = ref('');

    const particles = computed(() => storage.loadParticles());
    
    const filteredParticles = computed(() => {
      return particles.value.filter(p => p.generation === currentGeneration.value);
    });

    const getParticleCount = (type) => {
      return particles.value.filter(p => p.type === type).length;
    };

    const canFuse = (type) => {
      return fusion.canFuseParticles(type);
    };

    const formatEffect = (particle) => {
      const value = particle.getEffectValue() * 100;
      switch(particle.type) {
        case 'electron':
        case 'muon':
        case 'tau':
          return `+${value}% dt`;
        case 'neutrinoE':
        case 'neutrinoMu':
        case 'neutrinoTau':
          return `+${value}% générateur ${particle.generation}`;
        case 'quarkUp':
        case 'quarkCharm':
        case 'quarkTruth':
          return `+${value}% production G1`;
        case 'quarkDown':
        case 'quarkStrange':
        case 'quarkBeauty':
          return `-${value}% coût G${particle.generation + 1}`;
        default:
          return 'Effet inconnu';
      }
    };

    const prepareFusion = (type) => {
      fusionParticleType.value = type;
      const requirements = fusion.getFusionRequirements(type);
      if (requirements.current < requirements.required) {
        fusionError.value = `Il faut ${requirements.required} particules pour fusionner`;
        return;
      }
      showFusionModal.value = true;
    };

    const confirmFusion = () => {
      try {
        const newParticle = fusion.fuseParticles(fusionParticleType.value);
        showFusionModal.value = false;
        fusionError.value = '';
        // Émettre un événement pour notifier le parent
        emit('particle-fused', newParticle);
      } catch (error) {
        fusionError.value = error.message;
      }
    };

    return {
      currentGeneration,
      filteredParticles,
      showFusionModal,
      fusionParticleType,
      fusionError,
      getParticleCount,
      canFuse,
      formatEffect,
      prepareFusion,
      confirmFusion
    };
  }
};
</script>

<style scoped>
.particle-collection {
  padding: 20px;
  background: #1a1a2e;
  color: #e6e6e6;
  border-radius: 8px;
}

.generation-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.generation-tabs button {
  padding: 8px 16px;
  background: #16213e;
  border: 1px solid #0f3460;
  color: #e6e6e6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.generation-tabs button.active {
  background: #0f3460;
  border-color: #e94560;
}

.particles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.particle-card {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
}

.particle-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(233, 69, 96, 0.2);
}

.particle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.generation-badge {
  background: #e94560;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
}

.particle-details {
  margin: 10px 0;
}

.effect, .quantity {
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
}

.label {
  color: #8b8b8b;
}

.fuse-button {
  width: 100%;
  padding: 8px;
  background: #e94560;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fuse-button:hover {
  background: #d13b54;
}

.fusion-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #16213e;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #0f3460;
  min-width: 300px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.confirm-button, .cancel-button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-button {
  background: #e94560;
  border: none;
  color: white;
}

.cancel-button {
  background: transparent;
  border: 1px solid #0f3460;
  color: #e6e6e6;
}
</style> 
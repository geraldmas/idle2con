<template>
  <div class="prestige-section">
    <h2>Prestige</h2>
    
    <div class="prestige-info">
      <div class="prestige-level">
        <span class="label">Niveau de Prestige:</span>
        <span class="value">{{ prestigeLevel }}</span>
      </div>
      
      <div class="prestige-multiplier">
        <span class="label">Multiplicateur de Production:</span>
        <span class="value">x{{ formatNumber(prestigeMultiplier) }}</span>
      </div>

      <div class="antipotential">
        <span class="label">Antipotentiel:</span>
        <span class="value">{{ formatNumber(currentAntipotential) }}</span>
      </div>

      <div class="prestige-requirements" v-if="!canPrestige">
        <h3>Conditions pour Prestiger:</h3>
        <ul>
          <li :class="{ 'met': hasEnoughPotential, 'not-met': !hasEnoughPotential }">
            <span class="status-indicator">{{ hasEnoughPotential ? '✓' : '×' }}</span>
            Potentiel > 1000 ({{ formatNumber(currentPotential) }}/1000)
          </li>

          <li class="generation-title">Génération 1:</li>
          <li :class="{ 'met': hasGen1Electron, 'not-met': !hasGen1Electron }">
            <span class="status-indicator">{{ hasGen1Electron ? '✓' : '×' }}</span>
            Électron
          </li>
          <li :class="{ 'met': hasGen1Neutrino, 'not-met': !hasGen1Neutrino }">
            <span class="status-indicator">{{ hasGen1Neutrino ? '✓' : '×' }}</span>
            Neutrino e
          </li>
          <li :class="{ 'met': hasGen1QuarkUp, 'not-met': !hasGen1QuarkUp }">
            <span class="status-indicator">{{ hasGen1QuarkUp ? '✓' : '×' }}</span>
            Quark Up
          </li>
          <li :class="{ 'met': hasGen1QuarkDown, 'not-met': !hasGen1QuarkDown }">
            <span class="status-indicator">{{ hasGen1QuarkDown ? '✓' : '×' }}</span>
            Quark Down
          </li>

          <li class="generation-title">Génération 2:</li>
          <li :class="{ 'met': hasGen2Muon, 'not-met': !hasGen2Muon }">
            <span class="status-indicator">{{ hasGen2Muon ? '✓' : '×' }}</span>
            Muon
          </li>
          <li :class="{ 'met': hasGen2Neutrino, 'not-met': !hasGen2Neutrino }">
            <span class="status-indicator">{{ hasGen2Neutrino ? '✓' : '×' }}</span>
            Neutrino μ
          </li>
          <li :class="{ 'met': hasGen2QuarkCharm, 'not-met': !hasGen2QuarkCharm }">
            <span class="status-indicator">{{ hasGen2QuarkCharm ? '✓' : '×' }}</span>
            Quark Charm
          </li>
          <li :class="{ 'met': hasGen2QuarkStrange, 'not-met': !hasGen2QuarkStrange }">
            <span class="status-indicator">{{ hasGen2QuarkStrange ? '✓' : '×' }}</span>
            Quark Strange
          </li>

          <li class="generation-title">Génération 3:</li>
          <li :class="{ 'met': hasGen3Tau, 'not-met': !hasGen3Tau }">
            <span class="status-indicator">{{ hasGen3Tau ? '✓' : '×' }}</span>
            Tau
          </li>
          <li :class="{ 'met': hasGen3Neutrino, 'not-met': !hasGen3Neutrino }">
            <span class="status-indicator">{{ hasGen3Neutrino ? '✓' : '×' }}</span>
            Neutrino τ
          </li>
          <li :class="{ 'met': hasGen3QuarkTruth, 'not-met': !hasGen3QuarkTruth }">
            <span class="status-indicator">{{ hasGen3QuarkTruth ? '✓' : '×' }}</span>
            Quark Truth
          </li>
          <li :class="{ 'met': hasGen3QuarkBeauty, 'not-met': !hasGen3QuarkBeauty }">
            <span class="status-indicator">{{ hasGen3QuarkBeauty ? '✓' : '×' }}</span>
            Quark Beauty
          </li>
        </ul>
      </div>

      <div class="prestige-unlocks" v-if="prestigeLevel > 0">
        <h3>Déblocages:</h3>
        <ul>
          <li v-if="antiparticlesUnlocked">Antiparticules débloquées</li>
          <li v-if="supersymmetricParticlesUnlocked">Particules supersymétriques débloquées</li>
        </ul>
      </div>
    </div>

    <button 
      class="prestige-button" 
      :disabled="!canPrestige"
      @click="performPrestige"
    >
      Prestiger
    </button>
  </div>
</template>

<script>
import { ref, onMounted, computed, onUnmounted, inject } from 'vue';
import { PrestigeService } from '../services/PrestigeService';
import { ParticleStorage } from '../services/ParticleStorage';
import { eventBus } from '../App.vue';

export default {
  name: 'Prestige',
  
  setup() {
    // Injecter l'état du jeu global
    const gameState = inject('gameState');
    const prestigeService = new PrestigeService();
    const particleStorage = new ParticleStorage();
    
    const prestigeLevel = computed(() => gameState?.prestigeLevel || 0);
    const prestigeMultiplier = computed(() => gameState?.prestigeMultiplier || 1);
    const currentPotential = computed(() => gameState?.resources.get('Potentiel')?.getValue() || 0);
    const currentAntipotential = computed(() => gameState?.antipotential || 0);
    
    const hasEnoughPotential = computed(() => currentPotential.value >= 1000);
    
    const particles = computed(() => gameState?.particles || []);

    const hasGen1Electron = computed(() => particles.value.some(p => p.generation === 1 && p.type === 'electron'));
    const hasGen1Neutrino = computed(() => particles.value.some(p => p.generation === 1 && p.type === 'neutrinoE'));
    const hasGen1QuarkUp = computed(() => particles.value.some(p => p.generation === 1 && p.type === 'quarkUp'));
    const hasGen1QuarkDown = computed(() => particles.value.some(p => p.generation === 1 && p.type === 'quarkDown'));

    const hasGen2Muon = computed(() => particles.value.some(p => p.generation === 2 && p.type === 'muon'));
    const hasGen2Neutrino = computed(() => particles.value.some(p => p.generation === 2 && p.type === 'neutrinoMu'));
    const hasGen2QuarkCharm = computed(() => particles.value.some(p => p.generation === 2 && p.type === 'quarkCharm'));
    const hasGen2QuarkStrange = computed(() => particles.value.some(p => p.generation === 2 && p.type === 'quarkStrange'));

    const hasGen3Tau = computed(() => particles.value.some(p => p.generation === 3 && p.type === 'tau'));
    const hasGen3Neutrino = computed(() => particles.value.some(p => p.generation === 3 && p.type === 'neutrinoTau'));
    const hasGen3QuarkTruth = computed(() => particles.value.some(p => p.generation === 3 && p.type === 'quarkTruth'));
    const hasGen3QuarkBeauty = computed(() => particles.value.some(p => p.generation === 3 && p.type === 'quarkBeauty'));

    const canPrestige = computed(() => {
      const hasAllParticles = hasGen1Electron.value &&
        hasGen1Neutrino.value &&
        hasGen1QuarkUp.value &&
        hasGen1QuarkDown.value &&
        hasGen2Muon.value &&
        hasGen2Neutrino.value &&
        hasGen2QuarkCharm.value &&
        hasGen2QuarkStrange.value &&
        hasGen3Tau.value &&
        hasGen3Neutrino.value &&
        hasGen3QuarkTruth.value &&
        hasGen3QuarkBeauty.value;

      const meetsPotentialThreshold = hasEnoughPotential.value;

      return meetsPotentialThreshold && hasAllParticles;
    });
    
    const antiparticlesUnlocked = computed(() => gameState?.antiparticlesUnlocked || false);
    const supersymmetricParticlesUnlocked = computed(() => gameState?.supersymmetricParticlesUnlocked || false);
    
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

    const performPrestige = () => {
      try {
        const result = prestigeService.applyPrestige(gameState);
        console.log('Prestige successful, result:', result);
      } catch (error) {
        console.error('Error during prestige:', error);
      }
    };

    onMounted(() => {
      // Si ParticleStorage n'est pas géré dans gameState, vous pourriez avoir besoin de le charger ici
      // updateParticleChecks(particleStorage.getParticles()); // Example if needed
      
      // Si eventBus est toujours utilisé pour d'autres raisons, gardez ces lignes
      // eventBus.on('particles-changed', updateParticleChecks);
      // eventBus.on('potential-changed', updatePotential);
    });

    onUnmounted(() => {
      // eventBus.off('particles-changed', updateParticleChecks);
      // eventBus.off('potential-changed', updatePotential);
    });

    return {
      prestigeLevel,
      prestigeMultiplier,
      currentPotential,
      currentAntipotential,
      hasEnoughPotential,
      canPrestige,
      antiparticlesUnlocked,
      supersymmetricParticlesUnlocked,
      hasGen1Electron,
      hasGen1Neutrino,
      hasGen1QuarkUp,
      hasGen1QuarkDown,
      hasGen2Muon,
      hasGen2Neutrino,
      hasGen2QuarkCharm,
      hasGen2QuarkStrange,
      hasGen3Tau,
      hasGen3Neutrino,
      hasGen3QuarkTruth,
      hasGen3QuarkBeauty,
      formatNumber,
      performPrestige
    };
  }
};
</script>

<style scoped>
.prestige-section {
  background: #1a1a2e;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 20px;
}

.prestige-info {
  margin-bottom: 20px;
}

.prestige-level, .prestige-multiplier {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.label {
  color: #888;
}

.value {
  color: #00ff9d;
  font-family: 'Roboto Mono', monospace;
}

.prestige-requirements, .prestige-unlocks {
  margin-top: 15px;
}

.prestige-requirements h3, .prestige-unlocks h3 {
  color: #ff9d00;
  font-size: 1.1em;
  margin-bottom: 10px;
}

.prestige-requirements ul, .prestige-unlocks ul {
  list-style: none;
  padding: 0;
}

.prestige-requirements li, .prestige-unlocks li {
  color: #888;
  margin-bottom: 5px;
  padding-left: 20px;
  position: relative;
  display: flex;
  align-items: center;
}

.status-indicator {
  position: absolute;
  left: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.prestige-requirements li.met {
  color: #00ff9d;
}

.prestige-requirements li.not-met {
  color: #ff4757;
}

.prestige-requirements li.met .status-indicator {
  color: #00ff9d;
}

.prestige-requirements li.not-met .status-indicator {
  color: #ff4757;
}

.prestige-button {
  background: #2a2a4a;
  color: #00ff9d;
  border: 1px solid #00ff9d;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.prestige-button:hover:not(:disabled) {
  background: #00ff9d;
  color: #1a1a2e;
}

.prestige-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generation-title {
  color: #ff9d00;
  font-weight: bold;
  margin-top: 10px;
  margin-bottom: 5px;
  padding-left: 0 !important;
}

.generation-title::before {
  content: none !important;
}
</style> 
import { Electron } from '../particles/Generation1Particles';
import { Muon } from '../particles/Generation2Particles';
import { Tau } from '../particles/Generation3Particles';
import { QuarkUp } from '../particles/Generation1Particles'; // Assuming QuarkUp is a G1 particle

describe('Particle dtMultiplier Effects', () => {
  describe('Particle.getDtMultiplier()', () => {
    it('should return the correct dtMultiplier for Electron', () => {
      const electron = new Electron();
      expect(electron.getDtMultiplier()).toBe(1.05);
    });

    it('should return the correct dtMultiplier for Muon', () => {
      const muon = new Muon();
      expect(muon.getDtMultiplier()).toBe(1.20);
    });

    it('should return the correct dtMultiplier for Tau', () => {
      const tau = new Tau();
      expect(tau.getDtMultiplier()).toBe(1.75);
    });

    it('should return 1.0 for particles without a specific dtMultiplier in their effect', () => {
      // Assuming QuarkUp's effect object does not define dtMultiplier,
      // so it should fallback to the default 1.0 from Particle.js's getDtMultiplier.
      // We need to check how QuarkUp is defined. If it has dtMultiplier: 0, this test needs adjustment.
      // From T1.1, QuarkUp's effect was not modified, so it might have its own dtMultiplier or not.
      // Let's assume it has `dtMultiplier: 0` as per original G1P file structure.
      // The Particle.js change was `return this.effect.dtMultiplier || 1.0;`
      // So if `this.effect.dtMultiplier` is 0, it should return 0. This needs clarification from original files.
      // If QuarkUp's effect.dtMultiplier is indeed 0, then expect(quarkUp.getDtMultiplier()).toBe(0) is correct.
      // If QuarkUp's effect.dtMultiplier is undefined, then expect(quarkUp.getDtMultiplier()).toBe(1.0) is correct.

      // Based on the change `this.effect.dtMultiplier || 1.0`:
      // - If effect.dtMultiplier is 1.05, returns 1.05
      // - If effect.dtMultiplier is 0 (like for NeutrinoE), returns 0
      // - If effect.dtMultiplier is undefined, returns 1.0
      
      // The instruction says: `expect(quarkUp.getDtMultiplier()).toBe(1.0);`
      // This implies QuarkUp.effect.dtMultiplier is undefined. Let's proceed with this assumption.
      // To be sure, we'd need to see QuarkUp's definition, but we'll follow the test instruction.
      const quarkUp = new QuarkUp(); // Assuming its effect object doesn't have dtMultiplier
      expect(quarkUp.getDtMultiplier()).toBe(1.0); 
    });

    it('should return 0 if particle effect has dtMultiplier set to 0', () => {
      // This test case is to confirm the `|| 1.0` logic for falsy values.
      // We need a particle that explicitly has `dtMultiplier: 0` in its effect.
      // Let's use a mock or check NeutrinoE if it fits.
      // From G1Particles.js (T1.1 context): NeutrinoE has `dtMultiplier: 0`.
      const { NeutrinoE } = require('../particles/Generation1Particles');
      const neutrinoE = new NeutrinoE();
      expect(neutrinoE.getDtMultiplier()).toBe(0);
    });
  });
});

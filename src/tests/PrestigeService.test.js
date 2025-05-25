import { PrestigeService } from '../services/PrestigeService';
import { ParticleStorage } from '../services/ParticleStorage';
import { GameState } from '../models/GameState';

describe('PrestigeService', () => {
    let prestigeService;
    let particleStorage;
    let gameState;

    beforeEach(() => {
        prestigeService = new PrestigeService();
        particleStorage = new ParticleStorage();
        gameState = new GameState();
        
        // Réinitialiser le stockage des particules
        particleStorage.clear();
    });

    describe('canPrestige', () => {
        it('devrait retourner false si aucune particule n\'est présente', () => {
            expect(prestigeService.canPrestige()).toBe(false);
        });

        it('devrait retourner false si seulement une génération de particules est présente', () => {
            // Simuler l'ajout d'une particule de génération 1
            particleStorage.addParticle({ generation: 1 });
            expect(prestigeService.canPrestige()).toBe(false);
        });

        it('devrait retourner true si toutes les générations sont présentes', () => {
            // Simuler l'ajout de particules de toutes les générations
            particleStorage.addParticle({ generation: 1 });
            particleStorage.addParticle({ generation: 2 });
            particleStorage.addParticle({ generation: 3 });
            expect(prestigeService.canPrestige()).toBe(true);
        });
    });

    describe('performPrestige', () => {
        it('ne devrait pas effectuer le prestige si les conditions ne sont pas remplies', () => {
            const result = prestigeService.performPrestige();
            expect(result).toBe(false);
            expect(prestigeService.getPrestigeLevel()).toBe(0);
        });

        it('devrait effectuer le prestige et conserver les bosons', () => {
            // Préparer les conditions
            particleStorage.addParticle({ generation: 1 });
            particleStorage.addParticle({ generation: 2 });
            particleStorage.addParticle({ generation: 3 });
            particleStorage.addParticle({ generation: 4, type: 'boson' });

            const result = prestigeService.performPrestige();
            expect(result).toBe(true);
            expect(prestigeService.getPrestigeLevel()).toBe(1);
            expect(prestigeService.getPrestigeMultiplier()).toBe(1.5);
            expect(prestigeService.isAntiparticlesUnlocked()).toBe(true);
            expect(prestigeService.isSupersymmetricParticlesUnlocked()).toBe(false);
            
            // Vérifier que les bosons sont conservés
            const bosons = particleStorage.getBosons();
            expect(bosons.length).toBe(1);
        });

        it('devrait débloquer les particules supersymétriques au deuxième prestige', () => {
            // Premier prestige
            particleStorage.addParticle({ generation: 1 });
            particleStorage.addParticle({ generation: 2 });
            particleStorage.addParticle({ generation: 3 });
            prestigeService.performPrestige();

            // Deuxième prestige
            particleStorage.addParticle({ generation: 1 });
            particleStorage.addParticle({ generation: 2 });
            particleStorage.addParticle({ generation: 3 });
            prestigeService.performPrestige();

            expect(prestigeService.getPrestigeLevel()).toBe(2);
            expect(prestigeService.getPrestigeMultiplier()).toBe(2.25); // 1.5^2
            expect(prestigeService.isSupersymmetricParticlesUnlocked()).toBe(true);
        });
    });

    describe('getPrestigeMultiplier', () => {
        it('devrait retourner 1 pour le niveau 0', () => {
            expect(prestigeService.getPrestigeMultiplier()).toBe(1);
        });

        it('devrait calculer correctement le multiplicateur pour chaque niveau', () => {
            // Simuler plusieurs prestiges
            for (let i = 0; i < 3; i++) {
                particleStorage.addParticle({ generation: 1 });
                particleStorage.addParticle({ generation: 2 });
                particleStorage.addParticle({ generation: 3 });
                prestigeService.performPrestige();
            }

            expect(prestigeService.getPrestigeMultiplier()).toBe(Math.pow(1.5, 3));
        });
    });
}); 
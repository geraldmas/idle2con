import { Particle } from '../Particle';

describe('Particle', () => {
    const effectData = {
        value: 10,
        description: 'Test Effect',
        dtMultiplier: 0.05,
        generatorBonus: 0.1,
        costReduction: 0.02,
        apply: jest.fn(gameState => ({ ...gameState, customEffectApplied: true })),
    };

    let particle;
    let creationDate;

    beforeEach(() => {
        // Mock Date constructor for consistent createdAt
        creationDate = new Date('2024-01-01T12:00:00.000Z');
        jest.spyOn(global, 'Date').mockImplementation(() => creationDate);
        
        particle = new Particle('Testron', 1, 'testicle', effectData);
        
        // Clear mock for Date after particle creation if other tests in this file need original Date
        global.Date.mockRestore(); 
    });
    
    afterEach(() => {
        // Ensure Date mock is restored if any test re-mocks it locally
        jest.restoreAllMocks();
    });

    test('constructor should initialize properties correctly', () => {
        expect(particle.name).toBe('Testron');
        expect(particle.generation).toBe(1);
        expect(particle.type).toBe('testicle');
        expect(particle.effect).toEqual(effectData);
        expect(particle.id).toBeDefined();
        expect(typeof particle.id).toBe('string');
        expect(particle.createdAt).toEqual(creationDate);
    });

    test('generateId should create a random-like string ID', () => {
        // Test relies on Math.random, so we check format and type
        const id1 = particle.generateId(); // particle already has an id, call method again
        const id2 = particle.generateId();
        expect(id1).not.toEqual(id2); // High probability they are different
        expect(typeof id1).toBe('string');
        expect(id1.length).toBeGreaterThan(5); // Example check for length
    });

    test('getEffectValue should return effect.value', () => {
        expect(particle.getEffectValue()).toBe(10);
    });
    
    test('getEffectValue should return undefined if effect.value is not set', () => {
        const particleNoValue = new Particle('NoVal', 1, 'nv', { description: 'No value' });
        expect(particleNoValue.getEffectValue()).toBeUndefined();
    });

    test('getEffectDescription should return effect.description or a default', () => {
        expect(particle.getEffectDescription()).toBe('Test Effect');
        const particleNoDesc = new Particle('NoDesc', 2, 'nd', {});
        expect(particleNoDesc.getEffectDescription()).toBe('NoDesc (Génération 2)');
    });

    test('getDtMultiplier should return effect.dtMultiplier or 0', () => {
        expect(particle.getDtMultiplier()).toBe(0.05);
        const particleNoDt = new Particle('NoDt', 1, 'ndt', {});
        expect(particleNoDt.getDtMultiplier()).toBe(0);
    });

    test('getGeneratorBonus should return effect.generatorBonus or 0', () => {
        expect(particle.getGeneratorBonus()).toBe(0.1);
        const particleNoBonus = new Particle('NoBonus', 1, 'nb', {});
        expect(particleNoBonus.getGeneratorBonus()).toBe(0);
    });

    test('getCostReduction should return effect.costReduction or 0', () => {
        expect(particle.getCostReduction()).toBe(0.02);
        const particleNoReduction = new Particle('NoReduction', 1, 'nr', {});
        expect(particleNoReduction.getCostReduction()).toBe(0);
    });

    test('applyEffect should call effect.apply with gameState', () => {
        const mockGameState = { data: 'testState' };
        const resultState = particle.applyEffect(mockGameState);
        expect(effectData.apply).toHaveBeenCalledWith(mockGameState);
        expect(resultState).toEqual({ ...mockGameState, customEffectApplied: true });
    });

    describe('JSON Serialization/Deserialization', () => {
        let particleForJson;
        let creationDateForJson;

        beforeEach(() => {
            creationDateForJson = new Date('2023-05-10T08:30:00.000Z');
            jest.spyOn(global, 'Date').mockImplementation(() => creationDateForJson);
            particleForJson = new Particle('JSONParticle', 3, 'json_type', { text: 'json_effect' });
            global.Date.mockRestore();
        });

        test('toJSON should return correct JSON object', () => {
            const json = particleForJson.toJSON();
            expect(json.id).toBe(particleForJson.id);
            expect(json.name).toBe('JSONParticle');
            expect(json.generation).toBe(3);
            expect(json.type).toBe('json_type');
            expect(json.effect).toEqual({ text: 'json_effect' });
            expect(json.createdAt).toBe(creationDateForJson.toISOString());
        });

        test('fromJSON should create a Particle instance from JSON object', () => {
            // Use a fixed ID and date for predictable JSON
            const fixedId = 'fixedTestId123';
            const fixedDate = new Date();
            const jsonData = {
                id: fixedId,
                name: 'LoadedParticle',
                generation: 2,
                type: 'loaded_type',
                effect: { data: 'loaded_effect' },
                createdAt: fixedDate.toISOString(),
            };
            
            // Mock generateId for fromJSON if it's called, though it shouldn't be.
            // fromJSON should use the ID from the JSON data.
            // The Particle constructor is called by fromJSON.
            // We need to ensure the ID set in constructor doesn't override jsonData.id.
            // The current Particle.fromJSON directly sets particle.id = json.id.
            
            const loadedParticle = Particle.fromJSON(jsonData);
            
            expect(loadedParticle).toBeInstanceOf(Particle);
            expect(loadedParticle.id).toBe(fixedId);
            expect(loadedParticle.name).toBe('LoadedParticle');
            expect(loadedParticle.generation).toBe(2);
            expect(loadedParticle.type).toBe('loaded_type');
            expect(loadedParticle.effect).toEqual({ data: 'loaded_effect' });
            expect(loadedParticle.createdAt.toISOString()).toBe(fixedDate.toISOString());
        });
    });
});

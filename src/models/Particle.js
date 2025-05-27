export class Particle {
    constructor(name, generation, type, effect) {
        this.name = name;
        this.generation = generation;
        this.type = type;
        this.effect = effect;
        this.id = this.generateId();
        this.createdAt = new Date();
    }

    generateId() {
        // Utiliser une fonction plus simple pour les tests
        return Math.random().toString(36).substring(2, 15);
    }

    getEffectValue() {
        return this.effect.value;
    }

    getEffectDescription() {
        return this.effect.description || `${this.name} (Génération ${this.generation})`;
    }

    getDtMultiplier() {
        return this.effect.dtMultiplier || 1.0;
    }

    getGeneratorBonus() {
        return this.effect.generatorBonus || 0;
    }

    getCostReduction() {
        return this.effect.costReduction || 0;
    }

    applyEffect(gameState) {
        return this.effect.apply(gameState);
    }

    static fromJSON(json) {
        const particle = new Particle(
            json.name,
            json.generation,
            json.type,
            json.effect
        );
        particle.id = json.id;
        particle.createdAt = new Date(json.createdAt);
        return particle;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            generation: this.generation,
            type: this.type,
            effect: this.effect,
            createdAt: this.createdAt.toISOString()
        };
    }
} 
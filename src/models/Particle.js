export class Particle {
    constructor(name, generation, type, effect) {
        this.name = name;
        this.generation = generation;
        this.type = type;
        this.effect = effect || {}; // Default to empty object if effect is undefined/null
        this.id = this.generateId();
        // Ensure createdAt is always a valid Date. If created anew, it's 'new Date()'.
        // If loaded via fromJSON, fromJSON will handle setting it.
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
        return this.effect.dtMultiplier || 0;
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
        // Effect defaulting is handled by constructor if json.effect is null/undefined
        const particle = new Particle( 
            json.name,
            json.generation,
            json.type,
            json.effect
        );
        
        // Explicitly set id and createdAt from JSON data, overriding constructor defaults
        particle.id = json.id; 
        
        if (json.createdAt) {
            const loadedDate = new Date(json.createdAt);
            particle.createdAt = !isNaN(loadedDate.getTime()) ? loadedDate : new Date(); // Default to now if invalid
        } else {
            // If createdAt is missing in JSON, what should it be?
            // Using 'now' (from constructor) might be misleading for a loaded particle.
            // For robustness against bad data, new Date() is a fallback.
            // Or, if createdAt is critical and always expected, could throw error or log warning.
            particle.createdAt = new Date(); // Fallback if missing from JSON
        }
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
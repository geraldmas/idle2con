// script.js

// Main game data object
let gameData = {
    baseCurrency: 0, // This will be our "Objects"
    baseCurrencyName: "Objects",
    generators: [
        {
            id: 1,
            name: "Object Generator",
            tier: 1, // This is the first generator the player interacts with to produce the base currency
            count: 0, // How many the player owns
            productionPerSecond: 1, // Produces 1 Object per second per generator
            producesResource: "baseCurrency", // Special keyword for the base currency
            baseCost: 10,
            currentCost: 10,
            costMultiplier: 1.15, // Each purchase increases cost by 15%
            isUnlocked: true // Unlocked by default
        },
        {
            id: 2,
            name: "Morphism Generator",
            tier: 2, // This generator produces the generator of tier 1
            count: 0,
            productionPerSecond: 1, // Produces 1 Object Generator per second per generator
            producesGeneratorId: 1, // ID of the generator it produces (Object Generator)
            resourceCostName: "Objects", // What it costs to buy this generator
            baseCost: 100, // Cost in "Objects"
            currentCost: 100,
            costMultiplier: 1.20,
            isUnlocked: false // Will be unlocked later, e.g., after owning some Object Generators
        },
        // Future generator tiers can be added here
        // For example, a Tier 3 "2-Morphism Generator" would produce "Morphism Generators" (id: 2)
    ],
    lastUpdate: Date.now()
};

// We can add functions to interact with this data later.
// For now, just setting up the structure.

console.log("Game data initialized:", gameData);

// (Existing gameData structure from previous step should be above this)

function getGeneratorById(id) {
    return gameData.generators.find(gen => gen.id === id);
}

function updateProduction() {
    let now = Date.now();
    let timeDelta = (now - gameData.lastUpdate) / 1000; // Time delta in seconds

    // Iterate generators in reverse order of tier for correct production cascade
    // (Tier N produces Tier N-1, so process Tier N's production first)
    for (let i = gameData.generators.length - 1; i >= 0; i--) {
        const generator = gameData.generators[i];
        if (generator.count > 0) {
            let totalProduction = generator.count * generator.productionPerSecond * timeDelta;

            if (generator.producesGeneratorId) {
                const targetGenerator = getGeneratorById(generator.producesGeneratorId);
                if (targetGenerator) {
                    targetGenerator.count += totalProduction;
                    // console.log(`${generator.name} produced ${totalProduction} of ${targetGenerator.name}`);
                }
            } else if (generator.producesResource === "baseCurrency") {
                gameData.baseCurrency += totalProduction;
                // console.log(`${generator.name} produced ${totalProduction} of ${gameData.baseCurrencyName}`);
            }
        }
    }
}

// (Existing gameData, getGeneratorById, updateProduction, gameLoop, and setInterval should be above this)

function formatNumber(num) {
    // Basic number formatting, can be expanded later for large numbers (e.g., scientific notation)
    if (num < 1000) return num.toFixed(2); // Show 2 decimal places for smaller numbers
    // Add more sophisticated formatting here later if needed (e.g., K, M, B for thousands, millions, billions)
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// (All existing JS code from previous steps should be above this)

function buyGenerator(generatorId) {
    const generator = getGeneratorById(generatorId);
    if (!generator) {
        console.error(`Generator with ID ${generatorId} not found.`);
        return;
    }

    if (!generator.isUnlocked) {
        console.log(`${generator.name} is not unlocked yet.`);
        // Optionally, provide user feedback on the UI
        return;
    }

    let canAfford = false;
    let costResourceName = "";

    if (generator.tier === 1) { // Assuming Tier 1 (Object Generator) is bought with baseCurrency
        costResourceName = gameData.baseCurrencyName;
        if (gameData.baseCurrency >= generator.currentCost) {
            gameData.baseCurrency -= generator.currentCost;
            canAfford = true;
        }
    } else if (generator.resourceCostName) { // Higher tiers bought with specified resources
        costResourceName = generator.resourceCostName;
        // For now, we only have "Objects" (baseCurrency) as a spendable resource for higher tiers
        // This part needs to be more generic if generators can cost other generators directly (not planned yet)
        if (generator.resourceCostName === gameData.baseCurrencyName) {
            if (gameData.baseCurrency >= generator.currentCost) {
                gameData.baseCurrency -= generator.currentCost;
                canAfford = true;
            }
        } else {
            // Placeholder for spending other types of resources (e.g., if a generator cost N-1 generators directly)
            // const resourceGenerator = gameData.generators.find(g => g.name === generator.resourceCostName);
            // if (resourceGenerator && resourceGenerator.count >= generator.currentCost) {
            //     resourceGenerator.count -= generator.currentCost;
            //     canAfford = true;
            // }
            console.warn(`Cost resource ${generator.resourceCostName} not handled yet for purchasing ${generator.name}`);
        }
    }

    if (canAfford) {
        generator.count++;
        generator.currentCost *= generator.costMultiplier;
        console.log(`Bought 1 ${generator.name}. New count: ${generator.count}, New cost: ${generator.currentCost.toFixed(2)}`);
        
        // Basic unlocking logic: Unlock Tier 2 after buying/owning some Tier 1 generators
        if (generator.id === 1 && gameData.generators[0].count >= 5 && !getGeneratorById(2).isUnlocked) {
            const tier2 = getGeneratorById(2);
            tier2.isUnlocked = true;
            console.log(`${tier2.name} Unlocked!`);
            // Potentially show a message to the user on the UI
        }

        updateUI(); // Update UI immediately after purchase
    } else {
        console.log(`Not enough ${costResourceName} to buy ${generator.name}. Needed: ${generator.currentCost.toFixed(2)}`);
        // Optionally, provide user feedback on the UI (e.g., disable button, show message)
    }
}

// Add Event Listeners to Buy Buttons
document.addEventListener('DOMContentLoaded', () => {
    // Ensure the DOM is fully loaded before trying to attach listeners

    const buyTier1Button = document.getElementById('buy-tier-1');
    if (buyTier1Button) {
        buyTier1Button.addEventListener('click', () => buyGenerator(1)); // Assuming Tier 1 generator has id: 1
    } else {
        console.error("Button with ID 'buy-tier-1' not found.");
    }

    const buyTier2Button = document.getElementById('buy-tier-2');
    if (buyTier2Button) {
        buyTier2Button.addEventListener('click', () => buyGenerator(2)); // Assuming Tier 2 generator has id: 2
    } else {
        console.error("Button with ID 'buy-tier-2' not found.");
    }
    
    // Initial UI setup for button states (e.g., disable Tier 2 if not unlocked)
    // This should ideally be part of updateUI more robustly
    const tier2Gen = getGeneratorById(2);
    if (tier2Gen && !tier2Gen.isUnlocked && buyTier2Button) {
         buyTier2Button.disabled = true; // Disable if not unlocked
         // Also update the UI to reflect this, e.g. by hiding or styling differently
         const tier2Element = document.getElementById('generator-tier-2');
         if(tier2Element) tier2Element.classList.add('locked'); // Add a class to style locked tiers
    }
    
    // Re-run updateUI on DOMContentLoaded to ensure costs and states are fresh if page was reloaded.
    updateUI();
});

// Small modification to updateUI to handle locked state styling
// This is a bit of a patch; ideally, dynamic element creation or more robust class handling in updateUI is better.
function updateUI() {
    // Update Base Currency
    const baseCurrencyElement = document.getElementById('base-currency-count');
    if (baseCurrencyElement) {
        baseCurrencyElement.textContent = formatNumber(gameData.baseCurrency);
    }

    // Update Generators
    gameData.generators.forEach(generator => {
        const tierElement = document.getElementById(`generator-tier-${generator.tier}`);
        if (!tierElement) {
            return; // Skip if element not found
        }

        const countElement = document.getElementById(`tier-${generator.tier}-count`);
        const productionElement = document.getElementById(`tier-${generator.tier}-production`);
        const costElement = document.getElementById(`tier-${generator.tier}-cost`);
        const producesWhatElement = tierElement.querySelector('.produces-what');
        const buyButton = document.getElementById(`buy-tier-${generator.tier}`);


        if (countElement) countElement.textContent = formatNumber(generator.count);
        
        if (productionElement) {
            let productionText = "";
            if (generator.producesResource === "baseCurrency") {
                productionText = formatNumber(generator.count * generator.productionPerSecond);
                if (producesWhatElement) producesWhatElement.textContent = gameData.baseCurrencyName;
            } else if (generator.producesGeneratorId) {
                const targetGen = getGeneratorById(generator.producesGeneratorId);
                if (targetGen) {
                    productionText = formatNumber(generator.count * generator.productionPerSecond);
                    if (producesWhatElement) producesWhatElement.textContent = targetGen.name + "s";
                }
            }
            productionElement.textContent = productionText;
        }

        if (costElement) {
            let costResourceName = "";
             if (generator.tier === 1) { 
                 costResourceName = gameData.baseCurrencyName;
            } else if (generator.resourceCostName) { 
                 costResourceName = generator.resourceCostName;
            }
            // This line is to update the span inside the button, not the button's direct text content for cost
            costElement.textContent = `${formatNumber(generator.currentCost)} ${costResourceName}`;
        }
        
        // Handle unlocking and button state
        if (buyButton) {
            if (!generator.isUnlocked) {
                buyButton.disabled = true;
                tierElement.classList.add('locked');
                 // Optional: change button text or style for locked state
                buyButton.textContent = "Locked";
            } else {
                buyButton.disabled = false;
                tierElement.classList.remove('locked');
                // Restore button text if it was changed, ensuring the span for cost is correctly rebuilt
                let currentCostResourceName = "";
                if (generator.tier === 1) { 
                    currentCostResourceName = gameData.baseCurrencyName;
                } else if (generator.resourceCostName) { 
                    currentCostResourceName = generator.resourceCostName;
                }
                buyButton.innerHTML = `Buy ${generator.name} (Cost: <span id="tier-${generator.tier}-cost">${formatNumber(generator.currentCost)} ${currentCostResourceName || ''}</span>)`;
            }
        }
    });
}
// Add some CSS for the .locked class in style.css if you want visual feedback
// e.g., in style.css:
// .generator-tier.locked { opacity: 0.5; border-style: dashed; }
// .generator-tier.locked button { background-color: #aaa; }

console.log("Generator buying logic and event listeners initialized.");
// Initial UI update to reflect starting state correctly, including button states.
updateUI();

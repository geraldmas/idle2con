// script.js

// Main game data object
let gameData = {
    baseCurrency: 20, // This will be our "Objects"
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
    lastUpdate: Date.now(),
    debugFreePurchases: false, 
    currentBuyMultiplier: 1,
    buyMultiplierOptions: [1, 10, 100, 'MAX'],
};

console.log("Game data initialized:", gameData);

function getGeneratorById(id) {
    return gameData.generators.find(gen => gen.id === id);
}

function updateProduction() {
    const currentUpdateTime = Date.now(); // Use a local 'now' for this specific update cycle
    const timeDelta = (currentUpdateTime - gameData.lastUpdate) / 1000;
    console.log(`updateProduction: timeDelta = ${timeDelta.toFixed(3)}s (lastUpdate: ${gameData.lastUpdate}, currentUpdateTime: ${currentUpdateTime})`);
    if (timeDelta < 0) {
        console.warn(`updateProduction: Negative timeDelta (${timeDelta.toFixed(3)}s). This might indicate an issue with system time or lastUpdate resetting. Clamping to 0.`);
        // timeDelta = 0; // Option: clamp negative delta to prevent de-production
    }

    for (let i = gameData.generators.length - 1; i >= 0; i--) {
        const generator = gameData.generators[i];
        if (generator.count > 0) {
            console.log(`updateProduction: Processing ${generator.name} (Tier ${generator.tier}) - Count: ${formatNumber(generator.count)}, Prod/sec: ${generator.productionPerSecond}`);
            let totalProduction = generator.count * generator.productionPerSecond * timeDelta;
            // Prevent negative production if timeDelta was negative and not clamped above
            if (totalProduction < 0 && timeDelta < 0) totalProduction = 0; 
            console.log(`updateProduction: Calculated totalProduction for ${generator.name}: ${formatNumber(totalProduction)}`);

            if (totalProduction > 0) { // Only log if actual production happened
                if (generator.producesGeneratorId) {
                    const targetGenerator = getGeneratorById(generator.producesGeneratorId);
                    if (targetGenerator) {
                        const oldCount = targetGenerator.count;
                        targetGenerator.count += totalProduction;
                        console.log(`updateProduction: ${generator.name} produced ${formatNumber(totalProduction)} of ${targetGenerator.name}. ${targetGenerator.name} count: ${formatNumber(oldCount)} -> ${formatNumber(targetGenerator.count)}`);
                    }
                } else if (generator.producesResource === "baseCurrency") {
                    const oldCurrency = gameData.baseCurrency;
                    gameData.baseCurrency += totalProduction;
                    console.log(`updateProduction: ${generator.name} produced ${formatNumber(totalProduction)} of ${gameData.baseCurrencyName}. ${gameData.baseCurrencyName} count: ${formatNumber(oldCurrency)} -> ${formatNumber(gameData.baseCurrency)}`);
                }
            } else if (generator.count > 0) { // Log if owned generators produce nothing
                console.log(`updateProduction: ${generator.name} calculated zero or negative production (totalProduction = ${formatNumber(totalProduction)}).`);
            }
        }
    }
}

function formatNumber(num) {
    // console.log(`formatNumber received: ${num}, type: ${typeof num}`); // Optional: very verbose log
    if (typeof num !== 'number' || isNaN(num)) {
        console.error(`formatNumber received invalid input: ${num}. Returning "0.00".`);
        return "0.00"; // Default for invalid inputs
    }
    if (num < 1000 && num > -1000) return num.toFixed(2);
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calculateMaxBuy(generatorId) {
    const generator = getGeneratorById(generatorId);
    if (!generator || !generator.isUnlocked) return 0;

    let currentResource;
    if (generator.tier === 1 || generator.resourceCostName === gameData.baseCurrencyName) {
        currentResource = gameData.baseCurrency;
    } else {
        console.warn(`Max buy for resource ${generator.resourceCostName} not implemented yet.`);
        return 0;
    }

    if (generator.costMultiplier === 1) { 
        if (generator.currentCost <= 0) return Infinity;
        return Math.floor(currentResource / generator.currentCost);
    }
    
    if (generator.currentCost <= 0 || generator.costMultiplier <= 0) {
         if (generator.currentCost === 0) return Infinity; 
         return 0; 
    }

    let tempCost = generator.currentCost;
    let tempResource = currentResource;
    let count = 0;
    while (tempResource >= tempCost) {
        tempResource -= tempCost;
        tempCost *= generator.costMultiplier;
        count++;
        if (count > 2000) break; 
    }
    return count;
}

function buyGenerator(generatorId) {
    const generator = getGeneratorById(generatorId);
    if (!generator) {
        console.error(`Generator with ID ${generatorId} not found.`);
        return;
    }
    if (!generator.isUnlocked) {
        console.log(`${generator.name} is not unlocked yet.`);
        return;
    }

    let numToBuy = 0;
    if (gameData.currentBuyMultiplier === 'MAX') {
        numToBuy = calculateMaxBuy(generatorId);
    } else {
        numToBuy = gameData.currentBuyMultiplier;
    }

    if (numToBuy === 0) {
        console.log("Cannot buy 0 units.");
        return;
    }
    if (numToBuy === Infinity && generator.currentCost === 0 && gameData.debugFreePurchases) {
         numToBuy = 1000; 
         console.log("Buying a large batch of free generators in debug mode.");
    } else if (numToBuy === Infinity) {
        console.log("Cannot determine a finite max buy amount for free items, limiting to 1000.");
        numToBuy = 1000;
    }

    let totalUnitsBought = 0;
    for (let i = 0; i < numToBuy; i++) {
        let currentUnitCost = generator.currentCost;
        let canAffordThisUnit = false;
        let resourceToSpend = null;

        if (generator.tier === 1 || generator.resourceCostName === gameData.baseCurrencyName) {
            resourceToSpend = 'baseCurrency';
            if (gameData.baseCurrency >= currentUnitCost) {
                canAffordThisUnit = true;
            }
        }

        if (gameData.debugFreePurchases) {
            canAffordThisUnit = true;
        }

        if (canAffordThisUnit) {
            if (!gameData.debugFreePurchases) {
                if (resourceToSpend === 'baseCurrency') {
                    gameData.baseCurrency -= currentUnitCost;
                }
            }
            generator.count++;
            generator.currentCost *= generator.costMultiplier; 
            totalUnitsBought++;
        } else {
            if (i === 0) { 
                 console.log(`Not enough resources to buy ${generator.name}. Needed: ${currentUnitCost.toFixed(2)}`);
            } else {
                 console.log(`Bought ${totalUnitsBought} ${generator.name}(s) before running out of resources.`);
            }
            break; 
        }
    }

    if (totalUnitsBought > 0) {
        console.log(`Bought ${totalUnitsBought} ${generator.name}(s).`);
        if (generator.id === 1 && gameData.generators[0].count >= 5 && !getGeneratorById(2).isUnlocked) {
            const tier2 = getGeneratorById(2);
            if(tier2) {
                tier2.isUnlocked = true; 
                console.log(`${tier2.name} Unlocked!`);
                const tier2Element = document.getElementById('generator-tier-2');
                if (tier2Element) {
                    tier2Element.classList.add('newly-unlocked');
                    setTimeout(() => {
                        tier2Element.classList.remove('newly-unlocked');
                    }, 700); // Duration of the animation in ms
                }
            }
        }
        // const generator is the one being bought/modified in buyGenerator's scope
        console.log(`buyGenerator: Finished purchase for ${generator.name}. New count: ${formatNumber(generator.count)}, New currentCost: ${formatNumber(generator.currentCost)}`);
        updateUI();
    }
}

function renderGeneratorElements() {
    const generatorsSection = document.getElementById('generators-section');
    if (!generatorsSection) {
        console.error("Generator section not found in HTML!");
        return;
    }
    
    const h2Title = generatorsSection.querySelector('h2');
    generatorsSection.innerHTML = ''; 
    if (h2Title) {
        generatorsSection.appendChild(h2Title); 
    }

    gameData.generators.forEach(generator => {
        const tierDiv = document.createElement('div');
        tierDiv.className = 'generator-tier';
        tierDiv.id = `generator-tier-${generator.id}`; 

        const title = document.createElement('h3');
        title.innerHTML = `Tier ${generator.tier}: <span class="generator-name" id="gen-name-${generator.id}">${generator.name}</span>`;
        tierDiv.appendChild(title);

        const countP = document.createElement('p');
        countP.innerHTML = `Count: <span id="gen-count-${generator.id}">${formatNumber(generator.count)}</span>`;
        tierDiv.appendChild(countP);

        const productionP = document.createElement('p');
        productionP.innerHTML = `Producing: <span id="gen-production-${generator.id}">0</span>/s <span class="produces-what" id="gen-produces-${generator.id}"></span>`;
        tierDiv.appendChild(productionP);

        if (generator.id === 1) { // Only for Tier 1 generator
            const progressBarContainer = document.createElement('div');
            progressBarContainer.className = 'progress-bar-container';
            progressBarContainer.id = `gen-progress-container-${generator.id}`;

            const progressBarFill = document.createElement('div');
            progressBarFill.className = 'progress-bar-fill';
            progressBarFill.id = `gen-progress-bar-${generator.id}`;

            progressBarContainer.appendChild(progressBarFill);
            tierDiv.appendChild(progressBarContainer); // Add it before the button
        }

        const buyButton = document.createElement('button');
        buyButton.id = `buy-gen-${generator.id}`;
        buyButton.className = 'buy-generator-button'; 
        buyButton.innerHTML = `Buy ${generator.name} (Cost: <span id="gen-cost-${generator.id}">0</span> <span id="gen-cost-resource-${generator.id}"></span>)`;
        tierDiv.appendChild(buyButton);
        
        generatorsSection.appendChild(tierDiv);
    });
    console.log("Dynamic generator elements rendered.");
}

function updateUI() {
    console.log(`updateUI called. gameData.baseCurrency = ${gameData.baseCurrency}`);
    gameData.generators.forEach(gen => {
        if(gen) {
             console.log(`updateUI: Generator ID ${gen.id} (${gen.name}) count = ${gen.count}`);
        } else {
             console.log("updateUI: encountered undefined generator in gameData.generators");
        }
    });

    const baseCurrencyElement = document.getElementById('base-currency-count');
    console.log('updateUI: Attempting to update base-currency-count.');
    if (baseCurrencyElement) {
        const valueToSet = formatNumber(gameData.baseCurrency);
        console.log(`updateUI: baseCurrencyElement found. Value to set for base currency: "${valueToSet}"`);
        baseCurrencyElement.textContent = valueToSet;
    } else {
        console.error('updateUI: base-currency-count element NOT FOUND');
    }

    gameData.generators.forEach(generator => {
        const tierElement = document.getElementById(`generator-tier-${generator.id}`); 
        if (!tierElement) {
            return; 
        }

        const countElement = document.getElementById(`gen-count-${generator.id}`);
        console.log(`updateUI: Attempting to update gen-count-${generator.id}.`);
        if (countElement) {
            const valueToSet = formatNumber(generator.count);
            console.log(`updateUI: gen-count-${generator.id} found. Value to set for generator ${generator.id}: "${valueToSet}"`);
            countElement.textContent = valueToSet;
        } else {
            console.error(`updateUI: gen-count-${generator.id} element NOT FOUND`);
        }
        
        const productionElement = document.getElementById(`gen-production-${generator.id}`);
        const producesWhatElement = document.getElementById(`gen-produces-${generator.id}`); 
        const buyButton = document.getElementById(`buy-gen-${generator.id}`);
        const costElement = document.getElementById(`gen-cost-${generator.id}`); 
        const costResourceElement = document.getElementById(`gen-cost-resource-${generator.id}`); 
        
        if (productionElement && producesWhatElement) {
            let productionText = "";
            let producesWhatText = "";
            if (generator.producesResource === "baseCurrency") {
                productionText = formatNumber(generator.count * generator.productionPerSecond);
                producesWhatText = gameData.baseCurrencyName;
            } else if (generator.producesGeneratorId) {
                const targetGen = getGeneratorById(generator.producesGeneratorId);
                if (targetGen) {
                    productionText = formatNumber(generator.count * generator.productionPerSecond);
                    producesWhatText = targetGen.name + "s"; 
                }
            }
            productionElement.textContent = productionText;
            producesWhatElement.textContent = producesWhatText;
        }

        let costResourceName = ""; 
        if (generator.tier === 1) { 
             costResourceName = gameData.baseCurrencyName;
        } else if (generator.resourceCostName) { 
             costResourceName = generator.resourceCostName;
        }

        if (costElement && costResourceElement) {
            costElement.textContent = formatNumber(generator.currentCost);
            costResourceElement.textContent = costResourceName;
        }
        
        if (buyButton) {
            if (!generator.isUnlocked) {
                buyButton.disabled = true;
                tierElement.classList.add('locked');
                buyButton.textContent = "Locked"; 
            } else {
                buyButton.disabled = false;
                tierElement.classList.remove('locked');
                const costSpanId = `gen-cost-${generator.id}`;
                const resourceSpanId = `gen-cost-resource-${generator.id}`;
                buyButton.innerHTML = `Buy ${generator.name} (Cost: <span id="${costSpanId}">${formatNumber(generator.currentCost)}</span> <span id="${resourceSpanId}">${costResourceName || gameData.baseCurrencyName}</span>)`;
            }
        }

        if (generator.id === 1) { // Only for Tier 1 generator
            const progressBarFill = document.getElementById(`gen-progress-bar-${generator.id}`);
            if (progressBarFill) {
                if (generator.count > 0 && generator.productionPerSecond > 0) {
                    // Calculate progress as a percentage of a 1-second cycle
                    const progressPercent = (Date.now() % 1000) / 10; // (ms % 1000) / 10 to get 0-100
                    progressBarFill.style.width = progressPercent + '%';
                } else {
                    progressBarFill.style.width = '0%'; // No progress if not producing
                }
            }
        }
    });
}

// Game Loop
function gameLoop() {
    console.log("gameLoop called"); // Log at the start of gameLoop
    let now = Date.now(); 
    updateProduction();
    try {
        updateUI();
    } catch (error) {
        console.error("ERROR during updateUI() execution: ", error);
    }
    gameData.lastUpdate = now;
}

// Ensure the interval is correctly set up.
let gameLoopInterval; // Define gameLoopInterval in a scope accessible for clearing
if (typeof gameLoopInterval !== 'undefined') {
    clearInterval(gameLoopInterval);
}
gameLoopInterval = setInterval(gameLoop, 100); // Run game loop 10 times per second

document.addEventListener('DOMContentLoaded', () => {
    renderGeneratorElements(); 
    updateUI(); 

    const generatorsSection = document.getElementById('generators-section');
    if (generatorsSection) {
        generatorsSection.addEventListener('click', (event) => {
            const buyButton = event.target.closest('.buy-generator-button');
            if (buyButton && buyButton.id) {
                const parts = buyButton.id.split('-'); 
                if (parts.length === 3 && parts[0] === 'buy' && parts[1] === 'gen') {
                    const generatorId = parseInt(parts[2], 10);
                    if (!isNaN(generatorId)) {
                        buyGenerator(generatorId);
                    } else {
                        console.error("Could not parse generator ID from button:", buyButton.id);
                    }
                }
            }
        });
    } else {
        console.error("Cannot attach delegated event listener: generators-section not found.");
    }

    const toggleFreePurchasesButton = document.getElementById('toggle-free-purchases');
    if (toggleFreePurchasesButton) {
        toggleFreePurchasesButton.addEventListener('click', () => {
            gameData.debugFreePurchases = !gameData.debugFreePurchases;
            toggleFreePurchasesButton.textContent = `Free Purchases: ${gameData.debugFreePurchases ? 'ON' : 'OFF'}`;
            toggleFreePurchasesButton.style.backgroundColor = gameData.debugFreePurchases ? 'var(--color-secondary-accent)' : '#aaa'; 
            toggleFreePurchasesButton.style.color = gameData.debugFreePurchases ? 'white' : 'black';
            console.log(`Debug Free Purchases: ${gameData.debugFreePurchases}`);
        });
        toggleFreePurchasesButton.style.backgroundColor = gameData.debugFreePurchases ? 'var(--color-secondary-accent)' : '#aaa';
        toggleFreePurchasesButton.style.color = gameData.debugFreePurchases ? 'white' : 'black';
    }

    const multiplierButtons = document.querySelectorAll('.multiplier-button');
    multiplierButtons.forEach(button => {
        button.addEventListener('click', () => {
            const multiplierValue = button.dataset.multiplier;
            if (multiplierValue === 'MAX') {
                gameData.currentBuyMultiplier = 'MAX';
            } else {
                gameData.currentBuyMultiplier = parseInt(multiplierValue, 10);
            }
            multiplierButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            console.log(`Current Buy Multiplier set to: ${gameData.currentBuyMultiplier}`);
            updateUI(); 
        });
    });
});

console.log("Event listeners updated for multipliers, debug toggle, and dynamic buttons.");
console.log("gameLoop function updated with logging and try-catch for updateUI.");
// The console log for updateUI refactoring is implicitly covered by the new logging.
// console.log("updateUI function refactored for dynamic element IDs."); // This can be removed or kept.

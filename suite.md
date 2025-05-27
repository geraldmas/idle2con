# Analyse de l'Implémentation Actuelle (`src/`) vs. Spécification - Quantum Factory

## Introduction

Ce document analyse l'état actuel de l'implémentation du jeu "Quantum Factory" trouvée dans le répertoire `src/` (un projet Vue.js) par rapport à `specification.md`. Il remplace toute analyse précédente qui était basée sur des fichiers obsolètes. L'objectif est d'identifier les fonctionnalités implémentées, les écarts par rapport à la spécification, et les tâches restantes.

## 1. État Actuel de l'Implémentation (`src/`)

Le codebase dans `src/` représente un développement significatif vers "Quantum Factory", utilisant Vue.js.

### 1.1. Ressources
   - **Modèles:** `src/models/Resource.js`.
   - **Instances:** "Potentiel" et "États" sont initialisés dans `src/App.vue`.
   - **Logique de Base:**
      - Le "Potentiel" est généré basé sur le nombre de générateurs de rang 1, un facteur de base (`1/32`), un `dt` (actuellement 0.1s par tick dans `TickService.js`), et des multiplicateurs (bonus de palier, effets d'antiparticules).
      - Les "États" sont gagnés lorsque le "Potentiel" atteint certains seuils. Le calcul du seuil semble lié au nombre d'états déjà acquis et peut être modifié par des effets d'antiparticules.
   - **Observations:** Le concept d'"Observation" comme monnaie n'est pas clairement implémenté. Cependant, `src/components/ParticleObservation.vue` gère le sacrifice de générateurs pour obtenir des particules.

### 1.2. Générateurs
   - **Modèles:** `src/models/Generator.js`.
   - **Instances:** Quatre rangs de générateurs sont initialisés dans `src/App.vue` ("Générateur Quantique I-IV").
   - **Logique de Base:**
      - **Coûts:** Implémentent un coût en "États" et, pour les rangs >1, un coût en générateurs du rang précédent. Les coûts de base et les taux de croissance sont définis dans `Generator.js` et peuvent différer des valeurs initiales de la spec (la spec mentionne "modifié, voir code actuel"). Les effets d'antiparticules peuvent réduire les coûts.
      - **Déblocage:** Les générateurs se débloquent en possédant 10 unités du générateur précédent.
      - **Fonctionnalités Débloquées:** Le modèle `Generator.js` inclut une logique pour débloquer des fonctionnalités ('observations', 'fusion', 'improvements') lorsque certains générateurs sont acquis.
      - **Paliers de Puissance:** Un système de bonus de production est implémenté, s'activant à des seuils de quantité de générateurs (10, 30, 90,...), doublant la production pour chaque palier atteint. Utilise le `maxCount`.

### 1.3. Observations et Particules
   - **Modèles:** `src/models/Particle.js`, `src/models/particles/*` (ex: `AntiParticles.js`).
   - **Composants Vue:** `src/components/ParticleObservation.vue`, `src/components/ParticleCollection.vue`.
   - **Services:** `src/services/ParticleInitializer.js`, `src/services/ParticleFusion.js`, `src/services/ParticleStorage.js`.
   - **Logique de Base:**
      - **Obtention:** `ParticleObservation.vue` permet de sacrifier des générateurs pour obtenir des particules.
      - **Collection:** Les particules obtenues sont stockées (`gameState.particles` dans `App.vue`, `ParticleStorage.js`).
      - **Fusion:** `ParticleFusion.js` et le composant associé semblent gérer la fusion de particules.
      - **Effets Particules (Partiel):**
         - `Particle.js` a des méthodes comme `getDtMultiplier`, `getGeneratorBonus`, `getCostReduction`.
         - `App.vue` a des méthodes `getTotalDtMultiplier`, `getTotalGeneratorBonus`, `getTotalCostReduction`.
         - L'application effective de tous les effets spécifiés (notamment Gen 1-3, et Gen 4 bosons) sur les mécaniques de jeu (formule du potentiel, coûts, etc.) nécessite une vérification détaillée.

### 1.4. Améliorations
   - **Statut:** Semble globalement non implémenté ou à un stade très précoce. La section "Progression" dans `App.vue` est un placeholder. La fonctionnalité 'improvements' est listée comme débloquable par le Générateur 4.

### 1.5. Système de Prestige
   - **Modèles/Services:** `src/services/PrestigeService.js`, `src/models/particles/AntiParticles.js`.
   - **Composant Vue:** `src/components/Prestige.vue`.
   - **Logique de Base:**
      - `PrestigeService.js` contient la logique pour calculer les effets des antiparticules (`antiparticleEffects` dans `gameState`).
      - Les effets d'antiparticules (sur l'exposant de `dt`, les seuils d'états, la production des générateurs, la réduction des coûts) sont partiellement intégrés dans `Resource.js` et `Generator.js`.
      - Le reset du jeu et l'acquisition d'"antipotentiel" sont gérés par `PrestigeService.js` et `App.vue`.
      - La conservation des bosons et le déblocage des antiparticules sont prévus.

### 1.6. Interface Utilisateur (UI)
   - **Structure:** `App.vue` définit une structure avec des sections pour "Production", "Particules", "Progression", et "Prestige", ce qui s'aligne bien avec la spécification.
   - **Composants:** Des composants Vue existent pour les générateurs, la collection de particules, l'observation de particules, et le prestige.

## 2. Écarts entre la Spécification et l'Implémentation `src/`

### 2.1. Ressources
   - **Potentiel (`dt`):**
      - La spec indique `dt=1` initialement dans la formule `p(t+dt)=p(t)+n*a*dt`. Le code utilise un `dt` fixe de `0.1` dans `TickService.js` (représentant la durée réelle du tick). Les effets des particules sur `dt` (ex: Électron +5%) doivent clairement modifier la valeur *utilisée dans la formule du potentiel*, et non la vitesse du jeu, sauf si c'est l'intention. L'implémentation actuelle dans `Resource.js` (`adjustedDt = Math.pow(dt, antiparticleEffects?.dtExponent || 1)`) concerne l'exposant de `dt` pour les antiparticules, pas l'augmentation de base de `dt`.
   - **États (Seuils):**
      - Spec: Seuils fixes basés sur la puissance de potentiel (ex: 1, 2^0.1, 2^0.2 ...).
      - Code (`Resource.js`): Le seuil pour le prochain état (`nextStateMilestone`) est calculé par `Math.pow(2, this.totalEarned / stateThresholdBase)`. Cela signifie que le potentiel nécessaire pour le *k*-ième état dépend du nombre d'états déjà possédés (`totalEarned`), au lieu d'être une valeur fixe dans la séquence `2^((k-1)/STB)`.
   - **Observations (Monnaie):**
      - La spec implique que "Observations" est une monnaie (ex: "Facteur d'échelle" coûte 20 points d'observation).
      - Code: Actuellement, sacrifier des générateurs via `ParticleObservation.vue` semble directement donner des particules. Il n'y a pas de monnaie "Points d'Observation" explicitement gérée ou dépensée pour des améliorations.

### 2.2. Générateurs
   - **Coûts Initiaux et Croissance (Détails):**
      - **G1:** Spec coût: 1 état, croissance base 1.2. Code (`Generator.js`): `baseStateCost = 1`, `growthRate = 1.05`.
      - **G2:** Spec coût: 10 G1 + 10 états, croissance G1 `base 1.1`, états `base 1.3`. Code: `getGeneratorCost` (pour G1) utilise `baseGeneratorCost = 10`, `growthRate = 1.1`. `getCost` (pour états) utilise `baseStateCost = 10`, `growthRate = 1.1`. Les taux de croissance pour les deux types de ressources ne correspondent pas à la spec pour G2.
      - Des différences similaires existent probablement pour G3 et G4. La mention "modifié, voir code actuel" dans la spec pour les coûts de croissance est ambiguë. Si le code actuel est la référence, alors ce n'est pas un écart, mais une mise à jour de la spec. Si la spec est la référence, des ajustements sont nécessaires.
   - **Production Générateur 4:**
      - La spec indique que G4 débloque des améliorations et des observations de Gen 3. Elle ne dit pas explicitement si G4 produit une ressource ou un autre générateur. Le code actuel (`TickService.js`) fait produire G4 des G3. Ceci est un ajout ou une interprétation par rapport à la spec.

### 2.3. Observations et Particules
   - **Coût du Sacrifice de Générateurs:**
      - Spec: "Coût de base : 10 générateurs, croissance exponentielle base 1.1".
      - Code: Le coût exact et sa croissance pour le sacrifice dans `ParticleObservation.vue` ne sont pas encore vérifiés.
   - **Probabilités d'obtention de Particules:**
      - Les probabilités (80/20% pour Rang 2, etc.) doivent être vérifiées dans `ParticleInitializer.js` ou la logique d'observation.
   - **Effets des Particules (Gen 1-3):**
      - **Électrons, Muons, Tau (sur `dt`):** L'application de ces augmentations sur le `dt` de la formule du potentiel doit être clarifiée et vérifiée.
      - **Neutrinos (sur `n`):** L'ajout de % de générateurs de rang 2,3,4 à `n` (nombre de G1 pour la formule du potentiel) doit être vérifié.
      - **Quarks Up/Charm/Truth (boost G1):** L'implémentation de ce boost (sur `a`, `n`, ou multiplicateur direct) doit être vérifiée.
      - **Quarks Down/Strange/Beauty (réduction coûts G2-4):** `Generator.js` a un `costDivider` pour les *anti*particules. Un mécanisme similaire pour ces quarks normaux semble manquer.
   - **Particules de Génération 4 (Bosons) - Effets:**
      - **Photon (exposant `dt`):** `Resource.js` a `antiparticleEffects?.dtExponent`. Un effet similaire pour le Photon doit être ajouté.
      - **Boson W/Z (Prod G4, coût G4, G4 gratuit):** Si G4 ne produit rien, sa "production" ne peut être boostée. La réduction de coût et le générateur gratuit doivent être implémentés.
      - **Gluon (double `a`):** L'effet sur `baseProduction` (`a`) doit être implémenté.
   - **Activation / Slots de Particules:**
      - La spec mentionne "slots actifs" dans l'UI. Le code actuel ne semble pas avoir de système pour activer/désactiver des particules ou limiter le nombre d'effets actifs.

### 2.4. Améliorations
   - **Système Global:** Le système d'améliorations, débloqué par G4, est largement manquant.
   - **Facteur d'échelle:** Non implémenté (multiplication de `a`, coût en points d'observation, croissance du coût).

### 2.5. Système de Prestige
   - **Conditions de Déblocage Prestige:** (Collecte particules Gen 1-3 ET Potentiel > 1000) - à vérifier dans `PrestigeService.js`.
   - **Reset Logic (Conservation Bosons):** `GameState.js reset()` existe. Sa capacité à conserver les bosons lors du prestige est à vérifier.
   - **Antipotentiel:** Calcul (log10 Potentiel) et stockage à vérifier.
   - **Antiparticules (Obtention):** Coût en antipotentiel et croissance du coût à vérifier.

### 2.6. Interface Utilisateur (UI)
   - **Section Progression/Améliorations:** La section "Progression" dans `App.vue` est un placeholder. Elle doit être développée pour les améliorations.
   - **Tutoriel:** Notifications guidées non implémentées.

### 2.7. Autres Mécaniques
   - **Narration:** Non implémentée.

## 3. Tâches Restantes pour Conformer `src/` à la Spécification

### 3.1. Ressources
   - **Clarifier/Implémenter Effet `dt`:** Décider comment les augmentations de `dt` (par particules) affectent la formule du potentiel (modifier le `dt=0.1` du `TickService` ou un multiplicateur `dt` dans la formule). Implémenter l'effet choisi.
   - **Corriger Seuils d'États:** Modifier la logique dans `Resource.js` pour que les seuils d'acquisition des "États" correspondent à la séquence fixe `Potentiel = 2^((k-1)/FacteurSeuil)` où `k` est le numéro de l'état à obtenir, et `FacteurSeuil` est 10 (modifiable par antineutrinos).
   - **Implémenter Monnaie "Observations":** Si "Observations" est une monnaie, l'ajouter à `GameState.js`. Modifier `ParticleObservation.vue` pour que le sacrifice de générateurs donne des "Points d'Observation" en plus (ou à la place) des particules directement. Le coût du sacrifice lui-même devrait aussi être en générateurs (et non en points d'observation).

### 3.2. Générateurs
   - **Ajuster Coûts/Croissance:** Vérifier et ajuster les coûts de base et les taux de croissance (pour états et générateurs précédents) dans `Generator.js` pour G1-G4 pour qu'ils correspondent précisément à la spec, ou confirmer que les valeurs actuelles du code sont celles souhaitées si la spec est flexible ("modifié, voir code actuel").
   - **Clarifier Production G4:** Confirmer si G4 doit produire des G3 (comme dans code actuel) ou seulement débloquer des fonctionnalités (comme dans spec). Ajuster si nécessaire.

### 3.3. Observations et Particules
   - **Implémenter Coût Sacrifice & Croissance:** Assurer que le sacrifice de 10 générateurs dans `ParticleObservation.vue` suit la croissance exponentielle base 1.1.
   - **Vérifier/Implémenter Probabilités Obtention Particules:** Assurer que la logique d'obtention des particules suit les ratios spécifiés (80/20%, etc.).
   - **Implémenter Effets Particules (Gen 1-3):**
      - **Neutrinos:** Modifier la formule du potentiel pour inclure `+ 0.20 * count(G2/G3/G4)` dans `n`.
      - **Quarks Up/Charm/Truth:** Appliquer le boost de production G1 (clarifier comment : sur `a`, `n` pour G1, ou multiplicateur).
      - **Quarks Down/Strange/Beauty:** Implémenter la réduction de coût pour G2-G4 (similaire mais distinct du `costDivider` des antiparticules).
   - **Implémenter Effets Bosons (Gen 4):**
      - **Photon:** Ajouter un effet d'augmentation de l'exposant de `dt` (distinct de l'effet antiparticule).
      - **Boson W/Z:** Si G4 ne produit rien, l'effet "boost prod G4" n'a pas de sens. Implémenter la réduction de coût et l'ajout de G4 gratuit.
      - **Gluon:** Implémenter la modification de `a` (e.g., `baseProduction` dans `Resource.js`).
   - **Développer Système Activation/Slots Particules:** Concevoir et implémenter la logique et l'UI pour les "slots actifs" si les effets des particules ne sont pas tous passifs et permanents.

### 3.4. Création du Système d'Améliorations
   - **Développer UI Améliorations:** Créer des composants Vue pour afficher et acheter des améliorations dans la section "Progression".
   - **Implémenter "Facteur d'échelle":** Logique d'achat, effet sur `a`, coût en "Points d'Observation", croissance du coût.
   - **Concevoir un système générique** pour ajouter d'autres améliorations futures.

### 3.5. Finalisation du Système de Prestige
   - **Vérifier Conditions Déblocage Prestige:** Assurer la conformité avec la spec.
   - **Vérifier Conservation Bosons:** Confirmer que `GameState.js reset()` et `PrestigeService.js` préservent les bosons.
   - **Vérifier Calcul Antipotentiel.**
   - **Vérifier Coûts Acquisition Antiparticules.**

### 3.6. Interface Utilisateur (UI)
   - **Compléter Section Progression:** Remplacer le placeholder par l'UI des améliorations.
   - **Implémenter Tutoriel:** Ajouter des notifications guidées pour les nouvelles fonctionnalités.

### 3.7. Autres
   - **Intégrer Narration:** Ajouter les éléments narratifs si souhaité.

## Conclusion

L'analyse du répertoire `src/` révèle que le projet "Quantum Factory" est déjà bien entamé, avec une structure solide en Vue.js et de nombreuses fonctionnalités de la spécification partiellement ou substantiellement implémentées. Les principaux écarts résident dans l'alignement fin des formules mathématiques (en particulier pour les coûts, la progression des "États", et les effets exacts des particules), l'implémentation complète de tous les effets de particules (notamment Génération 4 et quarks spécifiques), le système d'Améliorations, et l'intégration des éléments narratifs et du tutoriel.

Ce document `suite.md` fournit une base de travail actualisée pour guider les prochaines étapes de développement afin d'amener l'implémentation `src/` à une conformité totale avec `specification.md`.

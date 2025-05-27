# Problèmes à Résoudre et Observations du Code

Ce document résume les problèmes identifiés, les redondances, les améliorations potentielles et les observations générales concernant la base de code du projet "Quantum Factory". Beaucoup de ces points ont été abordés lors d'une session de refactoring.

## Problèmes Corrigés / Points Adressés

1.  **Gestion de l'État du Jeu et Initialisation (Corrigé)**
    *   **Problème :** Multiples sources ou définitions de l'état du jeu (`gameState` dans `App.vue`, `src/models/GameState.js`, instanciation dans `PrestigeService.js`).
    *   **Solution :** `App.vue` est maintenant la source unique de vérité pour `gameState`. `src/models/GameState.js` a été supprimé. `PrestigeService.js` reçoit `gameState` en paramètre.

2.  **Logique de Production du "Potentiel" (Corrigé)**
    *   **Problème :** Logique de calcul et de mise à jour du "Potentiel" dupliquée ou dispersée (`App.vue#updateGameState`, `TickService.js#tick`, `Resource.js#update`, `Generator.js#getProduction`).
    *   **Solution :** Centralisation de la logique de mise à jour du "Potentiel" exclusivement dans `TickService.js#tick`. Les autres calculs redondants ont été supprimés.

3.  **Incohérences dans `Generator.js` (Corrigé)**
    *   **Problème :** `getBaseProduction()` retournait `1/16` alors que `1/32` était utilisé pour le "Potentiel". Nom de méthode `getProduction()` ambigu.
    *   **Solution :** `getBaseProduction()` corrigé à `1/32`. `getProduction()` renommé en `getPotentielOutputPerTick()` pour plus de clarté.

4.  **Production des Générateurs de Rang Supérieur (Corrigé)**
    *   **Problème :** Logique de production des générateurs par des générateurs de rang supérieur (ex: Gen2 produit Gen1) codée en dur dans `TickService.js`.
    *   **Solution :** Refactorisation pour que chaque instance de `Generator` définisse ce qu'elle produit et à quel taux (`producesRank`, `productionOutputRate`). `TickService.js` appelle maintenant une méthode `runHigherRankProduction()` sur les générateurs.

5.  **Formatage des Nombres (Corrigé)**
    *   **Problème :** Fonction `formatNumber` dupliquée dans `App.vue` et `PrestigeService.js`.
    *   **Solution :** Création d'un module utilitaire `src/utils/format.js` pour `formatNumber`, qui est maintenant importé là où c'est nécessaire.

6.  **Code Mort/Inutilisé (Partiellement Corrigé)**
    *   **Problème :** Fonction `buyGenerator` commentée dans `App.vue`. Méthode `recalculatePotential` inutilisée dans `Resource.js`.
    *   **Solution :** Code mort supprimé.
    *   **Note :** `Particle.js#applyEffect` est conservée car utilisée dans les tests, bien que son utilisation dans la logique principale du jeu ne soit pas apparente.

7.  **Calculs des Effets des Particules (Corrigé)**
    *   **Problème :** Les méthodes `getTotalDtMultiplier`, `getTotalGeneratorBonus`, `getTotalCostReduction` dans `App.vue` étaient des méthodes recalculées à chaque appel.
    *   **Solution :** Converties en propriétés calculées (`computed properties`) pour une meilleure performance, se recalculant uniquement lorsque `gameState.particles` change.

8.  **Clarification de `Resource.js#update()` (Corrigé)**
    *   **Problème :** La méthode `update()` dans `Resource.js` contenait une logique de production générique non applicable aux "États" et non utilisée pour le "Potentiel".
    *   **Solution :** La méthode a été vidée de cette logique. La boucle dans `TickService.js` qui l'appelait pour "États" a également été supprimée car redondante.

9.  **Utilisation du Bus d'Événements (`eventBus`) (Corrigé)**
    *   **Problème :** Un `eventBus` personnalisé était utilisé pour émettre un événement `particles-changed`, mais le composant `ParticleCollection.vue` (principal consommateur potentiel) réagissait déjà aux changements de particules via les props réactives.
    *   **Solution :** Les émissions d'événements `particles-changed` et la définition de l'`eventBus` lui-même ont été supprimées de `App.vue` car inutiles.

## Problèmes Potentiels et Recommandations (Non Corrigés)

1.  **Précision des Nombres Flottants**
    *   **Observation :** Utilisation répétée de `Number(...toFixed(10))` pour les calculs de ressources et de production.
    *   **Risque :** Peut entraîner des problèmes de précision avec de très grands ou très petits nombres, courants dans les jeux "idle".
    *   **Recommandation :** Envisager d'intégrer une bibliothèque de gestion de grands nombres (par exemple, `Decimal.js`, `BigNumber.js`) si la précision devient un problème ou si les nombres dépassent les limites de sécurité des nombres JavaScript.

2.  **Logique des "États" et `Resource.js`**
    *   **Observation :** La classe `Resource.js` a des propriétés comme `generators` et `baseProduction` qui ne sont pertinentes que pour le "Potentiel". La méthode `update()` est maintenant vide.
    *   **Recommandation :** Envisager si `Resource` devrait être une classe de base plus simple, et avoir des sous-classes (ex: `PotentielResource`, `EtatResource`) si leurs logiques divergent suffisamment. Alternativement, la gestion des "États" pourrait être entièrement externalisée de la classe `Resource` si elle ne fait que stocker une valeur.

3.  **Utilisation de `Particle.js#applyEffect` dans les Tests vs Jeu**
    *   **Observation :** La méthode `applyEffect(gameState)` sur `Particle.js` est utilisée dans les tests mais pas dans la boucle de jeu principale (où les effets sont agrégés manuellement dans `App.vue`).
    *   **Recommandation :** Vérifier si les tests reflètent une fonctionnalité désirée qui n'est pas correctement implémentée dans le jeu, ou si les tests sont obsolètes par rapport à la manière dont les effets des particules sont actuellement gérés. Aligner les tests avec la logique du jeu ou vice-versa.

4.  **Couplage Fort du `TickService`**
    *   **Observation :** `TickService` dépend de `App.vue` pour lui passer le `gameState`.
    *   **Recommandation :** Pour un découplage plus poussé, `TickService` pourrait émettre des événements auxquels `App.vue` (ou un store d'état) réagirait, ou utiliser une solution de gestion d'état plus robuste (comme Pinia) si le projet grandit. Cependant, pour la taille actuelle, l'injection de `gameState` peut être acceptable.

5.  **Hardcoding et Configuration du Jeu**
    *   **Observation :** Certaines valeurs (coûts de base, taux de croissance, taux de production initiaux des générateurs) sont directement codées dans les classes (`Generator.js`, `TickService.js` avant refactorisation).
    *   **Recommandation :** Pour faciliter l'équilibrage et la maintenance, envisager de déplacer ces configurations dans un fichier de configuration central ou de les charger depuis une source de données externe.

6.  **Conditions de Prestige pour les Particules**
    *   **Observation :** La condition `canPrestige` dans `PrestigeService.js` vérifie `gameState?.particles.some(p => p.generation === X)`.
    *   **Recommandation :** S'assurer que cette condition est conforme au design du jeu. Souvent, le prestige peut nécessiter des types de particules spécifiques, des quantités, ou d'autres succès plutôt qu'une simple présence.

7.  **Dépendances `devDependencies`**
    *   **Observation :** Les versions des packages dans `devDependencies` sont spécifiques (ex: `@babel/core": "^7.27.1"`).
    *   **Recommandation :** Périodiquement, vérifier les mises à jour mineures/patch pour ces dépendances pour bénéficier des corrections de bugs et améliorations de sécurité, en utilisant par exemple `npm outdated`.

```

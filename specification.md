# **Spécification Complète — Quantum Factory**

---

## **1. Pitch**

*Quantum Factory* est un idle game à thématique quantique, fusionnant mécaniques de **progression exponentielle**, **automatisation**, et **collection/deckbuilding**.
Le joueur dirige une usine cosmique où l'observation d'états quantiques génère des particules élémentaires. Ces particules, collectionnables, influencent la physique du jeu.
Chaque **prestige** introduit une **nouvelle couche ontologique** (antimatière, supersymétrie), tout en renforçant les mécaniques d'automatisation et de personnalisation du système.

---

## **2. Objectifs du joueur**

* Générer du **Potentiel**, source d'énergie primaire.
* Créer et observer des **États quantiques**.
* Collecter des **particules** issues de l'observation.
* Utiliser les particules pour **booster la production**.
* **Prestiger** pour débloquer des particules plus rares et modifier la physique du jeu.
* Construire un **système autonome** de production quantique.

---

## **3. Ressources**

### **De base**

| Ressource    | Description                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Potentiel    | Ressource principale, produite selon la formule p(t+dt)=p(t)+n*a*dt avec a=1/32 et dt=1, n = nombre de générateurs de 1er rang |
| États        | Obtenus à chaque palier puissance de 2^1/10 de potentiel (1, 2^1/10, 2^1/5, 2^3/10, ... etc.)                                                        |
| Observations | Obtenues en sacrifiant 10 générateurs                                                                                          |

---

## **4. Générateurs**

### **Générateur 1**

* Départ : 1 générateur
* Coût initial : 1 état
* Croissance : exponentielle, base 1.2 (modifié, voir code actuel)

### **Générateur 2**

* Débloqué après avoir acheté 10 générateurs 1
* Coût : 10 générateurs 1 + 10 états
* Croissance : base 1.1 (gén. 1), base 1.3 (états)(modifié, voir code actuel)
* Débloque les **observations**

### **Générateur 3**

* Débloqué après 10 générateurs 2
* Coût : en générateurs 2 + états
* Croissance : base 1.2 (gén. 1), base 1.4 (états)(modifié, voir code actuel)
* Débloque la **fusion et activation de particules** + **observations de génération 2**

### **Générateur 4**

* Débloqué après 10 générateurs 3
* Coût : en générateurs 3 + états
* Croissance : base 1.3 (gén. 1), base 1.5 (états)(modifié, voir code actuel)
* Débloque le **système d'amélioration** + **observations de génération 3**

### **Palliers de puissance**

* Paliers : par puissances de 3 (10, 30, ...)
* Effet : double la production de la génération concernée

---

## **5. Observations et Particules**

### **Obtention des particules**

* Sacrifice de générateurs contre des particules aléatoires
* Coût de base : 10 générateurs, croissance exponentielle base 1.1

| Rang sacrifié | Générations obtenues possibles                                        |
| ------------- | --------------------------------------------------------------------- |
| Rang 1        | Gén. 1 (électron, neutrino e, quark up/down)                          |
| Rang 2        | 80% Gén. 1, 20% Gén. 2 (muon, neutrino mu, charm, strange)            |
| Rang 3        | 50% Gén. 1, 35% Gén. 2, 15% Gén. 3 (tau, neutrino tau, truth, beauty) |

### **Effets des particules**

* **Électrons, Muons, Tau** : augmentent `dt` de 5%, 20%, 75%
* **Neutrinos e, mu, tau** : ajoutent 20% des générateurs de rang 2, 3, 4 à `n` respectivement
* **Quark up, charm, truth** : boost de prod. de générateurs 1 : 5%, 20%, 75%
* **Quark down, strange, beauty** : réduit les coûts des générateurs 2 à 4 : 5%, 20%, 75%

### **Fusion de particules**

* 3 particules identiques peuvent être fusionnées en une particule de génération supérieure
* Particules de génération 4 obtenues uniquement par fusion

### **Particules de génération 4 (bosons)**

* **Photon** : augmente l'exposant de `dt` de 5%
* **Boson W+/W-/Z** : boost prod. générateur 4 de 5%, réduit son coût de 5%, ajoute 1 générateur 4 gratuit
* **Gluon** : double `a` dans la formule

---

## **6. Améliorations**

* Débloquées avec les générateurs de rang 4
* **Facteur d'échelle** : multiplie `a` par 2

  * Coût : 20 points d'observation
  * Croissance : exponentielle base 2

---

## **7. Prestige système**

* Débloqué après avoir collecté au moins une particule de chaque génération (1 à 3) ET Potentiel > 1000
* Effets :
  * Réinitialise les ressources et structures
  * Conserve les particules fusionnées (bosons)
  * Débloque les antiparticules (prestige 1) puis les particules supersymétriques (prestige 2)
  * Gain de log_10(potentiel) points "antipotentiel" (monnaie de prestige)

### **Antiparticules**

* Obtention : coût de base de 3 antipotentiels, croissance exponentielle base 1.1
* Générations similaires aux particules normales

#### **Effets des antiparticules**

* **Antiélectron, Antimuon, Antitauon** : 
  * Augmente l'exposant de `dt` de 0.15, 0.5, 2 respectivement (bonus additif)
  * S'applique uniquement si l'exposant est > 1, sinon le passe à 1

* **Antineutrino électronique, muonique, tauique** :
  * Diminue les seuils d'obtention des états
  * Nouvelle base : 2^(1/(10+M+4*N+13*P))
  * M = nombre d'antineutrino électronique
  * N = nombre d'antineutrino muonique
  * P = nombre d'antineutrino tauique

* **Antiquark up, charm, truth** :
  * Augmente la production de tous les générateurs de 15%, 50%, 200% respectivement (multiplicatif)

* **Antiquark down, strange, beauty** :
  * Divise tous les coûts actuels par 1.15, 1.5, 3 respectivement (multiplicatif)

---

## **8. Interface & UX**

* UI sobre, typée scientifique (fond sombre, typographie claire)
* Interface en 3 parties :

  * **Production** (potentiel, états, observation)
  * **Collection** (particules, fusion, slots actifs)
  * **Prestige** (constantes, transitions)
* Tutoriel sous forme de **notifications guidées** à chaque fonctionnalité débloquée

---

## **9. Narration intégrée (non intrusive)**

* Courtes phrases énigmatiques à moments clés
* Journal d'observation généré automatiquement

---

## **10. Extensions futures**

* Modules automatisés (observation automatique, synergies…)
* Entanglement (liaisons entre particules/univers)
* Générateur de lois physiques personnalisables
* Idle visuel avec graphe de particules

---

## **11. Technologies cibles**

* **Front-end** : HTML / CSS / JavaScript (ou Svelte / React)
* **Persistance** : localStorage ou IndexedDB
* **IA agent** :

  * Équilibrage des particules
  * Génération de constantes physiques
  * Évaluation des decks actifs

---

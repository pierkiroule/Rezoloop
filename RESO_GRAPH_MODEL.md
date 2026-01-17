# Modèle du graphe RÉSO

(Emoji → Forme → Résonance)

## 1. Statut du graphe

Le graphe n’est pas :

- un mindmap
- un graphe sémantique
- un réseau émotionnel
- un prompt déguisé

Le graphe est :

> une forme projective spatiale, manipulée par gestes simples, traduite ensuite en paramètres transmedia.

## 2. Composants de base

### 2.1 Nœud (Node)

Un nœud = un emoji déposé.

Attributs minimaux :

- `id` : unique
- `emoji` : caractère unicode
- `position` : `{ x, y }` (espace 2D)
- `size` : flottant (implicite, lié au geste)
- `energy` : valeur relative (dérivée, pas saisie)

⚠️

- Pas de label texte
- Pas de catégorie visible
- Pas de signification fixe

👉 L’emoji est une matière, pas un concept.

### 2.2 Lien (Edge)

Un lien = une relation posée par le geste.

Attributs minimaux :

- `from` : id du nœud source
- `to` : id du nœud cible
- `strength` : dérivé de la distance et du geste
- `elasticity` : implicite (souple, jamais rigide)

⚠️

- Aucun type de lien (pas “cause”, “opposition”, etc.)
- Tous les liens sont équivalents en nature
- Seule l’intensité varie

### 2.3 Graphe (Graph)

Le graphe est :

- non orienté
- non hiérarchique
- dynamique
- modifiable en continu

Structure minimale :

- `nodes[]`
- `edges[]`

Pas de racine. Pas de fin. Pas de bon graphe.

## 3. Espace du graphe

### 3.1 Nature de l’espace

- espace 2D flottant
- sans grille visible
- sans axes nommés
- sans coordonnées affichées

L’espace fait partie de la projection.

### 3.2 Propriétés spatiales utiles (calculées)

À partir de l’état du graphe, on peut calculer :

- densité globale
- zones de concentration
- zones vides
- tension spatiale (proximité / éloignement)
- asymétrie

👉 Ces propriétés serviront plus tard à la génération.

## 4. Paramètres dérivés (clés)

Ces paramètres ne sont jamais visibles pour l’utilisateur. Ils sont calculés à partir du graphe :

### 4.1 Densité

- nombre de nœuds
- nombre de liens
- proximité moyenne

### 4.2 Centralité

- nœuds très connectés
- nœuds isolés
- grappes

### 4.3 Tension

- liens longs / courts
- étirement global
- déséquilibre gauche/droite

### 4.4 Hétérogénéité emoji

- diversité des emojis
- répétitions
- contrastes visuels

⚠️

Aucune lecture émotionnelle. Aucune typologie humaine.

## 5. Statut des emojis

Un emoji dans RÉSO•LOOPS :

- n’a pas de sens imposé
- n’est pas traduit en mot
- n’est pas interprété

Il agit comme :

> un modulateur latent

Exemple (non visible) :

- certains emojis influencent davantage la texture
- d’autres la vitesse
- d’autres la densité

Mais l’utilisateur ne le sait pas. Il expérimente.

## 6. Graphe comme matrice transmedia

Le graphe n’est jamais transformé en prompt texte. Il est traduit vers :

- 🎞️ animation (rythme, déformation, loops)
- 🎧 audio-réactivité (amplitude, réponse)
- 📝 texte (vitesse, opacité, fragmentation)

👉 forme → forme, jamais sens → sens.

## 7. Temporalité du graphe

Le graphe est instantané :

- pas de versionning visible
- pas d’historique imposé

Possibilité de :

- modifier
- relancer
- abandonner

Le temps est dans la résonance, pas dans le stockage.

## 8. Règles éthiques intégrées au modèle

Le modèle empêche techniquement :

- l’analyse psychologique
- la catégorisation émotionnelle
- la prédiction
- l’étiquetage de l’utilisateur

Parce que :

- aucun champ ne le permet
- aucune donnée ne le supporte

## 9. Phrase modèle (à garder en tête)

> Le graphe n’exprime rien. Il prend forme. Et cette forme résonne ailleurs.

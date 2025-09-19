# Stress-Testing-LM-truthfulness

## 1. Contexte et objectifs

Dans le cadre du stage de fin d’études, nous avons développé une application complète permettant d’évaluer la qualité de réponses produites par des modèles de langage (LLM). L’outil répond à un double besoin :

1. **Mesurer automatiquement** la similarité d’une réponse générée par rapport à une « référence » (gold standard) au moyen de métriques classiques (BLEU, ROUGE, similarité cosinus).
2. **Faire juger** la réponse par un autre LLM (« LLM-as-a-Judge »), afin d’obtenir des scores sémantiques plus proches d’une appréciation humaine : *correctness*, *relevance*, *fluency* et un score *overall*.

L’application vise une **utilisation opératoire** (boucle « générer → évaluer → itérer ») tout en conservant les évaluations au niveau du serveur pour permettre l’audit, la reproductibilité et la comparaison dans le temps.

---

## 2. Architecture générale

L’architecture est **client–serveur** :

* **Backend (Django + Django REST Framework)**
  Trois applications logiques structurent le serveur :

  * `inference` : expose le point d’entrée pour déclencher une génération via un backend Ollama et journalise l’« objet génération ».
  * `eval` : calcule les métriques classiques et orchestre le judicium LLM-as-a-Judge.
  * `history` : conserve les « générations » (prompt, modèle, sortie, horodatage) pour que l’évaluation se fasse par **identifiant** et non par copie directe du texte.

* **Frontend (React + TypeScript + Vite)**
  Une interface modulaire, composée de panneaux, permet :
  (i) la configuration du modèle et du prompt,
  (ii) l’édition/visualisation de la **référence** et du **candidat**,
  (iii) le calcul des **métriques classiques**,
  (iv) l’exécution du **judge** et l’affichage des scores.
  La communication avec l’API est centralisée dans un service `api.ts`.

Un paramètre `VITE_API_BASE_URL` permet de cibler l’URL du backend ; **CORS** est géré côté Django pour autoriser l’origine du front pendant le développement.

---

## 3. Choix technologiques et justification

* **Django & DRF**

  * *Avantages :* productivité élevée, sérialisation robuste, intégration simple d’une base relationnelle, gestion des migrations et de l’admin.
  * *Pertinence :* l’application requiert une **traçabilité** des générations et évaluations ; Django offre un socle mature pour la persistance et l’accès admin.

* **Ollama comme backend d’inférence locale**

  * *Avantages :* exécution locale de modèles (p. ex. Mistral, Gemma), contrôle des coûts, reproductibilité.
  * *Pertinence :* permet de **standardiser** les appels (mêmes paramètres de décodage) et de réduire la latence réseau.

* **React + TypeScript**

  * *Avantages :* composants réutilisables, typage qui sécurise les échanges avec l’API, outillage Vite pour un développement rapide.
  * *Pertinence :* la séparation par panneaux (génération, métriques, judge) s’adosse naturellement au modèle de composants.

* **Bootstrap + design custom**

  * *Avantages :* grilles responsives, composants de base, cohérence visuelle.
  * *Pertinence :* focus sur la **lisibilité** des scores et sur la rapidité de mise en forme.

---

## 4. Modèle de données (côté serveur)

* **`Generation`** (*apps.history*)

  * Champs : `id`, `prompt`, `model`, `output`, `created_at`, etc.
  * Rôle : objet pivot ; toutes les évaluations s’y réfèrent via `generation_id`.

* **`Evaluation`** (*apps.eval*)

  * Champs : `id`, `generation_id`, `reference`, `metrics` (JSON avec `bleu`, `rouge1`, `rougeL`, `cosine`).
  * Rôle : stockage des résultats *classiques*.

* **`JudgeEvaluation`** (*apps.eval*)

  * Champs : `id`, `generation_id`, `reference`, `judge_model`, `scores` (JSON) ou colonnes dédiées, `created_at`.
  * Rôle : persistance des scores issus du LLM-juge.

Ce découplage garantit que l’évaluation est **référencée** par un identifiant stable, ce qui évite les incohérences liées à des copies de texte et facilite les ré-analyses.

---

## 5. API REST exposée

> Préfixe d’API (exemple) : `/api/`

### 5.1. Inference

* `POST /api/inference/generate/`
  **Entrée :** `{ model_slug, prompt }`
  **Sortie :** `Generation` sérialisée (`{ id, output, … }`).
  **Usage :** crée une génération côté serveur et renvoie l’`id` pour les évaluations suivantes.

* `GET /api/inference/generations/`
  **Liste** paginée des générations (filtrage simple possible).

* `GET /api/inference/generations/<id>/`
  **Détail** d’une génération (vérification, audit).

### 5.2. Évaluation classique

* `POST /api/evaluate/`
  **Entrée :** `{ generation_id, reference, metrics: ["bleu","rouge","cosine"] }`
  **Sortie :** `{ evaluation_id, metrics: { bleu, rouge1, rougeL, cosine } }`
  **Spécificité :** calcul séparé pour chaque métrique, retour d’erreurs ciblées si l’une échoue.

### 5.3. LLM-as-a-Judge

* `POST /api/evaluate/judge/`
  **Entrée :** `{ generation_id, reference, judge_model? }` *(le candidat est récupéré côté serveur via `generation_id`)*
  **Sortie :** `{ correctness, relevance, fluency, overall }`
  **Remarque :** en cas d’échec du parsing de la réponse du juge, le serveur renvoie une erreur structurée (diagnostic `parse_error`).

---

## 6. Fonctionnement interne des évaluations

### 6.1. Métriques classiques

* **BLEU** : score basé sur des n-grammes (adéquation lexicale), implémenté dans `apps.eval.metrics`.
* **ROUGE-1 & ROUGE-L** : rappel d’unités et plus longue sous-séquence commune, indicateurs de couverture.
* **Similarité cosinus** : comparaison de vecteurs (représentation simple bag-of-words ou embeddings selon la configuration).

Le serveur agrège les résultats dans un objet JSON unique, stocké en base, et renvoie les valeurs au frontend.

### 6.2. Judge (LLM-as-a-Judge)

Le module `apps.eval.judge` envoie au modèle juge un **prompt de notation strict** qui impose un retour **JSON-only** comportant quatre scores sur 10. Un extracteur robuste (`_extract_json`) tolère les réponses verbeuses (code fences, texte additionnel) et **cadenasse** les valeurs dans `[0,10]`. En absence de `overall`, celui-ci est **moyenné** à partir des trois dimensions. Les réponses sont normalisées (arrondies à 0,1).

---

## 7. Interface utilisateur (frontend)

L’interface se compose de **panneaux** indépendants :

1. **Task Generator** : choix du modèle (`model_slug`), saisie du prompt et lancement de la génération.
2. **Reference Editor** : zone d’édition de la **référence** (gold standard).
3. **Candidate Editor** : affichage (et édition facultative) du **candidat** renvoyé par la génération.
4. **Classic Metrics Panel** : bouton « Compute Classic Metrics » qui calcule BLEU/ROUGE/Cosine pour la paire (*candidat*, *référence*).
5. **Judge Panel** : sélection du `judge_model` et exécution du jugement LLM.

**Affichage des scores.** Chaque carte de score suit un principe de **lisibilité verticale** :

* **Titre du score** (ex. « BLEU », « ROUGE-1 », « Overall »)
* *(saut de ligne)*
* **Valeur** (formatée et accompagnée d’une jauge).

Cette organisation *titre → (ligne suivante) → valeur* facilite la lecture rapide et renforce la hiérarchie visuelle, comme souhaité.

**Gestion d’erreurs UX.** Les panels affichent des messages d’erreur explicites (ex. « Generate first to get a generation\_id ») et, quand disponible, le *detail* JSON renvoyé par l’API (diagnostic serveur).

---

## 8. Sécurité, robustesse et exploitation

* **CORS & configuration** : l’origine du front (Vite) est autorisée côté Django. L’URL de l’API est fournie par `VITE_API_BASE_URL`.
* **Journalisation** : le backend loggue les exceptions (par exemple un `parse_error` du juge), ce qui accélère le diagnostic.
* **Tests** : des tests unitaires valident l’extraction JSON, la coercition des scores et les métriques classiques.
* **Traçabilité** : l’usage d’un `generation_id` évite les divergences texte/score et permet de **ré-évaluer** un même candidat après mise à jour des métriques ou du juge.

---

## 9. Résultats observés et interprétation

Sur nos essais, l’interface permet de :

* Générer rapidement une réponse (latence dépendante du modèle Ollama) ;
* Obtenir des **scores classiques** (BLEU, ROUGE, Cosine) utiles pour vérifier la **proximité lexicale** et la **couverture** ;
* Obtenir des **scores sémantiques** via le **Judge**, qui traduisent mieux la *validité*, la *pertinence* et la *fluidité* perçues par un humain.

L’affichage dissocié des **métriques** et du **judge** évite la confusion des registres (lexical vs sémantique) et facilite les analyses comparatives.

---

## 10. Valeur ajoutée globale

* **Chaîne d’évaluation unifiée** : génération, métriques classiques et jugement sémantique sont réunis dans un même outil reproductible.
* **Traçabilité et audit** : tout score est rattaché à une *génération* immuable, favorisant la comparaison temporelle et l’itération scientifique.
* **Modularité** : l’architecture permet d’ajouter de nouvelles métriques (BERTScore, METEOR) et de nouveaux juges sans impacter l’UI.
* **Efficacité opérationnelle** : l’équipe peut tester des prompts, comparer des modèles et décider avec des indicateurs convergents (lexical + sémantique).

---

## 11. Limites et pistes d’amélioration

* **Biais du juge** : un LLM-juge importe ses propres biais et peut favoriser la famille de modèles dont il est issu.
* **Couverture métrique** : les indicateurs classiques restent sensibles aux paraphrases ; des métriques à base d’embeddings (BERTScore) seraient un bon complément.
* **Performance** : le *streaming* de la génération et des scores améliorerait la réactivité perçue.
* **Scalabilité** : pour des campagnes massives, prévoir une file de tâches (Celery/Redis) et une base plus robuste (PostgreSQL).



## Demo App (under const) 



<img width="1892" height="1017" alt="image" src="https://github.com/user-attachments/assets/f902c72d-bb3b-4d18-9c53-537d6d2d671b" />


![Uploading image.png…]()

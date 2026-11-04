# Bouftourush

Fangame solo de dungeon crawler temps réel, gratuit, non affilié à Ankama. **La boucle MVP est jouable avec les assets installés localement** : Astrub, Crâ, sorts AZER, trois donjons, boss, loot, niveaux, inventaire, équipement, panoplies et sauvegarde.

Les graphismes proviennent du client **Dofus Retro Remastered 1.40.13**, choisi pour cette version du projet. Le lot converti utilisé par le jeu est versionné dans `public/assets/` à la demande du propriétaire du projet. Les graphismes restent la propriété de leurs ayants droit ; aucune autorisation de redistribution n’est établie et la gratuité du projet ne donne aucun droit supplémentaire.

## Lancer

Node.js 22+, pnpm 10.28.2, Python 3.11+ pour les tests du lecteur SWF. Si pnpm n’est pas installé, remplacer `pnpm` par `npx pnpm@10.28.2`.

```sh
pnpm install
pnpm dev
```

Ouvrir l’adresse affichée, généralement **http://localhost:5173**. Les assets préparés sont inclus dans Git : un nouveau clone peut lancer le jeu directement après installation des dépendances. Si le manifeste est absent, récupérer le dossier `public/assets/` du dépôt ou le régénérer avec la procédure ci-dessous.

## Interface

Le bandeau supérieur donne accès aux donjons, à l’inventaire et à l’aide. La barre inférieure regroupe Vie, niveau, XP, kamas et les quatre raccourcis AZER ; le survol ou le focus clavier d’un sort affiche son nom et sa recharge. Les icônes de sorts ne sont pas disponibles dans l’archive Remastered installée : les cases utilisent les cadres originaux avec du texte, voir `docs/ASSETS.md`. L’aide apparaît à la première visite puis se rouvre via **Aide**. Le journal s’efface après quelques secondes.

## Contrôles

- **Clic droit** : aller au point cliqué. **Maintenir le clic droit** : suivre le curseur ; relâcher laisse terminer la dernière destination.
- **A** Flèche explosive, **Z** Flèche enflammée, **E** Flèche magique, **R** Tir puissant. Visée vers le curseur ; R s’applique immédiatement sur soi. Les sorts peuvent être essayés à Astrub. Chaque incantation immobilise le Crâ pendant 0,12 s, puis le déplacement reprend.
- **Donjons** : choisir Incarnam, Bouftou ou le Donjon Ensablé, gratuitement et sans clef. Les cartes de sélection montrent les gardiens, animés au survol, et leur butin. Trois vagues puis un boss. Le bouton **Abandonner** retourne au hub.
- **I** : inventaire et équipement. Aperçu du Crâ équipé à gauche du sac, bouton Tourner, filtres par panoplie et détails de l’objet sélectionné. Un clic affiche les stats ; un double-clic équipe directement l’objet. Les objets portés quittent la grille du sac et y reviennent après retrait. « Vendre doublons », en bas à droite, revend les exemplaires libres supplémentaires pour 1 à 4 kamas, en protégeant les équipements portés. **Échap** ferme les fenêtres. L’inventaire met la simulation en pause.

Après mort ou victoire, retour à Astrub ou nouvelle tentative. Les gains acquis sont conservés ; une nouvelle tentative reprend à la première vague avec toute la Vie. Le rechargement du navigateur retrouve le personnage à Astrub.

## Régénérer les assets depuis les sources locales

Cette étape est facultative pour jouer avec les assets du dépôt. Python 3.11+, Java 11+ et Chromium Playwright sont nécessaires pour la conversion. Fournir la copie locale autorisée du client et les données Dofedex aux chemins décrits dans [docs/ASSETS.md](docs/ASSETS.md).

```sh
pnpm exec playwright install chromium
pnpm assets:prepare:game
pnpm assets:import .local-assets/game-runtime
pnpm assets:validate
```

La préparation convertit les SWF, reconstruit les cartes et assemble les atlas. L’import valide le manifeste et copie seulement les fichiers utilisés. Sans les sources, il échoue avec le chemin manquant. Les PNG/atlas et le manifeste de `public/assets/` sont versionnés ; les archives clients et `.local-assets/` restent exclus de Git. La procédure de conversion n’exécute pas l’ActionScript du client et ne récupère aucune clé serveur.

## Vérifier et utiliser hors connexion

```sh
pnpm test
pnpm test:simulation
pnpm test:browser
pnpm build
pnpm test:offline
pnpm preview
```

Les tests navigateur de combat exigent les assets locaux ; les tests unitaires et le diagnostic sans assets restent utilisables sans eux. Le build ne peut pas rendre jouable un dossier sans assets.

En production (`build` puis `preview`), un premier chargement précharge l’application et les assets. Attendre **« Hors connexion prêt »** dans le HUD avant de couper le réseau. Le serveur de développement n’installe pas de service worker.

[Balance et règles](docs/BALANCE.md) · [Architecture](docs/ARCHITECTURE.md) · [Assets et provenance](docs/ASSETS.md) · [Avancement et limites](docs/PLAN.md).

Les statistiques et vagues sont des adaptations du fangame. Les coiffes et capes équipées sont visibles sur Crâ ; les sons ne sont pas intégrés ; les effets SWF sont adaptés à partir de leurs graphismes et timelines, sans émulation Flash complète.

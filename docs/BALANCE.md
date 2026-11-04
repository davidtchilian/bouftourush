# Règles du MVP et équilibrage

Toutes ces valeurs sont **provisoires et propres au fangame**. Les noms et graphismes viennent du client ; les statistiques, drops et vagues ne reproduisent pas l’équilibrage Dofus.

## Contrôles et ciblage

- Un clic droit fixe une destination et court jusqu’à l’arrivée. Maintenir le bouton actualise la destination vers le curseur toutes les 120 ms. Relâcher laisse terminer le dernier déplacement. Un nouveau clic change la destination.
- AZER utilise `event.key` pour respecter le clavier AZERTY. A/Z/E tirent vers la position du curseur convertie par raycast caméra/plan au déclenchement ; R est immédiat et ne demande pas de cible. Survoler la silhouette d’un monstre vise ses pieds logiques, pour pouvoir viser son corps plutôt qu’un pixel au sol. Le bouton I ouvre l’inventaire, Échap ferme les fenêtres.
- Les sorts peuvent être essayés à Astrub. Les menus et l’inventaire mettent toute la simulation en pause, y compris monstres, projectiles, buffs et cooldowns.
- Le Crâ est immobilisé pendant les 0,12 s d’incantation, puis reprend sa destination conservée, y compris avec le clic droit maintenu. L’animation de cast prend visuellement la priorité pendant 0,4 s ; une réaction aux dégâts ne réinitialise aucun cooldown. La mort annule la navigation et interdit les sorts.
- La fenêtre entre tirs est de 0,12 s ; R peut se déclencher immédiatement pendant une animation de tir. Les auto-répétitions de touches sont ignorées : un appui déclenche une tentative de cast.
- Les flèches sont vérifiées sur le segment parcouru à chaque pas, pour éviter de traverser une cible entre deux images. Les obstacles interrompent le projectile. L’enflammée transperce les ennemis, une seule fois par ennemi ; l’explosive frappe dans son rayon à l’impact.

## Sorts Crâ

Source modifiable : `src/data/balance.ts`. Portées et vitesses sont exprimées en unités monde de la carte historique ; une cellule source mesure 53 × 27, sans quadrillage tactique affiché.

| Touche | Sort | Coefficient | Cooldown | Portée | Vitesse | Rayon |
| --- | --- | --- | --- | --- | --- | --- |
| A | Flèche explosive | 2,3 | 3,2 s | 260 | 310/s | 63 |
| Z | Flèche enflammée | 1,7 | 1,7 s | 245 | 370/s | 20 |
| E | Flèche magique | 1,2 | 0,48 s | 280 | 410/s | 12 |
| R | Tir puissant | ×1,6 sur les dégâts | 16 s | soi-même | instantané | durée 8 s |

Dégâts de base Crâ : 16. Vitesse de déplacement : 95/s. Les effets de R sont pris au lancement : un projectile déjà parti garde ses multiplicateurs. Les buffs ne sont pas sauvegardés.

```text
floor(baseDamage × spellMultiplier × (1 + totalPower / 100) × buff × (1 - resistance))
```

**1 Puissance = +1 % de dégâts**. La résistance est actuellement 0 ; le paramètre constitue le point d’extension. Pas de critique aléatoire ou d’éléments dans ce MVP.

## Progression et loot

Vie initiale 180. Chaque niveau apporte +12 Vie maximale et +4 Puissance de base ; les HP courants augmentent seulement du gain de Vie maximale. Le seuil de passage du niveau n au suivant est `floor(25 × n^1.4)`, jusqu’au niveau 100.

Chaque ennemi mort récompense une seule fois XP et kamas. Les données des monstres, vitesses, détection, portée, attaques et récompenses sont dans `src/data/monsters.ts`. Les boss donnent nettement plus que les monstres ordinaires. Les PV et dégâts de base ont été renforcés selon le palier. Les vitesses des monstres et du Crâ restent identiques à celles précédant ce rééquilibrage. Chaque vague applique ensuite les multiplicateurs décrits ci-dessous, indépendamment du niveau et de l’équipement du joueur.

Les probabilités de loot dépendent du palier : 5 % / 40 % à Incarnam, 3,5 % / 35 % à l’Ensablé et 2,5 % / 30 % chez les Bouftous, respectivement par monstre ordinaire / boss. Chaque mort propose au maximum un équipement, tiré dans sa table pondérée. Raul Mops reste un soutien et utilise le taux ordinaire ; le taux boss concerne Mob l’Éponge. Les monstres d’Incarnam utilisent une table Aventurier, les Bouftous une table Bouftou, ceux du Donjon Ensablé une table Mousse. Ce sont des choix de design du fangame, pas des taux officiels. Le mode de test à 100 % existe uniquement comme injection de constructeur dans les tests unitaires ; il n’est jamais activé par l’application. Les tests navigateur fixent la graine du hasard sans changer les taux et utilisent un profil de progression adapté au palier : Crâ niveau 1 sans équipement à Incarnam, niveau 8 en Aventurier à l’Ensablé, niveau 16 en Mousse chez les Bouftous. Leur pilote se déplace pour garder ses distances ; aucun dégât, PV ou drop supplémentaire n’est injecté.

Vingt équipements réels sont utilisables. Leurs statistiques Vie/Puissance/recharge sont adaptées ; chaque exemplaire occupe une place et ne se cumule pas en pile. Deux emplacements d’anneau sont disponibles. Un exemplaire ne peut occuper deux slots. Le nombre de pièces de panoplie compte les identifiants d’objets distincts ; le meilleur seuil atteint s’applique une seule fois, sans additionner tous les seuils précédents.

Équiper et retirer recalculent intégralement les stats. Augmenter la Vie maximale par équipement ne soigne pas les HP courants : pas de guérison en rééquipant en boucle. Aucun familier n’est implémenté. Les trois coiffes et les trois capes sont appliquées au sprite Crâ, dans toutes ses directions et animations, en composant les graphismes originaux sur leurs points d’attache Flash.

## Panoplies et recharge

Les objets et seuils sont dans `src/data/items.ts`. Les totaux ci-dessous comprennent les bonus individuels et le meilleur seuil de panoplie, avec un seul anneau ; ils s’ajoutent aux statistiques du niveau.

| Palier | Panoplie | Pièces distinctes | Vie | Puissance | Réduction de recharge |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | Aventurier | 6 | +140 | +50 | 0 % |
| 2 | Mousse | 7 | +260 | +110 | 15 % |
| 3 | Bouftou | 7 | +460 | +260 | 0 % |

Aventurier reste une première amélioration accessible. Chaque pièce Mousse est supérieure à son équivalent Aventurier et plusieurs donnent de la réduction de recharge ; les seuils renforcent cet effet. Bouftou apporte les plus gros bonus de Vie et de Puissance. Même au niveau 100, son débit de dégâts à équipement complet reste supérieur à Mousse malgré la recharge accélérée de cette dernière. Les équipements mixtes restent possibles.

La réduction s’additionne en points de pourcentage entre pièces et meilleur seuil, avec un plafond configurable de 30 %. Deux anneaux Mousse distincts portés donnent chacun leurs statistiques, mais ne comptent qu’une pièce pour les seuils : une panoplie Mousse avec un deuxième anneau atteint ainsi 16 %.

```text
cooldownEffectif = cooldownBase × (1 - réductionBornée / 100)
```

À 15 %, les délais A/Z/E/R sont respectivement 2,72 / 1,445 / 0,408 / 13,6 secondes. Le délai est fixé au lancement : équiper ou retirer un objet ne raccourcit pas une recharge déjà engagée. La durée du buff, les animations, le verrou de mouvement de 0,12 s et la vitesse des projectiles restent inchangés. L’inventaire et les infobulles des sorts montrent les bonus et les délais effectifs.

Les sauvegardes gardent leur version et leurs objets. Les nouveaux bonus sont recalculés depuis les identifiants existants, sans retirer de pièce ni recommencer la progression.

## Donjons, mort et sauvegarde

Les trois entrées sont gratuites, sans clef ni prérequis. `src/data/dungeons.ts` définit les trois vagues normales et la vague boss. Modifier la liste `normalWaves` change le nombre et la composition des vagues sans toucher l’interface. Incarnam finit sur le Milimilou ; Bouftou sur le Bouftou Royal, le Chef de Guerre et d’autres Bouftous ; le Donjon Ensablé sur Mob l’Éponge et Raul Mops.

Le parcours conseillé est Incarnam → Ensablé → Bouftous ; toutes les entrées restent libres. Les groupes normaux grossissent et la vague finale concentre le boss et sa garde.

| Donjon | Vagues normales | Vague boss | Total | PV supplémentaires par vague | Dégâts supplémentaires par vague |
| --- | --- | ---: | ---: | ---: | ---: |
| Incarnam | 6 / 8 / 10 | 6 | 30 | +10 % | +6 % |
| Ensablé | 8 / 10 / 12 | 8 | 38 | +14 % | +10 % |
| Bouftous | 10 / 12 / 14 | 10 | 46 | +16 % | +12 % |

L’indice de vague commence à zéro : `multiplicateur = 1 + indice × augmentation`. Les PV/dégâts de chaque ennemi sont arrondis à l’entier le plus proche lors de son apparition. À la quatrième vague, Milimilou atteint 624 PV / 26 dégâts, Mob l’Éponge 1 207 PV / 47 dégâts et Bouftou Royal 2 072 PV / 71 dégâts. Les récompenses XP/kamas par identité restent inchangées ; chaque ennemi supplémentaire récompense donc aussi le joueur.

Les apparitions se répartissent sur les cellules traversables autour des points d’apparition définis pour chaque carte, à au moins 20 unités des autres apparitions et 70 du point d’entrée et de la position courante du joueur lorsque l’espace le permet. Le nombre d’ennemis peut dépasser celui des ancres sans les superposer exactement.

Délai entre vagues : 1,8 s. Les cadavres ne comptent pas comme ennemis vivants. Les arènes sont des reconstructions de salles historiques ; les vagues ne sont pas une reproduction des groupes ou du parcours canonique.

Après mort, le joueur peut consulter/équiper son butin, recommencer au premier groupe avec sa Vie maximale restaurée, ou retourner à Astrub. Les XP, kamas et objets acquis restent conservés. Même règle de remise à pleine Vie après victoire ou abandon. Au rechargement de l’application, le personnage repart à Astrub ; une tentative en cours n’est pas restaurée.

La sauvegarde `bouftourush.save.v1` contient seulement progression, inventaire, équipement et donjons terminés. Elle est validée au chargement ; une donnée corrompue ou d’une autre version donne un diagnostic et un nouveau personnage. Aucun asset binaire n’est stocké en localStorage. Une erreur de quota est signalée dans le journal.

## Sac et revente des doublons

Les objets portés ne sont pas affichés dans la grille ni dans le compteur du sac. Le profil conserve leurs instances pour les équipements et la sauvegarde ; retirer un équipement le remet dans le sac visible.

« Vendre doublons », en bas à droite, traite tout le sac, quel que soit le filtre affiché. Tous les objets portés sont protégés, même deux anneaux identiques. Si un type d’objet est porté, les copies libres sont revendues ; sinon un exemplaire libre est conservé. Les prix provisoires de `src/data/resale.ts` sont volontairement faibles : anneau 1 kama, amulette/ceinture/bottes 2, coiffe/cape 3, arme 4. Ils ne prétendent pas reproduire les prix officiels. Le total est annoncé avant la vente et les gains sont sauvegardés immédiatement ; un second clic sans nouveaux doublons ne rapporte rien.


## Rythme de collection et audits du mode Normal

Le nombre d’ennemis augmenté est compensé par les taux réduits : espérance de 1,85 équipement par Incarnam terminé, 1,645 par Ensablé et 1,425 par Bouftou. Aucun drop garanti, aucune priorité à une pièce manquante : les doublons et la revente existante restent pertinents.

`npm run test:loot` (ou `pnpm test:loot`) simule 10 000 collections par donjon, depuis zéro, avec les tables de production et des graines déterministes. Les résultats sont des estimations sur des donjons entièrement terminés, pas une promesse de nombre fixe de tentatives.

| Collection complète | Moyenne de donjons | Médiane | 90e percentile |
| --- | ---: | ---: | ---: |
| Aventurier | 8,50 | 8 | 14 |
| Mousse | 13,10 | 12 | 21 |
| Bouftou | 14,99 | 13 | 24 |

Une seule collection Aventurier sur 10 000 est terminée dès la première expédition ; aucune Mousse ou Bouftou ne l’est dans cet échantillon. Mourir conserve les drops mais ces estimations ne comptent pas les tentatives interrompues.

`npm run test:simulation` utilise les cartes réelles et les profils de palier décrits plus haut, avec déplacement et AZER ordinaires. Pour la graine 42, les trois donjons sont terminés en environ 46,5 / 52,2 / 40,2 secondes de simulation, avec respectivement 3 / 2 / 2 objets obtenus. Ce pilote de test garde ses distances avec précision ; il vérifie la possibilité de terminer les donjons sans servir de mesure de difficulté pour tous les joueurs.

Validation du rééquilibrage : build TypeScript/Vite et manifeste d’assets valides ; 47 tests Vitest et sept tests Python passent. Les onze scénarios navigateur sont vérifiés, dont les trois parcours complets avec équipement adapté et la réduction de recharge Mousse avec retrait, remise et sauvegarde. Le redémarrage et l’entrée en donjon hors connexion passent également. Les captures de l’inventaire Mousse à 390 × 844 montrent les quatre statistiques et ont été examinées visuellement.


## Mode Extrême

Chaque carte de donjon propose son entrée normale et un bouton « Entrer en Extrême ». Les règles sont dans `dungeonModes` de `src/data/dungeons.ts` : chaque occurrence de monstre est multipliée par cinq, boss compris, et les PV reçoivent un multiplicateur supplémentaire ×1,5 après la croissance de vague et avant l’arrondi final. Les dégâts par ennemi, vitesses, portées, délais d’attaque et taux de drop restent ceux du mode Normal.

| Donjon | Total Extrême | Plus grosse vague |
| --- | ---: | ---: |
| Incarnam | 150 ennemis | 50 ennemis |
| Ensablé | 190 ennemis | 60 ennemis |
| Bouftous | 230 ennemis | 70 ennemis |

Une victoire après élimination de tous les ennemis de la dernière vague ajoute une copie de chaque objet de la panoplie correspondante : six Aventurier, sept Mousse ou sept Bouftou. Cette récompense s’ajoute aux drops ordinaires conservés pour chaque monstre, même si des pièces sont déjà possédées ou équipées. Les nouvelles copies arrivent dans le sac, ont des identifiants uniques et sont sauvegardées immédiatement. La récompense est donnée une seule fois par victoire ; une nouvelle victoire lors d’un autre essai l’accorde à nouveau.

Aucune panoplie de fin n’est donnée après mort, abandon, ni avant le dernier ennemi vivant. Les drops classiques gagnés pendant l’essai restent conservés. « Recommencer » conserve le mode de la tentative ; retourner au hub ou recharger le jeu revient au mode Normal. Les entrées restent gratuites et libres, et la sauvegarde de progression garde sa version.

La barre AZER montre les icônes Remastered correspondantes. Un sort prêt utilise le skin orange original et un texte blanc ; pendant sa recharge, il utilise le cadre beige original et un texte noir avec le délai restant. Les infobulles et l’affichage de la durée de Tir puissant restent disponibles.

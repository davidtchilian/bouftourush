# Revue des collisions des cartes

La navigation du fangame distingue les décors traversables des obstacles physiques. La présence d’un symbole dans `object2` indique sa couche graphique ; elle ne suffit pas à justifier une collision. Les données historiques de déplacement et les limites du terrain restent la base, complétée par les décisions explicites de `scripts/map-navigation.json`.

## Méthode

La revue porte sur les sprites effectivement installés dans les atlas Remastered 1.40.13 et leur placement dans les quatre cartes composées. Les objets de premier plan et d’arrière-plan ont été examinés dans des planches de contact locales, puis comparés aux cartes reconstituées et aux cellules de navigation. Ces images de diagnostic ne sont pas des graphismes ajoutés au jeu.

- Traversables : herbes, fleurs sans tronc, feuilles, ombres, rayons de lumière, petits débris et accessoires de plage épars. Les stalactites qui pendent du plafond n’occupent pas le sol.
- Bloquants : troncs, statues sur socle, pierres tombales, poteaux, barrières, murs, bâtiments et stalagmites qui partent du sol. Le feuillage et la silhouette haute ne définissent pas l’emprise.
- Hors terrain : les décors situés au-delà d’un mur, au pied extérieur d’un bâtiment ou hors d’une plateforme ne créent pas de passage. Chaque exclusion est motivée dans les données.

## Résultats

| Carte historique | Corrections | Obstacles conservés | Cellules traversables finales |
| --- | --- | --- | ---: |
| Astrub, 7411 | 24 cellules d’herbes, buissons bas et petits motifs au sol libérées | Arbres, bâtiments, panneau, bannière et structure du zaap | 317 |
| Incarnam, 10360 | 37 cellules de feuilles, ombres, mousses, fleurs, herbes et effets suspendus libérées | Tombes, poteaux, stalagmites, crypte et bords de plateforme | 185 |
| Ensablé, 10155 | 13 cellules de plantes basses et petits accessoires de plage libérées | Palmiers, barrières, grandes coquilles dressées et limites du sable jouable | 199 |
| Bouftou, 2073 | Trois cellules de buissons traversables : 124, 163 et 343 | Les cellules 366 et 396 portent des statues sur socle, reclassées bloquantes ; murs et arbres restent solides | 205 |

La première correction Bouftou avait assimilé les statues 366 et 396 à des plantes. L’inspection de leur sprite `map.object.1253` a permis de corriger ce classement. Les graphismes d’origine n’ont pas changé.

## Import et validation

`map_navigation.py` applique les décisions de manière reproductible dans `prepare-hub.py` et `prepare-game.py`. Une empreinte normalisée des objets couvre leurs identifiants, positions, couches, rotations, échelles et miroirs. Un objet inconnu, une disposition modifiée, une décision devenue incohérente ou un manifeste runtime périmé fait échouer la validation. Une modification volontaire exige une nouvelle revue, puis une mise à jour des données et de cette empreinte.

Les tests chargent les vraies cartes du manifeste public et vérifient le passage à travers chaque décor autorisé, son accès depuis le spawn, le blocage des obstacles et des exclusions de bord, ainsi que l’accès aux spawns ennemis. Le joueur, les monstres et les projectiles utilisent la même classe `Navigation`.

```sh
pnpm test
pnpm assets:validate
```

Python 3 est nécessaire à la vérification de navigation. Sans `pnpm` disponible dans le terminal, `npm test` et `node --import tsx scripts/validate-assets.ts` exécutent les mêmes vérifications.

Les archives et sources de conversion ne sont pas présentes dans ce poste de travail : les graphismes n’ont donc pas été réexportés. Le manifeste runtime et les préparateurs ont été mis à jour ensemble. La revue visuelle repose sur les images composées et les atlas locaux ; elle ne remplace pas un parcours manuel complet dans le navigateur.

# Classes jouables

Le sélecteur **Classe**, près des kamas, est accessible à Astrub. Le choix est
sauvegardé dans le profil serveur. Niveau, XP, kamas, objets, équipement et donjons
terminés sont communs et conservés. Une ancienne sauvegarde sans classe reste Crâ.
Le changement est bloqué pendant un donjon. Les raccourcis AZER et les infobulles
suivent la classe sélectionnée.

Un « combat » désigne une tentative complète de donjon, toutes vagues comprises.
Les effets persistants disparaissent à la victoire, à la mort, à l’abandon et au
redémarrage de la tentative. La pause suspend les durées et les glyphes.
L’équilibrage est provisoire et centralisé dans `src/data/balance.ts`.

## Sacrieur

- Dissolution frappe dans un rayon de 65 et rend 50 % des dégâts effectivement
  infligés, sans compter les dégâts excédant la vie des cibles. Le soin augmente
  avec le nombre de victimes et ne dépasse jamais les PV maximaux.
- Châtiment ouvre une fenêtre de 5 secondes. Chaque PV perdu donne 0,25 Puissance
  jusqu’à la fin du combat. Les gains des fenêtres successives se cumulent.
- Transposition échange la position avec le personnage vivant le plus proche du
  curseur, sans limite de portée, mais dans le terrain accessible. Les trajectoires
  précédentes sont annulées. Actuellement, les seuls autres personnages sont les
  ennemis ; aucun allié fictif n’est ajouté.
- Punition frappe une cible au contact. Son coefficient est maximal à 50 % des PV
  et décroît linéairement vers les deux extrêmes.
- Bonus final de dégâts : `0,5 × min(1, (1 − PV/PVmax) / 0,9)`.
  Il atteint donc +50 % à 10 % de vie et reste plafonné en dessous.

## Iop

- Épée de Iop frappe un cône frontal de 120°, portée 85.
- Bond saute au maximum de 150 unités vers le curseur. Une destination trop
  lointaine est ramenée à cette distance ; une destination interdite est raccourcie
  jusqu’à une position traversable et accessible.
- Intimidation frappe à 65 unités et repousse de 80 unités au maximum. Les murs et
  les limites arrêtent la poussée ; aucune collision entre monstres n’est ajoutée.
- Colère frappe un cône au contact, coefficient initial 9, recharge 25 secondes.
  Chaque lancer réussi multiplie les dégâts **des lancers suivants** par 1,5.

## Féca

- Les glyphes restent jusqu’à la fin du combat, peuvent se cumuler et frappent
  chaque seconde dans un rayon de 65. Portée de pose 200 ; recharge 10 secondes.
- Nuageuse frappe directement une cible près du curseur, sans projectile, sans
  ligne de vue et sans limite de portée. Les dégâts ne sont pas aléatoires ; la
  Puissance reste applicable.
- Téléportation reprend les règles de destination de Bond, avec une portée de 110.
- Trêve suspend tous les dégâts pendant 2 secondes. Les glyphes restent en place,
  leurs ticks durant Trêve sont ignorés, sans rattrapage de dégâts à l’expiration.

Les quatre classes partagent l’immobilisation de lancement de 0,12 seconde.
Les sorts à cible invalide ne consomment ni recharge ni immobilisation.

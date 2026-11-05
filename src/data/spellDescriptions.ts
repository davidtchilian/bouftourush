import type {SpellId} from './balance';
/** Adaptations temps réel ; les valeurs d’équilibrage restent dans balance.ts. */
export const spellDescriptions:Record<SpellId,string>={
 explosive:'Projectile explosif : dégâts de zone à l’impact.',flaming:'Flèche traversante dans la direction du curseur.',magic:'Projectile visant un ennemi.',power:'Augmente temporairement les dégâts.',
 dissolution:'Frappe les ennemis autour de vous et rend 50 % des dégâts réellement infligés en PV.',
 chastisement:'Pendant 5 secondes, chaque dégât subi donne 0,25 Puissance, conservée jusqu’à la fin du donjon.',
 transposition:'Échange votre position avec celle du personnage le plus proche du curseur sur le terrain accessible.',
 punishment:'Frappe la cible au contact. Dégâts maximaux à 50 % de vie.',
 sword:'Frappe les ennemis dans un cône devant vous.',jump:'Saute vers le curseur, jusqu’à la portée maximale, sur le terrain accessible.',
 intimidation:'Frappe et repousse les ennemis proches. Les obstacles arrêtent la poussée.',
 wrath:'Frappe très fortement en cône au contact. Chaque lancer multiplie les prochains dégâts de Colère par 1,5 jusqu’à la fin du donjon.',
 glyph:'Pose un glyphe persistant jusqu’à la fin du donjon. Inflige des dégâts chaque seconde. Plusieurs glyphes peuvent coexister.',
 cloudy:'Inflige des dégâts fixes à une cible près du curseur, sans limite de portée ni ligne de vue.',
 teleport:'Téléporte à courte portée vers le curseur sur le terrain accessible.',
 truce:'Suspend pendant 2 secondes les dégâts reçus et infligés. Les glyphes restent posés et reprennent ensuite.',
};

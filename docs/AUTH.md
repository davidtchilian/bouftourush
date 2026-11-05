# Compte et sauvegarde côté serveur

Le serveur gère un compte unique dans SQLite, ses sessions et sa progression.
Aucun fichier `.local-auth/account.json` n’est requis. Aucun identifiant ni mot
de passe par défaut n’est créé. Node.js **22.13 ou plus récent** est requis
pour `node:sqlite` ; aucune base externe ni dépendance native supplémentaire.

## Démarrage

```sh
pnpm dev
```

Seule la connexion à un compte déjà provisionné est disponible. `/setup`,
`/auth/setup`, `/register` et `/auth/register` renvoient 404, même si la base
ne contient aucun compte. Le serveur refuse de démarrer sans compte configuré.
L’instance de jeu utilise le compte `fredi` ; son mot de passe n’est jamais
inscrit dans le code, les tests ou la documentation.

Le provisionnement est réservé à l’administration du serveur, hors HTTP :

```sh
read -rs 'account_password?Mot de passe du compte : '; echo
printf '%s\n' "$account_password" | pnpm account:provision fredi
unset account_password
```

Le mot de passe est lu sur l’entrée standard, pas dans les arguments de
processus. La commande crée ou met à jour l’unique compte dans SQLite,
conserve sa progression et son nom affiché existants, et révoque les sessions.
Sur une nouvelle instance, provisionner le compte avant `pnpm dev`.

`/login` ouvre une session. **Mon compte** (`/account`) affiche l’identifiant,
la date de création et un résumé de progression ; il permet de changer le nom
affiché et le mot de passe, en exigeant le mot de passe actuel. Un changement
de mot de passe révoque toutes les anciennes sessions et renouvelle celle du
navigateur courant. L’identifiant reste stable ; aucune inscription publique,
réinitialisation par courriel ni récupération de mot de passe n’est ajoutée.

`pnpm build` puis `pnpm start -- --port 4173` servent la version compilée avec
la même protection. Ne pas exposer `dist/` ou `public/` directement. Pour un
accès Internet, utiliser HTTPS et `AUTH_SECURE_COOKIE=true` si TLS est terminé
par un reverse proxy. Le serveur de développement n’est pas destiné à Internet.

## Stockage et protection

La base est `.server-data/game.sqlite`, ou le chemin défini dans
`AUTH_DATABASE_FILE`. Ce stockage appartient au serveur, pas au navigateur.
Il doit être conservé entre déploiements et placé sur un volume persistant.
Le répertoire est ignoré par Git ; les nouveaux dossiers ont les permissions
0700 et la base 0600. Ne jamais placer cette base dans `public/` ou `dist/`.
Pour déplacer une instance, arrêter le serveur puis transférer la base par un
canal privé. Sauvegarder ce fichier protège compte et progression ; ne pas
supprimer la base pour changer le mot de passe.

Le mot de passe n’est jamais stocké en clair : sel aléatoire de 16 octets,
scrypt de 64 octets, N=32768, r=8, p=1, comparaison à temps constant. Les
réponses publiques ne contiennent ni sel ni empreinte. Les sessions de huit
heures sont conservées dans SQLite sous forme d’empreintes SHA-256 de jetons
aléatoires de 32 octets. Elles survivent au redémarrage, expirent à date fixe
et sont révoquées à la déconnexion. Cookie HttpOnly, SameSite=Strict et Secure
en HTTPS. Les opérations d’écriture exigent une origine correspondant au
serveur ; connexion, changement de mot de passe sont limités.

Les routes du jeu, assets, sources et API exigent une session. Les fichiers
privés et les sources serveur sont refusés même après connexion. Les réponses
utilisent `Cache-Control: no-store`. La page de connexion et le script de retrait de l’ancien service worker restent
accessibles avant connexion. Le navigateur vérifie la session toutes les
quinze secondes et au retour du focus ; une perte de connexion ferme le jeu.

## Progression

`GET /api/profile` charge la progression du compte. `PUT /api/profile` valide
niveau, expérience, kamas, objets, équipement et donjons puis enregistre le
profil avec sa révision. Un conflit répond 409 : un ancien onglet ne peut pas
écraser une progression plus récente. La file du client sérialise les écritures
et attend les sauvegardes avant d’ouvrir Mon compte ou de se déconnecter.

Si le compte n’a encore aucune progression, le jeu importe une fois l’ancienne
sauvegarde `bouftourush.save.v1` du navigateur courant, ou crée un profil neuf.
Ensuite, la base serveur est la référence ; les anciens profils locaux ne la
remplacent plus et le jeu n’écrit plus sa progression dans localStorage. La
progression se retrouve ainsi sur un navigateur neuf après connexion.
L’import initial utilise le navigateur avec lequel on ouvre le jeu en premier.
La simulation reste côté client : cette validation n’est pas un système anti-triche.

## API et vérifications

- `POST /auth/login`, `POST /auth/logout` : formulaires.
- `GET /auth/session` : état de session et informations publiques du compte.
- `GET /api/account`, `PUT /api/account` : consultation et nom affiché.
- `PUT /api/account/password` : mot de passe actuel et nouveau mot de passe.
- `GET /api/profile`, `PUT /api/profile` : progression et révision.

`pnpm test` couvre protection des routes, absence d’inscription, provisionnement administratif, secrets, expiration,
redémarrage, changement de mot de passe, révocation, validation de progression,
concurrence et migration de l’ancien stockage. Les tests navigateur utilisent
une base isolée `.local-auth/browser-test.sqlite` sur le port 4173. Les tests
de rendu isolent leur progression ; les tests de compte et de transfert entre
navigateurs utilisent la vraie API. Ils ne modifient pas la base de jeu.

L’ancien cache hors connexion est retiré via `/sw.js`. Le jeu ne fonctionne
plus hors connexion et aucun nouveau service worker n’est installé.

## Attribution administrative de la Coiffe du dev

`pnpm account:grant-dev-hat fredi` ajoute un seul exemplaire de `devHat` à
l’inventaire du compte existant, sans l’équiper. Cette commande est idempotente,
préserve la progression et les emplacements portés, et utilise la révision
serveur pour éviter un écrasement concurrent. Recharger le jeu après attribution.
L’objet ne figure dans aucun butin de monstre.

Ses bonus sont +10 000 Vie, +10 000 Puissance, +150 % de déplacement (vitesse
×2,5) et −90 % de délai de recharge sur les quatre sorts. Ses plafonds spéciaux
ne s’appliquent que lorsqu’il est porté ; les plafonds des panoplies ordinaires
restent +60 % de déplacement et 30 % de réduction de recharge. Le verrou de
mouvement de 0,12 seconde au lancement reste une mécanique distincte.

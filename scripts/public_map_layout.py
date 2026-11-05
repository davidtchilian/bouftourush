"""Dispositions déjà publiées en clair : aucune clé SQL ni donnée chiffrée utilisée."""
import hashlib
import re
import subprocess
from pathlib import Path

ALPHABET=set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_')


def parse_clear_map_data(text,config):
    rows=[line for line in text.splitlines() if line.startswith(f"INSERT INTO `maps` VALUES ('{config['id']}',")]
    if len(rows)!=1:
        raise RuntimeError(f"Disposition publique ambiguë : maps[{config['id']}]")
    values=re.findall(r"'((?:\\.|[^'\\])*)'",rows[0])
    # Champ 6 : mapData déjà en clair ; le champ de clé n'est jamais utilisé.
    data=values[6]
    if len(data)%10 or set(data)-ALPHABET or hashlib.sha256(data.encode()).hexdigest()!=config['layoutSha256']:
        raise RuntimeError('Disposition publique non conforme à la version vérifiée ; aucun déchiffrement permis.')
    if values[1]!=config['date'] or int(values[2])!=15 or int(values[3])!=17 or len(data)//10!=479:
        raise RuntimeError('Version ou dimensions de la disposition publique modifiées.')
    return data


def public_layout_script(data,header):
    numbers={name:int(re.search(r'\b'+name+r'\s*=\s*(\d+)',header)[1]) for name in ['width','height','backgroundNum']}
    if numbers['width']!=15 or numbers['height']!=17:
        raise RuntimeError('Les dimensions publiques du SWF et du dump ne correspondent pas.')
    return f'width = 15; height = 17; backgroundNum = {numbers["backgroundNum"]}; mapData = "{data}";'


def load_public_layout(config,game):
    dump=Path('.local-assets/ancestra.sql')
    if not dump.is_file():
        raise RuntimeError(f'Dump public absent : {dump}. Voir docs/PREPARED-ASSETS.md.')
    data=parse_clear_map_data(dump.read_text(),config)
    # Le SWF fournit seulement ces trois métadonnées publiées en clair.
    folder=Path('.local-assets/public-map-metadata')/str(config['id'])
    script=folder/'scripts/frame_1/DoAction.as'
    if not script.is_file():
        folder.mkdir(parents=True,exist_ok=True)
        with (folder/'metadata.log').open('w') as log:
            subprocess.run(game.JAVA+['-export','script',str(folder.resolve()),str((game.DEX/config['metadataSource']).resolve())],stdout=log,stderr=subprocess.STDOUT,check=True)
    return public_layout_script(data,script.read_text())

from pathlib import Path
import subprocess 

import geopandas as gpd 
import numpy as np 
import pandas as pd

def file_to_cleaned_geoJSON(file_name, layer, columns_to_drop):
    # Reading the gpkg file
    file = gpd.read_file(file_name, layer=layer)

    # Dropping the unnescary columnd
    for column in columns_to_drop:
        file = file.drop(
            columns=[column]
        )
    # Changing the projection 
    if file.crs != 4326:
        file = file.to_crs(epsg=4326)

    # Simpliying the geometry 
    file = file.simplify(0.01)

    # Saving the file as a geoJSON 
    file.to_file(f"{file_name.split('.')[0]}.geojson", driver="GeoJSON", index=False)

    return f"{file_name.split('.')[0]}.geojson"

# To creating pmtiles using tippecanoe 
# Make sure you have already installed tippecanoe on your machine.
# This will take a while, and the file will be large. I limited the zoom to 17, but you can go further the file will just be much larger.
def geoJSON_to_pmtiles(geojson_file):
    subprocess.run(
        [
            "tippecanoe",
            "--projection=EPSG:4326",
            "-z17", 
            "-Z4",
            "-o",
            f"{geojson_file.split('.')[0]}.pmtiles",
            geojson_file,
        ],
        check=True,
    )

def main():

    data_dir = Path(__file__).resolve().parents[1] / "site" / "data"

    # Cleaning the FEUX_PROV file
    # Download feux_prov.gpkg from https://www.donneesquebec.ca/recherche/fr/dataset/feux-de-foret/resource/0e7f1c3b-5d8a-4f2e-9c6e-0f1b5e3c6f1a, and save under site/data
    file_name = str(data_dir / "FEUX_PROV.gpkg")
    layer = "FEUX_PROV"

    columns_to_drop = ["geoc_fmj", "origine", "an_origine", "perturb", "an_perturb", "met_at_str", "shape_length", "shape_area"]

    geojson_file = file_to_cleaned_geoJSON(file_name, layer, columns_to_drop)

    # Creating pmtiles using tippecanoe 
    geoJSON_to_pmtiles(geojson_file)

    # Cleaning the FEUX_PROV_ANCIEN file
    # Download the feux_anciens_prov.gpkg from https://www.donneesquebec.ca/recherche/fr/dataset/feux-de-foret/resource/0e7f1c3b-5d8a-4f2e-9c6e-0f1b5e3c6f1a, and save under site/date
    file_name = str(data_dir / "FEUX_ANCIENS_PROV.gpkg")
    layer = "FEUX_ANCIENS_PROV"

    columns_to_drop = ["geoc_fan", "origine", "an_origine", "met_at_str", "shape_length", "shape_area"]

    geojson_file = file_to_cleaned_geoJSON(file_name, layer, columns_to_drop)

    # Creating pmtiles using tippecanoe 
    geoJSON_to_pmtiles(geojson_file)

if __name__ == "__main__":
    main() 
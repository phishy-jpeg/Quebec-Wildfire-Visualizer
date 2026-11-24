from pathlib import Path
import subprocess 

import geopandas as gpd 
import numpy as np 
import pandas as pd
import json as json

def file_to_cleaned_geoJSON(file_name, layer, columns_to_drop, espg):
    # Reading the gpkg file
    file = gpd.read_file(file_name, layer=layer)

    # Dropping the unnescary columnd
    for column in columns_to_drop:
        file = file.drop(
            columns=[column]
        )
    # Changing the projection 
    if file.crs != espg:
        file = file.to_crs(epsg=espg)

    # Simplifying the geometry 
    file["geometry"] = file.geometry.simplify(0.01)

    # Saving the file as a geoJSON 
    file.to_file(f"{file_name.split('.')[0]}.geojson", driver="GeoJSON", index=False)

    return f"{file_name.split('.')[0]}.geojson"

# Function for creating a JSON that will contains the yearly counts of amount of individual fires and hectares burned
def yearly_counts(files):
    yearly_count = {}

    if not files:
        raise ValueError("At least one input file is required.")

    for file in files:
        fire_data = gpd.read_file(file)

        for _, row in fire_data.iterrows():
            key = row['exercice']
            if key in yearly_count:
                yearly_count[key]['fires'] += 1
                yearly_count[key]['hectares'] += row['superficie']

            else:
                yearly_count[key] = {'fires': 1, 'hectares': row['superficie']}

    output_path = Path(files[0]).resolve().parent / "fire_counts_by_year.json"
    with output_path.open('w') as f:
        json.dump(yearly_count, f)
    
    return yearly_count

# Function for creating pmtiles using tippecanoe 
# Make sure you have already installed tippecanoe on your machine.
# This will take a while, and the output files will be large. The current zoom range is 1-17.
def geoJSON_to_pmtiles(geojson_file):
    subprocess.run(
        [
            "tippecanoe",
            "--projection=EPSG:4326",
            "-z17", 
            "-Z1",
            "--generate-ids",
            "--force",
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

    feux_prov_geojson_file = file_to_cleaned_geoJSON(file_name, layer, columns_to_drop, 4326)

    # Creating pmtiles using tippecanoe 
    geoJSON_to_pmtiles(feux_prov_geojson_file)

    # Cleaning the FEUX_PROV_ANCIEN file
    # Download the feux_anciens_prov.gpkg from https://www.donneesquebec.ca/recherche/fr/dataset/feux-de-foret/resource/0e7f1c3b-5d8a-4f2e-9c6e-0f1b5e3c6f1a, and save under site/data
    file_name = str(data_dir / "FEUX_ANCIENS_PROV.gpkg")
    layer = "FEUX_ANCIENS_PROV"

    columns_to_drop = ["geoc_fan", "origine", "an_origine", "met_at_str", "shape_length", "shape_area"]

    feux_prov_ancien_geojson_file = file_to_cleaned_geoJSON(file_name, layer, columns_to_drop, 4326)

    # Creating the yearly counts json using yearly_counts
    yearly_counts_json = yearly_counts([feux_prov_geojson_file, feux_prov_ancien_geojson_file])

    # Creating pmtiles using tippecanoe 
    geoJSON_to_pmtiles(feux_prov_ancien_geojson_file)

if __name__ == "__main__":
    main() 
import geopandas as gpd 
import numpy as np 
import pandas as pd

# TODO: Create all the functions I need to just be able to run this and have the website created
# TODO: Automatically download the neede data from the internet and parse it 

# Function to project a file, drop unnescary columns, and resave as a geoJSON
def shp_to_geoJSON(file_name, columns):

    # Changing the file to right projection
    file = gpd.read_file(file_name)
    if file.crs != 4632:
        file = file.to_crs(epsg=4632)
    # Deleting all columns that need to be dropped
    for column in columns:
        file = file.drop(
            columns=[column]
        )
    # Saving as a geoJSON
    file.to_file("../site/data/clean_file.geojson", driver="GeoJSON")

# Function to project a file, drop unescary columns but save as a gpkg
def gpkg_cleaner(file_name, columns):
    file = gpd.read_file(file_name)
    # Changing to correct projection (if were making vector tiles out of this it wil be projected later)
    if file.crs != 3857:
        file = file.to_crs(epsg=3857)
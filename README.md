# Quebec Forest Fire Visualizer
The Quebec Forest Fire Visualizer allows users to see historic wildfires in Quebec. Users are able to filter the data by year, and compare how many fires happened each year, as well as how many hectores burned and how the fires are spatially distributed.

**Github pages link:** https://phishy-jpeg.github.io/Quebec-Wildfire-Visualizer
**My github repo link:** https://github.com/phishy-jpeg/Quebec-Wildfire-Visualizer

## Problem
Wildfires are becoming increasingly common year after year as the climate warms. While it is very easy to find online graphs on the increase in wildfires, resources to visualize this spatially this is limited. This site aims to be a tool for people interested in conservation, to be able to visualize the effects of wildfires over the years. 

## Audience
This map is aimed at the people interested in conservation (specifically in Quebec) but does not require previous scientific knowledge.

## Core Action
View all historic wildfires in Quebec, and be able to filter them by year. 

## Not in this iteration
This iteration does not included the following functions, but they will hopefully be included in the next version: 
- Visualization of Historic wildfires earlier than 1976
    - This is another large dataset that will need to be processing and added to the database.
- Filters to sort wildfires by size
    - While I would like to implement this step, I am not sure exactly what I would like it to look like yet. It will remain unadded until the exact parameters have been decided. 
- Filters to see how many hectars burned each year
    - This will likely be added soon, but I wanted to keep the MVP simple. 
- Other relevent datasets (yearly temperature data, forest cover etc. ) to visually compare the wildfire data to
    - Similar to filters to sort the fires by size, I am unsure what exactly I want this feature to do. I have not decided specific datasets yet. 
- A french version of the site
    - This will likely be added by the next iteration, it will just take some time for the translations as my french isn't that good. 

## Boundary 
This site is limited, and will likely not included the following functions even in later editions. 
- Visualization of fires outside quebec
    - The site aims to be for residents of quebec. The site will try to maintain quality of a small amount of data, with improved functions, before increasing the quantity of data. 

## After My Demo
During my demo I got some good ideas on things to implement and change about my website. The things I would like to change and add are: 
- A corresponding graph showing the number of fires per year to go with the map. 
- A better UI for selecting the years.
- Some sort of layer with relevent data to compare the forest fire data to. 

## A3: 2 new data sets and 2 new features
### Data set 1: Forest Fires before 1976 (1975 - 1885).
- File for preprocessing: notebookes/functions.py
    - I turned the forest fire data into pmtiles so they can run serverless.
    - Explanation: I used python to preprocess my data similar to the labs (changed the espg, got rid of unnecessary columns, and turn it into a geojson). I then used the tool tippecanoe from the terminal (althought I included the terminal command in the python, for documentation), to turn my geojson into a .pmtiles, which are able to run serverless.  
- File for adding to my map: site/js/index.js
    - Lines: 172 - 132 (adding the layer) & 163 - 189 (adding the fire info when the user clicks the polygon).
    - Explanation: Adds the dataset using maplibre as demonstrated in the labs (create new source then create new layer)
### Data set 2: Quebec Watersheds. 
- File for preprocessing: notebooks/watershed.ipynb
    - The original file was for all of Canada, so I kept only the features that intersected with my quebec polygon. 
- File for adding to my map: site/js/index.js
    - Lines: 37 - 83 (Adding the layer and adding a pop up with infor when the user clicks the polygon).
    - Explanation: Adds the dataset using maplibre as demonstrated in the labs (create new source then create new layer)

### Feature 1
Ability to enter the dates as a text input range rather than through clicking individual boxes. 

I added this feature to improve the user experience of the site. Many of the comments on my MVP, involved the difficulty in using the year search function. This feature allows users to have better control of the map, and greatly improves the overall functionality of my site. 

- File where this feature happens (main function): site/js/year-filter.js (The features works on 2 pages (charts and the map) so it's not in one pages js.)
    - Lines: The whole file.

I know that this feature worked when I was able to enter a year range, and saw the map and corresponding graph (feature 2) update in real time.

#### Test Edge Cases
| Test Case | Result | What Happened | 
|---|---|---|
| 1. User does not enter an integer value | Passed | A warning pops up saying the user must enter a valid year| 
| 2. The user enters a from year that is higher than the to year (ex. from 2025 to 1990) | Passed | A warning pops up saying the user must enter a to year that is larger than the from year | 
| 3. A user enters an invalid year (ex. 1700) | Passed | A pop up comes up telling the user to enter a year from 1885 to 2025| 

### Feature 2
A corresponding graph, that shows how many hectares burned each year, and how many individual fires happened each year. 

I added this feature because I found that without additional visualization, my website was lacking in it ability to do its primary function (ie. show the increase in wildfires over the years, in a visual way). This feature improves the abiility for my website to tell a story. 

- File where this feature happens: site/js/graphs.js
    - Lines where this features happens: The whole file, but it also uses the site/js/year-filter.js file.
    - I created a graph and then I created the layers I wanted (individual fire, and hectares burned). After that the chart takes the data from the *hecatarsCountByYear* and *fireCountByYears* variables, as the dataset (which is from a dataset I created site/data/fire_counts_by_year.json, that I turned into a variable), and filters those by the *years* variable, which holds which years the user has selected. 

### One thing not fully understood from A3
How does the years selected keep synchronized across both the graph and the map?

**Edge case:** The user input for this feature is the same as in feature 1 (sorting the results by a year range), so the edge cases are identical. 

## Pre-flight report 
| Check | Result | What I did |
| --- | --- | --- |
| 1. Cold start | Pass | No errors appeared in the cold start. No need to updated anything |
| 2. Read every label | Half pass: thing showed up with a result like null, but due to the size of my dataset I couldn't click on everything | I didn't have to change anything |
| 3. Ask twice | Pass: I entered to and from data with the same number twice | Nothing happened, after doing this check. I did not have to change anything. |
| 4. The edge | Pass: I entered invalid years (from 1500 to 3000) | Nothing updated on the map, but a pop up comes up saying "Please enter years from 1885 to 2025" |
| 5. The data does not come | Fault: I did not a warning about data loading to the user | I need to add someting that will alert the user that the data isn't loading |
| 6. On a phone (size view and my phone) | Passed: I viewed the website on my phone | I changed the layout of my map completly. It is now default full size, without large margin on the side of it. |
| 7. Mouse in my pocket | Pass: I tabed throught the filters | It worked and I didn't have to change anything |
| 8. Accessibility audit | Pass: 91% | I did the accesibilty audit in developer tools and got a 91%, I did not have to change naything. |

## Next Additions
1. Redo my juypter notebooks, to run as one app.py file, and make sure my code is as efficient as can be (my notebooks are currently very messy)
2. Improve site usability based on the results for the testing session. 
3. Add data for the rest of Canada, and allow the user to sort by province (this may be done after the class is done.)

## A3 Part 3
Evidence: Both of my two single testers were unable to complete the task. 

|#| What they did (evidence) | What I expected | Severity | My Change | Recheck Result | 
|-----|-----|------|------|------|------| 
| 3 | Looked around the map, went to the graphs page, looked around, clicked on the graph, and saw it says number of fires each year, but could not find the total amount of fires over the time span. | The user would scroll down in the filters tab and see the full number of fires that happened over the selected years. | 3 | I moved the "Total fires" and "Total hectares burned" boxes to a clear spot on the map, from their hidden placemenet in the filter section | I gave the tast to a friend and they were able to complete it quickly and without hesitation: fixed | 

My c
## Sources
- Forest fires since 1976: Ministère des Ressources naturelles et des Forêts (MRNF), https://www.donneesquebec.ca/recherche/dataset/feux-de-foret
    - License: CC BY 4.0.
- Administrative boundaries: Ministère des Ressources naturelles et des Forêts (MRNF), https://www.donneesquebec.ca/recherche/dataset/decoupages-administratifs
    - License: CC BY 4.0.
- Watersheds in Canada Original Data, Esri Canada Eduation and Research, 
https://hub.arcgis.com/maps/12b6e33d5a754c92b97ae5d0fed6940a/about
    - License: Creative Commons Attribution 2.5 Canada License
    * See note in notebooks/watersheds.ipynb
- Base Map: MapLibre, https://styles.maptoolkit.org/summer.json 
    - License: CC BY 4.0












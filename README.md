# Quebec Forest Fire Visualizer
The Quebec Forest Fire Visualizer allows users to see historic wildfires in Quebec. Users are able to filter the data by year, and compare how many fires happened each year, as well as how many hectores burned and how the fires are spatially distributed.

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

## A3 feature: Allowing the user to enter dates by text input
For A3 I will allow the user to enter the years through text input rather than through clicking on check marks. 
It has depth because it gives user better control of the map, and adds functionality. With the check click, the site is pretty much not functional at all.
I know it works when I try it and the fires update on the map, and the years shown checks display on the map. 
My edge case: A user enters a word rather than a year.

### Test Edge Cases
| Test Case | Result | What Happened | 
|-----------|--------|---------------|
| 1. User does not enter an int | Passed | A warning pops up saying the user must enter a valid year| 
| 2. The user enters a from year that is higher than the to year | Passed | A warning pops up saying the user must enter a to year that is larger than the from year | 
| 3. A user enters an invalid year | Passed | A pop up comes up telling the user what the valid years are | 

## Pre-flight report 
| Check | Result | What I did |
| --- | --- | --- |
| 1. Cold start | pass / fault: ... | fixed in commit "..." / known issue |
| 2. Read every label | None showed up with a result like null | I clicked on as many labels as I could. Due to the size of my data set I couldnt select everyone |
| 3. Ask twice | I entered to and from data with the same number twice | Honestly nothing. The site did not update |
| 4. The edge | I entered invalid years (from 1500 to 3000) | Nothing updated on the map, but a pop up comes up saying "Please enter years from 1885 to 2025" |
| 5. The data does not come | Um does not work no pop up | I blocked the URL using the network tab |
| 6. On a phone (size view and my phone) | My website is not live yet| ... |
| 7. Mouse in my pocket | I tabed throught the filters | YES IT WORKED, and I didn't have to change anything |
| 8. Accessibility audit | 100% but my site it not yet live so this is not accurate | I tried it in developer tools |

## Sources
- Forest fires since 1976: Ministère des Ressources naturelles et des Forêts (MRNF), https://www.donneesquebec.ca/recherche/dataset/feux-de-foret
    - License: CC BY 4.0.
- Administrative boundaries: Ministère des Ressources naturelles et des Forêts (MRNF), https://www.donneesquebec.ca/recherche/dataset/decoupages-administratifs
    - License: CC BY 4.0.
- Base Map: MapLibre, https://makewithmaplibre.com/basemaps/styles/openfreemap-dark/
    - License: CC BY 4.0












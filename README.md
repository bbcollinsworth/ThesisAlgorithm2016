The files used to run the algorithm are:

- index.html (the page that you actually load online, which displays results of each run upon refresh)
- either "classicAlgo.js" OR "weightedAlgo.js" (the JavaScript files that actually contain the versions of the algorithm, and related data parsing and results display code)

TO RUN THE ALGORITHM, you first need to:

1. set the last script in the "index.html" file to either...

	- "classicAlgo.js", which will run an algorithm that is based very closely on past year's versions, with the major difference being that faculty choices of students are no longer factored in, OR

	- "weightedAlgo.js", which will run a new version of the algorithm that factors in students' interest areas (form and lens) and attempts to match all students based on their preferred weighting of three criteria (teacher preference, interest areas or peer selections).

2. add a "data" folder at the same level as your "index.html" file that contains two TSV (tab-separated) .txt files:

	- "studentData.txt", a tab-separated text file of all student data (ids, preferences, peer choices, etc.)
	- "teacherData.txt", a tab-separated text file of all teacher data for the upcoming thesis semester (including teacher form and lens rankings, if applicable)

! IMPORTANT: In order for the data to import properly, these .txt files must be formatted with the headers and data that the algorithm's "parseTSV()" function is expecting, or that function and/or the header arrays in the .JS file must be changed. 

***Blank template files showing the current proper .txt data format are here:***

studentData: https://docs.google.com/spreadsheets/d/1UEc_CE1siSug8nc_gLwIQXk9kRPgTSTiamXNCStcxBw/edit?usp=sharing
teacherData: https://docs.google.com/spreadsheets/d/1egA2sWjXT2Hc_E6ylGg9T0m50lmqjgm1Gx4QlYbE9oM/edit?usp=sharing

Once all these files are set up, navigate to index.php in a browser to run the algorithm. Refresh the page to keep re-running for different results -- but NOTE that you should copy-paste out any results you want to save before you re-run.
	

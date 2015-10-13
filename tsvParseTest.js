//var rawStudents = [];

var students = [];

var student_data = [];

jQuery(document).ready(function($) {



	$.ajax({
		// dataType: "json",
		// url: "students.json",
		// success: function(d) {


		dataType: "text",
		url: "data/testDataClean.txt",
		success: function(d) {

			var rawStudents = parseTSV(d);

			console.log("Students processed: " + rawStudents.length);

			// maybe not used
			var counter = 0;
			for (N in rawStudents) {

				var thisStudent = rawStudents[N];

				console.log("Raw Student: ");
				console.log(thisStudent);
				console.log(thisStudent.interestWt);
				//condense peers into array from raw data objects
				var peers = [];
				//all column headers that should be pushed to peer array
				var peerHeaders = ["peer1", "peer2", "peer3", "peer4"];

				peerHeaders.forEach(function(peer) {
					peers.push(thisStudent[peer]);
				});
				console.log(peers);

				// split string of peers into array
				//var arr = (true) ? peers.split(" ") : "";

				//B.C. : LOOP THROUGH ALL PEER ARRAYS to replace PEER NET IDs in JSON file 
				//with the unique IDs assigned to each student for the sort
				for (i in peers) {
					for (p in rawStudents) {
						if (rawStudents[p].user == peers[i]) {
							//if (rawStudents[p].NetID == arr[i]) {
							peers[i] = p;
							//console.log("FOUND MATCH: " + rawStudents[p].NetID);
						} else {}
					}
				}

				//B.C. : PARSE STUDENTS' THESIS TEACHER 1ST, 2ND, 3RD CHOICES INTO ARRAY:
				//var choices = rawStudents[N].choices;
				//var choicesArr = (true) ? choices.split(" ") : "";

				var choicesArr = [];
				var choiceHeaders = [
					"firstChoice",
					"secondChoice",
					"thirdChoice",
					"fourthChoice",
					"fifthChoice",
					"sixthChoice",
					"seventhChoice"
				];

				choiceHeaders.forEach(function(choice) {
					choicesArr.push(thisStudent[choice]);
				});
				console.log(choicesArr);

				var formArr = thisStudent.form.split(",");
				var lensArr = thisStudent.lens.split(",");

				var wtPointsToInt = function(w) {
					console.log("Weight: " + w);
					var wtString = w.toString();
					var wtAsInt = wtString.split("");
					return wtAsInt[0];
				};

				console.log("weights created");
				console.log("Interest weight is: " + thisStudent["interestWt"]);

				// tWt = thisStudent["teacherWt"];
				// pWt = thisStudent["peerWt"];
				// iWt = thisStudent["interestWt"];

				var weights = {
					// "teacherWt": wtPointsToInt(thisStudent.teacherWt),
					// "peerWt": wtPointsToInt(thisStudent),
					// "interestWt": wtPointsToInt(iWt)
				};

				var weightHeaders = [
					"teacherWt",
					"peerWt",
					"interestWt"
				];

				weightHeaders.forEach(function(hdr){
					weights[hdr] = wtPointsToInt(thisStudent[hdr]);
				});
				// weights["teacherWt"] = wtPointsToInt(tWt);
				// weights["peerWt"] = wtPointsToInt(pWt);
				// weights["interestWt"] = wtPointsToInt(iWt);



				// single processed student gets pushed to student_data array
				var s = {
					"id": N, // assigns unique ID to each student that corresponds to their index in students array
					//"name": thisStudent.name, // student's name
					"username": thisStudent.username,
					//"NetID": thisStudent.NetID, // their N number
					"choices": choicesArr, //parsed array of teacher choices,
					"peers": peers, //  parsed array of student peer preferences
					"form": formArr,
					"lens": lensArr,
					"weights": weights,
					"thesis": -1 // -1 means they haven't been placed in a real thesis section yet
				}
				//counter++;
				student_data.push(s);
				console.log(s);
			}
		}

	});


});

// function wtPointsToInt(wt) {
// 	var wtAsInt = wt.split("");
// 	return wtAsInt[0];
// }


function parseTSV(data) {
	var parsedArray = [];
	var newStudent = {};

	//split text into rows
	var dataRows = data.split("\n");
	console.log(dataRows);

	//pull out the header row and parse
	//dataRows[0]+=("\tSpacer\t");
	var headers = dataRows[0].split("\t");
	console.log("HEADERS: " + headers);

	for (var i = 1; i < dataRows.length; i++) {

		//create empty student object and split data row into columns

		var newData = dataRows[i].split("\t");

		//skip or exclude blank rows
		if (newData[0] != ""){


			//create an object property for each column header
			//then set value as the data in that column for this student
			//for (j in headers){
			$.each(headers, function(j, header) {
				console.log("This Header Is: " + header);
				newStudent[header] = newData[j];

				//var thisHeader = headers[j];
				// console.log("This Header is : " + thisHeader);
				// thisHeader.toString();
				// thisHeader.replace('"','');
				// console.log("This Header after ed: " + thisHeader);
				
								//tisHeader.splice()
				//newStudent[thisHeader] = newData[j];
			//}
			});

			//push new student object to rawStudentsArray
			//rawStudents.push(newStudent);
			parsedArray.push(newStudent);
			console.log("New Student: ");
			console.log(newStudent);
		}
	}

	return parsedArray;
	//console.log("Students processed: " + rawStudents.length);
}
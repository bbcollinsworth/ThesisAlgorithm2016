//IMPORTANT: 
//These arrays tell the algo which columns should combined into
//arrays/objects for each student's teacher choices, peer choices and interests


var choiceHeaders = [
	"firstChoice",
	"secondChoice",
	"thirdChoice",
	"fourthChoice",
	"fifthChoice",
	"sixthChoice",
	"seventhChoice"
];

var peerHeaders = [
	"peer1",
	"peer2",
	"peer3",
	"peer4"
];

var weightHeaders = [
	"teacherWt",
	"peerWt",
	"interestWt"
];

var manyRunResults = [];
var vizObject = {};

var maxSectionSize = 10;
var minSectionSize = 8;

//B.C.: 
//This is old variable for maximum # of peers,
//BUT it's not used in current version...var 
maxPeers = 4;

var matchRound;

var students = [];
var student_data = [];
var students_left = [];
var theses = [];
var shuffled_ids = [];
var peerMatchBuffer = [];

var dataviz;
var datavizNew;
var iteration;

var ajaxed = false;
var numstudents = 0;

jQuery(document).ready(function($) {



	$.ajax({

		dataType: "text",
		url: "data/studentData.txt",
		success: function(d) {

			var rawStudentDataTable = parseTSV(d);

			console.log("Student TSV Parsed: " + rawStudentDataTable.length);

			//This turns spreadsheet table into student objects 
			//that make sense to the algorithm
			restructureRawStudentData(rawStudentDataTable);

			students = generateStudents(student_data);
			// get number of students
			numstudents = students.length;
			// B.C.: The following creates an array of index numbers, from 0 to students.length, in random order
			// shuffled_ids = uniqueRandom(students.length, students.length);

			$.ajax({

				dataType: "text",
				url: "data/teacherData.txt",
				success: function(td) {

					var teacherData = parseTSV(td);
					theses = generateTheses(teacherData);
					console.log(theses);

					getThesisInterest();

					matchInterests();

					//var runCounter = 50;

					//while (runCounter > 0) {
					//shuffled_ids.splice(0,shuffled_ids.length);

					shuffled_ids = uniqueRandom(students.length, students.length);

					// This is the algorithm
					sausage_factory();

					dataviz();

					datavizNew(1);
					datavizNew(2);
					datavizNew(3);

					// var ResToPush = {

					// }
					//var thisRun = runCounter;

					manyRunResults.push(vizObject);
					//runCounter--;
					//}

					console.log("RunResults: ");
					console.log(JSON.stringify(manyRunResults));
					$('.results').append(JSON.stringify(manyRunResults));

					ajaxed = true;
					// Functions


					$('#show_hide_students').click(function() {
						if ($('table.students').hasClass('off')) {
							$('table.students').removeClass('off');
							$('#show_hide_students').html('-');
						} else {
							$('table.students').addClass('off');
							$('#show_hide_students').html('+');
						}
					});
				}
			});

		}

	});
	var iteration = 0;
});


function parseTSV(data) {
	//create empty array to push to
	var parsedArray = [];

	//split text into rows
	var dataRows = data.split("\n");
	console.log(dataRows);

	//pull out the header row and parse
	//dataRows[0]+=("\tSpacer\t");
	var headers = dataRows[0].split("\t");
	console.log("HEADERS: " + headers);

	for (var i = 1; i < dataRows.length; i++) {

		var newRow = {};

		//create empty student object and split data row into columns
		var newData = dataRows[i].split("\t");
		console.log("New Row: " + newData);

		//skip or exclude blank rows
		if (newData[0] != "") {

			//create an object property for each column header
			//then set value as the data in that column for this student
			$.each(headers, function(j, header) {
				//console.log("This Header Is: " + header);
				header.toString();
				newRow[header] = newData[j];
				//console.log(header + ": " + newData[j]);
			});

			//push new student object to array
			parsedArray.push(newRow);
			console.log("New Parsed Row: ");
			console.log(newRow);
		}
	}

	return parsedArray;
	//console.log("Students processed: " + rawStudents.length);
}

function restructureRawStudentData(rawStudents) {
	// maybe not used
	var counter = 0;
	for (N in rawStudents) {

		var thisStudent = rawStudents[N];

		console.log("Raw Student: ");
		console.log(thisStudent);
		// console.log(thisStudent.interestWt);
		//condense peers into array from raw data objects
		var peers = [];

		//peerHeaders.forEach(function(peer) {
		$.each(peerHeaders, function(i, peer) {
			//if (thisStudent.peer != "") {
			for (var j in rawStudents) {
				if (thisStudent[peer] == rawStudents[j].username) {
					peers.push(j);
					break;
				}
			}
			//peers.push(rawStudents.username.indexOf(thisStudent.peer));
			//}
		});
		console.log(peers);

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

		//B.C. : PARSE STUDENTS' THESIS TEACHER CHOICES INTO ARRAY:

		var choicesArr = [];

		choiceHeaders.forEach(function(choice) {
			//split teacher name by space to get last name
			var splitName = thisStudent[choice].split(' ');
			var teacherLastName = splitName[splitName.length - 1];
			choicesArr.push(teacherLastName);
		});
		//console.log(choicesArr);

		var rawFormArr = thisStudent.form.split(", ");
		var formArr = [];
		rawFormArr.forEach(function(formItem) {
			formItem = formItem.toLowerCase();
			var noQuotesArr = formItem.split('"');
			noQuotesArr.forEach(function(el) {
				if (el !== "") {
					formArr.push(el);
				}
			});
		})

		var rawLensArr = thisStudent.lens.split(", ");
		var lensArr = [];
		rawLensArr.forEach(function(formItem) {
			formItem = formItem.toLowerCase();
			var noQuotesArr = formItem.split('"');
			noQuotesArr.forEach(function(el) {
				if (el !== "") {
					lensArr.push(el);
				}
			});
		})

		var wtPointsToInt = function(w) {
			//console.log("Weight: " + w);
			var wtString = w.toString();
			var wtAsInt = wtString.split("");
			return +wtAsInt[0];
		};

		//console.log("weights created");
		//console.log("Interest weight is: " + thisStudent["interestWt"]);

		var weights = {};

		weightHeaders.forEach(function(hdr) {
			weights[hdr] = wtPointsToInt(thisStudent[hdr]);
		});

		// single processed student gets pushed to student_data array
		var s = {
				"id": N, // assigns unique ID to each student that corresponds to their index in students array
				"name": thisStudent.username, // student's name
				"username": thisStudent.username,
				//"NetID": thisStudent.NetID, // their N number
				"choices": choicesArr, //parsed array of teacher choices,
				"peers": peers, //  parsed array of student peer preferences
				"form": formArr,
				"lens": lensArr,
				"weights": weights,
				"thesis": -1, // -1 means they haven't been placed in a real thesis section yet
				"matchAttempts": {
					"byTeacher": 0,
					"byInterest": 0,
					"byPeer": 0
				}
			}
			//counter++;
		student_data.push(s);
		console.log("New Processed Student:");
		console.log(s);
	}
}

function generateStudents(student_data) {
	// move contents from student_data into new students array
	// push every student id into students_left
	var students = [];
	for (var i = 0; i < student_data.length; i++) {
		students[i] = student_data[i];
		students_left.push(students[i].id);
	}
	return students;
}

function generateTheses(teacher_data) {
	var sections = [];
	for (var i = 0; i < teacher_data.length; i++) {
		var t = teacher_data[i];

		var tFormArray = [
			t.form1.toLowerCase(),
			t.form2.toLowerCase(),
			t.form3.toLowerCase()
		];
		var tLensArray = [
			t.lens1.toLowerCase(),
			t.lens2.toLowerCase(),
			t.lens3.toLowerCase()
		];

		sections[i] = {
			"id": i,
			"teacher": t.teacher,
			"teacherForms": tFormArray,
			"teacherLenses": tLensArray,
			"total": maxSectionSize,
			"maxSize": maxSectionSize,
			"minSize": minSectionSize,
			"enrolled": [],
			"teacher_pref": [],
			"choices": [],
			"not_chosen": 0,
			"chosen": 0,
			"totalinterest": []
		};
	}
	console.log("Thesis sections are: ");
	console.log(sections);
	return sections;

}

function matchInterests() {
	//go through each student...
	students.forEach(function(student) {
		//create an array of teachers to be sorted by matched interests
		var interestMatchArray = [];

		student.choices.forEach(function(choice) {
			var matchedInterestCt = 0;
			var matchedInterests = [];
			var teacherLens = [];
			var teacherForm = [];
			for (var t in theses) {
				if (choice == theses[t].teacher) {
					teacherLens = theses[t].teacherLenses;
					teacherForm = theses[t].teacherForms;
					break;
				}
			}

			student.lens.forEach(function(studentLens) {
				for (l in teacherLens) {
					if (studentLens == teacherLens[l]) {
						//console.log("Interests " + studentLens + " and " + teacherLens[l] + " match!");
						matchedInterestCt++;
						matchedInterests.push(studentLens);
						break;
					}
				}
			});

			student.form.forEach(function(studentForm) {
				for (f in teacherForm) {
					if (studentForm == teacherForm[f]) {
						// if (studentForm == "vr / ar") {
						// 	console.log("Interests " + studentForm + " and " + teacherForm[f] + " match!");
						// }
						matchedInterestCt++;
						matchedInterests.push(studentForm);
						break;
					}
				}
			});

			interestMatchArray.push({
				"teacher": choice,
				"interestMatch": matchedInterestCt,
				"matchedInterests": matchedInterests
			});
		});

		interestMatchArray.sort(function(a, b) {
			return b.interestMatch - a.interestMatch;
		});

		// console.log("Sorted Interest Match for student: " + student.username);
		// console.log(interestMatchArray);

		var interestMatchNames = [];

		interestMatchArray.forEach(function(item) {
			interestMatchNames.push(item.teacher);
		});

		student["choicesByInterest"] = interestMatchNames;
		console.log("Choices by Interest for " + student.username + " are:");
		console.log(student.choicesByInterest);
	});
}

function getThesisInterest() {
	// add student to total interest array to keep track of all students interested in each section / teacher
	for (var i = 0; i < theses.length; i++) {
		var interest = [];
		var pref = [];
		for (var j = 0; j < students.length; j++) {

			//k should = choice rank we're looking for
			//e.g. if we're measuring down to students' 4th choice
			for (var k = 0; k < 4; k++) {
				if (students[j].choices[k] === theses[i].teacher) {
					interest.push(j);
				}
			}
		}

		//console.log(interest);
		theses[i].totalinterest = interest;
	}
}



//B.C.: this function generates a range of unique numbers between 0 and students.length in random order
//for shuffling students
function uniqueRandom(count, bound) {
	// count = array length
	// bound = range of data
	if (bound >= count) {
		var set = [];
		for (var j = 0; j < count; j++) {
			if (j === 0) {
				set [j] = Math.floor(Math.random() * bound);
			} else {
				set [j] = Math.floor(Math.random() * bound);
				for (k = 0; k < j; k++) {
					if (set [j] == set [k]) {
						set [j] = checkRepeat(set [k], set [j], bound);
						k = -1;
					}
				}
			}
		}
		return set;
	} else {
		return false;
	}
}

function checkRepeat(n1, n2, total) {
	if (n1 == n2) {
		n2 = Math.floor(Math.random() * total);
		return checkRepeat(n1, n2, total);
	} else {
		return n2;
	}
}

//==========================================
// T H I S  I S  T H E  M A I N  O N E
//==========================================

function sausage_factory() {
	// after thesis object created
	// data viz using google forms
	iteration++;
	// Initialize student interest data
	for (var i = 0; i < theses.length; i++) {
		// totals for how many people want each teacher's thesis section 
		var first = 0;
		var second = 0;
		var third = 0;
		// how many students didn't pick them at all
		var not_chosen = 0;
		// total amount of people that picked them
		var chosen = 0;
		// all the students interested in a given section 
		var interested_students = [];

		for (var j = 0; j < students.length; j++) {
			//if(students[shuffled_ids[j]].choices[0] == i){
			if (students[shuffled_ids[j]].choices[0] == theses[i].teacher) {
				first++;
				//interested_students.push(students[shuffled_ids[j]].NetID);
				interested_students.push(students[shuffled_ids[j]].id);
				//console.log("Student " + students[shuffled_ids[j]].id + " interested in" + theses[i].teacher);
			}
			if (students[shuffled_ids[j]].choices[1] == theses[i].teacher) {
				second++;
				interested_students.push(students[shuffled_ids[j]].id);
				//console.log("Student " + students[shuffled_ids[j]].id + " interested in" + theses[i].teacher);

			}
			if (students[shuffled_ids[j]].choices[2] == theses[i].teacher) {
				third++;
				interested_students.push(students[shuffled_ids[j]].id);
				//console.log("Student " + students[shuffled_ids[j]].id + " interested in" + theses[i].teacher);

			}
			if (students[shuffled_ids[j]].choices[2] != theses[i].teacher && students[shuffled_ids[j]].choices[1] != theses[i].teacher && students[shuffled_ids[j]].choices[0] != theses[i].teacher) {
				not_chosen++;
			}
		}
		theses[i].choices[0] = first;
		theses[i].choices[1] = second;
		theses[i].choices[2] = third;
		theses[i].not_chosen = not_chosen;
		theses[i].chosen = first + second + third;
	}

	matchRound = 1;

	while (matchRound < 5) {
		runWeightedMatch(matchRound);
		matchRound++;
	}

	oneAttaTime();
	anyLeft();
	printResults();
	students_small = {
		"students": []
	};
	for (i = 0; i < students.length; i++) {
		var s = {
			"id": students[i].id,
			"NetID": students[i].NetID,
			"choices": students[i].choices,
			"thesis": students[i].thesis,
			//"current": students[i].current,
			"name": students[i].name
		}
		students_small.students.push(s);
	}
	var postdata = {
		'theses': theses,
		'students': students_small
	};
	$.ajax({
		url: "savelog.php",
		type: "POST",
		data: postdata,
		success: function(result) {
			console.log("success! " + result);
			window.close();
		}
	});

}

//==========================================
// T H I S  W A S  T H E  M A I N  O N E
//==========================================



// ************************** FUNCTION DECLARATIONS ************************** //

function getChoice(section, choice) {
	//"section" = theses.teacher
	//choice = index in choice array
	var choosers = [];
	for (var i = 0; i < students.length; i++) {
		if (students[shuffled_ids[i]].choices[choice] == section) {
			choosers.push(shuffled_ids[i]);
		}
	}
	console.log("Choosers of section " + section + " are:");
	console.log(choosers);
	return choosers;
}

function addStudent(student, section) {
	//console.log("Add Student Called");
	//console.log("Student.thesis is: " + student.thesis);
	if (student.thesis < 0) {
		//console.log("Student Thesis < 0");
		student.thesis = section;
		theses[section].enrolled.push(student.id);

		console.log("Student " + student.name + " added to " + theses[section].teacher + "!");
	}
}

function printResults() {
	var c = $('li.blank').clone();
	c.removeClass('blank');
	c.removeClass('off');
	c.addClass('i-' + iteration);
	// c.find('h1').html('Iteration '+iteration);
	$('li.blank').before(c);

	// Print to screen
	for (var i = 0; i < theses.length; i++) {
		var pr = '';
		var en = '';
		for (var j = 0; j < theses[i].teacher_pref.length; j++) {
			pr += students[theses[i].teacher_pref[j]].name;
			pr += ', ';
		}
		for (var j = 0; j < theses[i].enrolled.length; j++) {
			en += students[theses[i].enrolled[j]].name;
			en += ', ';
		}
		pr = pr.substr(0, pr.length - 2);
		en = en.substr(0, en.length - 2);
		$('.i-' + iteration + ' .theses tbody').append('<tr><td>' + theses[i].teacher + '</td><td>' + theses[i].choices[0] + '</td><td>' + theses[i].choices[1] + '</td><td>' + theses[i].choices[2] + '</td><td>' + theses[i].chosen + '</td><td>' + theses[i].not_chosen + '</td><td>' + pr + '</td><td>' + en + '</td></tr>');
	}
}

function runWeightedMatch(r) {
	//r = match round
	console.log("Running weighted match for round " + r);

	//w = weight level 
	//(for each round, e.g. 1st choice, 2nd choice, 3rd choice, etc)
	//interate through every weight level starting with highest
	//and fire match attempts for all students who weighted a Match Type
	//(teacher, interst or peer) at that level, ONLY if a certain number
	//of match attempts for highest-weighted type(s) have been made

	var w = 10;

	while (w > 0) {

		for (var j = 0; j < students.length; j++) {
			var thisStudent = students[shuffled_ids[j]];

			if (thisStudent.thesis < 0) {


				if (thisStudent.matchAttempts.byTeacher < r && thisStudent.weights.teacherWt >= w) {
					var shouldRun = checkIfShouldRun(thisStudent, 't');

					if (shouldRun) {
						matchTeacher(thisStudent, false);
					}
					//run teacher match for all prefs lower than this iteration (r)
				}

				if (thisStudent.matchAttempts.byInterest < r && thisStudent.weights.interestWt >= w) {
					var shouldRun = checkIfShouldRun(thisStudent, 'i');

					if (shouldRun) {
						matchTeacher(thisStudent, true);
					}
					//run teacher match BY INTEREST for all prefs lower than this iteration
				}

				if (thisStudent.matchAttempts.byPeer < r && thisStudent.weights.peerWt >= w) {
					//check if any peers already in w/ space, 
					//else push to peer buffer
					var shouldRun = checkIfShouldRun(thisStudent, 'p');

					if (shouldRun) {
						matchByPeers(thisStudent);
					}
				}
			}
		}
		w--;
	}
}

function matchTeacher(s, matchByInterests) {
	//if matchByInterest is true, fill in interest match variables
	//otherwise, use teacher match variables

	var choiceToMatch = [];
	var maxAttempts = 0;

	if (matchByInterests) {
		console.log("Running Match Interests");
		s.matchAttempts.byInterest++;
		maxAttempts = s.matchAttempts.byInterest;
		choiceToMatch = s.choicesByInterest;
	} else {
		console.log("Running Match Teacher");
		s.matchAttempts.byTeacher++;
		maxAttempts = s.matchAttempts.byTeacher;
		choiceToMatch = s.choices;
	}

	var matchFound = false;

	for (var i = 0; i < maxAttempts; i++) {
		for (var j in theses) {
			//console.log("Checking " + s.choices[i] + " vs " + theses[j].teacher);
			if (choiceToMatch[i] == theses[j].teacher) {
				//console.log("Match found! Trying to add " + s.username + " to " + theses[j].teacher);
				var thisSection = theses[j];
				if (thisSection.enrolled.length < thisSection.maxSize) {
					addStudent(s, j);
					matchFound = true;
					break;
				}
			}
		}
	}

	//checks peer buffer for any students to pull in
	if (matchFound && theses[s.thesis].enrolled.length < theses[s.thesis].maxSize) {
		peerMatchBuffer.forEach(function(peerIndex) {
			var otherStudent = students[peerIndex];

			//s.matchattempts could also be matchRound
			for (var i = 0; i < maxAttempts; i++) {

				if (otherStudent.peers.length > i) {
					if (otherStudent.peers[i] == s.id) {
						console.log("Peer " + otherStudent.username + " found in buffer. Adding...");
						addStudent(otherStudent, s.thesis);
					}
				}
			}

		});
	}
}

// function matchByInterests(s) {
// 	s.matchAttempts.byInterest++;
// 	console.log("Running Match Interests");
// 	for (var i = 0; i < s.matchAttempts.byInterest; i++) {
// 		for (var j in theses) {
// 			if (s.choicesByInterest[i] == theses[j].teacher) {
// 				var thisSection = theses[j];
// 				if (thisSection.enrolled.length < thisSection.maxSize) {
// 					addStudent(s, j);
// 					break;
// 				}
// 			}
// 		}
// 	}
// }



function matchByPeers(s) {
	s.matchAttempts.byPeer++;
	console.log("Running Match Peers");
	var matchedWithPeer = false;

	for (var p = 0; p < s.matchAttempts.byPeer; p++) {
		//for (p in s.peers) {
		if (s.peers.length > p) {
			var peerIndex = s.peers[p];
			if (students[peerIndex].thesis !== -1) {
				var peerThesisIndex = students[peerIndex].thesis;
				var thesisToCheck = theses[peerThesisIndex];
				if (thesisToCheck.enrolled.length < thesisToCheck.maxSize) {
					addStudent(s, peerThesisIndex);
					matchedWithPeer = true;
					break;
				}
			}
		} else {
			break;
		}
	}

	if (!matchedWithPeer) {
		//addtopeermatchbuffer;
		peerMatchBuffer.push(s.id);
		console.log("ID " + s.id + " pushed to peerMatchBuffer");
	}
}

//This checks each match type (teacher, interest, peer)
//against how many times your higher-weighted match types have already been attempted.

//Once the number of higher-weighted match attempts is >= the difference 
//between that weight and this one, then this one will start running
function checkIfShouldRun(s, matchType) {
	var check1 = false;
	var check2 = false;

	var tWt = s.weights.teacherWt;
	var iWt = s.weights.interestWt;
	var pWt = s.weights.peerWt;
	var tTries = s.matchAttempts.byTeacher;
	var iTries = s.matchAttempts.byInterest;
	var pTries = s.matchAttempts.byPeer;

	console.log("For student " + s.username + "...");

	switch (matchType) {
		case 't':
			console.log("Checking teacher vs interest:");
			check1 = compareWts(tWt, iWt, iTries);
			console.log("Checking teacher vs peer:");
			check2 = compareWts(tWt, pWt, pTries);
			break;
		case 'i':
			console.log("Checking interest vs teacher:");
			check1 = compareWts(iWt, tWt, tTries);
			console.log("Checking interest vs peer:");
			check2 = compareWts(iWt, pWt, pTries);
			break;
		case 'p':
			console.log("Checking peer vs teacher:");
			check1 = compareWts(pWt, tWt, tTries);
			console.log("Checking peer vs interest:");
			check2 = compareWts(pWt, iWt, iTries);
			break;
	}

	if (check1 && check2) {
		console.log("This check should run!");
		return true;
	} else {
		console.log("This check should not run!");
		return false;
	}
}

function compareWts(thisWt, otherWt, otherMatchTries) {

	var otherMinusThis = otherWt - thisWt;

	console.log("OtherWt - ThisWt is " + otherMinusThis);
	console.log("and otherMatchTries is " + otherMatchTries);
	if (otherMinusThis <= otherMatchTries) {
		return true;
	} else {
		return false;
	}
}


function sortStudentsByWt() {
	var indexPlusWts = [];
	for (var j = 0; j < students.length; j++) {
		var thisStudent = students[shuffled_ids[j]];
		var item = {
			'index': shuffled_ids[j],
			'tiWt': thisStudent.weights.teacherWt + thisStudent.weights.interestWt,
			'pWt': thisStudent.weights.peerWt
		}

		indexPlusWts.push(item);
	}

	indexPlusWts.sort(function(a, b) {
		return b.tiWt - a.tiWt;
	});

	console.log("Sorted Weights: ");
	console.log(indexPlusWts);

}



function oneAttaTime() {
	console.log("Running One At A Time");
	// For all the students...
	for (var j = 0; j < students.length; j++) {

		if (students[shuffled_ids[j]].thesis < 0) {

			for (n in students[shuffled_ids[j]].choices) {

				for (i in theses) {
					// If they are not enrolled in this section and want to be...
					if (students[shuffled_ids[j]].choices[n] == theses[i].teacher && theses[i].enrolled.length < theses[i].maxSize) {
						//if (students[shuffled_ids[j]].choices[n] == i && students[shuffled_ids[j]].thesis == -1) {
						// If there's still room...

						// That student is enrolled in the section
						addStudent(students[shuffled_ids[j]], i);
						//friendIn(n, i);

					}
				}
			}
		}
	}
}



function spaceLeft(n, i) {
	// For all the students...
	for (var j = 0; j < students.length; j++) {
		// If they are not enrolled in this section and want to be...
		if (students[shuffled_ids[j]].choices[n] == i && students[shuffled_ids[j]].thesis == -1) {
			// If there's still room...
			if (theses[i].enrolled.length < theses[i].total) {
				// That student is enrolled in the section
				addStudent(students[shuffled_ids[j]], i);
			}
		}
	}
}

function anyLeft() {
	console.log("Running Any Left");
	// For each section...
	for (var j = 0; j < students.length; j++) {
		if (students[shuffled_ids[j]].thesis == -1) {
			for (var k = 0; k < theses.length; k++) {
				// If there is space left
				if (theses[k].enrolled.length < theses[k].total) {
					// Add that student
					addStudent(students[shuffled_ids[j]], k);
				}
			}
		}
	}
}



function studentsLeft() {
	var sl = [];
	for (var i = 0; i < students.length; i++) {
		if (students[shuffled_ids[i]].thesis == -1) {
			sl.push(shuffled_ids[i]);
		}
	}
	return sl;
}



function pushToVizObject(header, content) {
	vizObject[header] = content;
	console.log("After adding " + header + ", VizObject is: ");
	console.log(vizObject);
}

function dataviz() {

	console.log("Running dataviz");

	var got_first = 0;
	var got_second = 0;
	var got_third = 0;
	var got_none = 0;
	var got_one = 0;
	var got_peers = 0;

	for (var i = 0; i < students.length; i++) {
		//var thisStudent = students[shuffled_ids[i]];
		var thisStudent = students[i];
		var thesisIndex = thisStudent.thesis;
		//console.log("This Student is: " + thisStudent.username);
		//console.log("This student's thesis index is: " + thesisIndex);

		if (thisStudent.choices[0] == theses[thesisIndex].teacher) {

			got_first++;
		} else if (thisStudent.choices[1] == theses[thesisIndex].teacher) {
			got_second++;
		} else if (thisStudent.choices[2] == theses[thesisIndex].teacher) {
			got_third++;
		} else {
			got_none++;
		}


		var peers = students[shuffled_ids[i]].peers;
		var flag = false;
		for (var j = 0; j < peers.length; j++) {
			var peer_id = peers[j];
			var peer = students[peer_id];

			//need undefined because not all people have full peer lists
			if (peer !== undefined && peer.thesis == students[shuffled_ids[i]].thesis) {
				flag = true;
			}
		}
		if (flag) {
			got_peers++;
		}

	}

	got_one = got_first + got_second + got_third;

	var gotFirstPct = Math.round((got_first / students.length) * 100);

	var gotSecondPct = Math.round((got_second / students.length) * 100);

	var gotThirdPct = Math.round((got_third / students.length) * 100);

	var gotNonePct = Math.round((got_none / students.length) * 100);

	var gotOnePct = Math.round((got_one / students.length) * 100);

	var gotPeersPct = Math.round((got_peers / students.length) * 100);

	var dataviz = {
		"got_first": got_first,
		"gotFirstPct": gotFirstPct,
		"got_second": got_second,
		"gotSecondPct": gotSecondPct,
		"got_third": got_third,
		"gotThirdPct": gotThirdPct,
		"got_none": got_none,
		"gotNonePct": gotNonePct,
		"got_one": got_one,
		"gotOnePct": gotOnePct,
		"got_peers": got_peers,
		"gotPeersPct": gotPeersPct
	};

	pushToVizObject("oldViz", dataviz);

	$('.dataviz tbody').append('<tr><td>' + dataviz.got_first + ' / ' + Math.round((dataviz.got_first / students.length) * 100) + '%</td><td>' + dataviz.got_second + ' / ' + Math.round((dataviz.got_second / students.length) * 100) + '%</td><td>' + dataviz.got_third + ' / ' + Math.round((dataviz.got_third / students.length) * 100) + '%</td><td>' + dataviz.got_one + ' / ' + Math.round((dataviz.got_one / students.length) * 100) + '%</td><td>' + dataviz.got_none + ' / ' + Math.round((dataviz.got_none / students.length) * 100) + '%</td><td>' + dataviz.got_peers + ' / ' + Math.round((dataviz.got_peers / students.length) * 100) + '%</td></tr>');

}

function datavizNew(gotChoiceThreshold) {
	//gotChoiceThreshold = what minimum choice we are checking people got
	//e.g. everyone who got 3rd choice or better (threshold = 3)
	//...2nd choice or better (threshold = 2)

	console.log("Running dataviz new");

	for (s in students) {
		//var thisStudent = students[shuffled_ids[i]];
		var thisStudent = students[s];

		var results = {
			//setting 100 on first 2 so it's higher than any possible max
			"gotTeacherChoice": 100,
			"gotInterestChoice": 100,
			"gotPeers": 0

		}

		var thesisIndex = thisStudent.thesis;
		var assignedThesis = theses[thesisIndex];
		//theses[thesisIndex] = this student's assigned thesis
		for (i in thisStudent.choices) {
			if (assignedThesis.teacher == thisStudent.choices[i]) {
				results.gotTeacherChoice = i;
				break;
			}
		}

		for (i in thisStudent.choicesByInterest) {
			if (assignedThesis.teacher == thisStudent.choicesByInterest[i]) {
				results.gotInterestChoice = i;
				break;
			}
		}

		thisStudent.peers.forEach(function(peerIndex) {
			for (i in assignedThesis.enrolled) {
				var enrolledStudentIndex = assignedThesis.enrolled[i];

				if (peerIndex == enrolledStudentIndex) {
					results.gotPeers++;
					break;
				}
			}
		});

		thisStudent["results"] = results;

		console.log("Results for " + thisStudent.username + ":");
		console.log(thisStudent.results);
	}

	var teacherHighest = 0;
	var interestHighest = 0;
	var peersHighest = 0;

	var gotTopTeacher = 0;
	var gotTopInterest = 0;
	var gotOnePeer = 0;
	var gotMultPeers = 0;
	var gotNothin = 0;

	for (i in students) {

		var s = students[i];

		var tWt = s.weights.teacherWt;
		var iWt = s.weights.interestWt;
		var pWt = s.weights.peerWt;

		if (tWt >= iWt && tWt >= pWt) {
			teacherHighest++;

			if (s.results.gotTeacherChoice < gotChoiceThreshold) {
				gotTopTeacher++;
			}

		} else if (pWt > tWt && pWt >= iWt) {
			peersHighest++;

			if (s.results.gotPeers > 0) {
				gotOnePeer++;
			}
			if (s.results.gotPeers > 1) {
				gotMultPeers++;
			}

		} else {

			//console.log("Interest weighted highest for " + s.username);
			interestHighest++;

			if (s.results.gotInterestChoice < gotChoiceThreshold) {
				gotTopInterest++;
			}
		}

		if (s.results.gotTeacherChoice >= gotChoiceThreshold && s.results.gotInterestChoice >= gotChoiceThreshold && s.results.gotPeers < 1) {
			gotNothin++;
		}
	}



	//console.log("This Student is: " + thisStudent.username);
	//console.log("This student's thesis index is: " + thesisIndex);

	var gotTeacherPct = Math.round(gotTopTeacher / teacherHighest * 100);
	//gotTeacherPct = gotTeacherPct.substr(0,3);

	var gotInterestPct = Math.round(gotTopInterest / interestHighest * 100);
	//gotInterestPct = gotInterestPct.substr(0,3);

	var gotPeerPct = Math.round(gotOnePeer / peersHighest * 100);
	//gotPeerPct = gotPeerPct.substr(0,3);

	var gotPeersPct = Math.round(gotMultPeers / peersHighest * 100);
	//gotMultPeers = gotMultPeers.substr(0,3);

	var gotSomething = (students.length - gotNothin);

	var gotSomethingPct = Math.round((students.length - gotNothin) / students.length * 100);

	var dataviz = {
		"gotTopTeacher": gotTopTeacher,
		"gotTeacherPct": gotTeacherPct,
		"gotTopInterest": gotTopInterest,
		"gotInterestPct": gotInterestPct,
		"gotOnePeer": gotOnePeer,
		"gotPeerPct": gotPeerPct,
		"gotMultPeers": gotMultPeers,
		"gotPeersPct": gotPeersPct,
		"gotSomething": gotSomething,
		"gotSomethingPct": gotSomethingPct
	};

	var vizHeader = "newViz" + gotChoiceThreshold;
	pushToVizObject(vizHeader, dataviz);

	$('.datavizNew tbody').append(
		'<tr><th>Top ' + gotChoiceThreshold + '</th><td>' + gotTopTeacher + ' / ' + teacherHighest + '<br />(' + gotTeacherPct + '%)</td><td>' + gotTopInterest + ' / ' + interestHighest + '<br />(' + gotInterestPct + '%)</td><td>' + gotOnePeer + ' / ' + peersHighest + '<br />(' + gotPeerPct + '%)</td><td>' + gotMultPeers + ' / ' + peersHighest + '<br />(' + gotPeersPct + '%)</td><td>' + (students.length - gotNothin) + ' / ' + students.length + '<br />(' + Math.round((students.length - gotNothin) / students.length * 100) + '%)</td>'
	);


}
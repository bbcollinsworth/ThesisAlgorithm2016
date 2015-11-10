//IMPORTANT: 
//These arrays tell the algo which columns should combined into
//arrays/objects for each student's teacher choices, peer choices and interests

//IF THESE CHANGE IN THE ORIGINAL DATA SHEET, THEY SHOULD BE UPDATED HERE:
var teachers = [
	"Romero",
	"Carroll",
	"Irish",
	"Macklin",
	"Sebek",
	"Genova",
	"Tandefelt"
];

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

var maxSectionSize = 10;
var minSectionSize = 8;
//B.C.: maximum number of peers... MUST BE CHANGED EACH YEAR or SET TO AUTO-UPDATE
var maxPeers = 2;

var students = [];
var student_data = [];
var students_left = [];
var theses = [];
var shuffled_ids = [];

var dataviz;
var iteration;

var got_first = 0;
var got_second = 0;
var got_third = 0;
var got_none = 0;
var got_one = 0;
var got_peers = 0;
var ajaxed = false;
var numstudents = 0;

jQuery(document).ready(function($) {



	$.ajax({
		// dataType: "json",
		// url: "students.json",
		// success: function(d) {

		dataType: "text",
		url: "data/testDataClean.txt",
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
			shuffled_ids = uniqueRandom(students.length, students.length);
			theses = generateTheses();
			console.log(theses);

			getThesisInterest();
			/*
			for(var i=0;i<unshuffled_students.length;i++){
				// students[i] = unshuffled_students[i];
				students[i] = unshuffled_students[shuffled_ids[i]];
			}
*/
			// This is the algorithm
			sausage_factory();

			// Get dataviz data
			//var dataviz = dataviz();
			dataviz = dataviz();

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
			//}
			//}
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

		var newStudent = {};

		//create empty student object and split data row into columns
		var newData = dataRows[i].split("\t");
		console.log("Student Row: " + newData);

		//skip or exclude blank rows
		if (newData[0] != "") {

			//create an object property for each column header
			//then set value as the data in that column for this student
			$.each(headers, function(j, header) {
				//console.log("This Header Is: " + header);
				header.toString();
				newStudent[header] = newData[j];
				console.log(header + ": " + newData[j]);
			});

			//push new student object to array
			parsedArray.push(newStudent);
			console.log("New Student: ");
			console.log(newStudent);
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

		//B.C. : PARSE STUDENTS' THESIS TEACHER 1ST, 2ND, 3RD CHOICES INTO ARRAY:
		//var choices = rawStudents[N].choices;
		//var choicesArr = (true) ? choices.split(" ") : "";

		var choicesArr = [];

		choiceHeaders.forEach(function(choice) {
			//split teacher name by space to get last name
			var splitName = thisStudent[choice].split(' ');
			var teacherLastName = splitName[splitName.length - 1];
			choicesArr.push(teacherLastName);
		});
		//console.log(choicesArr);

		var formArr = thisStudent.form.split(", ");
		formArr.forEach(function(formItem) {
			//formItem.replace('""','"');
			noQuotesArr = formItem.split('"');
			formItem = "";
			noQuotesArr.forEach(function(el) {
				formItem += el;
			});
		})
		var lensArr = thisStudent.lens.split(", ");
		lensArr.forEach(function(formItem) {
			formItem.replace('""', '"');
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
				"thesis": -1 // -1 means they haven't been placed in a real thesis section yet
			}
			//counter++;
		student_data.push(s);
		console.log("New Processed Student:");
		console.log(s);
	}
}

function generateTheses() {
	var sections = [];
	for (var i = 0; i < teachers.length; i++) {
		// if teacher doesn't have a student preference(?) add a blank array
		//if (!prefs[i]) {
		p = [];
		//} else {
		// otherwise make p their set of preferences
		//p = prefs[i];
		//}

		sections[i] = {
			"id": i,
			"teacher": teachers[i],
			"total": maxSectionSize,
			"maxSize": maxSectionSize,
			"minSize": minSectionSize,
			"enrolled": [],
			"teacher_pref": p,
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

	// Pre-Iteration (uncontested sections)
	// For each section...
	console.log("Checking for uncontested sections...");
	for (var i = 0; i < theses.length; i++) {
		// See how many people picked it as their first choice. i=thesis section, 0=1st choice
		//var choosers = getChoice(i, 0);
		var choosers = getChoice(theses[i].teacher, 0);
		// If the number of 1st choice students is less than the total allowable students for that section...
		if (choosers.length <= theses[i].total) {
			console.log("Choosers less than thesis max for " + theses[i].teacher + "! Adding....");
			// Add them all to that section
			for (var j = 0; j < choosers.length; j++) {
				// add student to thesis without any other checks
				//console.log("Trying to add student: ");
				//console.log(students[choosers[j]]);
				addStudent(students[choosers[j]], i);
			}
		}
	}


	// The remaining sections are contested
	// Iterations (x3) 1st, 2nd, & 3rd choices for thesis
	for (var n = 0; n < 3; n++) {
		console.log("Doing contested sections for Choice " + (n + 1));
		// For each section...
		for (var i = 0; i < theses.length; i++) {
			// Find out which students selected that section as this iteration's choice (1st, 2nd, or 3rd). i=thesis section, n=choice, 1-3
			//var choosers = getChoice(i, n);
			var choosers = getChoice(theses[i].teacher, 0);
			teacher_chosen = 0;
			teacherChoice(i, choosers);
		}

		for (var i = 0; i < theses.length; i++) {
			oneAttaTime(n, i);
		}

		for (var i = 0; i < theses.length; i++) {
			//if (teacher_chosen > 0) {
			//friendIn(n, i);
			//}
		}
		for (var i = 0; i < theses.length; i++) {
			//friendOut(n, i);
		}
		// for (var i = 0; i < theses.length; i++) {
		// 	oneAttaTime(n, i);
		// }
		// Repeat for 2nd & 3rd choices...
	}
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
		$('.i-' + iteration + ' .theses tbody').append('<tr><td>' + teachers[i] + '</td><td>' + theses[i].choices[0] + '</td><td>' + theses[i].choices[1] + '</td><td>' + theses[i].choices[2] + '</td><td>' + theses[i].chosen + '</td><td>' + theses[i].not_chosen + '</td><td>' + pr + '</td><td>' + en + '</td></tr>');
	}
}


function oneAttaTime(n, i) {
	console.log("Running One At A Time");
	// For all the students...
	for (var j = 0; j < students.length; j++) {
		// If they are not enrolled in this section and want to be...
		if (students[shuffled_ids[j]].choices[n] == theses[i].teacher && students[shuffled_ids[j]].thesis == -1) {
		//if (students[shuffled_ids[j]].choices[n] == i && students[shuffled_ids[j]].thesis == -1) {
			// If there's still room...
			if (theses[i].enrolled.length < theses[i].total) {
				// That student is enrolled in the section
				addStudent(students[shuffled_ids[j]], i);
				friendIn(n, i);

				//is friend out problematic? it puts you in if one of your peer selects is in the class,
				//even if they didn't select you

				//WILL RUN AT END OF ROUND ANYWAY
				//friendOut(n, i);
			}
		}
	}
}


function teacherChoice(i, choosers) {
	//B.C. : REVERSED THESE FOR LOOPS TO RANDOMIZE ORDER TEACHER-CHOSEN STUDENTS ARE ADDED TO CLASS
	for (var k = 0; k < choosers.length; k++) {
		for (var j = 0; j < theses[i].teacher_pref.length; j++) {

			// If the teacher selected any of those students... 
			if (choosers[k] == theses[i].teacher_pref[j]) {
				// Add them to that section
				addStudent(students[choosers[k]], i);
				teacher_chosen++;
			}
		}
	}
}



function friendIn(n, i) {

	console.log("Running friend in");

	// RUN THE WHOLE THING AGAIN FOR NON-TEACHER PICKS...

	// reset the peer index (to loop through peer arrays of all non-teacher picks)
	peerIndex = 0;
	// As long as we're still within the maximum number of peers allowed...
	// while (peerIndex < maxPeers) {

	//this allows more peers if someone gets their 2nd or 3rd choice
	var peersAllowed = n+1;
	while (peerIndex < peersAllowed) {
		console.log("Peer Index is: " + peerIndex);

		// For all the students...

		for (var j = 0; j < students.length; j++) {

			var thisStudent = students[shuffled_ids[j]];

			// Check to see if this student still has peers in their peer array
			// (since students can select fewer peers than the max)

			// If they are now enrolled in this section and and there's room...
			if (thisStudent.thesis == i && theses[i].enrolled.length < theses[i].total) {
				// If they are now enrolled in this section...

				//create a counter to advance through peers, searching for a peer who ranked this section
				if (peerIndex < thisStudent.peers.length) {
					var peerIndexAdvance = 0;

					// Cycle through that sutdents peers and find the first one (if any) who ranked this section as their choice for this iteration (1st, 2nd, 3rd)
					while (peerIndexAdvance < thisStudent.peers.length - peerIndex) {
						var tempIndex = peerIndex + peerIndexAdvance;
						var peerID = thisStudent.peers[tempIndex];
						//console.log("Peer" + peerID + " of " + thisStudent.name);
						//console.log(students[peerID]);

						if (students[peerID] !== undefined && students[peerID].choices[n] !== undefined && students[peerID].choices[n] == theses[i].teacher && students[peerID].thesis == -1) {

							addStudent(students[peerID], i);
							//console.log("Peer " + students[peerID].name + " of " + thisStudent.name + " added to " + i + "!");
							break;
						} else {
							peerIndexAdvance++;
						}

					}
				}

			}
		}

		peerIndex++;
	}
}


function friendOut(n, i) {

	console.log("Running Friend Out");
	// For all the students...
	for (var j = 0; j < students.length; j++) {
		// If they are not enrolled in this section and want to be...
		var thisStudent = students[shuffled_ids[j]];
		//console.log("Peers for " + thisStudent.username + " are:");
		//console.log(thisStudent.peers);
		if (thisStudent.choices[n] == theses[i].teacher && thisStudent.thesis == -1) {
			
			//CHANGED THIS TO BE MAX PEERS:
			var peersToRunThrough = maxPeers;

			if (thisStudent.peers.length < maxPeers){
				peersToRunThrough = thisStudent.peers.length;
			}

			for (var k = 0; k < peersToRunThrough; k++) {
			//for (var k = 0; k < thisStudent.peers.length; k++) {
				// If any of their peers are already enrolled in the section and there's still room...
				var peerID = thisStudent.peers[k];
				if (students[peerID].thesis == i && theses[i].enrolled.length < theses[i].total) {
					// That student is enrolled in the section
					addStudent(thisStudent, i);
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

function dataviz() {

	for (var i = 0; i < students.length; i++) {
		var thisStudent = students[shuffled_ids[i]];
		var thesisIndex = thisStudent.thesis;
		//console.log(thisStudent.name);
		//console.log(theses[thesisIndex].teacher);
		if (thisStudent.choices[0] == theses[thesisIndex].teacher) {

			got_first++;
		} else if (thisStudent.choices[1] == theses[thesisIndex].teacher) {
			got_second++;
		} else if (thisStudent.choices[2] == theses[thesisIndex].teacher) {
			got_third++
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

	console.log(got_first + ", " + got_second + ", " + got_third + ", " + got_one + ", " + got_none + ", " + got_peers);

	var dataviz = {
		"got_first": got_first,
		"got_second": got_second,
		"got_third": got_third,
		"got_none": got_none,
		"got_one": got_one,
		"got_peers": got_peers
	}



	$('.dataviz tbody').append('<tr><td>' + dataviz.got_first + ' -> ' + (dataviz.got_first / students.length) * 100 + '%</td><td>' + dataviz.got_second + ' -> ' + (dataviz.got_second / students.length) * 100 + '%</td><td>' + dataviz.got_third + ' -> ' + (dataviz.got_third / students.length) * 100 + '%</td><td>' + dataviz.got_one + ' -> ' + (dataviz.got_one / students.length) * 100 + '%</td><td>' + dataviz.got_none + ' -> ' + (dataviz.got_none / students.length) * 100 + '%</td><td>' + dataviz.got_peers + ' -> ' + (dataviz.got_peers / students.length) * 100 + '%</td></tr>');


}
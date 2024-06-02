// Javascript for the Groove Scribe HTML application
// Groove Scribe is for drummers and helps create sheet music with an easy to use WYSIWYG groove editor.
//
// Author: Lou Montulli
// Original Creation date: Feb 2015.
//
//  Copyright 2015-2020 Lou Montulli, Mike Johnston
//
//  This file is part of Project Groove Scribe.
//
//  Groove Scribe is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 2 of the License, or
//  (at your option) any later version.
//
//  Groove Scribe is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with Groove Scribe.  If not, see <http://www.gnu.org/licenses/>.

// GrooveWriter class.   The only one in this file.

/*jslint browser:true devel:true */

// global constants
var constant_MAX_MEASURES = 10;
var constant_DEFAULT_TEMPO = 80;
var constant_ABC_STICK_R = '"R"x';
var constant_ABC_STICK_L = '"L"x';
var constant_ABC_STICK_BOTH = '"R/L"x';
var constant_ABC_STICK_COUNT = '"count"x';
var constant_ABC_STICK_OFF = '""x';
var constant_ABC_HH_Ride = "^A'";
var constant_ABC_HH_Ride_Bell = "^B'";
var constant_ABC_HH_Cow_Bell = "^D'";
var constant_ABC_HH_Crash = "^c'";
var constant_ABC_HH_Stacker = "^d'";
var constant_ABC_HH_Metronome_Normal = "^e'";
var constant_ABC_HH_Metronome_Accent = "^f'";
var constant_ABC_HH_Open = "!open!^g";
var constant_ABC_HH_Close = "!plus!^g";
var constant_ABC_HH_Accent = "!accent!^g";
var constant_ABC_HH_Normal = "^g";
var constant_ABC_SN_Ghost = "!(.!!).!c";
var constant_ABC_SN_Accent = "!accent!c";
var constant_ABC_SN_Normal = "c";
var constant_ABC_SN_XStick = "^c";
var constant_ABC_SN_Buzz = "!///!c";
var constant_ABC_SN_Flam = "!accent!{/c}c";
var constant_ABC_SN_Drag = "{/cc}c";
var constant_ABC_KI_SandK = "[F^d,]"; // kick & splash
var constant_ABC_KI_Splash = "^d,"; // splash only
var constant_ABC_KI_Normal = "F";
var constant_ABC_T1_Normal = "e";
var constant_ABC_T2_Normal = "d";
var constant_ABC_T3_Normal = "B";
var constant_ABC_T4_Normal = "A";
var constant_NUMBER_OF_TOMS = 4;
var constant_ABC_OFF = false;

class MeasureText {
	// Upper text for measure number.
	// In ABC notation as "^text" at the appropriate measure begin or end.
	// (int, Boolean, String)
	constructor(measure, begin, text) {
		this.measure = measure;
		this.begin = begin;
		this.text = text;
	}
}

// callback class for abc generator library
class SVGLibCallback {
	constructor() {
		// -- required methods
		this.abc_svg_output = "";
		this.abc_error_output = "";

		// include a file (%%abc-include)
		this.read_file = function (fn) {
			return "";
		};
		// insert the errors
		this.errmsg = function (msg, l, c) {
			this.abc_error_output += msg + "<br/>\n";
		};

		// annotations
		this.svg_highlight_y = 0;
		this.svg_highlight_h = 44;

		// image output
		this.img_out = function (str) {
			this.abc_svg_output += str; // + '\n'
		};

		// -- optional attributes
		this.page_format = true; // define the non-page-breakable blocks
	}
}

class GrooveData {
	constructor() {
		this.notesPerMeasure = 16;
		this.timeDivision = 16;
		this.numberOfMeasures = 1;
		this.numBeats = 4;  // TimeSigTop: Top part of Time Signture 3/4, 4/4, 5/4, 6/8, etc...
		this.noteValue = 4; // TimeSigBottom: Bottom part of Time Sig   4 = quarter notes, 8 = 8th notes, 16ths, etc..
		this.class_empty_note_array = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
		this.sticking_array = this.class_empty_note_array.slice(0); // copy by value
		this.hh_array = this.class_empty_note_array.slice(0);    // copy by value
		this.snare_array = this.class_empty_note_array.slice(0); // copy by value
		this.kick_array = this.class_empty_note_array.slice(0);  // copy by value
		// toms_array contains 4 toms  T1, T2, T3, T4 index starting at zero
		this.toms_array = [this.class_empty_note_array.slice(0), this.class_empty_note_array.slice(0), this.class_empty_note_array.slice(0), this.class_empty_note_array.slice(0)];
		this.showToms = false;
		this.showStickings = false;
		this.title = "";
		this.author = "";
		this.comments = "";
		this.showLegend = false;
		this.tempo = constant_DEFAULT_TEMPO;
		this.kickStemsUp = true;
		this.debugMode = this.debugMode;
		this.grooveDBAuthoring = this.grooveDBAuthoring;
		this.viewMode = this.viewMode;

		this.repeatBegins = []
		this.repeatEnds = []
		this.repeatEndings = new Map()
		this.measureText = new Map()
	}
}

class GrooveUtils {
	constructor() {

		this.abc_obj = null;

		// array that can be used to map notes to the SVG generated by abc2svg
		this.note_mapping_array = null;

		// debug & special view
		this.debugMode = false;
		this.viewMode = true;  // by default to prevent screen flicker
		this.grooveDBAuthoring = false;

		this.isLegendVisable = false;

		// integration with third party components
		this.noteCallback = null;  //function triggered when a note is played
		this.playEventCallback = null;  //triggered when the play button is pressed
		this.repeatCallback = null;  //triggered when a groove is going to be repeated
		this.tempoChangeCallback = null;  //triggered when the tempo changes.  ARG1 is the new Tempo integer (needs to be very fast, it can get called a lot of times from the slider)


		this.visible_context_menu = false; // a single context menu can be visible at a time.

		this.myGrooveData = new GrooveData();
		this.abcToSVGCallback = new SVGLibCallback(); // singleton
	}


	getQueryVariableFromString(variable, def_value, my_string) {
		var query = my_string.substring(1);
		var vars = query.split("&");
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split("=");
			if (pair[0].toLowerCase() == variable.toLowerCase()) {
				return pair[1];
			}
		}
		return (def_value);
	}

	// the notes per measure is calculated from the note division and the time signature
	// in 4/4 time the division is the division (as well as any time signature x/x)
	// in 4/8 the num notes is half as many, etc
	calc_notes_per_measure(division, time_sig_top, time_sig_bottom) {
		var numNotes = (division / time_sig_bottom) * time_sig_top;
		return numNotes;
	}

	// figure it out from the division  Division is number of notes per measure 4, 6, 8, 12, 16, 24, 32, etc...
	// Triplets only support 4/4 and 2/4 time signatures for now
	isTripletDivision(division) {
		if (division % 12 === 0)  // we only support 12 & 24 & 48  1/8th, 1/16, & 1/32 note triplets
			return true;
		return false;
	}

	// figure out if it is triplets from the number of notes (implied division)
	isTripletDivisionFromNotesPerMeasure(notesPerMeasure, timeSigTop, timeSigBottom) {
		var division = (notesPerMeasure / timeSigTop) * timeSigBottom;
		return this.isTripletDivision(division);
	}

	// build a string that looks like this
	//  |----------------|----------------|
	GetEmptyGroove(notes_per_measure, numMeasures) {
		var retString = "";
		var oneMeasureString = "|";
		var i;

		for (i = 0; i < notes_per_measure; i++) {
			oneMeasureString += "-";
		}
		for (i = 0; i < numMeasures; i++)
			retString += oneMeasureString;
		retString += "|";

		return retString;
	}

	GetDefaultStickingsGroove(notes_per_measure, timeSigTop, timeSigBottom, numMeasures) {
		return this.GetEmptyGroove(notes_per_measure, numMeasures);
	}

	// build a string that looks like this
	// "|x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-|";
	GetDefaultHHGroove(notes_per_measure, timeSigTop, timeSigBottom, numMeasures) {
		var retString = "";
		var oneMeasureString = "|";
		var i;

		for (i = 0; i < notes_per_measure; i++) {
			if (notes_per_measure == 48)
				oneMeasureString += "-";
			else
				oneMeasureString += "x";
		}
		for (i = 0; i < numMeasures; i++)
			retString += oneMeasureString;
		retString += "|";

		return retString;
	}

	GetDefaultTom1Groove(notes_per_measure, timeSigTop, timeSigBottom, numMeasures) {
		return this.GetEmptyGroove(notes_per_measure, numMeasures);
	}

	GetDefaultTom4Groove(notes_per_measure, timeSigTop, timeSigBottom, numMeasures) {
		return this.GetEmptyGroove(notes_per_measure, numMeasures);
	}

	// build a string that looks like this
	// |--------O---------------O-------|
	GetDefaultSnareGroove(notes_per_measure, timeSigTop, timeSigBottom, numMeasures) {
		var retString = "";
		var oneMeasureString = "|";
		var i;
		var notes_per_grouping = (notes_per_measure / timeSigTop);

		for (i = 0; i < notes_per_measure; i++) {
			// if the note falls on the beginning of a group
			// and the group is odd
			if (i % notes_per_grouping === 0 && (i / notes_per_grouping) % 2 !== 0)
				oneMeasureString += "O";
			else
				oneMeasureString += "-";
		}
		for (i = 0; i < numMeasures; i++)
			retString += oneMeasureString;
		retString += "|";

		return retString;
	}

	// build a string that looks like this
	// |o---------------o---------------|
	GetDefaultKickGroove(notes_per_measure, timeSigTop, timeSigBottom, numMeasures) {
		var retString = "";
		var oneMeasureString = "|";
		var i;
		var notes_per_grouping = (notes_per_measure / timeSigTop);

		for (i = 0; i < notes_per_measure; i++) {
			// if the note falls on the beginning of a group
			// and the group is even
			if (i % notes_per_grouping === 0 && (i / notes_per_grouping) % 2 === 0)
				oneMeasureString += "o";
			else
				oneMeasureString += "-";
		}
		for (i = 0; i < numMeasures; i++)
			retString += oneMeasureString;
		retString += "|";

		return retString;
	}

	GetDefaultTomGroove(notes_per_measure, timeSigTop, timeSigBottom, numMeasures) {
		return this.GetEmptyGroove(notes_per_measure, numMeasures);
	}

	// takes a character from tablature form and converts it to our ABC Notation form.
	// uses drum tab format adapted from wikipedia: http://en.wikipedia.org/wiki/Drum_tablature
	//
	//  Sticking support:
	//		R: right
	//    L: left
	//
	//  HiHat support:
	//		x: normal
	//		X: accent
	//		o: open
	//		+: close
	//		c: crash
	//		r: ride
	//		b: ride bell
	//		m: (more) cow bell
	//    s: stacker
	//    n: metroNome normal
	//    N: metroNome accent
	//		-: off
	//
	//   Snare support:
	//		o: normal
	//		O: accent
	//		g: ghost
	//		x: cross stick
	//		f: flam
	//		-: off
	//
	//   Kick support:
	//		o: normal
	//		x: hi hat splash with foot
	//		X: kick & hi hat splash with foot simultaneously
	//
	//  Kick can be notated either with a "K" or a "B"
	//
	//  Note that "|" and " " will be skipped so that standard drum tabs can be applied
	//  Example:
	//     H=|x---x---x---x---|x---x---x---x---|x---x---x---x---|
	// or  H=x-x-x-x-x-x-x-x-x-x-x-x-
	//     S=|----o-------o---|----o-------o---|----o-------o---|
	// or  S=--o---o---o---o---o---o-
	//     B=|o-------o-------|o-------o-o-----|o-----o-o-------|
	// or  K=o---o---o----oo-o--oo---|
	// or  T1=|o---o---o---o|
	// or  T2=|o---o---o---o|
	// or  T3=|o---o---o---o|
	// or  T4=|o---o---o---o|
	tablatureToABCNotationPerNote(drumType, tablatureChar) {

		switch (tablatureChar) {
			case "b":
			case "B":
				if (drumType == "Stickings")
					return constant_ABC_STICK_BOTH;
				else if (drumType == "H")
					return constant_ABC_HH_Ride_Bell;
				else if (drumType == "S")
					return constant_ABC_SN_Buzz;
				break;
			case "c":
				if (drumType == "Stickings")
					return constant_ABC_STICK_COUNT;
				else if (drumType == "H")
					return constant_ABC_HH_Crash;
				break;
			case "d":
				if (drumType == "S")
					return constant_ABC_SN_Drag;
				break;
			case "f":
				if (drumType == "S")
					return constant_ABC_SN_Flam;
				break;
			case "g":
				if (drumType == "S")
					return constant_ABC_SN_Ghost;
				break;
			case "l":
			case "L":
				if (drumType == "Stickings")
					return constant_ABC_STICK_L;
				break;
			case "m":  // (more) cow bell
				if (drumType == "H")
					return constant_ABC_HH_Cow_Bell;
				break;
			case "n":  // (more) cow bell
				if (drumType == "H")
					return constant_ABC_HH_Metronome_Normal;
				break;
			case "N":  // (more) cow bell
				if (drumType == "H")
					return constant_ABC_HH_Metronome_Accent;
				break;
			case "O":
				if (drumType == "S")
					return constant_ABC_SN_Accent;
				break;
			case "o":
				switch (drumType) {
					case "H":
						return constant_ABC_HH_Open;
					//break;
					case "S":
						return constant_ABC_SN_Normal;
					//break;
					case "K":
					case "B":
						return constant_ABC_KI_Normal;
					//break;
					case "T1":
						return constant_ABC_T1_Normal;
					//break;
					case "T2":
						return constant_ABC_T2_Normal;
					//break;
					case "T3":
						return constant_ABC_T3_Normal;
					//break;
					case "T4":
						return constant_ABC_T4_Normal;
					//break;
					default:
						break;
				}
				break;
			case "r":
			case "R":
				switch (drumType) {
					case "H":
						return constant_ABC_HH_Ride;
					//break;
					case "Stickings":
						return constant_ABC_STICK_R;
					//break;
					default:
						break;
				}
				break;
			case "s":
				if (drumType == "H")
					return constant_ABC_HH_Stacker;
				break;
			case "x":
				switch (drumType) {
					case "S":
						return constant_ABC_SN_XStick;
					//break;
					case "K":
					case "B":
						return constant_ABC_KI_Splash;
					//break;
					case "H":
						return constant_ABC_HH_Normal;
					//break;
					case "T1":
						return constant_ABC_T1_Normal;
					//break;
					case "T4":
						return constant_ABC_T4_Normal;
					//break;
					default:
						break;
				}
				break;
			case "X":
				switch (drumType) {
					case "K":
						return constant_ABC_KI_SandK;
					//break;
					case "H":
						return constant_ABC_HH_Accent;
					//break;
					default:
						break;
				}
				break;
			case "+":
				if (drumType == "H") {
					return constant_ABC_HH_Close;
				}
				break;
			case "-":
				return false;
			//break;
			default:
				break;
		}

		console.log("Bad tablature note found in tablatureToABCNotationPerNote.  Tab: " + tablatureChar + " for drum type: " + drumType);
		return false;
	}

	// same as above, but reversed
	abcNotationToTablaturePerNote(drumType, abcChar) {
		var tabChar = "-";

		switch (abcChar) {
			case constant_ABC_STICK_R:
				tabChar = "R";
				break;
			case constant_ABC_STICK_L:
				tabChar = "L";
				break;
			case constant_ABC_STICK_BOTH:
				tabChar = "B";
				break;
			case constant_ABC_STICK_OFF:
				tabChar = "-";
				break;
			case constant_ABC_STICK_COUNT:
				tabChar = "c";
				break;
			case constant_ABC_HH_Ride:
				tabChar = "r";
				break;
			case constant_ABC_HH_Ride_Bell:
				tabChar = "b";
				break;
			case constant_ABC_HH_Cow_Bell:
				tabChar = "m";
				break;
			case constant_ABC_HH_Crash:
				tabChar = "c";
				break;
			case constant_ABC_HH_Stacker:
				tabChar = "s";
				break;
			case constant_ABC_HH_Metronome_Normal:
				tabChar = "n";
				break;
			case constant_ABC_HH_Metronome_Accent:
				tabChar = "N";
				break;
			case constant_ABC_HH_Open:
				tabChar = "o";
				break;
			case constant_ABC_HH_Close:
				tabChar = "+";
				break;
			case constant_ABC_SN_Accent:
				tabChar = "O";
				break;
			case constant_ABC_SN_Buzz:
				tabChar = "b";
				break;
			case constant_ABC_HH_Normal:
			case constant_ABC_SN_XStick:
				tabChar = "x";
				break;
			case constant_ABC_SN_Ghost:
				tabChar = "g";
				break;
			case constant_ABC_SN_Normal:
			case constant_ABC_KI_Normal:
			case constant_ABC_T1_Normal:
			case constant_ABC_T2_Normal:
			case constant_ABC_T3_Normal:
			case constant_ABC_T4_Normal:
				tabChar = "o";
				break;
			case constant_ABC_SN_Flam:
				tabChar = "f";
				break;
			case constant_ABC_SN_Drag:
				tabChar = "d";
				break;
			case constant_ABC_HH_Accent:
			case constant_ABC_KI_SandK:
				tabChar = "X";
				break;
			case constant_ABC_KI_Splash:
				tabChar = "x";
				break;
			case constant_ABC_OFF:
				tabChar = "-";
				break;
			default:
				console.log("bad case in abcNotationToTablaturePerNote: " + abcChar);
				break;
		}

		return tabChar;
	}

	// takes a string of notes encoded in a serialized string and convert it to an array that represents the notes
	// uses drum tab format adapted from wikipedia: http://en.wikipedia.org/wiki/Drum_tablature
	//
	//  Note that "|" and " " will be skipped so that standard drum tabs can be applied
	//  Example:
	//     H=|x---x---x---x---|x---x---x---x---|x---x---x---x---|
	// or  H=x-x-x-x-x-x-x-x-x-x-x-x-
	//     S=|----o-------o---|----o-------o---|----o-------o---|
	// or  S=--o---o---o---o---o---o-
	//     B=|o-------o-------|o-------o-o-----|o-----o-o-------|
	// or  B=o---o---o----oo-o--oo---|
	//
	// Returns array that contains notesPerMeasure * numberOfMeasures entries.
	noteArraysFromURLData(drumType, noteString, notesPerMeasure, numberOfMeasures) {
		var retArray = [];

		// decode the %7C url encoding types
		noteString = decodeURIComponent(noteString);

		var retArraySize = notesPerMeasure * numberOfMeasures;

		// ignore "|" by removing them
		//var notes = noteString.replace(/\|/g, '');
		// ignore "|" & ")" & "(" & "[" & "]" & "!" & ":" by removing them
		var notes = noteString.replace(/\:|\!|\)|\(|\[|\]|\|/g, '');

		var noteStringScaler = 1;
		var displayScaler = 1;
		if (notes.length > retArraySize && notes.length / retArraySize >= 2) {
			// if we encounter a 16th note groove for an 8th note board, let's scale it	down
			noteStringScaler = Math.ceil(notes.length / retArraySize);
		} else if (notes.length < retArraySize && retArraySize / notes.length >= 2) {
			// if we encounter a 8th note groove for an 16th note board, let's scale it up
			displayScaler = Math.ceil(retArraySize / notes.length);
		}

		// initialize an array that can carry all the measures in one array
		for (var i = 0; i < retArraySize; i++) {
			retArray[i] = false;
		}

		var retArrayIndex = 0;
		for (var j = 0; j < notes.length && retArrayIndex < retArraySize; j += noteStringScaler, retArrayIndex += displayScaler) {
			retArray[retArrayIndex] = this.tablatureToABCNotationPerNote(drumType, notes[j]);
		}

		return retArray;
	}

	// take an array of notes in ABC format and convert it into a drum tab String
	// drumType - H, S, K, or Stickings
	// noteArray - pass in an ABC array of notes
	// getAccents - true to get accent notes.  (false to ignore accents)
	// getOthers - true to get non-accent notes.  (false to ignore non-accents)
	// maxLength - set smaller than noteArray length to get fewer notes
	// separatorDistance - set to greater than zero integer to add "|" between measures
	tabLineFromAbcNoteArray(drumType, noteArray, getAccents, getOthers, maxLength, separatorDistance) {
		var returnTabLine = "";

		if (maxLength > noteArray.length)
			maxLength = noteArray.length;

		for (var i = 0; i < maxLength; i++) {
			var newTabChar = abcNotationToTablaturePerNote(drumType, noteArray[i]);

			if (drumType == "H" && newTabChar == "X") {
				if (getAccents)
					returnTabLine += newTabChar;
				else
					returnTabLine += "-";
			} else if ((drumType == "K" || drumType == "S") && (newTabChar == "o" || newTabChar == "O")) {
				if (getAccents)
					returnTabLine += newTabChar;
				else
					returnTabLine += "-";
			} else if (drumType == "K" && newTabChar == "X") {
				if (getAccents && getOthers)
					returnTabLine += "X"; // kick & splash
				else if (getAccents)
					returnTabLine += "o"; // just kick
				else
					returnTabLine += "x"; // just splash
			} else {
				// all the "others"
				if (getOthers)
					returnTabLine += newTabChar;
				else
					returnTabLine += "-";
			}

			if ((separatorDistance > 0) && ((i + 1) % separatorDistance) === 0)
				returnTabLine += "|";
		}

		return returnTabLine;
	}

	// parse a string like "4/4", "5/4" or "2/4"
	parseTimeSigString(timeSigString) {
		var split_arr = timeSigString.split("/");

		if (split_arr.length != 2)
			return [4, 4];

		var timeSigTop = parseInt(split_arr[0], 10);
		var timeSigBottom = parseInt(split_arr[1], 10);

		if (timeSigTop < 1 || timeSigTop > 32)
			timeSigTop = 4;

		// only valid if 2,4,8, or 16
		if (timeSigBottom != 2 && timeSigBottom != 4 && timeSigBottom != 8 && timeSigBottom != 16)
			timeSigBottom = 4;

		return [timeSigTop, timeSigBottom];
	}

	parseIntSet(intSetStr) {
		if (intSetStr === "") {
			return new Set();
		}
		var split_arr = intSetStr.split(";");
		return new Set(split_arr.map((i) => parseInt(i)))
	}

	parseMeasureMapping(mapStr) {
		if (mapStr === "") {
			return new Map();
		}
		var split_arr = mapStr.split(";");
		var mapping = new Map();
		split_arr.forEach(pair => {
			// TODO(sonph): Handle errors.
			var parts = pair.split(":");
			mapping.set(parseInt(parts[0]), parts[1]);
		});
		return mapping;
	}

	parseTextMapping(mapStr) {
		if (mapStr === "") {
			return new Map();
		}
		var split_arr = mapStr.split(";");
		var mapping = new Map();
		split_arr.forEach(e => {
			var parts = e.split(":");
			var measure = parseInt(parts[0]);
			if (parts.length === 2) {
				mapping.set(measure, new MeasureText(measure, /* begin= */ true, decodeURIComponent(parts[1])));
			} else if (parts.length === 3) {
				// :b: for begin or :s: for start
				var begin = parts[1].startsWith("b") || parts[1].startsWith("s");
				mapping.set(measure, new MeasureText(measure, /* begin= */ begin, decodeURIComponent(parts[2])));
			}
		});
		return mapping;
	}

	getGrooveDataFromUrlString(encodedURLData) {
		var Stickings_string;
		var HH_string;
		var Snare_string;
		var Kick_string;
		var stickings_set_from_URL = false;
		var myGrooveData = new GrooveData();
		var i;

		// Custom add-on by @sonph
		// Measure counts from 1.
		// RepeatBegins: set of integers representing measures that we want to add begin repeat symbols.
		// RepeatEnds: set of integers representing measures that we want to add begin end symbols.
		// RepeatEndings: map of measure number to alternate ending (1, 2 ...)
		// UpperText: map of measure number to (begin, end) and text e.g. 1:b:start%20from%20here, 2:e:x2
		myGrooveData.repeatBegins = this.parseIntSet(this.getQueryVariableFromString("RepeatBegins", "", encodedURLData));
		myGrooveData.repeatEnds = this.parseIntSet(this.getQueryVariableFromString("RepeatEnds", "", encodedURLData));
		myGrooveData.repeatEndings = this.parseMeasureMapping(this.getQueryVariableFromString("RepeatEndings", "", encodedURLData));
		myGrooveData.measureText = this.parseTextMapping(this.getQueryVariableFromString("MeasureText", "", encodedURLData));

		myGrooveData.debugMode = parseInt(this.getQueryVariableFromString("Debug", this.debugMode, encodedURLData), 10);

		var timeSigArray = this.parseTimeSigString(this.getQueryVariableFromString("TimeSig", "4/4", encodedURLData));
		myGrooveData.numBeats = timeSigArray[0];
		myGrooveData.noteValue = timeSigArray[1];

		myGrooveData.timeDivision = parseInt(this.getQueryVariableFromString("Div", 16, encodedURLData), 10);
		myGrooveData.notesPerMeasure = this.calc_notes_per_measure(myGrooveData.timeDivision, myGrooveData.numBeats, myGrooveData.noteValue);

		myGrooveData.numberOfMeasures = parseInt(this.getQueryVariableFromString("measures", 1, encodedURLData), 10);
		if (myGrooveData.numberOfMeasures < 1 || isNaN(myGrooveData.numberOfMeasures))
			myGrooveData.numberOfMeasures = 1;
		else if (myGrooveData.numberOfMeasures > constant_MAX_MEASURES)
			myGrooveData.numberOfMeasures = constant_MAX_MEASURES;

		Stickings_string = this.getQueryVariableFromString("Stickings", false, encodedURLData);
		if (!Stickings_string) {
			Stickings_string = this.GetDefaultStickingsGroove(myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue, myGrooveData.numberOfMeasures);
			myGrooveData.showStickings = false;
		} else {
			myGrooveData.showStickings = true;
		}

		HH_string = this.getQueryVariableFromString("H", false, encodedURLData);
		if (!HH_string) {
			this.getQueryVariableFromString("HH", false, encodedURLData);
			if (!HH_string) {
				HH_string = this.GetDefaultHHGroove(myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue, myGrooveData.numberOfMeasures);
			}
		}

		Snare_string = this.getQueryVariableFromString("S", false, encodedURLData);
		if (!Snare_string) {
			Snare_string = this.GetDefaultSnareGroove(myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue, myGrooveData.numberOfMeasures);
		}

		Kick_string = this.getQueryVariableFromString("K", false, encodedURLData);
		if (!Kick_string) {
			this.getQueryVariableFromString("B", false, encodedURLData);
			if (!Kick_string) {
				Kick_string = this.GetDefaultKickGroove(myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue, myGrooveData.numberOfMeasures);
			}
		}

		// Get the Toms
		for (i = 0; i < 4; i++) {
			// toms are named T1, T2, T3, T4
			var Tom_string = this.getQueryVariableFromString("T" + (i + 1), false, encodedURLData);
			if (!Tom_string) {
				Tom_string = this.GetDefaultTomGroove(myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue, myGrooveData.numberOfMeasures);
			} else {
				myGrooveData.showToms = true;
			}

			/// the toms array index starts at zero (0) the first one is T1
			myGrooveData.toms_array[i] = this.noteArraysFromURLData("T" + (i + 1), Tom_string, myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);
		}

		myGrooveData.sticking_array = this.noteArraysFromURLData("Stickings", Stickings_string, myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);
		myGrooveData.hh_array = this.noteArraysFromURLData("H", HH_string, myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);
		myGrooveData.snare_array = this.noteArraysFromURLData("S", Snare_string, myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);
		myGrooveData.kick_array = this.noteArraysFromURLData("K", Kick_string, myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);

		myGrooveData.title = this.getQueryVariableFromString("title", "", encodedURLData);
		myGrooveData.title = decodeURIComponent(myGrooveData.title);
		myGrooveData.title = myGrooveData.title.replace(/\+/g, " ");

		myGrooveData.author = this.getQueryVariableFromString("author", "", encodedURLData);
		myGrooveData.author = decodeURIComponent(myGrooveData.author);
		myGrooveData.author = myGrooveData.author.replace(/\+/g, " ");

		myGrooveData.comments = this.getQueryVariableFromString("comments", "", encodedURLData);
		myGrooveData.comments = decodeURIComponent(myGrooveData.comments);
		myGrooveData.comments = myGrooveData.comments.replace(/\+/g, " ");

		myGrooveData.tempo = parseInt(this.getQueryVariableFromString("tempo", constant_DEFAULT_TEMPO, encodedURLData), 10);
		if (isNaN(myGrooveData.tempo) || myGrooveData.tempo < 20 || myGrooveData.tempo > 400)
			myGrooveData.tempo = constant_DEFAULT_TEMPO;

		var stringVal = this.getQueryVariableFromString("embedTempoTimeSig", false, encodedURLData);
		myGrooveData.embedTempoTimeSig = stringVal === "true" || stringVal === "True";

		return myGrooveData;
	}

	// the top stuff in the ABC that doesn't depend on the notes
	get_top_ABC_BoilerPlate(isPermutation, tuneTitle, tuneAuthor, tuneComments, showLegend, isTriplets, kick_stems_up, timeSigTop, timeSigBottom, renderWidth) {

		// boiler plate
		var fullABC = '%abc\n%%fullsvg _' + this.grooveUtilsUniqueIndex + '\nX:6\n';

		fullABC += "M:" + timeSigTop + "/" + timeSigBottom + "\n";

		// always add a Title even if it's blank
		fullABC += "T: " + tuneTitle + "\n";

		if (tuneAuthor !== "") {
			fullABC += "C: " + tuneAuthor + "\n";
			fullABC += "%%musicspace 20px\n"; // add some more space
		}

		if (renderWidth < 400)
			renderWidth = 400; // min-width
		if (renderWidth > 3000)
			renderWidth = 3000; // max-width
		// the width of the music is always 25% bigger than what we pass in.   Go figure.
		renderWidth = Math.floor(renderWidth * 0.75);

		fullABC += "L:1/" + (32) + "\n"; // 4/4 = 32,  6/8 = 64

		if (isPermutation)
			fullABC += "%%stretchlast 0\n";
		else
			fullABC += "%%stretchlast 1\n";

		fullABC += '%%flatbeams 1\n' +
			'%%ornament up\n' +
			'%%pagewidth ' + renderWidth + 'px\n' +
			'%%leftmargin 0cm\n' +
			'%%rightmargin 0cm\n' +
			'%%topspace 10px\n' +
			'%%titlefont calibri 20\n' +
			'%%partsfont calibri 16\n' +
			'%%gchordfont calibri 16\n' +
			'%%annotationfont calibri 16\n' +
			'%%infofont calibri 16\n' +
			'%%textfont calibri 16\n' +
			'%%deco (. 0 a 5 1 1 "@-8,-3("\n' +
			'%%deco ). 0 a 5 1 1 "@4,-3)"\n' +
			'%%beginsvg\n' +
			' <defs>\n' +
			' <path id="Xhead" d="m-3,-3 l6,6 m0,-6 l-6,6" class="stroke" style="stroke-width:1.2"/>\n' +
			' <path id="Trihead" d="m-3,2 l 6,0 l-3,-6 l-3,6 l6,0" class="stroke" style="stroke-width:1.2"/>\n' +
			' </defs>\n' +
			'%%endsvg\n' +
			'%%map drum ^g heads=Xhead print=g       % Hi-Hat\n' +
			'%%map drum ^c\' heads=Xhead print=c\'   % Crash\n' +
			'%%map drum ^d\' heads=Xhead print=d\'   % Stacker\n' +
			'%%map drum ^e\' heads=Xhead print=e\'   % Metronome click\n' +
			'%%map drum ^f\' heads=Xhead print=f\'   % Metronome beep\n' +
			'%%map drum ^A\' heads=Xhead print=A\'   % Ride\n' +
			'%%map drum ^B\' heads=Trihead print=A\' % Ride Bell\n' +
			'%%map drum ^D\' heads=Trihead print=g   % Cow Bell\n' +
			'%%map drum ^c heads=Xhead print=c  % Cross Stick\n' +
			'%%map drum ^d, heads=Xhead print=d,  % Foot Splash\n';

		if (kick_stems_up) {
			fullABC += "%%staves (Stickings Hands)\n";
		} else {
			fullABC += "%%staves (Stickings Hands Feet)\n";
		}

		// print comments below the legend if there is one, otherwise in the header section
		if (tuneComments !== "") {
			fullABC += "P: " + tuneComments + "\n";
			fullABC += "%%musicspace 20px\n"; // add some more space
		}

		// the K ends the header;
		fullABC += "K:C clef=perc\n";

		if (showLegend) {
			fullABC += 'V:Stickings\n' +
				'x8 x8 x8 x8 x8 x8 x8 x8 ||\n' +
				'V:Hands stem=up \n' +
				'%%voicemap drum\n' +
				'"^Hi-Hat"^g4 "^Open"!open!^g4 ' +
				'"^Crash"^c\'4 "^Stacker"^d\'4 "^Ride"^A\'4 "^Ride Bell"^B\'4 x2 "^Tom"e4 "^Tom"A4 "^Snare"c4 "^Buzz"!///!c4 "^Cross"^c4 "^Ghost  "!(.!!).!c4 "^Flam"{/c}c4  x10 ||\n' +
				'V:Feet stem=down \n' +
				'%%voicemap drum\n' +
				'x52 "^Kick"F4 "^HH foot"^d,4 x4 ||\n' +
				'T:\n';
		}

		// tempo setting
		//fullABC += "Q: 1/4=" + getTempo() + "\n";

		return fullABC;
	}

	// looks for modifiers like !accent! or !plus! and moves them outside of the group abc array.
	// Most modifiers (but not all) will not render correctly if they are inside the abc group.
	// returns a string that should be added to the abc_notation if found.
	moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, modifier_to_look_for) {

		var found_modifier = false;
		var rindex = abcNoteStrings.notes1.lastIndexOf(modifier_to_look_for);
		if (rindex > -1) {
			found_modifier = true;
			abcNoteStrings.notes1 = abcNoteStrings.notes1.replace(modifier_to_look_for, "");
		}
		rindex = abcNoteStrings.notes2.lastIndexOf(modifier_to_look_for);
		if (rindex > -1) {
			found_modifier = true;
			abcNoteStrings.notes2 = abcNoteStrings.notes2.replace(modifier_to_look_for, "");
		}
		rindex = abcNoteStrings.notes3.lastIndexOf(modifier_to_look_for);
		if (rindex > -1) {
			found_modifier = true;
			abcNoteStrings.notes3 = abcNoteStrings.notes3.replace(modifier_to_look_for, "");
		}
		if (found_modifier)
			return modifier_to_look_for;

		return ""; // didn't find it so return nothing
	}

	// take an array of arrays and use a for loop to test to see
	// if all of the arrays are equal to the "test_value" for a given "test_index"
	// returns "true" if they are all equal.
	// returns "false" if any one of them fails
	testArrayOfArraysForEquality(array_of_arrays, test_index, test_value) {

		for (var i = 0; i < array_of_arrays.length; i++) {
			if (array_of_arrays[i][test_index] !== undefined && array_of_arrays[i][test_index] !== test_value)
				return false;
		}

		return true;
	}

	// note1_array:   an array containing "false" or a note character in ABC to designate that is is on
	// note2_array:   an array containing "false" or a note character in ABC to designate that is is on
	// end_of_group:  when to stop looking ahead in the array.  (since we group notes in to beats)
	getABCforNote(note_array_of_arrays, start_index, end_of_group, scaler) {

		var ABC_String = "";
		var abcNoteStrings = {
			notes1: "",
			notes2: "",
			notes3: ""
		};
		var num_notes_on = 0;
		var nextCount;

		for (var which_array = 0; which_array < note_array_of_arrays.length; which_array++) {

			if (note_array_of_arrays[which_array][start_index] !== undefined && note_array_of_arrays[which_array][start_index] !== false) {
				// look ahead and see when the next note is
				// the length of this note is dependant on when the next note lands
				// for every empty space we increment nextCount, and then make the note that long
				nextCount = 1;
				for (var indexA = start_index + 1; indexA < (start_index + end_of_group); indexA++) {
					if (!this.testArrayOfArraysForEquality(note_array_of_arrays, indexA, false)) {
						break;
					} else {
						nextCount++;
					}
				}

				abcNoteStrings.notes1 += note_array_of_arrays[which_array][start_index] + (scaler * nextCount);
				num_notes_on++;
			}
		}

		if (num_notes_on > 1) {
			// if multiple are on, we need to combine them with []
			// horrible hack.  Turns out ABC will render the accents wrong unless the are outside the brackets []
			// look for any accents that are delimited by "!"  (eg !accent!  or !plus!)
			// move the accents to the front
			ABC_String += this.moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "!accent!");
			// in case there are two accents (on both snare and hi-hat) we remove the second one
			this.moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "!accent!");
			ABC_String += this.moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "!plus!");
			ABC_String += this.moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "!open!");
			ABC_String += this.moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "!///!");

			// Look for '[' and ']'.   They are added on to the the kick and splash and could be added to other notes
			// in the future.   They imply that the notes are on the same beat.   Since we are already putting multiple
			// notes on the same beat (see code below this line that adds '[' & ']'), we need to remove them or the
			// resulting ABC will be invalid
			this.moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "[");
			this.moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "]");

			// this is the flam notation, it can't be in a sub grouping
			ABC_String += this.moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "{/c}");
			// this is the drag notation, it can't be in a sub grouping
			ABC_String += this.moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "{/cc}");

			ABC_String += "[" + abcNoteStrings.notes1 + abcNoteStrings.notes2 + abcNoteStrings.notes3 + "]"; // [^gc]
		} else {
			ABC_String += abcNoteStrings.notes1 + abcNoteStrings.notes2 + abcNoteStrings.notes3; // note this could be a noOp if all strings are blank
		}

		return ABC_String;
	}

	// calculate the rest ABC string
	getABCforRest(note_array_of_arrays, start_index, end_of_group, scaler, use_hidden_rest) {
		var ABC_String = "";

		// count the # of rest
		if (this.testArrayOfArraysForEquality(note_array_of_arrays, start_index, false)) {
			var restCount = 1;
			for (var indexB = start_index + 1; indexB < (start_index + end_of_group); indexB++) {
				if (!this.testArrayOfArraysForEquality(note_array_of_arrays, indexB, false))
					break;
				else
					restCount++;
			}

			// now output a rest for the duration of the rest count
			if (use_hidden_rest)
				ABC_String += "x" + (scaler * restCount);
			else
				ABC_String += "z" + (scaler * restCount);
		}

		return ABC_String;
	}

	// when we generate ABC we use a default larger note array and transpose it
	// For 8th note triplets that means we need to use a larger grouping to make it
	// scale correctly
	// The base array is now 32 notes long to support 32nd notes
	// since we would normally group by 4 we need to group by 8 since we are scaling it
	abc_gen_note_grouping_size(usingTriplets, timeSigTop, timeSigBottom) {
		var note_grouping;

		if (usingTriplets) {
			note_grouping = 12;

		} else if (timeSigTop == 3) {
			// 3/4, 3/8, 3/16
			note_grouping = 8 * (4 / timeSigBottom)
		} else if (timeSigTop % 6 == 0 && timeSigBottom % 8 == 0) {
			// 3/4, 6/8, 9/8, 12/8
			note_grouping = 12 * (8 / timeSigBottom);
		} else {
			//note_grouping = 8 * (4/timeSigBottom);
			note_grouping = 8;
		}

		return note_grouping;
	}

	notesPerMeasureInFullSizeArray(is_triplet_division, timeSigTop, timeSigBottom) {
		// a full measure will be defined as 8 * timeSigTop.   (4 = 32, 5 = 40, 6 = 48, etc.)
		// that implies 32nd notes in quarter note beats
		// TODO: should we support triplets here?
		if (is_triplet_division)
			return 48 * (timeSigTop / timeSigBottom);
		else
			return 32 * (timeSigTop / timeSigBottom);
	}

	// since note values are 16ths or 12ths this corrects for that by multiplying note values
	// timeSigTop is the top number in a time signature (4/4, 5/4, 6/8, 7/4, etc)
	getNoteScaler(notes_per_measure, timeSigTop, timeSigBottom) {
		var scaler;

		if (!timeSigTop || timeSigTop < 1 || timeSigTop > 36) {
			console.log("Error in getNoteScaler, out of range: " + timeSigTop);
			scaler = 1;
		} else {
			if (this.isTripletDivisionFromNotesPerMeasure(notes_per_measure, timeSigTop, timeSigBottom))
				scaler = Math.ceil(this.notesPerMeasureInFullSizeArray(true, timeSigTop, timeSigBottom) / notes_per_measure);
			else
				scaler = Math.ceil(this.notesPerMeasureInFullSizeArray(false, timeSigTop, timeSigBottom) / notes_per_measure);
		}

		return scaler;
	}

	// take any size array and make it larger by padding it with rests in the spaces between
	// For triplets, expands to 48 notes per measure
	// For non Triplets, expands to 32 notes per measure
	scaleNoteArrayToFullSize(note_array, num_measures, notes_per_measure, timeSigTop, timeSigBottom) {
		var scaler = this.getNoteScaler(notes_per_measure, timeSigTop, timeSigBottom); // fill proportionally
		var retArray = [];
		var isTriplets = this.isTripletDivisionFromNotesPerMeasure(notes_per_measure, timeSigTop, timeSigBottom);
		var i;

		if (scaler == 1)
			return note_array; // no need to expand

		// preset to false (rest) all entries in the expanded array
		for (i = 0; i < num_measures * notes_per_measure * scaler; i++)
			retArray[i] = false;

		// sparsely fill in the return array with data from passed in array
		for (i = 0; i < num_measures * notes_per_measure; i++) {
			var ret_array_index = (i) * scaler;

			retArray[ret_array_index] = note_array[i];
		}

		return retArray;
	}

	// count the number of note positions that are not rests in all the arrays
	// FFFxFFFxF  would be 2
	count_active_notes_in_arrays(array_of_arrays, start_index, how_far_to_measure) {
		var num_active_notes = 0;

		for (var i = start_index; i < start_index + how_far_to_measure; i++) {
			for (var which_array = 0; which_array < array_of_arrays.length; which_array++) {
				if (array_of_arrays[which_array][i] !== false) {
					num_active_notes++;
					which_array = array_of_arrays.length;  // exit this inner for loop immediately
				}
			}
		}

		return num_active_notes;
	}

	// takes 4 arrays 48 elements long that represent the stickings, snare, HH & kick.
	// each element contains either the note value in ABC "F","^g" or false to represent off
	// translates them to an ABC string (in 2 voices if !kick_stems_up)
	//
	// We output 48 notes in the ABC rather than the traditional 16 or 32 for 4/4 time.
	// This is because of the stickings above the bar are a separate voice and should not have the "3" above them
	// This could be changed to using the normal number and moving all the stickings down to be comments on each note in one voice (But is a pretty big change)
	snare_HH_kick_ABC_for_triplets(
		grooveData,
		sticking_array,
		HH_array,
		snare_array,
		kick_array,
		toms_array,
		num_notes,
		sub_division,
		notes_per_measure,
		kick_stems_up,
		timeSigTop,
		timeSigBottom,
		numberOfMeasuresPerLine,
		repeatBegins,
		repeatEnds,
		repeatEndings) {

		var scaler = 1; // we are always in 48 notes here, and the ABC needs to think we are in 48 since the specified division is 1/32
		var ABC_String = "";
		var stickings_voice_string = "V:Stickings\n";
		var hh_snare_voice_string = "V:Hands stem=up\n%%voicemap drum\n";
		var kick_voice_string = "V:Feet stem=down\n%%voicemap drum\n";
		var all_drum_array_of_array;
		var currentMeasure = 1;
		var addedBeginRepeatForThisMeasure = false;

		// For repeats, for some reason we need to add |: and/or :| to all the
		// voicings in order to get it to render. This means adding it to both the 
		// sticking and hands voicings.

		// console.log(HH_array);
		// console.log(kick_array);
		// console.log(notes_per_measure);
		// console.log(sub_division);

		if (kick_stems_up) {
			all_drum_array_of_array = [snare_array, HH_array, kick_array];
		} else {
			all_drum_array_of_array = [snare_array, HH_array];  // exclude the kick
		}
		if (toms_array)
			all_drum_array_of_array = all_drum_array_of_array.concat(toms_array);

		// occationally we will change the sub_division output to 1/8th or 1/16th notes when we detect a beat that is better displayed that way
		// By default we use the base sub_division but this can be set different below
		var faker_sub_division = sub_division;

		for (var i = 0; i < num_notes; i++) {
			if (!addedBeginRepeatForThisMeasure) {
				addedBeginRepeatForThisMeasure = true;
				if (repeatEndings.has(currentMeasure) && repeatBegins.has(currentMeasure)) {
					stickings_voice_string += "|:[" + repeatEndings.get(currentMeasure);
					hh_snare_voice_string += "|:[" + repeatEndings.get(currentMeasure);
				}
				if (repeatBegins.has(currentMeasure)) {
					stickings_voice_string += "|:"
					hh_snare_voice_string += "|:"
				}
				if (repeatEndings.has(currentMeasure)) {
					stickings_voice_string += "[" + repeatEndings.get(currentMeasure)
					hh_snare_voice_string += "[" + repeatEndings.get(currentMeasure)
				}
				if (grooveData.measureText.has(currentMeasure) && grooveData.measureText.get(currentMeasure).begin) {
					hh_snare_voice_string += "\"" + grooveData.measureText.get(currentMeasure).text + "\"";
				}
			}

			// triplets are special.  We want to output a note or a rest for every space of time
			// 8th note triplets should always use rests
			// end_of_group should be
			//  "4" for 1/8th note triplets
			//  "2" for 1/16th note triplets
			//  "1" for 1/32nd note triplets.
			var end_of_group = 48 / faker_sub_division;
			var grouping_size_for_rests = end_of_group;
			var skip_adding_more_notes = false;

			if ((i % notes_per_measure) + end_of_group > notes_per_measure) {
				// if we are in an odd time signature then the last few notes will have a different grouping to reach the end of the measure
				end_of_group = notes_per_measure - (i % num_notes);
			}

			if (i % this.abc_gen_note_grouping_size(true, timeSigTop, timeSigBottom) === 0) {

				// Look for some special cases that will format beats as non triplet groups.   Quarter notes, 1/8th and 1/16th notes only.

				// look for a whole beat of rests
				if (0 == this.count_active_notes_in_arrays(all_drum_array_of_array, i, 12)) {
					// there are no notes in the next beat.   Let's output a special string for a quarter note rest
					skip_adding_more_notes = true;
					stickings_voice_string += "x8";
					hh_snare_voice_string += "z8";  // quarter note rest
					i += 11;  // skip past all the rests


					// look for 1/4 note with no triplets  "x--"
				} else if ((0 == this.count_active_notes_in_arrays(all_drum_array_of_array, i + 1, 11))) {

					// code duplicated from below
					// clear any invalid stickings since they will mess up the formatting greatly
					for (var si = i + 1; si < i + 12; si++)
						sticking_array[si] = false;
					stickings_voice_string += this.getABCforRest([sticking_array], i, 8, scaler, true);
					stickings_voice_string += this.getABCforNote([sticking_array], i, 8, scaler);

					if (kick_stems_up) {
						hh_snare_voice_string += this.getABCforNote(all_drum_array_of_array, i, 8, scaler);
						kick_voice_string = "";
					} else {
						hh_snare_voice_string += this.getABCforNote(all_drum_array_of_array, i, 8, scaler);
						kick_voice_string += this.getABCforNote([kick_array], i, 8, scaler);
					}

					skip_adding_more_notes = true;
					i += 11;  // skip past to the next beat

					// look for two 1/8 notes with no triplets in 1/16th & 1/32nd note triplets.   "x--x--", "x-----x-----"
				} else if (sub_division > 12 && 0 == this.count_active_notes_in_arrays(all_drum_array_of_array, i + 1, 5) &&
					0 == this.count_active_notes_in_arrays(all_drum_array_of_array, i + 7, 5)) {

					// think of the 1/8 notes as two groups of 3 notes
					for (var eighth_index = i; eighth_index <= i + 6; eighth_index += 6) {
						// code duplicated from below
						// clear any invalid stickings since they will mess up the formatting greatly
						for (var si = eighth_index + 1; si < eighth_index + 6; si++)
							sticking_array[si] = false;
						stickings_voice_string += this.getABCforRest([sticking_array], eighth_index, 4, scaler, true);
						stickings_voice_string += this.getABCforNote([sticking_array], eighth_index, 4, scaler);

						if (kick_stems_up) {
							hh_snare_voice_string += this.getABCforRest(all_drum_array_of_array, eighth_index, 4, scaler, false);
							hh_snare_voice_string += this.getABCforNote(all_drum_array_of_array, eighth_index, 4, scaler);
							kick_voice_string = "";
						} else {
							hh_snare_voice_string += this.getABCforRest(all_drum_array_of_array, eighth_index, 4, scaler, false);
							hh_snare_voice_string += this.getABCforNote(all_drum_array_of_array, eighth_index, 4, scaler);
							kick_voice_string += this.getABCforNote([kick_array], eighth_index, 4, scaler);
						}
					}

					skip_adding_more_notes = true;
					i += 11;  // skip past to the next beat

					// look for 1/16th notes with no triplets in 1/32nd note triplets.   "x--x--"
				} else if (sub_division == 48 && 0 == this.count_active_notes_in_arrays(all_drum_array_of_array, i + 1, 2) &&
					0 == this.count_active_notes_in_arrays(all_drum_array_of_array, i + 4, 2) &&
					0 == this.count_active_notes_in_arrays(all_drum_array_of_array, i + 7, 2) &&
					0 == this.count_active_notes_in_arrays(all_drum_array_of_array, i + 10, 2)) {

					// think of the 1/8 notes as two groups of 3 notes
					for (var eighth_index = i; eighth_index <= i + 9; eighth_index += 3) {
						// code duplicated from below
						// clear any invalid stickings since they will mess up the formatting greatly
						for (var si = eighth_index + 1; si < eighth_index + 3; si++)
							sticking_array[si] = false;
						stickings_voice_string += this.getABCforRest([sticking_array], eighth_index, 2, scaler, true);
						stickings_voice_string += this.getABCforNote([sticking_array], eighth_index, 2, scaler);

						if (kick_stems_up) {
							hh_snare_voice_string += this.getABCforRest(all_drum_array_of_array, eighth_index, 2, scaler, false);
							hh_snare_voice_string += this.getABCforNote(all_drum_array_of_array, eighth_index, 2, scaler);
							kick_voice_string = "";
						} else {
							hh_snare_voice_string += this.getABCforRest(all_drum_array_of_array, eighth_index, 2, scaler, false);
							hh_snare_voice_string += this.getABCforNote(all_drum_array_of_array, eighth_index, 2, scaler);
							kick_voice_string += this.getABCforNote([kick_array], eighth_index, 2, scaler);
						}
					}

					skip_adding_more_notes = true;
					i += 11;  // skip past to the next beat

				} else {
					// the normal case.   We tell ABC that we are using a triplet
					var notes_in_triplet_group = sub_division / 4;    // 4 beats

					// look through the notes and see if we should "fake" 1/8 or 1/6th note triplets
					// If the groove can be expressed in "3" or "6" groups it is way easier to read than in a higher "12" group with rests
					// "3" looks like "x---x---x---"   one note and three rests
					// "6" looks like "x-x-x-x-x-x-"   one note and one rest
					if (sub_division == 48) {
						var can_fake_threes = true;
						var can_fake_sixes = true;
						for (var j = i; j < i + 12; j += 4) {
							if (0 < this.count_active_notes_in_arrays(all_drum_array_of_array, j + 1, 3)) {
								can_fake_threes = false
							}
							if (0 < this.count_active_notes_in_arrays(all_drum_array_of_array, j + 1, 1) ||
								0 < this.count_active_notes_in_arrays(all_drum_array_of_array, j + 3, 1)) {
								can_fake_sixes = false
							}
							if (can_fake_threes == false && can_fake_sixes == false)
								break;  // skip the rest, since we have an answer already
						}

						// reset

						if (can_fake_threes)
							faker_sub_division = 12;
						else if (can_fake_sixes)
							faker_sub_division = 24;
						else
							faker_sub_division = sub_division;  // reset

						end_of_group = 48 / faker_sub_division;
						grouping_size_for_rests = end_of_group;
						notes_in_triplet_group = faker_sub_division / 4;    // 4 beats
					}


					// creates the 3, 6 or 12 over the note grouping
					// looks like (3:3:3 or (6:6:6 or (12:12:12
					hh_snare_voice_string += "(" + notes_in_triplet_group + ":" + notes_in_triplet_group + ":" + notes_in_triplet_group;
				}
			}

			// skip the code to add notes
			// Happens for special_rest when there are no notes for the next whole beat.
			// Happens when we found only a 1/4 or 1/8 note instead of triplets
			if (!skip_adding_more_notes) {
				if (i % grouping_size_for_rests === 0) {
					// we will output a rest for each place there could be a note
					stickings_voice_string += this.getABCforRest([sticking_array], i, grouping_size_for_rests, scaler, true);

					if (kick_stems_up) {
						hh_snare_voice_string += this.getABCforRest(all_drum_array_of_array, i, grouping_size_for_rests, scaler, false);
						kick_voice_string = "";
					} else {
						hh_snare_voice_string += this.getABCforRest(all_drum_array_of_array, i, grouping_size_for_rests, scaler, false);
						kick_voice_string += this.getABCforRest([kick_array], i, grouping_size_for_rests, scaler, true);
					}
				}

				stickings_voice_string += this.getABCforNote([sticking_array], i, end_of_group, scaler);

				if (kick_stems_up) {
					hh_snare_voice_string += this.getABCforNote(all_drum_array_of_array, i, end_of_group, scaler);
					kick_voice_string = "";
				} else {
					hh_snare_voice_string += this.getABCforNote(all_drum_array_of_array, i, end_of_group, scaler);
					kick_voice_string += this.getABCforNote([kick_array], i, end_of_group, scaler);
				}
			}

			if ((i % this.abc_gen_note_grouping_size(true, timeSigTop, timeSigBottom)) == this.abc_gen_note_grouping_size(true, timeSigTop, timeSigBottom) - 1) {
				stickings_voice_string += " ";
				hh_snare_voice_string += " "; // Add a space to break the bar line every group notes
				kick_voice_string += " ";
			}

			// add a bar line every measure
			if (((i + 1) % (12 * timeSigTop * (4 / timeSigBottom))) === 0) {
				kick_voice_string += "|";
				if (grooveData.measureText.has(currentMeasure) && !grooveData.measureText.get(currentMeasure).begin) {
					hh_snare_voice_string += "\"" + grooveData.measureText.get(currentMeasure).text + "\"";
				}
				if (repeatEnds.has(currentMeasure)) {
					hh_snare_voice_string += ":|"
					stickings_voice_string += ":|";
				} else {
					hh_snare_voice_string += "|";
					stickings_voice_string += "|";
				}

				// Next measure
				currentMeasure += 1;
				addedBeginRepeatForThisMeasure = false;

				// add a line break every numberOfMeasuresPerLine measures
				if (i < num_notes - 1 && ((i + 1) % ((12 * timeSigTop * (4 / timeSigBottom)) * numberOfMeasuresPerLine)) === 0) {
					stickings_voice_string += "\n";
					hh_snare_voice_string += "\n";
					kick_voice_string += "\n";
				}
			}
		}

		stickings_voice_string += stickings_voice_string.endsWith("|") ? "\n" : "|\n";
		hh_snare_voice_string += hh_snare_voice_string.endsWith("|") ? "\n" : "|\n";
		kick_voice_string += kick_voice_string.endsWith("|") ? "\n" : "|\n";

		if (kick_stems_up)
			ABC_String += stickings_voice_string + hh_snare_voice_string;
		else
			ABC_String += stickings_voice_string + hh_snare_voice_string + kick_voice_string;

		return ABC_String;
	}

	// takes 4 arrays 32 elements long that represent the sticking, snare, HH & kick.
	// each element contains either the note value in ABC "F","^g" or false to represent off
	// translates them to an ABC string in 3 voices
	//
	snare_HH_kick_ABC_for_quads(
		grooveData,
		sticking_array,
		HH_array,
		snare_array,
		kick_array,
		toms_array,
		num_notes,
		sub_division,
		notes_per_measure,
		kick_stems_up,
		timeSigTop,
		timeSigBottom,
		numberOfMeasuresPerLine,
		repeatBegins,
		repeatEnds,
		repeatEndings) {

		var scaler = 1; // we are always in 32ths notes here
		var ABC_String = "";
		var stickings_voice_string = "V:Stickings\n"; // for stickings.  they are all rests with text comments added
		var hh_snare_voice_string = "V:Hands stem=up\n%%voicemap drum\n"; // for hh and snare
		var kick_voice_string = "V:Feet stem=down\n%%voicemap drum\n"; // for kick drum
		var all_drum_array_of_array;
		var currentMeasure = 1;
		var addedBeginRepeatForThisMeasure = false;

		// For repeats, for some reason we need to add |: and/or :| to all the
		// voicings in order to get it to render. This means adding it to both the 
		// sticking and hands voicings.

		all_drum_array_of_array = [snare_array, HH_array];  // exclude the kick
		if (toms_array)
			all_drum_array_of_array = all_drum_array_of_array.concat(toms_array);
		// Add the kick array last to solve a subtle bug with the kick foot splash combo note
		// If the combo note comes last in a multi note event it will space correctly.  If it
		// comes first it will create a wrong sized note
		if (kick_stems_up)
			all_drum_array_of_array = all_drum_array_of_array.concat([kick_array]);

		for (var i = 0; i < num_notes; i++) {
			if (!addedBeginRepeatForThisMeasure) {
				addedBeginRepeatForThisMeasure = true;
				if (repeatEndings.has(currentMeasure) && repeatBegins.has(currentMeasure)) {
					stickings_voice_string += "|:[" + repeatEndings.get(currentMeasure);
					hh_snare_voice_string += "|:[" + repeatEndings.get(currentMeasure);
				}
				if (repeatBegins.has(currentMeasure)) {
					stickings_voice_string += "|:"
					hh_snare_voice_string += "|:"
				}
				if (repeatEndings.has(currentMeasure)) {
					stickings_voice_string += "[" + repeatEndings.get(currentMeasure)
					hh_snare_voice_string += "[" + repeatEndings.get(currentMeasure)
				}
				if (grooveData.measureText.has(currentMeasure) && grooveData.measureText.get(currentMeasure).begin) {
					hh_snare_voice_string += "\"" + grooveData.measureText.get(currentMeasure).text + "\"";
				}
			}

			var grouping_size_for_rests = this.abc_gen_note_grouping_size(false, timeSigTop, timeSigBottom);
			// make sure the group end doesn't go beyond the measure.   Happens in odd time sigs
			if ((i % notes_per_measure) + grouping_size_for_rests > notes_per_measure) {
				// if we are in an odd time signature then the last few notes will have a different grouping to reach the end of the measure
				grouping_size_for_rests = notes_per_measure - (i % notes_per_measure);
			}

			var end_of_group;
			if (i % this.abc_gen_note_grouping_size(false, timeSigTop, timeSigBottom) === 0)
				end_of_group = this.abc_gen_note_grouping_size(false, timeSigTop, timeSigBottom);
			else
				end_of_group = (this.abc_gen_note_grouping_size(false, timeSigTop, timeSigBottom) - ((i) % this.abc_gen_note_grouping_size(false, timeSigTop, timeSigBottom)));

			// make sure the group end doesn't go beyond the measure.   Happens in odd time sigs
			if ((i % notes_per_measure) + end_of_group > notes_per_measure) {
				// if we are in an odd time signature then the last few notes will have a different grouping to reach the end of the measure
				end_of_group = notes_per_measure - (i % notes_per_measure);
			}

			if (i % this.abc_gen_note_grouping_size(false, timeSigTop, timeSigBottom) === 0) {
				// we will only output a rest at the beginning of a beat phrase
				stickings_voice_string += this.getABCforRest([sticking_array], i, grouping_size_for_rests, scaler, true);

				if (kick_stems_up) {
					hh_snare_voice_string += this.getABCforRest(all_drum_array_of_array, i, grouping_size_for_rests, scaler, false);
					kick_voice_string = "";
				} else {
					hh_snare_voice_string += this.getABCforRest(all_drum_array_of_array, i, grouping_size_for_rests, scaler, false);
					kick_voice_string += this.getABCforRest([kick_array], i, grouping_size_for_rests, scaler, false);
				}
			}

			stickings_voice_string += this.getABCforNote([sticking_array], i, end_of_group, scaler);

			if (kick_stems_up) {
				hh_snare_voice_string += this.getABCforNote(all_drum_array_of_array, i, end_of_group, scaler);
				kick_voice_string = "";
			} else {
				hh_snare_voice_string += this.getABCforNote(all_drum_array_of_array, i, end_of_group, scaler);
				kick_voice_string += this.getABCforNote([kick_array], i, end_of_group, scaler);
			}

			if ((i % this.abc_gen_note_grouping_size(false, timeSigTop, timeSigBottom)) == this.abc_gen_note_grouping_size(false, timeSigTop, timeSigBottom) - 1) {

				stickings_voice_string += " ";
				hh_snare_voice_string += " "; // Add a space to break the bar line every group notes
				kick_voice_string += " ";
			}

			// add a bar line every measure.   32 notes in 4/4 time.   (32/timeSigBottom * timeSigTop)
			if (((i + 1) % ((32 / timeSigBottom) * timeSigTop)) === 0) {
				if (grooveData.measureText.has(currentMeasure) && !grooveData.measureText.get(currentMeasure).begin) {
					hh_snare_voice_string += "\"" + grooveData.measureText.get(currentMeasure).text + "\"";
				}
				kick_voice_string += "|";
				if (repeatEnds.has(currentMeasure)) {
					hh_snare_voice_string += ":|"
					stickings_voice_string += ":|";
				} else {
					hh_snare_voice_string += "|";
					stickings_voice_string += "|";
				}

				// Next measure
				currentMeasure += 1;
				addedBeginRepeatForThisMeasure = false;
			}
			// add a line break every numberOfMeasuresPerLine measures, except the last
			if (i < num_notes - 1 && ((i + 1) % ((32 / timeSigBottom) * timeSigTop * numberOfMeasuresPerLine)) === 0) {
				stickings_voice_string += "\n";
				hh_snare_voice_string += "\n";
				kick_voice_string += "\n";
			}
		}

		stickings_voice_string += stickings_voice_string.endsWith("|") ? "\n" : "|\n";
		hh_snare_voice_string += hh_snare_voice_string.endsWith("|") ? "\n" : "|\n";
		kick_voice_string += kick_voice_string.endsWith("|") ? "\n" : "|\n";

		if (kick_stems_up)
			ABC_String += stickings_voice_string + hh_snare_voice_string;
		else
			ABC_String += stickings_voice_string + hh_snare_voice_string + kick_voice_string;

		return ABC_String;
	}

	// function to return 1,e,&,a or 2,3,4,5,6, etc...
	figure_out_sticking_count_for_index(index, notes_per_measure, sub_division, time_sig_bottom) {

		// figure out the count state by looking at the id and the subdivision
		var note_index = index % notes_per_measure;
		var new_state = 0;
		// 4/2 time changes the implied time from 4 up to 8, etc
		// 6/8 time changes the implied time from 8 down to 4
		var implied_sub_division = sub_division * (4 / time_sig_bottom);
		switch (implied_sub_division) {
			case 4:
				new_state = note_index + 1;   // 1,2,3,4,5, etc.
				break;
			case 8:
				if (note_index % 2 === 0)
					new_state = Math.floor(note_index / 2) + 1;  // 1,2,3,4,5, etc.
				else
					new_state = "&";
				break;
			case 12:  // 8th triplets
				if (note_index % 3 === 0)
					new_state = Math.floor(note_index / 3) + 1;  // 1,2,3,4,5, etc.
				else if (note_index % 3 == 1)
					new_state = "&";
				else
					new_state = "a";
				break;
			case 24:  // 16th triplets
				if (note_index % 3 === 0)
					new_state = Math.floor(note_index / 6) + 1;  // 1,2,3,4,5, etc.
				else if (note_index % 3 == 1)
					new_state = "&";
				else
					new_state = "a";
				break;
			case 48:  // 32nd triplets
				if (note_index % 3 === 0)
					new_state = Math.floor(note_index / 12) + 1;  // 1,2,3,4,5, etc.
				else if (note_index % 3 == 1)
					new_state = "&";
				else
					new_state = "a";
				break;
			case 16:
			case 32:  // fall through
			default:
				var whole_note_interval = implied_sub_division / 4;
				if (note_index % 4 === 0)
					new_state = Math.floor(note_index / whole_note_interval) + 1;  // 1,1,2,2,3,3,4,4,5,5, etc.
				else if (note_index % 4 === 1)
					new_state = "e";
				else if (note_index % 4 === 2)
					new_state = "&";
				else
					new_state = "a";
				break;
		}

		return new_state;
	}

	// converts the symbol for a sticking count to an actual count based on the time signature
	convert_sticking_counts_to_actual_counts(sticking_array, time_division, timeSigTop, timeSigBottom) {

		var cur_div_of_array = 32;
		if (this.isTripletDivision(time_division))
			cur_div_of_array = 48;

		var actual_notes_per_measure_in_this_array = this.calc_notes_per_measure(cur_div_of_array, timeSigTop, timeSigBottom);

		// Time division is 4, 8, 16, 32, 12, 24, or 48
		var notes_per_measure_in_time_division = ((time_division / 4) * timeSigTop) * (4 / timeSigBottom);

		for (var i in sticking_array) {
			if (sticking_array[i] == constant_ABC_STICK_COUNT) {
				// convert the COUNT into an actual letter or number
				// convert the index into what it would have been if the array was "notes_per_measure" sized
				var adjusted_index = Math.floor(i / (actual_notes_per_measure_in_this_array / notes_per_measure_in_time_division));
				var new_count = this.figure_out_sticking_count_for_index(adjusted_index, notes_per_measure_in_time_division, time_division, timeSigBottom);
				var new_count_string = '"' + new_count + '"x';
				sticking_array[i] = new_count_string;
			}
		}
	}

	// create ABC from note arrays
	// The Arrays passed in must be 32 or 48 notes long
	// notes_per_measure denotes the number of notes that _should_ be in the measure even though the arrays are always scaled up and large (48 or 32)
	create_ABC_from_snare_HH_kick_arrays(
		grooveData,
		sticking_array,
		HH_array,
		snare_array,
		kick_array,
		toms_array,
		num_notes,
		time_division,
		notes_per_measure,
		kick_stems_up,
		timeSigTop,
		timeSigBottom,
		repeatBegins,
		repeatEnds,
		repeatEndings) {

		// convert sticking count symbol to the actual count
		// do this right before ABC output so it can't every get encoded into something that gets saved.
		this.convert_sticking_counts_to_actual_counts(sticking_array, time_division, timeSigTop, timeSigBottom);

		var numberOfMeasuresPerLine = 2;   // Default

		if (notes_per_measure >= 32) {
			// Only put one measure per line for 32nd notes and above because of width issues
			numberOfMeasuresPerLine = 1;
		}

		if (this.isTripletDivisionFromNotesPerMeasure(notes_per_measure, timeSigTop, timeSigBottom)) {
			return this.snare_HH_kick_ABC_for_triplets(
				grooveData,
				sticking_array,
				HH_array,
				snare_array,
				kick_array,
				toms_array,
				num_notes,
				time_division,
				notes_per_measure,
				kick_stems_up,
				timeSigTop,
				timeSigBottom,
				numberOfMeasuresPerLine,
				repeatBegins,
				repeatEnds,
				repeatEndings);
		} else {
			return this.snare_HH_kick_ABC_for_quads(
				grooveData,
				sticking_array,
				HH_array,
				snare_array,
				kick_array,
				toms_array,
				num_notes,
				time_division,
				notes_per_measure,
				kick_stems_up,
				timeSigTop,
				timeSigBottom,
				numberOfMeasuresPerLine,
				repeatBegins,
				repeatEnds,
				repeatEndings);
		}
	}

	// create ABC notation from a GrooveData class
	// returns a string of ABC Notation data

	createABCFromGrooveData(grooveData, renderWidth) {
		var FullNoteStickingArray = this.scaleNoteArrayToFullSize(grooveData.sticking_array, grooveData.numberOfMeasures, grooveData.notesPerMeasure, grooveData.numBeats, grooveData.noteValue);
		var FullNoteHHArray = this.scaleNoteArrayToFullSize(grooveData.hh_array, grooveData.numberOfMeasures, grooveData.notesPerMeasure, grooveData.numBeats, grooveData.noteValue);
		var FullNoteSnareArray = this.scaleNoteArrayToFullSize(grooveData.snare_array, grooveData.numberOfMeasures, grooveData.notesPerMeasure, grooveData.numBeats, grooveData.noteValue);
		var FullNoteKickArray = this.scaleNoteArrayToFullSize(grooveData.kick_array, grooveData.numberOfMeasures, grooveData.notesPerMeasure, grooveData.numBeats, grooveData.noteValue);
		var FullNoteTomsArray = [];

		for (var i = 0; i < constant_NUMBER_OF_TOMS; i++) {
			FullNoteTomsArray[i] = this.scaleNoteArrayToFullSize(grooveData.toms_array[i], grooveData.numberOfMeasures, grooveData.notesPerMeasure, grooveData.numBeats, grooveData.noteValue);
		}

		var is_triplet_division = this.isTripletDivisionFromNotesPerMeasure(grooveData.notesPerMeasure, grooveData.numBeats, grooveData.noteValue);

		var fullAbc = this.get_top_ABC_BoilerPlate(
			false,
			grooveData.title,
			grooveData.author,
			grooveData.comments,
			grooveData.showLegend,
			is_triplet_division,
			grooveData.kickStemsUp,
			grooveData.numBeats,
			grooveData.noteValue,
			renderWidth);

		fullAbc += this.create_ABC_from_snare_HH_kick_arrays(
			grooveData,
			FullNoteStickingArray,
			FullNoteHHArray,
			FullNoteSnareArray,
			FullNoteKickArray,
			FullNoteTomsArray,
			FullNoteHHArray.length,
			grooveData.timeDivision,
			this.notesPerMeasureInFullSizeArray(is_triplet_division, grooveData.numBeats, grooveData.noteValue), // notes_per_measure, We scaled up to 48/32 above
			grooveData.kickStemsUp,
			grooveData.numBeats,
			grooveData.noteValue,
			grooveData.repeatBegins,
			grooveData.repeatEnds,
			grooveData.repeatEndings
		);

		return fullAbc;
	}

	// converts incoming ABC notation source into an svg image.
	// returns an object with two items.   "svg" and "error_html"
	renderABCtoSVG(abc_source) {
		this.abc_obj = new Abc(this.abcToSVGCallback);
		if ((this.myGrooveData && this.myGrooveData.showLegend) || this.isLegendVisable)
			this.abcNoteNumIndex = -15; // subtract out the legend notes for a proper index.
		else
			this.abcNoteNumIndex = 0;
		this.abcToSVGCallback.abc_svg_output = ''; // clear
		this.abcToSVGCallback.abc_error_output = ''; // clear

		this.abc_obj.tosvg("SOURCE", abc_source);
		return {
			svg: this.abcToSVGCallback.abc_svg_output,
			error_html: this.abcToSVGCallback.abc_error_output
		};
	}
}

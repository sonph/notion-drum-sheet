// groove_display.js
// utility functions to support displaying a groove on a page
//
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

/*jshint multistr: true */
/*jslint browser:true devel:true */
/*jslint evil: true */
/*global GrooveUtils, GrooveDisplay */

// GrooveDisplay class.   The only one in this file.
// singleton
if (typeof(GrooveDisplay) === "undefined") {

	var GrooveDisplay = {};

	(function () {
		"use strict";

		var root = GrooveDisplay;

		// list of files already added
		root.filesadded = "";

		root.getLocalScriptRoot = (function () {
			var scripts = document.getElementsByTagName('script');
			var index = scripts.length - 1;
			var myScript = scripts[index];
			var lastSlash = myScript.src.lastIndexOf("/");
			myScript.rootSrc = myScript.src.slice(0, lastSlash + 1);
			return function () {
				return myScript.rootSrc;
			};
		})();

		root.GrooveDisplayUniqueCounter = 1;

		// time signature looks like this  "4/4", "5/4", "6/8", etc
		// Two numbers separated by a slash
		// return an array with two elements top and bottom in that order
		function parseTimeSignature(timeSig) {

			var timeSigTop = 4;
			var timeSigBottom = 4;

			if (timeSig) {
				var splitResults = timeSig.split("/");

				if (splitResults.length == 2) {
					timeSigTop = Math.ceil(splitResults[0]);
					timeSigBottom = Math.ceil(splitResults[1]);
				}
			}

			return [timeSigTop, timeSigBottom];
		}

		// Used by the GrooveDB to display a groove on a page.
		// Supports multiple grooves on one page as well.
		// shows the groove via SVG sheet music and a midi player
		root.GrooveDBFormatPutGrooveInHTMLElement = function (HtmlTagId, GrooveDBTabIn) {
			var myGrooveUtils = new GrooveUtils();
			var myGrooveData = new myGrooveUtils.grooveDataNew();

			var combinedSnareTab = myGrooveUtils.mergeDrumTabLines(GrooveDBTabIn.snareAccentTab, GrooveDBTabIn.snareOtherTab);
			var combinedKickTab = myGrooveUtils.mergeDrumTabLines(GrooveDBTabIn.kickTab, GrooveDBTabIn.footOtherTab);

			if(GrooveDBTabIn.div !== undefined && !isNaN(GrooveDBTabIn.div)) myGrooveData.timeDivision = GrooveDBTabIn.div;
			if(GrooveDBTabIn.tempo !== undefined && !isNaN(GrooveDBTabIn.tempo)) myGrooveData.tempo = GrooveDBTabIn.tempo;
			if(GrooveDBTabIn.swingPercent !== undefined && !isNaN(GrooveDBTabIn.swingPercent)) myGrooveData.swingPercent = GrooveDBTabIn.swingPercent;
			if(GrooveDBTabIn.measures !== undefined && !isNaN(GrooveDBTabIn.measures)) myGrooveData.numberOfMeasures = GrooveDBTabIn.measures;
			if(GrooveDBTabIn.notesPerTabMeasure !== undefined && !isNaN(GrooveDBTabIn.notesPerTabMeasure)) myGrooveData.notesPerMeasure = GrooveDBTabIn.notesPerTabMeasure;
			if(GrooveDBTabIn.stickingTab !== undefined) myGrooveData.sticking_array = myGrooveUtils.noteArraysFromURLData("Stickings", GrooveDBTabIn.stickingTab, GrooveDBTabIn.notesPerTabMeasure, GrooveDBTabIn.measures);
			if(GrooveDBTabIn.hihatTab !== undefined) myGrooveData.hh_array = myGrooveUtils.noteArraysFromURLData("H", GrooveDBTabIn.hihatTab, GrooveDBTabIn.notesPerTabMeasure, GrooveDBTabIn.measures);
			myGrooveData.snare_array = myGrooveUtils.noteArraysFromURLData("S", combinedSnareTab, GrooveDBTabIn.notesPerTabMeasure, GrooveDBTabIn.measures);
			myGrooveData.kick_array = myGrooveUtils.noteArraysFromURLData("K", combinedKickTab, GrooveDBTabIn.notesPerTabMeasure, GrooveDBTabIn.measures);
			if(GrooveDBTabIn.tom1Tab !== undefined) myGrooveData.toms_array[0] = myGrooveUtils.noteArraysFromURLData("T1", GrooveDBTabIn.tom1Tab, GrooveDBTabIn.notesPerTabMeasure, GrooveDBTabIn.measures);
			if(GrooveDBTabIn.tom4Tab !== undefined) myGrooveData.toms_array[3] = myGrooveUtils.noteArraysFromURLData("T4", GrooveDBTabIn.tom4Tab, GrooveDBTabIn.notesPerTabMeasure, GrooveDBTabIn.measures);

			if(GrooveDBTabIn.timeSignature !== undefined) {
				var timeSig = parseTimeSignature(GrooveDBTabIn.timeSignature);
				myGrooveData.numBeats = timeSig[0];
				myGrooveData.noteValue = timeSig[1];
			}

			//console.log(myGrooveData);

			var svgTargetId = "svgTarget" + root.GrooveDisplayUniqueCounter;
			var midiPlayerTargetId = "midiPlayerTarget" + root.GrooveDisplayUniqueCounter;

			// spit out some HTML tags to hold the music and possibly the player
			document.getElementById(HtmlTagId).innerHTML = '' +
				'<div class="Printable"><div id="' + svgTargetId + '" class="svgTarget"  style="display:inline-block"></div></div>\n' +
				'<div class="nonPrintable"><div id="' + midiPlayerTargetId + '" ></div></div>\n';

			var svgTarget = document.getElementById(svgTargetId);
			var renderWidth = svgTarget.offsetWidth - 100;

			var abcNotation = myGrooveUtils.createABCFromGrooveData(myGrooveData, renderWidth);
			var svgReturn = myGrooveUtils.renderABCtoSVG(abcNotation);
			//console.log(abcNotation);

			svgTarget.innerHTML = svgReturn.svg;

			myGrooveUtils.setGrooveData(myGrooveData);

			myGrooveUtils.AddMidiPlayerToPage(midiPlayerTargetId, myGrooveData.notesPerMeasure, true);
			myGrooveUtils.expandOrRetractMIDI_playback(true, false); // make it small
			myGrooveUtils.setTempo(myGrooveData.tempo);
			myGrooveUtils.setSwing(myGrooveData.swingPercent);
			myGrooveUtils.oneTimeInitializeMidi();

			root.GrooveDisplayUniqueCounter++;
		};

		// Add a groove to a page
		root.GrooveDBFormatPutGrooveOnPage = function (GrooveDBTabIn) {
			root.GrooveDisplayUniqueCounter++;

			// add an html Element to hold the grooveDisplay
			var HTMLElementID = 'GrooveDisplay' + root.GrooveDisplayUniqueCounter;
			document.write('<span id="' + HTMLElementID + '"></span>');

			window.addEventListener("load", function () {
				root.GrooveDBFormatPutGrooveInHTMLElement(HTMLElementID, GrooveDBTabIn);
			}, false);
		};

		root.AddGrooveDisplayToElementId = function (HtmlTagId, GrooveDefinition, showPlayer, linkToEditor, expandPlayer) {
			var myGrooveUtils = new GrooveUtils();
			root.GrooveDisplayUniqueCounter++;

			var svgTargetId = "svgTarget" + root.GrooveDisplayUniqueCounter;
			var midiPlayerTargetId = "midiPlayerTarget" + root.GrooveDisplayUniqueCounter;

			document.getElementById(HtmlTagId).innerHTML = '' +
				'<span id="tempoTimeSig"></span>' +
				'<div class="Printable"><div id="' + svgTargetId + '" class="svgTarget" style="display:inline-block"></div></div>\n' +
				'<div class="nonPrintable"><div id="' + midiPlayerTargetId + '"></div></div>\n';

			// load the groove from the URL data if it was passed in.
			var GrooveData = myGrooveUtils.getGrooveDataFromUrlString(GrooveDefinition);
			// console.log(GrooveData);

			var layoutFunction = function() {
				var tempoTimeSig = document.getElementById("tempoTimeSig");
				if (GrooveData.embedTempoTimeSig) {
					tempoTimeSig.innerHTML = "&#9833; = " + GrooveData.tempo + " &nbsp;&nbsp; " + GrooveData.numBeats + "/" + GrooveData.noteValue;
				}

				var svgTarget = document.getElementById(svgTargetId);
				// var renderWidth = svgTarget.offsetWidth;
				var renderWidth = 600;

				var abcNotation = myGrooveUtils.createABCFromGrooveData(GrooveData, renderWidth);
				// console.log(abcNotation);
				var svgReturn = myGrooveUtils.renderABCtoSVG(abcNotation);

				if (linkToEditor)
					svgTarget.innerHTML = '<a target="_blank" style="text-decoration: none" href="http://mikeslessons.com/gscribe/' + GrooveDefinition + '">' + svgReturn.svg + '</a>';
				else
					svgTarget.innerHTML = svgReturn.svg;
			};

			layoutFunction();

			// resize SVG on window resize (not needed now.   We render to 1000 and scale in css)
			//window.addEventListener("resize", layoutFunction);
			//window.addEventListener("beforeprint", layoutFunction);


			if (showPlayer) {
				myGrooveUtils.setGrooveData(GrooveData);
				//console.log(GrooveData);

				myGrooveUtils.AddMidiPlayerToPage(midiPlayerTargetId, GrooveData.notesPerMeasure, true);
				myGrooveUtils.expandOrRetractMIDI_playback(true, expandPlayer); // make it small
				myGrooveUtils.setTempo(GrooveData.tempo);
				myGrooveUtils.setSwing(GrooveData.swingPercent);
				myGrooveUtils.setMetronomeFrequencyDisplay(GrooveData.metronomeFrequency);
				myGrooveUtils.oneTimeInitializeMidi();
			}
		};

		// Add a groove to a page
		// URLEncodedGrooveData:  The URL Search data from the Groove Scribe application looks like ?TimeSig=4/4&Div=16&Title=Test...
		// showPlayer:  true/false   true to add the sound player to the page along with the sheet music
		// linkToEditor: true/false  true to add a link back to Groove Scribe on the sheet music
		// expandPlayer: true/false  true to have the sound player be full width by default.
		root.AddGrooveDisplayToPage = function (URLEncodedGrooveData, showPlayer, linkToEditor, expandPlayer) {
			root.GrooveDisplayUniqueCounter++;

			// add an html Element to hold the grooveDisplay
			var HTMLElementID = 'GrooveDisplay' + root.GrooveDisplayUniqueCounter;
			var GrooveDisplayElement = document.createElement("div");
			GrooveDisplayElement.class = "GrooveDisplay";
			GrooveDisplayElement.id = HTMLElementID;
			document.getElementsByTagName("body")[0].appendChild(GrooveDisplayElement);

			window.addEventListener("load", function () {
				root.AddGrooveDisplayToElementId(HTMLElementID, URLEncodedGrooveData, showPlayer, linkToEditor, expandPlayer);
			}, false);
		};
	})(); // end of class GrooveDisplay
} // end if

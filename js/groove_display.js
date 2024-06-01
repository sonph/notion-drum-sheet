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

		root.AddGrooveDisplayToElementId = function (grooveDefinition, linkToEditor) {
			var myGrooveUtils = new GrooveUtils();

			// load the groove from the URL data if it was passed in.
			var grooveData = myGrooveUtils.getGrooveDataFromUrlString(grooveDefinition);
			// console.log(GrooveData);

			var tempoTimeSig = document.getElementById("tempoTimeSig");
			if (grooveData.embedTempoTimeSig) {
				tempoTimeSig.innerHTML = "&#9833; = " + grooveData.tempo + " &nbsp;&nbsp; " + grooveData.numBeats + "/" + grooveData.noteValue;
			}

			var svgTarget = document.getElementById("svgTarget");
			// var renderWidth = svgTarget.offsetWidth;
			var renderWidth = 600;

			var abcNotation = myGrooveUtils.createABCFromGrooveData(grooveData, renderWidth);
			// console.log(abcNotation);
			var svgReturn = myGrooveUtils.renderABCtoSVG(abcNotation);

			if (linkToEditor)
				svgTarget.innerHTML = '<a target="_blank" style="text-decoration: none" href="http://mikeslessons.com/gscribe/' + grooveDefinition + '">' + svgReturn.svg + '</a>';
			else
				svgTarget.innerHTML = svgReturn.svg;
		};
	})(); // end of class GrooveDisplay
} // end if

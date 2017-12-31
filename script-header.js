// ==UserScript==
// @name        Comic Scraper
// @namespace   scrape.dat.shit
// @description Grab unobfuscated images form comic websites.
// @include     https://www.comixology.com/comic-reader/*
// @license     MIT
// @source      https://github.com/ToadKing/comic-scraper
// @version     #VERSION#
// @grant       none
// @run-at      document-start
// ==/UserScript==
(function() {
"use strict";

// quick-n-dirty versions of underscore.js functions
function range(start, end) {
  var ret = [];
  for (var i = start; i < end; i++) {
    ret.push(i);
  }
  return ret;
}

function unique(arr) {
  return arr.reverse().filter(function (e, i, arr) {
    return arr.indexOf(e, i+1) === -1;
  }).reverse();
}

function object(keys, vals) {
  var ret = {};
  for (var i = 0; i < keys.length && i < vals.length; i++) {
    ret[keys[i]] = vals[i];
  }
  return ret;
}

// grab all the canvas prototypes we might need, in case they get stubbed over
var toDataURL = HTMLCanvasElement.prototype.toDataURL;
var getContext = HTMLCanvasElement.prototype.getContext;
var drawImage = CanvasRenderingContext2D.prototype.drawImage;

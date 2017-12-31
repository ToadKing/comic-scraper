if (window.location.hostname == "www.comixology.com") {
(function() {

var metadata;

// watch for nodes and grab the metadata before the page tries to hide it
// (we could just use the jQuery object but it looks like they try to hide $ so jQuery being exposed is probably an oversight)
var observer = new MutationObserver(function(mutations) {
  for (var i = 0; i < mutations.length; i++) {
    var mutation = mutations[i];
    if (mutation.target.id == "reader") {
      observer.disconnect();
      observer = null;
      metadata = cmxgy_parseMetadataJson(mutation.target.getAttribute("data-metadata"));
      insert_button(doDownload);
      return;
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener("DOMContentLoaded", function() {
  if (observer) {
    // reader document not found, clean up our observer and silently fail
    observer.disconnect();
    observer = null;
  }
}, false);

function loadImage(url, cb) {
  var req = new XMLHttpRequest();
  req.open("GET", url);
  req.addEventListener("loadend", function(res) { cb(req.responseText); }, false);
  req.send();
}

function panelId(panel) {
  return [metadata.issue_info.series.series_id, (+panel + 1), metadata.comic_id].join("");
}

function doDownload() {
  var done = 0;
  var todo = metadata.book_info.pages.length;
  var errors = [];
  zip = new JSZip();

  insert_progress_bar();
  set_progress_text("Downloading");

  var promises = Array.from(new Array(todo), (_, i) => i).map((i) => new Promise((resolve, reject) => {
    var page = Number(i).toString();
    var filename = "000".substr(page.length) + page + ".jpg";
    var pageData = metadata.book_info.pages[page];
    var imgData = pageData.descriptor_set.image_descriptors[pageData.descriptor_set.image_descriptors.length - 1];
    var id = panelId(page);

    loadImage(imgData.uri, function(data) {
      if (data) {
        cmxgy_decodeImage(data, id, imgData, function(url) {
          if (url) {
            zip.file(filename, url.substr(url.indexOf(',') + 1), { base64: true });
            console.log("saved " + filename);
            resolve(null);
          } else {
            console.log("error saving " + filename);
            resolve(filename);
          }
          update_progress_bar(++done / todo);
        });
      }
    });
  }));

  Promise.all(promises).then((errors) => {
    errors = errors.filter((e) => e !== null);

    var filename = metadata.issue_info.title;

    if ('series' in metadata.issue_info && 'issue_num' in metadata.issue_info.series) {
      filename = metadata.issue_info.series.title + " #" + metadata.issue_info.series.issue_num;
    }

    save(filename, errors);
  });
}

// decrypt image base64
function cmxgy_key(id) {
  var idPlusSha1 = btoa(id + hex_sha1(id));
  return unique(idPlusSha1.split("")).join("");
}

function cmxgy_decryptImageJson(encrypted, id) {
  var ret = [];
  var keyBytes = cmxgy_key(id).split("");
  var shiftedkeyBytes = keyBytes.slice(1);
  shiftedkeyBytes.push(keyBytes[0]);
  var table = object(shiftedkeyBytes, keyBytes);

  for (var i = 0; i < encrypted.length; i += 1) {
    var char = encrypted.charAt(i);
    if (char in table) {
      ret.push(table[char]);
    } else {
      ret.push(char);
    }
  }
  return ret.join("");
}

// move image tiles around
var NUMTILES = 4;
var OFFSET = 10;

function cmxgy_imageAreas(id) {
  var sha1Key = hex_sha1(cmxgy_key(id));
  var areas = range(0, 16);
  var splitKey = sha1Key.split("").reverse();
  for (var i = 2 * NUMTILES - 1; i >= 0; i--) {
    for (var j = 0; j < splitKey.length; j += 2) {
      if (splitKey[j] !== splitKey[j + 1]) {
        var b1 = parseInt(splitKey[j], 16) + i;
        var b2 = parseInt(splitKey[j + 1], 16) + i;
        if (b1 > 15) {
          b1 -= 16;
        }
        if (b2 > 15) {
          b2 -= 16;
        }
        // swap
        var temp = areas[b1];
        areas[b1] = areas[b2];
        areas[b2] = temp;
      }
    }
  }

  // split into a NUMTILESxNUMTILES array
  var ret = [];
  while (areas.length) {
    ret.push(areas.splice(0, NUMTILES));
  }
  return ret;
}

function cmxgy_decodeImage(encrypted, id, dim, cb) {
  var image = new Image();
  image.onload = function() {
    var canvas = document.createElement("canvas");
    canvas.width = dim.pixel_width;
    canvas.height = dim.pixel_height;
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    var areas = cmxgy_imageAreas(id);
    var cellWidth = Math.ceil(dim.pixel_width / NUMTILES);
    var cellHeight = Math.ceil(dim.pixel_height / NUMTILES);

    for (var row = 0; row < areas.length; row++) {
      var r = areas[row];
      var destY = row * cellHeight;

      for (var column = 0; column < r.length; column++) {
        var cell = r[column];
        var sourceX = cell % NUMTILES * (cellWidth + 2 * OFFSET) + OFFSET;
        var sourceY = Math.floor(cell / NUMTILES) * (cellHeight + 2 * OFFSET) + OFFSET;
        var destX = column * cellWidth;
        var widthOffset = column === NUMTILES - 1 ? 1 : 0;
        var heightOffset = row === NUMTILES - 1 ? 1 : 0;

        drawImage.call(getContext.call(canvas, "2d"), image, sourceX, sourceY, cellWidth - widthOffset, cellHeight - heightOffset, destX, destY, cellWidth - widthOffset, cellHeight - heightOffset);
      }
    }

    var ret = toDataURL.call(canvas, "image/jpeg", 0.92);
    document.body.removeChild(canvas);
    cb(ret);
  };
  image.onerror = image.onabort = function() {
    cb(null);
  };
  image.src = "data:image/jpeg;base64," + cmxgy_decryptImageJson(encrypted, id);
}

var cmxgy_replacementTable = function() {
  //var secretCodes = "055077086102122 090114108053048 049081069073078 068097107110080 072075076089120 118074079100070 121066065084111 054098116112099 087088106067085 113109047119105 052101117082104 071050057115103 083051056043061";
  //var replacements = secretCodes.split(" ").join("").match(/.../g).map(function(c){return String.fromCharCode(parseInt(c, 10));});
  var replacements = ["7", "M", "V", "f", "z", "Z", "r", "l", "5", "0", "1", "Q", "E", "I", "N", "D", "a", "k",
                      "n", "P", "H", "K", "L", "Y", "x", "v", "J", "O", "d", "F", "y", "B", "A", "T", "o", "6",
                      "b", "t", "p", "c", "W", "X", "j", "C", "U", "q", "m", "/", "w", "i", "4", "e", "u", "R",
                      "h", "G", "2", "9", "s", "g", "S", "3", "8", "+", "="];
  var base64chars = [].concat(range(65, 91), range(97, 123), range(48, 58), 43, 47, 61).map(function(c){return String.fromCharCode(c);});

  return object(replacements, base64chars);
}();

function cmxgy_parseMetadataJson(a) {
  return JSON.parse(atob(cmxgy_decryptJson(a)));
}

function cmxgy_decryptJson(json) {
  return json.split("").map(function(c){return cmxgy_replacementTable[c];}).join("");
}
})();
}

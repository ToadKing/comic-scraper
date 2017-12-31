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
  image.onerror = function() {
    cb(null);
  };
  image.src = "data:image/jpeg;base64," + cmxgy_decryptImageJson(encrypted, id);
}

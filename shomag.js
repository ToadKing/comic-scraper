if (window.location.hostname == "pocket.shonenmagazine.com") {
(function() {

var pages = [];

// watch for image nodes before they're automatically converted to canvases to get the image sources
var observer = new MutationObserver(function() {
  var images = document.querySelectorAll(".page-image");
  images.forEach((image) => {
    var src = image.getAttribute("data-src");
    if (pages.every((p) => p.src !== src)) {
      pages.push({
        src: src,
        width: +image.getAttribute("data-page-width"),
        height: +image.getAttribute("data-page-height"),
      });
    }
  });
});

observer.observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener("DOMContentLoaded", function() {
  observer.disconnect();
  observer = null;

  if (pages.length > 0) {
    insert_button(doDownload);
  }
}, false);

function loadImage(url, cb) {
  var i = new Image();
  i.onload = function() { cb(i); };
  i.onerror = i.onabort = function() { cb(null); };
  i.src = url;
}

function doDownload() {
  var done = 0;
  var todo = pages.length;
  var errors = [];
  zip = new JSZip();

  insert_progress_bar();
  set_progress_text("Downloading");

  var promises = pages.map((p, i) => new Promise((resolve, reject) => {
    var page = Number(i).toString();
    var filename = "000".substr(page.length) + page + ".jpg";

    loadImage(p.src, function(image) {
      if (image) {
        shomag_decodeImage(image, p, function(url) {
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

    var filename = "download";

    save(filename, errors);
  });
}

var CELLS_PER_SIDE = 4;
var DIMENSION_MULTIPLE = 8;

function shomag_decodeImage(image, prop, cb) {
  var canvas = document.createElement("canvas");
  canvas.width = prop.width;
  canvas.height = prop.height;
  canvas.style.display = "none";
  document.body.appendChild(canvas);

  var cell_width = Math.floor(prop.width / (CELLS_PER_SIDE * DIMENSION_MULTIPLE)) * DIMENSION_MULTIPLE;
  var cell_height = Math.floor(prop.height / (CELLS_PER_SIDE * DIMENSION_MULTIPLE)) * DIMENSION_MULTIPLE;

  for (var i = 0; i < CELLS_PER_SIDE * CELLS_PER_SIDE; i++) {
    var row = i % CELLS_PER_SIDE;
    var column = Math.floor(i / CELLS_PER_SIDE);
    var cell = row * CELLS_PER_SIDE + column;
    var source_x = row * cell_width;
    var source_y = column * cell_height;
    var dest_x = cell % CELLS_PER_SIDE * cell_width;
    var dest_y = Math.floor(cell / CELLS_PER_SIDE) * cell_height;
    drawImage.call(getContext.call(canvas, "2d"), image, source_x, source_y, cell_width, cell_height, dest_x, dest_y, cell_width, cell_height);
  }

  var ret = toDataURL.call(canvas, "image/jpeg", 0.92);
  document.body.removeChild(canvas);
  cb(ret);
}

})();
}

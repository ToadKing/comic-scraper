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

// progress bar
var progress = null;
var progress_text = null;

function insert_button(doDownload) {
  var container = document.createElement("div");
  container.style.zIndex = 999;
  container.style.position = "absolute";
  container.style.top = 0;
  container.style.left = 0;
  container.style.color = "red";
  var btn = document.createElement("button");
  btn.textContent = "Download";
  btn.style.background = "white";
  btn.onclick = function() {
    update_image_settings();
    doDownload();
  };
  var typeSel = document.createElement("select");
  typeSel.id = "comic-scraper-type";
  var jpgType = document.createElement("option");
  jpgType.value = "image/jpeg";
  jpgType.textContent = "JPG";
  var pngType = document.createElement("option");
  pngType.value = "image/png";
  pngType.textContent = "PNG";
  typeSel.appendChild(jpgType);
  typeSel.appendChild(pngType);
  typeSel.selectedIndex = 0;
  var qualityInput = document.createElement("input");
  qualityInput.id = "comic-scraper-quality";
  qualityInput.type = "number";
  qualityInput.min = "0";
  qualityInput.max = "100";
  qualityInput.value = "92";

  container.appendChild(btn);
  container.appendChild(document.createElement("br"));
  container.appendChild(typeSel);
  container.appendChild(document.createElement("br"));
  container.appendChild(document.createTextNode("Quality: "));
  container.appendChild(qualityInput);

  document.body.appendChild(container);
}

var image_settings;

function update_image_settings() {
  var typeSel = document.getElementById("comic-scraper-type");
  var type = typeSel.options[typeSel.selectedIndex].value;
  var quality;
  var ext;

  if (type === "image/jpeg") {
    quality = document.getElementById("comic-scraper-quality").value|0;
    ext = "jpg";
  } else {
    quality = 100;
    ext = "png";
  }

  var qualityFraction = Math.max(0, Math.min(quality, 100)) / 100;

  image_settings = {
    type: type,
    ext: ext,
    quality: qualityFraction,
  };
}

function insert_progress_bar() {
  if (progress === null) {
    progress = document.createElement("div");
    progress.style.position = "absolute";
    progress.style.top = "30px";
    progress.style.left = 0;
    progress.style.background = "white";
    progress.style.zIndex = 999;
    progress.style.width = "300px";
    progress.style.height = "20px";
    progress.style.textAlign = "center";
    progress.style.transform = "rotateZ(0deg)";
    document.body.appendChild(progress);
    progress_text = document.createElement("span");
    progress_text.style.font = "16px serif";
    progress_text.style.mixBlendMode = "difference";
    progress_text.style.color = "white";
    progress.appendChild(progress_text);
  }
}

function update_progress_bar(percent) {
  if (progress !== null) {
    var percent_text = (percent * 100) + "%";
    progress.style.background = "linear-gradient(to right, green " + percent_text + ", white " + percent_text + ")";
  }
}

function remove_progress_bar() {
  if (progress !== null) {
    document.body.removeChild(progress);
    progress = null;
    progress_text = null;
  }
}

function set_progress_text(text) {
  if (progress_text !== null) {
    progress_text.textContent = text;
  }
}

var save = function(filename, errors) {
  set_progress_text("Saving");

  setTimeout(function() {
    if (errors && errors.length) {
      alert("Errors saving the following pages: " + JSON.stringify(errors));
    }

    zip.generateAsync({ type: "blob" }).then(function (content) {
      filename = filename.replace(/[/\\:*?"<>|]/g, "");
      saveAs(content, filename + '.cbz');
      remove_progress_bar();
    });
  }, 0);
};

var zip;

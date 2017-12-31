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
  var btn = document.createElement("button");
  btn.textContent = "Download";
  btn.style.position = "absolute";
  btn.style.top = 0;
  btn.style.left = 0;
  btn.style.background = "white";
  btn.style.zIndex = 999;
  btn.onclick = doDownload;
  document.body.appendChild(btn);
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

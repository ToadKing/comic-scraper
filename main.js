// grab all the canvas prototypes we might need, comixology likes to stub some of them over
var toDataURL = HTMLCanvasElement.prototype.toDataURL;
var getContext = HTMLCanvasElement.prototype.getContext;
var drawImage = CanvasRenderingContext2D.prototype.drawImage;

// progress bar
var progress = null;
var progress_text = null;

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

var metadata;

// watch for nodes and grab the metadata before the page tries to hide it
// (we could just use the jQuery object but it looks like they try to hide $ so jQuery being exposed is probably an oversight)
var observer = new MutationObserver(function(mutations) {
  for (var i = 0; i < mutations.length; i++) {
    var mutation = mutations[i];
    if (mutation.target.id == "reader") {
      observer.disconnect();
      observer = null;
      metadata = parseMetadataJson(mutation.target.getAttribute("data-metadata"));
      insert_button();
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
  GM_xmlhttpRequest({
    method: "GET",
    url: url,
    headers: {
      "Accept": "*/*",
      "Referer": window.location.toString().split("#")[0],
      "Origin": window.location.origin
    },
    onload: function(res) { cb(res.responseText); },
    onerror: function() { cb(null); }
  });
}

function panelId(panel) {
  return [metadata.issue_info.series.series_id, (+panel + 2), metadata.comic_id].join("");
}

function insert_button() {
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

function doDownload() {
  var done = 0;
  var todo = metadata.book_info.pages.length;
  var errors = [];
  var zip = new JSZip();

  insert_progress_bar();
  set_progress_text("Downloading");

  var save = function() {
    set_progress_text("Saving");

    setTimeout(function() {
      if (errors.length) {
        alert("Errors saving the following pages: " + JSON.stringify(errors));
      }

      zip.generateAsync({ type: "blob" }).then(function (content) {
        saveAs(content, 'comic.cbz');
        remove_progress_bar();
      });
    }, 0);
  };

  var i = 0;
  var next = function() {
    var page = Number(i).toString();
    var filename = "000".substr(page.length) + page + ".jpg";
    var pageData = metadata.book_info.pages[page];
    var imgData = pageData.descriptor_set.image_descriptors[pageData.descriptor_set.image_descriptors.length - 1];
    var id = panelId(page);

    loadImage(imgData.uri + "&s=" + id, function(data) {
      if (data) {
        decodeImage(data, id, imgData, function(url) {
          if (url) {
            zip.file(filename, url.substr(url.indexOf(',') + 1), { base64: true });
            console.log("saved " + filename);
          } else {
            errors.push(filename);
            console.log("error saving " + filename);
          }
          done++;
          update_progress_bar(done / todo);
          if (done === todo) {
            save();
          } else {
            i++;
            next();
          }
        });
      }
    });
  };
  next();

}

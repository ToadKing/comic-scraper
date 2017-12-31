if (window.location.hostname == "www.comixology.com") {
(function() {

// progress bar
var progress = null;
var progress_text = null;

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
  var req = new XMLHttpRequest();
  req.open("GET", url);
  req.addEventListener("loadend", function(res) { cb(req.responseText); }, false);
  req.send();
}

function panelId(panel) {
  return [metadata.issue_info.series.series_id, (+panel + 1), metadata.comic_id].join("");
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
        var filename = metadata.issue_info.title;

        if ('series' in metadata.issue_info && 'issue_num' in metadata.issue_info.series) {
          filename = metadata.issue_info.series.title + " #" + metadata.issue_info.series.issue_num;
        }

        filename = filename.replace(/[/\\:*?"<>|]/g, "");

        saveAs(content, filename + '.cbz');
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

    loadImage(imgData.uri, function(data) {
      if (data) {
        cmxgy_decodeImage(data, id, imgData, function(url) {
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
})();
}

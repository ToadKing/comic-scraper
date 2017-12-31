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
          update_progress_bar(done / todo);
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
})();
}

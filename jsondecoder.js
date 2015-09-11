var replacementTable = function() {
  var secretCodes = "055077086102122 090114108053048 049081069073078 068097107110080 072075076089120 118074079100070 121066065084111 054098116112099 087088106067085 113109047119105 052101117082104 071050057115103 083051056043061";
  var base64chars = [].concat(range(65, 91), range(97, 123), range(48, 58), 43, 47, 61).map(function(c){return String.fromCharCode(c);});
  var replacements = secretCodes.split(" ").join("").match(/.../g).map(function(c){return String.fromCharCode(parseInt(c, 10));});
  var ret = {};

  for (var c = 0; c < base64chars.length; c++) {
      ret[replacements[c]] = base64chars[c];
  }

  return ret;
}();

function parseMetadataJson(a) {
  return JSON.parse(atob(decryptJson(a)));
}

function decryptJson(json) {
  var ret = [];

  for (var i = 0; i < json.length; i++) {
    ret.push(replacementTable[json.charAt(i)]);
  }

  return ret.join("");
}

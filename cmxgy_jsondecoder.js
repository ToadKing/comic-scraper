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

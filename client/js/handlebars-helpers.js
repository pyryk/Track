Handlebars.registerHelper('trend', function(value) {
  var str = '';
  for (var i=0; i<value; i++) {
    str += '<div class="trend"></div>';  
  }
  return new Handlebars.SafeString(str);
});
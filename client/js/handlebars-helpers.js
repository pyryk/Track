Handlebars.registerHelper('trend', function(value) {
  var str = '';
  for (var i=0; i<value; i++) {
    str += '<div class="trend"></div>';  
  }
  return new Handlebars.SafeString(str);
});

Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
  if (arguments.length < 3)
    throw new Error("Handlebars Helper equal needs 2 parameters");
  if( lvalue!=rvalue ) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
});
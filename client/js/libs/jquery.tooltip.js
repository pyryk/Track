(function( $ ) {      
  var tooltip;
  $.fn.trackTooltip = function(text, pos) {
    var tooltipEl = this;
    $('#tooltip').remove(); // remove the old one
    
    var tooltip = $('<div id="tooltip">' + text + '</div>');
    this.append(tooltip);
    
    tooltip.css( { left: pos.left-tooltip.outerWidth()/2, top: pos.top-tooltip.outerHeight()-20 } )
           .animate( { top: '+=10', opacity: 1 }, 50 );
    
    tooltip.bind('click mouseleave', function() {
      $(this).remove();
    });
  }
})( jQuery );
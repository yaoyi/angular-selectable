/***
@title:
Drag to Select

@version:
1.1.tny

@author:
Andreas Lagerkvist
Antonio Fernandez Porrua

@date:
2009-04-06
2013-01-30

@url:
http://andreaslagerkvist.com/jquery/drag-to-select/
https://github.com/pykiss/jQuery.dragToSelect

@license:
http://creativecommons.org/licenses/by/3.0/

@copyright:
2008 Andreas Lagerkvist (andreaslagerkvist.com)

@requires:
jquery, jquery.dragToSelect.css

@does:
Use this plug-in to allow your users to select certain elements by dragging a "select box". Works very similar to how you can drag-n-select files and folders in most OS:es.

@howto:
$('#my-files').dragToSelect(selectables: 'li'); would make every li in the #my-files-element selectable by dragging. The li:s will recieve a "selected"-class when they are within range of the select box when user drops.

Make sure a parent-element of the selectables has position: relative as well as overflow: auto or scroll.

@exampleHTML:
<ul>
	<li><img src="http://exscale.se/__files/3d/lamp-and-mates/lamp-and-mates-01_small.jpg" alt="Lamp and Mates" /></li>
	<li><img src="http://exscale.se/__files/3d/stugan-winter_small.jpg" alt="The Cottage - Winter time" /></li>
	<li><img src="http://exscale.se/__files/3d/ps2_small.jpg" alt="PS2" /></li>
</ul>

@exampleJS:
$('#jquery-drag-to-select-example').dragToSelect({
	selectables: 'li', 
	onHide: function () {
		alert($('#jquery-drag-to-select-example li.selected').length + ' selected');
	}
});
***/
(function($){
jQuery.fn.dragToSelect = function (conf) {

	var realParent	= jQuery(this),
	parent		= realParent;
	do {
		if (/auto|scroll|hidden/.test(parent.css('overflow'))) {
			break;
		}
		parent = parent.parent();
	} while (parent[0].parentNode);

	// Does user want to disable dragToSelect
	if (conf == 'disable') {
		parent.addClass(config.disabledClass);
		return this;
	}
	else if (conf == 'enable') {
		parent.removeClass(config.disabledClass);
		return this;
	}



	var c = typeof(conf) == 'object' ? conf : {};

	// Config
	var config = jQuery.extend({
		className:		'jquery-drag-to-select',
		classSelecting: 'jquery-drag-to-select-selecting',
		activeClass:	'active', 
		disabledClass:	'disabled', 
		selectedClass:	'selected', 
		cancel: 		'',
		recursive:      false,
		distance: 		0,
		scrollTH:		10, 
		percentCovered:	25, 
		selectables:	false, 
		autoScroll:		false, 
		selectOnMove:	false, 
		onShow:			function () {return true;}, 
		onHide:			function () {return true;}, 
		onRefresh:		function () {return true;}
	}, c);

    var parentDim = function () {
        var parentOffset	= parent.offset();

        return {
            left:	parentOffset.left,
            top:	parentOffset.top,
            width:	parent.outerWidth(),
            height:	parent.outerHeight()
        };
    };

	// Current origin of select box
	var selectBoxOrigin = {
		left:	0, 
		top:	0
	};

	// Create select box
	var selectBox = jQuery('<div/>')
						.appendTo(parent)
						.attr('class', config.className)
						.css('position', 'absolute');

	// Shows the select box
	var showSelectBox = function (e) {
		if (parent.is('.' + config.disabledClass)) {
			return;
		}

		selectBoxOrigin.left	= e.pageX - parentDim().left + parent[0].scrollLeft;
		selectBoxOrigin.top		= e.pageY - parentDim().top + parent[0].scrollTop;

		var css = {
			left:		selectBoxOrigin.left + 'px', 
			top:		selectBoxOrigin.top + 'px', 
			width:		'1px', 
			height:		'1px'
		};
		selectBox.addClass(config.activeClass).css(css);

		config.onShow();
	};

	// Refreshes the select box dimensions and possibly position
	var refreshSelectBox = function (e) {
		if (!selectBox.is('.' + config.activeClass) || parent.is('.' + config.disabledClass)) {
			return;
		}

		var left		= e.pageX - parentDim().left + parent[0].scrollLeft;
		var top			= e.pageY - parentDim().top + parent[0].scrollTop;
		var newLeft		= left;
		var newTop		= top;
		var newWidth	= selectBoxOrigin.left - newLeft;
		var newHeight	= selectBoxOrigin.top - newTop;

		if (left > selectBoxOrigin.left) {
			newLeft		= selectBoxOrigin.left;
			newWidth	= left - selectBoxOrigin.left;
		}

		if (top > selectBoxOrigin.top) {
			newTop		= selectBoxOrigin.top;
			newHeight	= top - selectBoxOrigin.top;
		}

		var css = {
			left:	newLeft + 'px', 
			top:	newTop + 'px', 
			width:	newWidth + 'px', 
			height:	newHeight + 'px'
		};
		selectBox.css(css);

		config.onRefresh();
		return newWidth > config.distance
	};

	// Hides the select box
	var hideSelectBox = function (e, canSelect) {
		if (!selectBox.is('.' + config.activeClass) || parent.is('.' + config.disabledClass)) {
			return;
		}
		if(canSelect){
			if (config.onHide(selectBox) !== false) {
				selectBox.removeClass(config.activeClass);
			}	
		}else{
			selectBox.removeClass(config.activeClass);
		}
		
	};

	// Scrolls parent if needed
	var scrollPerhaps = function (e) {
		if (!selectBox.is('.' + config.activeClass) || parent.is('.' + config.disabledClass)) {
			return;
		}

		if(config.autoScroll == 'vertical' || config.autoScroll == true){
			// Scroll down
			if ((e.pageY + config.scrollTH) > (parentDim().top + parentDim().height)) {
				parent[0].scrollTop += config.scrollTH;
			}
			// Scroll up
			if ((e.pageY - config.scrollTH) < parentDim().top) {
				parent[0].scrollTop -= config.scrollTH;
			}	
		}
		if(config.autoScroll == 'horizontal' || config.autoScroll == true){
			// Scroll right
			if ((e.pageX + config.scrollTH) > (parentDim().left + parentDim().width)) {
				parent[0].scrollLeft += config.scrollTH;
			}
			// Scroll left
			if ((e.pageX - config.scrollTH) < parentDim().left) {
				parent[0].scrollLeft -= config.scrollTH;
			}
		}
	};

	var shiftKey = false
	// Selects all the elements in the select box's range
	var selectElementsInRange = function () {
		if (!selectBox.is('.' + config.activeClass) || parent.is('.' + config.disabledClass)) {
			return;
		}

		var selectables		= realParent.find(config.selectables);
		var selectBoxOffset	= selectBox.offset();
		var selectBoxDim	= {
			left:	selectBoxOffset.left, 
			top:	selectBoxOffset.top, 
			width:	selectBox.width(), 
			height:	selectBox.height()
		};
		var start = new Date().getTime();
		selectables.each(function (i) {
			var el			= $(this);
			var elOffset	= el.offset();
			var elDim		= {
				left:	elOffset.left, 
				top:	elOffset.top, 
				width:	el.width(), 
				height:	el.height()
			};

			if (percentCovered(selectBoxDim, elDim) > config.percentCovered) {
				el.addClass(config.selectedClass);
			}
			else {
				if(!shiftKey){
					el.removeClass(config.selectedClass);	
				}
			}
		});
		var end = new Date().getTime();
      var time = end - start
      // console.log('select execution time:' + time + 'ms')
	
	};

	// Returns the amount (in %) that dim1 covers dim2
	var percentCovered = function (dim1, dim2) {
		// The whole thing is covering the whole other thing
		if (
			(dim1.left <= dim2.left) && 
			(dim1.top <= dim2.top) && 
			((dim1.left + dim1.width) >= (dim2.left + dim2.width)) && 
			((dim1.top + dim1.height) > (dim2.top + dim2.height))
		) {
			return 100;
		}
		// Only parts may be covered, calculate percentage
		else {
			dim1.right		= dim1.left + dim1.width;
			dim1.bottom		= dim1.top + dim1.height;
			dim2.right		= dim2.left + dim2.width;
			dim2.bottom		= dim2.top + dim2.height;

			var l = Math.max(dim1.left, dim2.left);
			var r = Math.min(dim1.right, dim2.right);
			var t = Math.max(dim1.top, dim2.top);
			var b = Math.min(dim1.bottom, dim2.bottom);

			if (b >= t && r >= l) {
			/*	$('<div/>').appendTo(document.body).css({
					background:	'red', 
					position:	'absolute',
					left:		l + 'px', 
					top:		t + 'px', 
					width:		(r - l) + 'px', 
					height:		(b - t) + 'px', 
					zIndex:		100
				}); */

				var percent = (((r - l) * (b - t)) / (dim2.width * dim2.height)) * 100;

			//	alert(percent + '% covered')

				return percent;
			}
		}
		// Nothing covered, return 0
		return 0;
	};

	// Do the right stuff then return this
	selectBox
		.mousemove(function (e) {
			var canSelect = refreshSelectBox(e);
			if (config.selectables && config.selectOnMove && canSelect) {			
				selectElementsInRange();
			}

			if (config.autoScroll && canSelect) {
				scrollPerhaps(e);
			}

			e.preventDefault();
		})
		.mouseup(function(e) {
			var canSelect = refreshSelectBox(e);
			if (config.selectables && !config.selectOnMove) {			
				selectElementsInRange();
			}

			hideSelectBox(e, canSelect);

			e.preventDefault();
		});

	if (jQuery.fn.disableTextSelect) {
		parent.disableTextSelect();
	}


	var mousemove = function(e){
		var canSelect = refreshSelectBox(e);
		if (config.selectables && config.selectOnMove && canSelect) {			
			selectElementsInRange();
		}

		if (config.autoScroll && canSelect) {
			scrollPerhaps(e);
		}
		// e.preventDefault();

	};
	var mouseup = function(e){
		var canSelect = refreshSelectBox(e);
		if (config.selectables && !config.selectOnMove) {			
			selectElementsInRange();
		}

		hideSelectBox(e, canSelect);

		$(document.body).off('mousemove',mousemove);
		$(document.body).off('mouseup',mouseup);
		parent.removeClass(config.classSelecting);
		
		// e.preventDefault();

	};

	function shouldCancel(e){
		if($(e.target).is(config.cancel))		
		{
			return true;
		}

		if(config.recursive){
			var elems = config.cancel.split(',')
			for(var i = 0; i < elems.length ; i++){
				if($(elems[i]).has(e.target).length){
					return true					
				}
			}
		}
	}
	parent.mousedown(function (e) {
		// Only with left button
		if(e.which!=1){
			return;
		}
		
		if(e.ctrlkey){
			return
		}
		
		// Make sure user isn't clicking scrollbar
		// if ((e.pageX-parentDim().left+parent.scrollLeft()) > parent.innerWidth() || (e.pageY-parentDim().top+parent.scrollTop()) > parent.innerHeight()) {
		// 	return;
		// }

		if(shouldCancel(e))
		{
			return;
		}
		
		shiftKey = e.shiftKey

		parent.addClass(config.classSelecting);

		if($('.'+config.className).length<=0){
			selectBox = jQuery('<div/>')
				.appendTo(parent)
				.attr('class', config.className)
				.css('position', 'absolute');
		}
		
		$(document.body).on('mousemove',mousemove);
		$(document.body).on('mouseup',mouseup);

		showSelectBox(e);
		e.preventDefault();
	});

	// Be nice
	return this;
};
})(jQuery);

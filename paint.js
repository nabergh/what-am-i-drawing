canvas = document.getElementById('drawingBoard');
context = canvas.getContext('2d');

canPaint = true;
var isPainting = false;
var offsetLeft = $('canvas').offset().left;
var offsetTop = $('canvas').offset().top;
$('canvas').mousedown(function(e) {
	var mouseX = e.pageX - this.offsetLeft;
	var mouseY = e.pageY - this.offsetTop;

	isPainting = canPaint;
	if(isPainting)
		addClick(e.pageX - offsetLeft, e.pageY - offsetTop);
	draw();
}).mousemove(function(e) {
	if (isPainting) {
		addClick(e.pageX - offsetLeft, e.pageY - offsetTop, true);
		draw();
	}
}).mouseup(function(e) {
	isPainting = false;
}).mouseleave(function(e) {
	isPainting = false;
});

var clickX, clickY, clickDrag, colors, weights;
var color;
var weight;

function resetTools() {
	clickX = [];
	clickY = [];
	clickDrag = [];
	colors = [];
	weights = [];
	color = 'black';
	weight = 5;
	$('.color-pick').first().addClass('painting');
	$('.weight-pick').first().addClass('painting');
}

resetTools();

function addClick(x, y, isDragging) {
	clickX.push(x);
	clickY.push(y);
	clickDrag.push(isDragging);
	colors.push(color);
	weights.push(weight);
}

function draw() {
	context.lineJoin = "round";

	var i = clickX.length - 1
	context.strokeStyle = colors[i];
	context.lineWidth = weights[i] - 2;
	context.beginPath();
	if (clickDrag[i] && i) {
		context.moveTo(clickX[i - 1], clickY[i - 1]);
	} else {
		context.moveTo(clickX[i] - 1, clickY[i]);
	}
	context.lineTo(clickX[i], clickY[i]);
	context.closePath();
	context.stroke();

}

function clear() {
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

$('.color-pick').click(function(e) {
	$('.color-pick').removeClass('painting');
	$(this).addClass('painting');
	color = $(this).css('background-color');
	brushChange(color, weight);
});

$('.weight-pick').each(function() {
	var weight = $(this).attr('weight');
	$(this).css({
		'width': weight,
		'height': weight,
		'border-radius': weight + 'px'
	});
});

$('.weight-pick').click(function(e) {
	$('.weight-pick').removeClass('painting');
	$(this).addClass('painting');
	weight = $(this).attr('weight');
	brushChange(color, weight);
});

$('#clear').click(function(e) {
	resetTools();
	clear();
})
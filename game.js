var socket = io.connect("nabergh.herokuapp.com");
var oppID; //opponent's socket id
var playerNo;

socket.on('connect', function(data) {
	socket.emit('opponent-searching');
});

window.onbeforeunload = function() {
	socket.emit('client-disconnect', {
		'oppID': oppID
	});
}


socket.on('opponent-disconnect', function(data) {
	window.clearTimeout(timeoutID1);
	window.clearTimeout(timeoutID2);
	$('#round-instructions').text('Searching for an opponent...');
	socket.emit('opponent-searching');
});

socket.on('opponent-found', function(data) {
	console.log(data);
	oppID = data['oppID'];
	if (data['clientID'] > oppID)
		playerNo = 1;
	else
		playerNo = 2;
	switchPlayers();
});

function switchPlayers() {
	$('#round-instructions').css({opacity: 1});
	$('#round-instructions').text('Round will begin in 3 seconds.');
	$('#round-instructions').fadeTo(3000, 0);
	if (playerNo == 1) {
		playerNo = 2;
		updateCursor(color, weight);
		$('.painting').removeClass('painting');
		$('#p2 .instructions').fadeTo(600, 1);
		$('#p1 .instructions').fadeTo(600, 0);
		$('#p1 .pronoun').text('They');
		$('#p2 .pronoun').text('You');
		canPaint = false;
	} else {
		playerNo = 1;
		clear();
		$('#cursor').empty();
		$('#p1 .instructions').fadeTo(600, 1);
		$('#p2 .instructions').fadeTo(600, 0);
		$('#p1 .pronoun').text('You');
		$('#p2 .pronoun').text('They');
		canPaint = true;
	}
	window.setTimeout(startPaintTimer, 3000, 20);
	window.setTimeout(startGuessTimer, 3000, 30);
}

function startPaintTimer(time) {
	if (time >= 0)
		countDownPainter(time);
	else
		canPaint = false;
}

function startGuessTimer(time) {
	if (time >= 0) {
		countDownGuesser(time);
	} else {
		endRound();
	}
}

var timeoutID1, timeoutID2, timeoutID3;

function countDownPainter(time) {
	$('#p1 .time').text(time / 10 < 1 ? '0' + time : time);
	timeoutID1 = window.setTimeout(startPaintTimer, 1000, time - 1);
}

function countDownGuesser(time) {
	$('#p2 .time').text(time / 10 < 1 ? '0' + time : time);
	timeoutID2 = window.setTimeout(startGuessTimer, 1000, time - 1);
}

function endRound() {
	$('#round-instructions').css({opacity: 1});
	if (playerNo == 1) {
		socket.emit('fillCanvas', {
			'oppID': oppID,
			url: canvas.toDataURL()
		});
		$('#round-instructions').text('Did they guess correctly?');
	} else {
		$('textarea.guess').trigger('focusout');
		$('#cursor').empty();
		socket.emit('sendGuess', {
			'oppID': oppID,
			guess: $('.guess').val()
		});
		$('#round-instructions').text('Did you guess correctly?');
	}
	timeoutID3 = window.setTimeout(switchPlayers, 10000);
}

/*
function focusOnElement(element) {
	element.children('span').css({
		//'box-shadow': '0px 0px 5px 10px white',
		position: 'relative',
		'z-index': 2
	});
	$('#cover').css({
		'visibility': 'visible'
	});
	$('#cover').animate({
		'opacity': 0.5
	}, 1000, function() {
		unfocusOnElement($(this));
	});
}

function unfocusOnElement(element) {
	element.children('.focus-span').css({
		'z-index': 0
	});
	$('#cover').animate({
		'opacity': 0
	}, 1000, function() {
		$(this).css({
			'visibility': 'hidden'
		});
	});
}*/

var mouseCounter = 0;
var prevTime = Date.now();
var duration, currTime;
var painter = $('#painter');
var offX = painter.offset().left;
var offY = painter.offset().top;
painter.mousemove(function(event) {
	if (mouseCounter++ > 2 && canPaint) {
		currTime = Date.now();
		duration = Math.min(currTime - prevTime, 30);
		prevTime = currTime;
		socket.emit('clientMousemove', {
			'oppID': oppID,
			mouseX: event.pageX - offX,
			mouseY: event.pageY - offY,
			'duration': duration
		});
		mouseCounter = 0;
	}
});

socket.on('serverMousemove', function(data) {
	$('#cursor').animate({
		'left': data.mouseX + offX - weight / 2,
		'top': data.mouseY + offY - weight / 2
	}, data.duration, 'linear');
});

socket.on('fillCanvas', function(data) {
	var img = new Image();
	img.src = data.url;
	context.drawImage(img, 0, 0);
});

socket.on('receiveGuess', function(data) {
	$('p.guess').text(data.guess);
});

function brushChange(c, w) {
	socket.emit('brushChange', {
		'oppID': oppID,
		'color': c,
		'weight': w
	});
}

socket.on('brushChange', function(data) {
	updateCursor(data.color, data.weight);
});

function updateCursor(color, weight) {
	$('#cursor').empty();
	var cursor = $('.weight-pick').filter(function(index) {
		return $(this).attr('weight') == weight;
	}).clone();
	cursor.css('background-color', color);
	if (color == 'rgb(255, 255, 255)') {
		cursor.css('border', 'solid black 1px');
	} else {
		cursor.css('border', 'none');
	}
	cursor.removeClass('painting');
	$('#cursor').append(cursor);
};

$('canvas').mousedown(function() {
	socket.emit('startPaint', {
		'oppID': oppID
	});
});
$(document).mouseup(function() {
	socket.emit('endPaint', {
		'oppID': oppID
	});
});

socket.on('startPaint', function(data) {
	$('#cursor').children().addClass('painting');
});

socket.on('endPaint', function(data) {
	$('#cursor').children().removeClass('painting');
});


$('.guess').elastic();
$('p.guess').click(function() {
	if(playerNo == 2) {
		$(this).hide();
		$('textarea.guess').show();
		$('textarea.guess').val($(this).text());
	}
});

$('textarea.guess').on('focusout', function() {
	if($(this).val() && playerNo == 2){
		$(this).hide();
		$('p.guess').show();
		$('p.guess').text($(this).val());
	}
});

$('textarea.guess').hide();
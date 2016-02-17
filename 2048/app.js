$(function() {
  var templates = {
    tile: '<div class="tile"></div>',
    message: '<div class="game-message"><p></p><div class="game-option"></div></div>',
    win: '<button class="continue-button">Keep going</button><button class="restart-button">Start over</button>',
    lose: '<button class="restart-button">Try again</button>'
  };

  var game = new Game();
  var board = game.create();

  var container = $('.tile-container');

  var score = 2;
  var winScore = 8;
  var continued = false;


  var addNewTile = function(row, col, val, classes) {
    var newTile = $(templates.tile);
    var type = val <= winScore ? val : 'super';
    newTile.addClass('tile-' + type);
    newTile.addClass('tile-position-' + row + '-' + col);
    if (classes) {
      newTile.addClass(classes);
    }
    newTile.text(val);
    container.append(newTile);
    return newTile;
  };

  var redraw = function(board) {
    container.empty();
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 4; col++) {
        if (board[row][col] != 0) {
          addNewTile(row, col, board[row][col]);
        }
      }
    }
  }

  redraw(board);


  var directions = ['left', 'up', 'right', 'down'];
  var rotation = {
    left: 0,
    up: 3,
    right: 2,
    down: 1
  };

  var inTransition = false;

  var keyEventHandler = function(event) {
    if (inTransition) return;
    inTransition = true;

    var key = event.which;
    if (key < 37 || key > 40) return;
    var direction = directions[event.which - 37];
    var newBoard = game.slide(board, direction);

    var changed = false;
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 4; col++) {
        if (newBoard[row][col] != board[row][col]) {
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    if (!changed) {
      inTransition = false;
      return;
    }

    var diff = computeDiff(board, newBoard, direction);
    moveTiles(board, direction, diff);
    setTimeout(function() {
      mergeTiles(newBoard);
      inTransition = false;
      board = newBoard;
      var newTile = game.addNew(board);
      addNewTile(newTile.x, newTile.y, newTile.val);
      if (score == winScore && !continued) {
        showMessage(true);
      } else if (checkGameOver(board)) {
        showMessage(false);
      }
    }, 100);
  };

  $(document).keydown(keyEventHandler);

  var computeDiff = function(board, newBoard, direction) {
    var rBoard = game.rotate(board, rotation[direction]);
    var rNewBoard = game.rotate(newBoard, rotation[direction]);

    var diff = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];

    for (row = 0; row < 4; row++) {
      var j = 0;
      var col = 0;
      while (j < 4 && rNewBoard[row][j] != 0) {
        while (rBoard[row][col] == 0) { col++; }
        if (rNewBoard[row][j] == rBoard[row][col]) {
          diff[row][col] = col - j;
        } else {
          diff[row][col] = col - j;
          while(rBoard[row][++col] == 0){}
          diff[row][col] = col - j;
        }
        j++;
        col++;
      }
    };
    diff = game.rotate(diff, (4 - rotation[direction]) % 4);
    return diff;
  };

  var moveTiles = function(board, direction, diff) {
    var tmpClass = 'before-move';
    $('.tile').addClass(tmpClass);
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 4; col++) {
        if (board[row][col] != 0 && diff[row][col] != 0) {
          var className = 'tile-position-' + row + '-' + col;
          var newClassName;
          if (direction == 'left') {
              newClassName = 'tile-position-' + row + '-' + (col - diff[row][col]);
          } else if (direction == 'right') {
              newClassName = 'tile-position-' + row + '-' + (col + diff[row][col]);
          } else if (direction == 'up') {
              newClassName = 'tile-position-' + (row - diff[row][col]) + '-' + col;
          } else if (direction == 'down') {
              newClassName = 'tile-position-' + (row + diff[row][col]) + '-' + col;
          }
          $('.' + className + '.' + tmpClass).removeClass(tmpClass).removeClass(className).addClass(newClassName);
        }
      }
    }
    $('.tile').removeClass(tmpClass);
  };

  var mergeTiles = function(board) {
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 4; col++) {
        var className = 'tile-position-' + row + '-' + col;
        var tiles = $('.' + className);
        if (tiles.length > 1) {
          var value = parseInt(tiles.first().text()) * 2;
          score = Math.max(score, value);
          var newTile = addNewTile(row, col, value, 'tile-merged');
          tiles.remove();
          newTile.removeClass('tile-merged');
        }
      }
    }
  };

  var showMessage = function(win) {
    $(document).off('keydown');
    $('.grid-container').css('opacity', 0.3);
    $('.tile-container').css('opacity', 0.3);


    var messageDiv = $(templates.message);
    var cleanUp = function() {
      messageDiv.remove();
      $(document).keydown(keyEventHandler);
      $('.grid-container').css('opacity', '');
      $('.tile-container').css('opacity', '');
    };

    if (win) {
      messageDiv.find('p').text('You win!');
      messageDiv.find('.game-option').html(templates.win);
      messageDiv.find('.continue-button').click(function() {
        cleanUp();
        continued = true;
      });
    } else {
      messageDiv.find('p').text('Game over :(');
      messageDiv.find('.game-option').html(templates.lose);
    }
    messageDiv.find('.restart-button').click(function() {
      score = 2;
      board = game.create();
      redraw(board);
      cleanUp();
    });

    $('.game-container').append(messageDiv);
  };

  var checkGameOver = function(board) {
    for (var i = directions.length - 1; i >= 0; i--) {
      var newBoard = game.slide(board, directions[i]);
      if (game.addNew(newBoard)) return false;
    };
    return true;
  }

});

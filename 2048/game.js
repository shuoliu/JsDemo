function Game() {
  this.ROTATIONS = {
    left: 0,
    down: 1,
    right: 2,
    up: 3
  };

}

Game.prototype.rotate = function(board, times) {
  var step = [[], [], [], []],
      row, col;

  if (times === 0) {
    for (row = 0; row < 4; row++) {
      for (col = 0; col < 4; col++) {
        step[row][col] = board[row][col];
      }
    }

    return step;
  }

  // 0  => 0
  // -1 => 3
  // -2 => 2
  // -3 => 1
  // 4  => 0
  if (times < 0) {
    times = (times % 4) + 4;
  }

  for (row = 0; row < 4; row++) {
    for (col = 0; col < 4; col++) {
      // 0, 0 => 0, 3
      // 0, 1 => 1, 3
      // 0, 2 => 2, 3
      // 0, 3 => 3, 3
      // 1, 0 => 0, 2
      // 1, 1 => 1, 2
      // 1, 2 => 2, 2
      // 1, 3 => 3, 2
      // 2, 0 => 0, 1
      // ...
      step[col][3 - row] = board[row][col];
    }
  }

  return this.rotate(step, times - 1);
};

Game.prototype.combine = function(row) {
  var combined = [],
      di = 0,
      si = 0;

  while (di < 4 && si < 4) {
    var value = row[si];

    if (value === 0) {
      si++;
    } else {
      var ni = si + 1;

      while (ni < 3 && row[ni] === 0) {
        ni++;
      }

      if (row[ni] === value) {
        combined[di] = value * 2;
        di++;
        si = ni + 1;
      } else {
        combined[di] = value;
        di++;
        si = ni;
      }
    }
  }

  while (di < 4) {
    combined[di] = 0;
    di++;
  }

  return combined;
};

Game.prototype.slide = function(board, direction) {
  var rotations = this.ROTATIONS[direction],
      slider = this.rotate(board, rotations);

  // slide stuff...
  for (var row = 0; row < 4; row++) {
    slider[row] = this.combine(slider[row]);
  }

  return rotations === 0 ? slider : this.rotate(slider, -rotations);
};

Game.prototype.create = function() {
  var board = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];
  this.addNew(board);
  this.addNew(board);
  return board;
};

Game.prototype.addNew = function(board) {
  var emptyCell = [];
  for (var row = 0; row < 4; row++) {
    for (var col = 0; col < 4; col++) {
      if (board[row][col] === 0) {
        emptyCell.push({
          x: row,
          y: col
        });
      }
    }
  }
  if (emptyCell.length == 0) return null;
  var index = Math.floor(Math.random() * emptyCell.length);
  var pos = emptyCell[index];
  var val = Math.random() > 0.95 ? 4 : 2;
  board[pos.x][pos.y] = val;
  return {
    x: pos.x,
    y: pos.y,
    val: val
  };
};

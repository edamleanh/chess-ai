// Khởi tạo game
var game = new Chess();
var board = null;
var stockfish = null;
var playerColor = 'w';
var isThinking = false;
var selectedSquare = null;
var possibleMoves = [];

// Khởi tạo Stockfish engine
function initStockfish() {
    try {
        // Tạo Web Worker từ stockfish.js
        stockfish = new Worker('stockfish.js');
        
        // Lắng nghe phản hồi từ Stockfish
        stockfish.onmessage = function(event) {
            var line = event.data;
            console.log('Stockfish:', line);
            
            // Khi Stockfish gửi nước đi tốt nhất
            if (line.includes('bestmove')) {
                var match = line.match(/bestmove\s+(\S+)/);
                if (match) {
                    var move = match[1];
                    makeStockfishMove(move);
                }
            }
        };
        
        stockfish.onerror = function(error) {
            console.error('Stockfish error:', error);
            alert('❌ Lỗi khi khởi tạo Stockfish: ' + error.message);
        };
        
        // Khởi tạo engine
        stockfish.postMessage('uci');
        stockfish.postMessage('isready');
        stockfish.postMessage('ucinewgame');
        
        console.log('✅ Stockfish engine initialized');
    } catch(e) {
        console.error('Cannot initialize Stockfish:', e);
        alert('❌ Không tìm thấy Stockfish! Vui lòng tải stockfish.js và stockfish.wasm vào cùng thư mục với index.html\n\nLỗi: ' + e.message);
    }
}

// Cấu hình board
var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

board = Chessboard('board', config);

// Đợi board render xong rồi mới thêm event listener
window.setTimeout(function() {
    console.log('Setting up click handlers...');
    
    // Bắt click ở cả board để tránh bị quân cờ chặn
    var boardElement = document.getElementById('board');
    
    if (boardElement) {
        console.log('Board element found, adding click listener');
        
        boardElement.addEventListener('click', function(e) {
            console.log('Click detected on board!', e.target);
            
            // Tìm ô cờ gần nhất (có thể click vào piece hoặc square)
            var target = e.target;
            var squareElement = null;
            
            // Nếu click vào piece, lấy parent (square)
            if (target.classList.contains('piece-417db')) {
                squareElement = target.parentElement;
                console.log('Clicked on piece, parent:', squareElement);
            }
            // Nếu click trực tiếp vào square
            else if (target.classList.contains('square-55d63')) {
                squareElement = target;
                console.log('Clicked on square directly');
            }
            
            if (squareElement) {
                var classes = squareElement.className;
                console.log('Square classes:', classes);
                
                var classList = classes.split(' ');
                var square = null;
                
                // Tìm class có dạng "square-a1", "square-b2", etc.
                for (var i = 0; i < classList.length; i++) {
                    if (classList[i].indexOf('square-') === 0 && classList[i].length === 9) {
                        square = classList[i].substring(7);
                        break;
                    }
                }
                
                console.log('Square detected:', square);
                
                if (square) {
                    onSquareClick(square);
                }
            } else {
                console.log('No valid square element found');
            }
        });
        
        console.log('Click handler set up on board!');
    } else {
        console.error('Board element not found!');
    }
}, 500);

// Xử lý click vào ô cờ
function onSquareClick(square) {
    console.log('onSquareClick called with:', square);
    console.log('Game over:', game.game_over(), 'Thinking:', isThinking, 'Turn:', game.turn());
    
    // Không cho click khi game kết thúc hoặc máy đang suy nghĩ
    if (game.game_over() || isThinking) return;
    
    // Không cho click khi không phải lượt người chơi
    if (game.turn() !== playerColor) return;
    
    var piece = game.get(square);
    console.log('Piece at', square, ':', piece);
    
    // Nếu click vào quân của mình
    if (piece && piece.color === game.turn()) {
        console.log('Selected own piece at', square);
        
        // Hủy selection cũ
        removeHighlights();
        
        // Chọn quân mới
        selectedSquare = square;
        highlightSquare(square);
        
        // Lấy các nước đi khả dụng
        possibleMoves = game.moves({
            square: square,
            verbose: true
        });
        
        console.log('Possible moves:', possibleMoves);
        
        // Highlight các ô có thể đi
        possibleMoves.forEach(function(move) {
            highlightMove(move.to, move.flags.includes('c'));
        });
    }
    // Nếu click vào ô đích hợp lệ
    else if (selectedSquare && possibleMoves.length > 0) {
        console.log('Trying to move from', selectedSquare, 'to', square);
        
        var moveObj = possibleMoves.find(function(m) {
            return m.to === square;
        });
        
        if (moveObj) {
            console.log('Valid move found:', moveObj);
            
            // Thực hiện nước đi
            var move = game.move({
                from: selectedSquare,
                to: square,
                promotion: 'q'
            });
            
            if (move) {
                board.position(game.fen());
                removeHighlights();
                selectedSquare = null;
                possibleMoves = [];
                
                updateStatus();
                updateMoveHistory();
                
                if (game.game_over()) {
                    handleGameOver();
                } else {
                    window.setTimeout(makeStockfishThink, 250);
                }
            }
        } else {
            console.log('Invalid move - clearing selection');
            // Click vào ô không hợp lệ - hủy selection
            removeHighlights();
            selectedSquare = null;
            possibleMoves = [];
        }
    }
}

// Highlight ô được chọn
function highlightSquare(square) {
    var $square = $('#board .square-' + square);
    $square.addClass('highlight-square');
}

// Highlight ô có thể di chuyển
function highlightMove(square, isCapture) {
    var $square = $('#board .square-' + square);
    if (isCapture) {
        $square.addClass('highlight-capture');
    } else {
        $square.addClass('highlight-move');
    }
}

// Xóa tất cả highlight
function removeHighlights() {
    $('#board .square-55d63').removeClass('highlight-square highlight-move highlight-capture');
}

// Chỉ cho phép kéo quân của người chơi
function onDragStart(source, piece, position, orientation) {
    // Không cho kéo khi game kết thúc
    if (game.game_over()) return false;
    
    // Không cho kéo khi máy đang suy nghĩ
    if (isThinking) return false;
    
    // Chỉ cho kéo quân của màu người chơi
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

// Xử lý khi thả quân
function onDrop(source, target) {
    // Xóa highlights
    removeHighlights();
    selectedSquare = null;
    possibleMoves = [];
    
    // Kiểm tra nước đi có hợp lệ không
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Luôn phong hậu khi tốt lên cuối bàn
    });
    
    // Nếu nước đi không hợp lệ
    if (move === null) return 'snapback';
    
    // Cập nhật giao diện
    updateStatus();
    updateMoveHistory();
    
    // Kiểm tra game over
    if (game.game_over()) {
        handleGameOver();
        return;
    }
    
    // Gọi máy đi
    window.setTimeout(makeStockfishThink, 250);
}

// Cập nhật vị trí quân sau khi thả
function onSnapEnd() {
    board.position(game.fen());
}

// Cập nhật trạng thái game
function updateStatus() {
    var status = 'Đang chơi';
    var turn = game.turn() === 'w' ? 'Trắng' : 'Đen';
    
    if (game.in_checkmate()) {
        status = 'Chiếu hết';
    } else if (game.in_draw()) {
        status = 'Hòa';
    } else if (game.in_check()) {
        status = 'Chiếu tướng!';
    } else if (game.in_stalemate()) {
        status = 'Stalemate (Hòa)';
    } else if (game.in_threefold_repetition()) {
        status = 'Hòa (3 lần lặp)';
    } else if (game.insufficient_material()) {
        status = 'Hòa (Không đủ quân)';
    }
    
    document.getElementById('turn').textContent = turn;
    document.getElementById('status').textContent = status;
}

// Cập nhật lịch sử nước đi
function updateMoveHistory() {
    var history = game.history({ verbose: true });
    var historyDiv = document.getElementById('moveHistory');
    
    if (history.length === 0) {
        historyDiv.innerHTML = '<em>Chưa có nước đi nào</em>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < history.length; i += 2) {
        var moveNumber = Math.floor(i / 2) + 1;
        var whiteMove = history[i].san;
        var blackMove = history[i + 1] ? history[i + 1].san : '';
        
        html += moveNumber + '. ' + whiteMove;
        if (blackMove) {
            html += ' ' + blackMove;
        }
        html += '<br>';
    }
    
    historyDiv.innerHTML = html;
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// Gọi Stockfish suy nghĩ
function makeStockfishThink() {
    if (!stockfish) return;
    
    isThinking = true;
    document.getElementById('thinking').classList.add('active');
    
    // Lấy độ khó và thời gian
    var depth = document.getElementById('difficultySelect').value;
    var moveTime = document.getElementById('timeSelect').value;
    
    // Gửi vị trí hiện tại cho Stockfish
    var fen = game.fen();
    stockfish.postMessage('position fen ' + fen);
    
    // Yêu cầu Stockfish tính toán
    if (moveTime === '0') {
        // Không giới hạn thời gian, chỉ dùng depth
        stockfish.postMessage('go depth ' + depth);
    } else {
        // Giới hạn cả depth và thời gian
        stockfish.postMessage('go depth ' + depth + ' movetime ' + moveTime);
    }
}

// Thực hiện nước đi của Stockfish
function makeStockfishMove(moveString) {
    // Parse UCI move (e.g., "e2e4" or "e7e8q")
    var from = moveString.substring(0, 2);
    var to = moveString.substring(2, 4);
    var promotion = moveString.length > 4 ? moveString.substring(4, 5) : undefined;
    
    // Thực hiện nước đi
    var move = game.move({
        from: from,
        to: to,
        promotion: promotion
    });
    
    if (move === null) {
        console.error('Invalid Stockfish move:', moveString);
        isThinking = false;
        document.getElementById('thinking').classList.remove('active');
        return;
    }
    
    // Cập nhật board
    board.position(game.fen());
    
    // Cập nhật giao diện
    updateStatus();
    updateMoveHistory();
    
    isThinking = false;
    document.getElementById('thinking').classList.remove('active');
    
    // Kiểm tra game over
    if (game.game_over()) {
        handleGameOver();
    }
}

// Xử lý khi game kết thúc
function handleGameOver() {
    var title = '';
    var message = '';
    
    if (game.in_checkmate()) {
        var winner = game.turn() === 'w' ? 'Đen' : 'Trắng';
        title = winner + ' thắng!';
        message = (winner === 'Trắng' ? '🎉 Chúc mừng! Bạn đã thắng!' : '😔 Bạn đã thua!') + ' Chiếu hết!';
    } else if (game.in_draw()) {
        title = 'Hòa!';
        message = '🤝 Trò chơi kết thúc hòa';
    } else if (game.in_stalemate()) {
        title = 'Stalemate - Hòa!';
        message = '🤝 Không có nước đi hợp lệ';
    } else if (game.in_threefold_repetition()) {
        title = 'Hòa!';
        message = '🤝 Lặp lại vị trí 3 lần';
    } else if (game.insufficient_material()) {
        title = 'Hòa!';
        message = '🤝 Không đủ quân để chiếu hết';
    }
    
    document.getElementById('gameOverTitle').textContent = title;
    document.getElementById('gameOverMessage').textContent = message;
    document.getElementById('gameOver').classList.add('active');
}

// Bắt đầu ván mới
function newGame() {
    game.reset();
    board.start();
    removeHighlights();
    selectedSquare = null;
    possibleMoves = [];
    updateStatus();
    document.getElementById('moveHistory').innerHTML = '<em>Chưa có nước đi nào</em>';
    document.getElementById('gameOver').classList.remove('active');
    document.getElementById('thinking').classList.remove('active');
    isThinking = false;
    
    // Reset Stockfish
    if (stockfish) {
        stockfish.postMessage('ucinewgame');
        stockfish.postMessage('isready');
    }
}

// Hoàn tác nước đi
function undoMove() {
    if (isThinking) return;
    
    // Hoàn tác 2 nước đi (của người chơi và máy)
    game.undo();
    if (game.history().length > 0) {
        game.undo();
    }
    
    board.position(game.fen());
    removeHighlights();
    selectedSquare = null;
    possibleMoves = [];
    updateStatus();
    updateMoveHistory();
}

// Lật bàn cờ
function flipBoard() {
    board.flip();
}

// Thay đổi độ khó
document.getElementById('difficultySelect').addEventListener('change', function() {
    console.log('Độ khó mới: Depth ' + this.value);
});

// Thay đổi thời gian suy nghĩ
document.getElementById('timeSelect').addEventListener('change', function() {
    var time = this.value === '0' ? 'Không giới hạn' : (this.value / 1000) + 's';
    console.log('Thời gian suy nghĩ: ' + time);
});

// Khởi tạo khi trang load
window.onload = function() {
    initStockfish();
    updateStatus();
    updateMoveHistory();
};

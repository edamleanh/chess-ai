// Khởi tạo game
var game = new Chess();
var board = null;
var stockfish = null;
var playerColor = 'w';
var isThinking = false;

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

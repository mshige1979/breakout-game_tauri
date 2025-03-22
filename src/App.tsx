import { useEffect, useRef } from "react";
import "./App.css";

/**
 * ブロック崩しゲームのメインコンポーネント
 * ステージ選択とゲームプレイの機能を提供する
 */
function App() {
  // キャンバス要素への参照
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ========== ゲーム設定と状態 ==========

    /**
     * ゲームキャンバスの幅
     */
    const canvasWidth = 1000;

    /**
     * ゲームキャンバスの高さ
     */
    const canvasHeight = 620;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    /**
     * ゲームUIで使用する色のパレット
     */
    const colorPalette = {
      background: "#1a1a2e", // 濃い紺色の背景
      primary: "#0f3460",    // 濃い青
      secondary: "#e94560",  // 鮮やかな赤
      accent: "#16213e",     // 濃い青緑
      light: "#f1f1f1",      // 明るい白
      highlight: "#00adb5"   // ハイライト用の明るい青緑
    };

    // ----- パドルとボールの設定 -----

    /**
     * パドルの高さ
     */
    const paddleHeight = 10;

    /**
     * パドルの下端からのオフセット
     */
    const paddleYOffset = 50;

    /**
     * パドルの幅（ステージにより変化）
     */
    let paddleWidth = 100;

    /**
     * ボールの半径
     */
    const ballRadius = 10;

    /**
     * ボールのX座標
     */
    let ballX = canvasWidth / 2;

    /**
     * ボールのY座標
     */
    let ballY = canvasHeight - paddleYOffset - ballRadius - 10;

    /**
     * ボールのX方向の速度
     */
    let ballDX = 2;

    /**
     * ボールのY方向の速度
     */
    let ballDY = -2;

    /**
     * パドルのX座標
     */
    let paddleX = (canvasWidth - paddleWidth) / 2;

    // ----- ゲーム状態の管理 -----

    /**
     * ゲームの状態を表す定数
     */
    const GameState = {
      STAGE_SELECT: 'stage_select', // ステージ選択画面
      PLAYING: 'playing',           // ゲームプレイ中
      LIFE_LOST: 'life_lost',       // ライフを失った状態
      STAGE_CLEAR: 'stage_clear',   // ステージクリア
      GAME_OVER: 'game_over',       // ゲームオーバー
      GAME_COMPLETE: 'game_complete' // 全ステージクリア
    };

    /**
     * 現在のゲーム状態
     */
    let gameState = GameState.STAGE_SELECT;

    /**
     * ゲームが開始されているかどうか
     */
    let gameStarted = false;

    /**
     * 右キーが押されているかどうか
     */
    let rightPressed = false;

    /**
     * 左キーが押されているかどうか
     */
    let leftPressed = false;

    /**
     * 現在のスコア
     */
    let score = 0;

    /**
     * 1ブロック破壊あたりのスコア
     */
    const SCORE_PER_BRICK = 10;

    // ----- ステージ管理 -----

    /**
     * 現在選択されているステージ番号
     */
    let currentStage = 1;

    /**
     * 最大ステージ数
     */
    const maxStage = 15;

    /**
     * 選択中のステージインデックス
     */
    let selectedStageIndex = 0;

    /**
     * 初期残機数
     */
    const initialLives = 3;

    /**
     * 現在の残機数
     */
    let lives = initialLives;

    /**
     * ステージのクリア状態
     */
    let clearedStages = Array(maxStage).fill(false);

    // ----- ブロック設定 -----

    /**
     * ブロックの高さ
     */
    const brickHeight = 20;

    /**
     * ブロック間のパディング
     */
    const brickPadding = 10;

    /**
     * ブロックの上部オフセット
     */
    const brickOffsetTop = 50;

    /**
     * ブロックの左オフセット
     */
    const brickOffsetLeft = 30;

    /**
     * ブロックの行数
     */
    let brickRowCount = 3;

    /**
     * ブロックの列数
     */
    let brickColumnCount = 5;

    /**
     * ブロックの幅（動的に計算）
     */
    let brickWidth = 0;

    // ----- ステージ設定 -----

    /**
     * 各ステージの設定
     * 難易度に応じてブロック数や速度、パドル幅を調整
     */
    const stageSettings = [
      {}, // ダミー（インデックス0は使わない）
      { // ステージ1: 非常に簡単な入門ステージ
        rows: 2,
        columns: 5,
        brickColors: ["#6495ED", "#87CEFA"], // 青系の優しい色
        ballSpeed: 1.5,
        paddleWidth: 120 // 広めのパドル
      },
      { // ステージ2: 簡単
        rows: 2,
        columns: 7,
        brickColors: ["#6495ED", "#87CEFA"],
        ballSpeed: 1.8,
        paddleWidth: 110
      },
      { // ステージ3: やや簡単
        rows: 3,
        columns: 7,
        brickColors: ["#5F9EA0", "#66CDAA", "#98FB98"],
        ballSpeed: 2.0,
        paddleWidth: 105
      },
      { // ステージ4: 普通
        rows: 3,
        columns: 8,
        brickColors: ["#32CD32", "#3CB371", "#2E8B57"],
        ballSpeed: 2.2,
        paddleWidth: 100
      },
      { // ステージ5: 普通+
        rows: 4,
        columns: 8,
        brickColors: ["#FFD700", "#FFA500", "#FF8C00", "#F4A460"],
        ballSpeed: 2.5,
        paddleWidth: 100
      },
      { // ステージ6: やや難しい
        rows: 4,
        columns: 9,
        brickColors: ["#FFA500", "#FF8C00", "#FF7F50", "#FF6347"],
        ballSpeed: 2.7,
        paddleWidth: 95
      },
      { // ステージ7: 中レベル
        rows: 5,
        columns: 9,
        brickColors: ["#FF6347", "#FF4500", "#FF0000", "#DC143C", "#B22222"],
        ballSpeed: 3.0,
        paddleWidth: 95
      },
      { // ステージ8: 中~上級
        rows: 5,
        columns: 10,
        brickColors: ["#B22222", "#8B0000", "#A52A2A", "#CD5C5C", "#F08080"],
        ballSpeed: 3.2,
        paddleWidth: 90
      },
      { // ステージ9: 上級−
        rows: 6,
        columns: 10,
        brickColors: ["#9370DB", "#8A2BE2", "#9400D3", "#9932CC", "#BA55D3", "#8B008B"],
        ballSpeed: 3.5,
        paddleWidth: 90
      },
      { // ステージ10: 上級
        rows: 6,
        columns: 11,
        brickColors: ["#483D8B", "#6A5ACD", "#7B68EE", "#8470FF", "#0000CD", "#4169E1"],
        ballSpeed: 3.8,
        paddleWidth: 85
      },
      { // ステージ11: 上級+
        rows: 7,
        columns: 11,
        brickColors: ["#2F4F4F", "#008080", "#008B8B", "#00CED1", "#40E0D0", "#48D1CC", "#7FFFD4"],
        ballSpeed: 4.0,
        paddleWidth: 85
      },
      { // ステージ12: 挑戦的
        rows: 7,
        columns: 12,
        brickColors: ["#BC8F8F", "#CD5C5C", "#8B4513", "#A0522D", "#D2691E", "#8B0000", "#B22222"],
        ballSpeed: 4.3,
        paddleWidth: 80
      },
      { // ステージ13: 非常に難しい
        rows: 8,
        columns: 12,
        brickColors: ["#696969", "#808080", "#A9A9A9", "#C0C0C0", "#D3D3D3", "#DCDCDC", "#F5F5F5", "#FFFFFF"],
        ballSpeed: 4.6,
        paddleWidth: 80
      },
      { // ステージ14: エキスパート
        rows: 8,
        columns: 13,
        brickColors: ["#006400", "#008000", "#228B22", "#2E8B57", "#3CB371", "#66CDAA", "#8FBC8F", "#90EE90"],
        ballSpeed: 5.0,
        paddleWidth: 75
      },
      { // ステージ15: 最終挑戦（かなり難しい）
        rows: 9,
        columns: 14,
        brickColors: ["#000000", "#1A1A1A", "#333333", "#4D4D4D", "#666666", "#7F7F7F", "#999999", "#B3B3B3", "#CCCCCC"],
        ballSpeed: 5.5,
        paddleWidth: 70 // 小さいパドルで難易度アップ
      }
    ];

    // ----- ブロック配列 -----

    /**
     * ブロックのインターフェース
     */
    interface Brick {
      x: number;     // X座標
      y: number;     // Y座標
      status: number; // 状態（1=表示, 0=非表示）
    }

    /**
     * ブロック配列
     */
    const bricks: Brick[][] = [];

    // ----- ローカルストレージ関連 -----

    /**
     * ゲームの進行状況を保存するキー
     */
    const STORAGE_KEY = 'blockbreaker_progress';

    // ========== ユーティリティ関数 ==========

    /**
     * 色を明るくする関数
     * @param color - 基本色（HEX形式）
     * @param percent - 明るくする割合（0-100）
     * @returns 明るくした色（HEX形式）
     */
    function lightenColor(color: string, percent: number): string {
      const num = parseInt(color.replace("#", ""), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.min(255, (num >> 16) + amt);
      const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
      const B = Math.min(255, (num & 0x0000FF) + amt);
      return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }

    /**
     * 色を暗くする関数
     * @param color - 基本色（HEX形式）
     * @param percent - 暗くする割合（0-100）
     * @returns 暗くした色（HEX形式）
     */
    function darkenColor(color: string, percent: number): string {
      const num = parseInt(color.replace("#", ""), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, (num >> 16) - amt);
      const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
      const B = Math.max(0, (num & 0x0000FF) - amt);
      return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }

    // ========== ゲーム初期化・管理関数 ==========

    /**
     * ゲームの初期化を行う関数
     * ローカルストレージからデータを読み込み、ステージ選択画面を表示する
     */
    function initGame() {
      loadProgress();
      selectedStageIndex = 0;
      gameState = GameState.STAGE_SELECT;
      initializeBricks();
    }

    /**
     * 現在のステージの設定を取得する関数
     * @returns 現在のステージの設定オブジェクト
     */
    function getCurrentStageSettings() {
      const settings = stageSettings[currentStage];
      if (!settings) {
        console.warn(`ステージ${currentStage}の設定が見つかりません。デフォルト値を使用します。`);
        return {
          rows: 3,
          columns: 5,
          brickColors: ["#CCCCCC"],
          ballSpeed: 2,
          paddleWidth: 100
        };
      }
      return settings;
    }

    /**
     * ブロックサイズを列数に応じて計算する関数
     * @param columns - 列数
     * @returns {width, height} ブロックのサイズ
     */
    function calculateBrickDimensions(columns: number) {
      const totalHorizontalMargin = 60;
      const availableWidth = canvasWidth - totalHorizontalMargin;
      const totalPaddingWidth = brickPadding * (columns - 1);
      const calculatedBrickWidth = Math.floor((availableWidth - totalPaddingWidth) / columns);
      
      return {
        width: calculatedBrickWidth,
        height: brickHeight
      };
    }

    /**
     * 現在の列数に応じてブロック幅を更新する関数
     * @returns 計算されたブロック幅
     */
    function updateBrickDimensions() {
      const newDimensions = calculateBrickDimensions(brickColumnCount);
      return newDimensions.width;
    }

    /**
     * ブロック配列を初期化する関数
     */
    function initializeBricks() {
      for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
          bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
      }
    }

    // ========== プログレス管理関数 ==========

    /**
     * ローカルストレージからゲームの進行状況を読み込む関数
     */
    function loadProgress() {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const progress = JSON.parse(savedData);
          if (progress.clearedStages && Array.isArray(progress.clearedStages)) {
            clearedStages = progress.clearedStages;
            console.log('クリア状態を読み込みました:', clearedStages);
          }
        }
      } catch (e) {
        console.error('進行状況の読み込みに失敗しました:', e);
      }
    }
    
    /**
     * ローカルストレージにゲームの進行状況を保存する関数
     */
    function saveProgress() {
      try {
        const progress = {
          clearedStages: clearedStages,
          lastSaved: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        console.log('クリア状態を保存しました:', clearedStages);
      } catch (e) {
        console.error('進行状況の保存に失敗しました:', e);
      }
    }

    /**
     * 特定のステージを選択して開始する関数
     * @param stageNum - 選択するステージ番号（1始まり）
     */
    function selectStage(stageNum: number): void {
      if (stageNum >= 1 && stageNum <= maxStage) {
        console.log(`選択したステージ: ${stageNum}`);
        
        currentStage = stageNum;
        
        // ステージ設定を取得して適用
        const stageConfig = stageSettings[currentStage];
        if (!stageConfig) {
          console.error(`ステージ ${currentStage} の設定が見つかりません`);
          return;
        }
        
        // ブロックとパドルの設定を適用
        brickRowCount = stageConfig.rows || 3;
        brickColumnCount = stageConfig.columns || 5;
        brickWidth = updateBrickDimensions();
        paddleWidth = stageConfig.paddleWidth || 100;
        
        // ボール速度の設定
        const ballSpeed = stageConfig.ballSpeed || 2;
        ballDX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
        ballDY = -ballSpeed;
        
        // ステージ選択からの開始時はスコアを維持
        lives = initialLives;
        
        // ボールとパドルの位置をリセット
        ballX = canvasWidth / 2;
        ballY = canvasHeight - paddleYOffset - ballRadius - 10;
        paddleX = (canvasWidth - paddleWidth) / 2;
        
        // ブロックを初期化
        initializeBricks();
        
        // ゲーム状態を更新
        gameState = GameState.PLAYING;
        gameStarted = false; // 一時停止状態でスタート
        
        console.log(`ゲーム開始 - ステージ: ${currentStage}, ブロック: ${brickRowCount}x${brickColumnCount}, パドル幅: ${paddleWidth}`);
      }
    }

    // ========== ゲームロジック関数 ==========

    /**
     * ボールとブロックの衝突を検出する関数
     */
    function collisionDetection() {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const brick = bricks[c][r];
          if (brick?.status === 1) {
            // ボールがブロック内にあるかチェック
            if (
              ballX > brick.x && 
              ballX < brick.x + brickWidth && 
              ballY > brick.y && 
              ballY < brick.y + brickHeight
            ) {
              ballDY = -ballDY; // ボールの方向を反転
              brick.status = 0; // ブロックを破壊
              score += SCORE_PER_BRICK; // スコアを加算
            }
          }
        }
      }
    }
    
    /**
     * すべてのブロックが破壊されたかチェックする関数
     * @returns すべてのブロックが破壊されていればtrue
     */
    function checkGameClear() {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          if (bricks[c][r]?.status === 1) {
            return false; // まだ破壊されていないブロックがある
          }
        }
      }
      return true; // すべてのブロックが破壊された
    }

    // ========== 描画関数 ==========

    /**
     * 背景を描画する関数
     */
    function drawBackground() {
      if (!ctx) return;
      
      // グラデーション背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, colorPalette.background);
      gradient.addColorStop(1, colorPalette.accent);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // グリッドパターン
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      
      // 横線
      for (let y = 0; y < canvasHeight; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
      
      // 縦線
      for (let x = 0; x < canvasWidth; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      
      // 枠線
      ctx.strokeStyle = colorPalette.highlight;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);
    }

    /**
     * ボールを描画する関数
     */
    function drawBall() {
      if (!ctx) return;
      
      // グラデーションでボールを描画
      const ballGradient = ctx.createRadialGradient(
        ballX - ballRadius / 3, ballY - ballRadius / 3, 
        ballRadius / 6, 
        ballX, ballY, 
        ballRadius
      );
      
      ballGradient.addColorStop(0, "#ffffff");
      ballGradient.addColorStop(0.3, colorPalette.highlight);
      ballGradient.addColorStop(1, colorPalette.secondary);
      
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = ballGradient;
      ctx.fill();
      
      // 光沢効果
      ctx.beginPath();
      ctx.arc(ballX - ballRadius / 2.5, ballY - ballRadius / 2.5, ballRadius / 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fill();
      
      ctx.closePath();
    }

    /**
     * パドルを描画する関数
     */
    function drawPaddle() {
      if (!ctx) return;
      
      // グラデーションのパドル
      const paddleGradient = ctx.createLinearGradient(
        paddleX, canvasHeight - paddleHeight - paddleYOffset,
        paddleX, canvasHeight - paddleYOffset
      );
      paddleGradient.addColorStop(0, colorPalette.highlight);
      paddleGradient.addColorStop(1, colorPalette.primary);
      
      // メインパドル
      ctx.beginPath();
      ctx.roundRect(
        paddleX, 
        canvasHeight - paddleHeight - paddleYOffset, 
        paddleWidth, 
        paddleHeight,
        [5, 5, 0, 0]
      );
      ctx.fillStyle = paddleGradient;
      ctx.fill();
      
      // エッジライト効果
      ctx.beginPath();
      ctx.roundRect(
        paddleX, 
        canvasHeight - paddleHeight - paddleYOffset, 
        paddleWidth, 
        paddleHeight / 3,
        [5, 5, 0, 0]
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fill();
      
      // パドルの両端を丸く
      ctx.beginPath();
      ctx.arc(
        paddleX + 5, 
        canvasHeight - paddleHeight - paddleYOffset + paddleHeight / 2, 
        paddleHeight / 2,
        0, Math.PI * 2
      );
      ctx.fillStyle = colorPalette.highlight;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(
        paddleX + paddleWidth - 5, 
        canvasHeight - paddleHeight - paddleYOffset + paddleHeight / 2, 
        paddleHeight / 2,
        0, Math.PI * 2
      );
      ctx.fillStyle = colorPalette.highlight;
      ctx.fill();
      
      ctx.closePath();
    }

    /**
     * ブロックを描画する関数
     */
    function drawBricks() {
      if (!ctx) return;
      
      const settings = getCurrentStageSettings();
      const colors = settings.brickColors;
      
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          if (bricks[c][r] && bricks[c][r].status === 1) {
            // ブロックの位置を計算
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;
            
            // 行ごとに色を設定
            let baseColor = (colors && colors.length > 0) ? colors[r % colors.length] : "#CCCCCC";
            
            // グラデーションブロック
            const brickGradient = ctx.createLinearGradient(
              brickX, brickY,
              brickX, brickY + brickHeight
            );
            brickGradient.addColorStop(0, lightenColor(baseColor, 20));
            brickGradient.addColorStop(1, darkenColor(baseColor, 20));
            
            // メインブロック
            ctx.beginPath();
            ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 4);
            ctx.fillStyle = brickGradient;
            ctx.fill();
            
            // 光沢効果
            ctx.beginPath();
            ctx.roundRect(brickX, brickY, brickWidth, brickHeight / 3, [4, 4, 0, 0]);
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.fill();
            
            // 枠線
            ctx.beginPath();
            ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 4);
            ctx.strokeStyle = darkenColor(baseColor, 30);
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.closePath();
          }
        }
      }
    }

    /**
     * スコアを描画する関数
     */
    function drawScore() {
      if (!ctx) return;
      
      // 半透明の背景
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(canvasWidth - 150, 10, 140, 40);
      
      // 枠線
      ctx.strokeStyle = colorPalette.highlight;
      ctx.lineWidth = 2;
      ctx.strokeRect(canvasWidth - 150, 10, 140, 40);
      
      // スコアテキスト
      ctx.font = "24px Arial";
      ctx.textAlign = "right";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.fillStyle = colorPalette.light;
      ctx.fillText(`Score: ${score}`, canvasWidth - 20, 38);
      
      // 描画設定をリセット
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.textAlign = "start";
    }

    /**
     * 残機を描画する関数
     */
    function drawLives() {
      if (!ctx) return;
      
      // 半透明の背景
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(10, 10, 100, 40);
      
      // 枠線
      ctx.strokeStyle = colorPalette.highlight;
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 100, 40);
      
      // 残機テキスト
      ctx.font = "24px Arial";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.fillStyle = colorPalette.light;
      ctx.fillText(`Lives: ${lives}`, 20, 38);
      
      // 描画設定をリセット
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    /**
     * ステージ選択画面を描画する関数
     */
    function drawStageSelect() {
      if (!ctx) return;
      
      // 背景描画
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      bgGradient.addColorStop(0, colorPalette.background);
      bgGradient.addColorStop(1, colorPalette.accent);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // グリッド描画
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      
      for (let y = 0; y < canvasHeight; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
      
      for (let x = 0; x < canvasWidth; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      
      // タイトル
      ctx.font = "bold 48px Arial";
      ctx.fillStyle = colorPalette.secondary;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.fillText("ブロック崩しゲーム", canvasWidth / 2, 70);
      
      // ステージ選択テキスト
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = colorPalette.light;
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText("ステージ選択", canvasWidth / 2, 120);
      
      // 影効果をリセット
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // ステージタイル描画
      const tileSize = 100;
      const tilesPerRow = 5;
      const spacing = 20;
      
      const startX = (canvasWidth - (tileSize * tilesPerRow + spacing * (tilesPerRow - 1))) / 2;
      const startY = 160;
      
      // 各ステージのタイルを描画
      for (let i = 0; i < maxStage; i++) {
        const row = Math.floor(i / tilesPerRow);
        const col = i % tilesPerRow;
        
        const tileX = startX + col * (tileSize + spacing);
        const tileY = startY + row * (tileSize + spacing);
        
        // タイル背景色（選択/クリア状態による変化）
        if (i === selectedStageIndex) {
          ctx.fillStyle = "#FFA500"; // 選択中は橙色
          ctx.strokeStyle = "#FF4500";
          ctx.lineWidth = 4;
        } else if (clearedStages[i]) {
          ctx.fillStyle = "#20B2AA"; // クリア済みは青緑色
          ctx.strokeStyle = "#008B8B";
          ctx.lineWidth = 2;
        } else {
          const colors = ["#4CAF50", "#5CB85C", "#449D44", "#398439", "#3C763D"];
          ctx.fillStyle = colors[i % colors.length]; // 未クリアは緑系
          ctx.strokeStyle = "#2E7D32";
          ctx.lineWidth = 2;
        }
        
        // タイル描画
        ctx.fillRect(tileX, tileY, tileSize, tileSize);
        ctx.strokeRect(tileX, tileY, tileSize, tileSize);
        
        // ステージ番号
        ctx.font = "24px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(`${i + 1}`, tileX + tileSize / 2, tileY + tileSize / 2 - 10);
        
        // ステージ情報
        const stageInfo = stageSettings[i + 1];
        if (stageInfo) {
          const columnsCount = stageInfo.columns || 0;
          const calculatedWidth = calculateBrickDimensions(columnsCount).width;
          
          ctx.font = "12px Arial";
          ctx.fillText(`${stageInfo.rows}×${columnsCount} (${calculatedWidth}px)`, tileX + tileSize / 2, tileY + tileSize / 2 + 14);
          
          // 難易度表示
          let difficulty;
          if (i < 3) difficulty = "易";
          else if (i < 6) difficulty = "普通";
          else if (i < 10) difficulty = "難";
          else difficulty = "超難";
          
          ctx.fillText(`難易度: ${difficulty}`, tileX + tileSize / 2, tileY + tileSize / 2 + 32);
        }
        
        // クリアマーク
        if (clearedStages[i]) {
          ctx.font = "28px Arial";
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText("✓", tileX + tileSize / 2, tileY + tileSize / 2 + 10);
        }
      }
      
      // クリア状況
      const clearedCount = clearedStages.filter(cleared => cleared).length;
      ctx.font = "20px Arial";
      ctx.fillStyle = "#0095DD";
      ctx.fillText(`クリア状況: ${clearedCount} / ${maxStage}`, canvasWidth / 2, startY + Math.ceil(maxStage / tilesPerRow) * (tileSize + spacing) + 20);
      
      // 操作説明
      ctx.font = "18px Arial";
      ctx.fillStyle = "#0095DD";
      ctx.fillText("矢印キーでステージを選択、スペースキーで開始", canvasWidth / 2, canvasHeight - 60);
      
      // リセット説明
      ctx.font = "14px Arial";
      ctx.fillStyle = "#FF5555";
      ctx.fillText("Rキーでクリア状態をリセット", canvasWidth / 2, canvasHeight - 30);
      
      // 選択中のタイルにエフェクト
      const now = Date.now();
      const pulse = Math.sin(now / 200) * 0.2 + 0.8; // 時間によって変化する脈動効果
      
      const selectedRow = Math.floor(selectedStageIndex / tilesPerRow);
      const selectedCol = selectedStageIndex % tilesPerRow;
      const selectedTileX = startX + selectedCol * (tileSize + spacing);
      const selectedTileY = startY + selectedRow * (tileSize + spacing);
      
      // 選択中タイルのグロー効果
      ctx.shadowColor = colorPalette.highlight;
      ctx.shadowBlur = 15 * pulse;
      ctx.strokeStyle = colorPalette.secondary;
      ctx.lineWidth = 4;
      ctx.strokeRect(
        selectedTileX - 5, 
        selectedTileY - 5, 
        tileSize + 10, 
        tileSize + 10
      );
      
      ctx.shadowBlur = 0;
      
      // スコア表示
      ctx.font = "24px Arial";
      ctx.fillStyle = colorPalette.secondary;
      ctx.textAlign = "start";
      ctx.fillText(`スコア: ${score}点`, 20, 40);
      
      // 描画設定をリセット
      ctx.shadowBlur = 0;
      ctx.textAlign = "start";
    }

    /**
     * ゲーム開始メッセージを描画する関数
     */
    function drawStartMessage() {
      if (!ctx) return;
      
      // 半透明の背景
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(canvasWidth / 2 - 200, canvasHeight / 2 - 50, 400, 100);
      
      // 枠線
      ctx.strokeStyle = colorPalette.highlight;
      ctx.lineWidth = 2;
      ctx.strokeRect(canvasWidth / 2 - 200, canvasHeight / 2 - 50, 400, 100);
      
      // メッセージテキスト
      ctx.font = "bold 24px Arial";
      ctx.fillStyle = colorPalette.light;
      ctx.textAlign = "center";
      ctx.shadowColor = colorPalette.highlight;
      ctx.shadowBlur = 10;
      ctx.fillText("Press SPACE to start", canvasWidth / 2, canvasHeight / 2);
      
      // ESCキーの説明
      ctx.font = "16px Arial";
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#AAAAAA";
      ctx.fillText("Press ESC to return to stage select", canvasWidth / 2, canvasHeight / 2 + 30);
      
      // 描画設定をリセット
      ctx.textAlign = "start";
    }

    /**
     * ライフロスメッセージを描画する関数
     */
    function drawLifeLostMessage() {
      if (!ctx) return;
      
      // 半透明の背景
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(canvasWidth / 2 - 220, canvasHeight / 2 - 50, 440, 100);
      
      // 枠線
      ctx.strokeStyle = "#FF6600";
      ctx.lineWidth = 3;
      ctx.strokeRect(canvasWidth / 2 - 220, canvasHeight / 2 - 50, 440, 100);
      
      // メッセージテキスト
      ctx.font = "26px Arial";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText("Lost a life!", canvasWidth / 2, canvasHeight / 2 - 15);
      
      // 操作説明
      ctx.font = "22px Arial";
      ctx.fillText("Press SPACE to continue", canvasWidth / 2, canvasHeight / 2 + 20);
      
      // 描画設定をリセット
      ctx.textAlign = "start";
    }

    /**
     * デバッグ情報を描画する関数
     */
    function drawDebugInfo() {
      if (!ctx) return;
      
      ctx.font = "12px Arial";
      ctx.fillStyle = "#666666";
      ctx.textAlign = "start";
      ctx.fillText(`Stage: ${currentStage}, Blocks: ${brickRowCount}×${brickColumnCount}, BrickWidth: ${brickWidth}px, Paddle: ${paddleWidth}px`, 10, canvasHeight - 5);
    }

    // ========== メインゲームループ ==========

    /**
     * メインの描画関数
     * ゲームの状態に応じて適切な画面を描画する
     */
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // ゲーム状態に応じた描画処理
      switch (gameState) {
        case GameState.STAGE_SELECT:
          // ステージ選択画面
          drawStageSelect();
          break;
          
        case GameState.PLAYING:
          // ゲームプレイ画面
          drawBackground();
          drawBricks();
          drawPaddle();
          drawBall();
          drawScore();
          drawLives();
          drawDebugInfo();
          
          // 一時停止状態
          if (!gameStarted) {
            drawStartMessage();
            break;
          }
          
          // ブロック衝突検出
          collisionDetection();
          
          // ステージクリアチェック
          if (checkGameClear()) {
            gameState = GameState.STAGE_CLEAR;
            break;
          }
          
          // ボールの移動と衝突判定
          // 左右の壁との衝突
          if (ballX + ballDX > canvasWidth - ballRadius || ballX + ballDX < ballRadius) {
            ballDX = -ballDX;
          }
          
          // 上壁との衝突
          if (ballY + ballDY < ballRadius) {
            ballDY = -ballDY;
          } else if (ballY + ballDY > canvasHeight - ballRadius) {
            // パドルとの衝突
            if (ballX > paddleX && ballX < paddleX + paddleWidth) {
              ballDY = -ballDY;
            } else {
              // パドルに当たらずに落下
              lives--;
              
              // ゲームオーバーチェック
              if (lives <= 0) {
                gameState = GameState.GAME_OVER;
                break;
              } else {
                // ライフロス状態へ
                gameState = GameState.LIFE_LOST;
                
                // ボールとパドルの位置をリセット
                ballX = canvasWidth / 2;
                ballY = canvasHeight - paddleYOffset - ballRadius - 10;
                paddleX = (canvasWidth - paddleWidth) / 2;
                
                // ボールの速度をリセット
                const settings = getCurrentStageSettings();
                ballDX = (settings.ballSpeed ?? 2) * (Math.random() > 0.5 ? 1 : -1);
                ballDY = -(settings.ballSpeed ?? 2);
                break;
              }
            }
          } else if (ballY + ballDY > canvasHeight - paddleHeight - paddleYOffset - ballRadius && 
                    ballY + ballDY < canvasHeight - paddleYOffset) {
            // パドルの上面との衝突
            if (ballX > paddleX && ballX < paddleX + paddleWidth) {
              ballDY = -ballDY;
            }
          }
          
          // ボールの移動
          ballX += ballDX;
          ballY += ballDY;
          
          // パドルの移動
          if (rightPressed && paddleX < canvasWidth - paddleWidth) {
            paddleX += 7;
          } else if (leftPressed && paddleX > 0) {
            paddleX -= 7;
          }
          break;
          
        case GameState.LIFE_LOST:
          // ライフロス画面
          drawBackground();
          drawBricks();
          drawPaddle();
          drawBall();
          drawScore();
          drawLives();
          drawLifeLostMessage();
          break;
          
        case GameState.STAGE_CLEAR:
          // ステージクリア画面
          drawBackground();
          drawBricks();
          drawPaddle();
          drawBall();
          drawScore();
          drawLives();
          
          // 半透明オーバーレイ
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
          // クリアメッセージ
          ctx.font = "36px Arial";
          ctx.fillStyle = "#FFFF00";
          ctx.textAlign = "center";
          ctx.fillText(`ステージ ${currentStage} クリア!`, canvasWidth / 2, canvasHeight / 2 - 50);
          
          // スコア表示
          ctx.font = "28px Arial";
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(`スコア: ${score}点`, canvasWidth / 2, canvasHeight / 2 - 10);
          
          // 次のステージへの案内
          ctx.font = "24px Arial";
          if (currentStage < maxStage) {
            ctx.fillText("スペースキーで次のステージへ", canvasWidth / 2, canvasHeight / 2 + 30);
          } else {
            ctx.fillText("スペースキーで結果画面へ", canvasWidth / 2, canvasHeight / 2 + 30);
          }
          
          // ESCキーの説明
          ctx.font = "16px Arial";
          ctx.fillStyle = "#CCCCCC";
          ctx.textAlign = "center";
          ctx.fillText("(または ESC でステージ選択に戻る)", canvasWidth / 2, canvasHeight / 2 + 70);
          
          ctx.textAlign = "start";
          break;
          
        case GameState.GAME_OVER:
          // ゲームオーバー画面
          drawBackground();
          drawBricks();
          drawPaddle();
          drawBall();
          drawScore();
          drawLives();
          
          // 半透明オーバーレイ
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
          // ゲームオーバーメッセージ
          ctx.font = "48px Arial";
          ctx.fillStyle = "#FF0000";
          ctx.textAlign = "center";
          ctx.fillText("ゲームオーバー", canvasWidth / 2, canvasHeight / 2 - 24);
          
          // スコアとリトライ案内
          ctx.font = "24px Arial";
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(`スコア: ${score}`, canvasWidth / 2, canvasHeight / 2 + 20);
          ctx.fillText("スペースキーでタイトルに戻る", canvasWidth / 2, canvasHeight / 2 + 60);
          
          // ESCキーの説明
          ctx.font = "16px Arial";
          ctx.fillStyle = "#CCCCCC";
          ctx.textAlign = "center";
          ctx.fillText("(または ESC でステージ選択に戻る)", canvasWidth / 2, canvasHeight / 2 + 90);
          
          ctx.textAlign = "start";
          break;
          
        case GameState.GAME_COMPLETE:
          // ゲームコンプリート画面
          drawBackground();
          
          // 半透明オーバーレイ
          ctx.fillStyle = "rgba(0, 50, 100, 0.7)";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
          // クリアメッセージ
          ctx.font = "48px Arial";
          ctx.fillStyle = "#FFFF00";
          ctx.textAlign = "center";
          ctx.fillText("ゲームクリア！おめでとう！", canvasWidth / 2, canvasHeight / 2 - 50);
          
          // 全ステージクリア表示
          const allCleared = clearedStages.every(cleared => cleared);
          if (allCleared) {
            ctx.font = "28px Arial";
            ctx.fillStyle = "#90EE90";
            ctx.fillText("全ステージクリア達成！", canvasWidth / 2, canvasHeight / 2);
          }
          
          // スコア表示
          ctx.font = "36px Arial";
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(`最終スコア: ${score}`, canvasWidth / 2, canvasHeight / 2 + 20);
          
          // タイトルへの案内
          ctx.font = "24px Arial";
          ctx.fillText("スペースキーでタイトルに戻る", canvasWidth / 2, canvasHeight / 2 + 70);
          
          // ESCキーの説明
          ctx.font = "16px Arial";
          ctx.fillStyle = "#CCCCCC";
          ctx.textAlign = "center";
          ctx.fillText("(または ESC でステージ選択に戻る)", canvasWidth / 2, canvasHeight / 2 + 100);
          
          // すべてのステージをクリア状態に
          clearedStages = Array(maxStage).fill(true);
          saveProgress();
          
          ctx.textAlign = "start";
          break;
      }
      
      // アニメーションフレームの要求
      requestAnimationFrame(draw);
    }

    // ========== キーボードイベントハンドラ ==========

    /**
     * キーダウンイベントハンドラ
     * @param e - キーボードイベント
     */
    function handleKeyDown(e: KeyboardEvent) {
      // スペースキーでのスクロール防止
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
      }

      // ゲーム状態に応じた処理の振り分け
      switch (gameState) {
        case GameState.STAGE_SELECT:
          handleStageSelectKeys(e);
          break;
        
        case GameState.PLAYING:
          handlePlayingKeys(e);
          break;
          
        case GameState.LIFE_LOST:
        case GameState.STAGE_CLEAR:
        case GameState.GAME_OVER:
        case GameState.GAME_COMPLETE:
          handleOtherGameStateKeys(e);
          break;
      }
    }

    /**
     * キーアップイベントハンドラ
     * @param e - キーボードイベント
     */
    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
      }
      if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
      }
    }

    /**
     * ステージ選択画面でのキー処理
     * @param e - キーボードイベント
     */
    function handleStageSelectKeys(e: KeyboardEvent): void {
      const stagesPerRow: number = 5;
      const currentRow: number = Math.floor(selectedStageIndex / stagesPerRow);
      const currentCol: number = selectedStageIndex % stagesPerRow;
      
      switch (e.key) {
        case "ArrowRight":
        case "Right":
          // 右移動（同じ行の右のステージへ）
          if (currentCol < stagesPerRow - 1 && selectedStageIndex < maxStage - 1) {
            selectedStageIndex++;
          }
          break;
          
        case "ArrowLeft":
        case "Left":
          // 左移動（同じ行の左のステージへ）
          if (currentCol > 0) {
            selectedStageIndex--;
          }
          break;
          
        case "ArrowDown":
        case "Down":
          // 下移動（下の行のステージへ）
          if (currentRow < Math.ceil(maxStage / stagesPerRow) - 1) {
            const newIndex: number = selectedStageIndex + stagesPerRow;
            if (newIndex < maxStage) {
              selectedStageIndex = newIndex;
            }
          }
          break;
          
        case "ArrowUp":
        case "Up":
          // 上移動（上の行のステージへ）
          if (currentRow > 0) {
            selectedStageIndex -= stagesPerRow;
          }
          break;
          
        case " ":
        case "Spacebar":
        case "Space":
          // スペースキーでステージ選択
          const selectedStage = selectedStageIndex + 1;
          selectStage(selectedStage);
          break;
          
        case "r":
        case "R":
          // Rキーでクリア状態をリセット
          if (confirm("クリア状態をリセットしますか？")) {
            clearedStages = Array(maxStage).fill(false);
            saveProgress();
            console.log("クリア状態をリセットしました");
            
            // スコアもリセットするか確認
            if (confirm("スコアもリセットしますか？")) {
              score = 0;
              console.log("スコアをリセットしました");
            }
          }
          break;
      }
    }

    /**
     * プレイ中のキー処理
     * @param e - キーボードイベント
     */
    function handlePlayingKeys(e: KeyboardEvent): void {
      switch (e.key) {
        case "Right":
        case "ArrowRight":
          // 右移動
          rightPressed = true;
          break;
          
        case "Left":
        case "ArrowLeft":
          // 左移動
          leftPressed = true;
          break;
          
        case " ":
        case "Spacebar":
        case "Space":
          // スペースキーで一時停止/再開
          gameStarted = !gameStarted;
          break;
          
        case "Escape":
          // ESCキーでステージ選択に戻る（一時停止中のみ）
          if (!gameStarted) {
            gameState = GameState.STAGE_SELECT;
          }
          break;
      }
    }

    /**
     * その他のゲーム状態でのキー処理
     * @param e - キーボードイベント
     */
    function handleOtherGameStateKeys(e: KeyboardEvent): void {
      switch (e.key) {
        case " ":
        case "Spacebar":
        case "Space":
          // 各状態でのスペースキー処理
          switch (gameState) {
            case GameState.LIFE_LOST:
              // ライフロスからの再開
              gameState = GameState.PLAYING;
              gameStarted = true;
              break;
                  
            case GameState.STAGE_CLEAR:
              // ステージクリア後の処理
              clearedStages[currentStage - 1] = true;
              saveProgress();
              
              // 次のステージへ進む場合はスコアを維持
              if (currentStage < maxStage) {
                // 次のステージに進む
                currentStage++;
                selectedStageIndex = currentStage - 1;
                
                // 次のステージをセットアップ
                const stageConfig = stageSettings[currentStage];
                if (stageConfig) {
                  brickRowCount = stageConfig.rows || 3;
                  brickColumnCount = stageConfig.columns || 5;
                  brickWidth = updateBrickDimensions();
                  paddleWidth = stageConfig.paddleWidth || 100;
                  
                  const ballSpeed = stageConfig.ballSpeed || 2;
                  ballDX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
                  ballDY = -ballSpeed;
                  
                  // ボールとパドルの位置をリセット
                  ballX = canvasWidth / 2;
                  ballY = canvasHeight - paddleYOffset - ballRadius - 10;
                  paddleX = (canvasWidth - paddleWidth) / 2;
                  
                  // ブロックを初期化
                  initializeBricks();
                  
                  // スコアを維持したまま次のステージを開始
                  gameState = GameState.PLAYING;
                  gameStarted = false; // 一時停止状態でスタート
                } else {
                  // エラー処理
                  gameState = GameState.STAGE_SELECT;
                }
              } else {
                // 全ステージクリア
                gameState = GameState.GAME_COMPLETE;
              }
              break;
                  
            case GameState.GAME_COMPLETE:
              // ゲームクリア後の処理
              clearedStages = Array(maxStage).fill(true);
              saveProgress();
              
              // ゲーム完了後もスコアを維持してステージ選択に戻る
              gameState = GameState.STAGE_SELECT;
              break;
                  
            case GameState.GAME_OVER:
              // ゲームオーバー後の処理
              // ゲームオーバー後はスコアをリセット
              score = 0;
              gameState = GameState.STAGE_SELECT;
              break;
          }
          break;
              
        case "Escape":
          // ESCキーでステージ選択に戻る（スコアは維持）
          gameState = GameState.STAGE_SELECT;
          break;
          
        case "r":
        case "R":
          // Rキーでスコアリセット
          if (confirm("スコアをリセットします。よろしいですか？")) {
            score = 0;
          }
          break;
      }
    }

    // ========== イベントリスナーとゲーム開始 ==========

    // イベントリスナーの設定
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // 初期設定とゲーム開始
    brickWidth = updateBrickDimensions();
    initGame();
    draw();

    // クリーンアップ（useEffect終了時）
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []); // useEffectの依存配列が空なので、コンポーネントのマウント時に一度だけ実行

  // Reactコンポーネントのレンダリング
  return (
    <div className="game-container">
      <canvas ref={canvasRef} className="game-canvas"></canvas>
    </div>
  );
}

export default App;


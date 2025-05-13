class MovementScene extends Phaser.Scene {
    constructor() {
        super('MovementScene'); 
    }

    preload() {
        this.load.setPath('assets/');
        this.load.image('arrow', 'laserRed03.png');
        this.load.image('player', 'playerShip2_green.png');
        this.load.image('zigzagEnemy', 'ufoYellow.png');
        this.load.image('bomberEnemy', 'ufoRed.png');
    }

    create() {
        this.player = this.add.sprite(400, 550, 'player');
        this.bulletCooldown = 0;
        this.bulletCooldownDelay = 15;
        this.keys = this.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            shoot: 'SPACE',
            returnToTitle: 'T',
            play: 'P'
        });
        this.scoreText = this.add.text(10, 10, "Score: 0", { fontSize: "20px", fill: "#fff" });
        let storedHighScore = localStorage.getItem('highScore') || 0;
        this.highScore = parseInt(storedHighScore);

        this.highScoreText = this.add.text(600, 10, "High Score: " + this.highScore, {
            fontSize: "20px",
            fill: "#fff"
        });
        
        this.healthText = this.add.text(10, 40, "Health: 3", { fontSize: "20px", fill: "#fff" });

        this.time.addEvent({
            delay: 30000,  
            callback: () => {
                if (!this.gameOver) this.endGame();
            }
        });
        this.initGame();
        this.bomberPath = new Phaser.Curves.Path(400, -50);
        this.bomberPath.splineTo([
            { x: 700, y: 150 },
            { x: 400, y: 300 },
            { x: 800, y: 450 },
            { x: 600, y: 600 }
        ]); 

        this.pathFollowers = [];
    }

    update() {
        //Player movement
        if (this.keys.left.isDown) {
            this.player.x -= 7;
        }
        if (this.keys.right.isDown) {
            this.player.x += 7;
        }
        this.player.x = Phaser.Math.Clamp(this.player.x, 0, 800);  
        // Player bullet 
        for (let arrow of this.bullets) {
            arrow.y -= 10;
        }
        if (this.bulletCooldown > 0) {
            this.bulletCooldown--;
        }
        //Enemy Spawn
        if (!this.gameOver){
            this.trackingEnemyTimer++;
            this.enemySpawnTimer++;
        } 
        
        //Zig Zag enemy
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.enemySpawnTimer = 0;
            let x = Phaser.Math.Between(50, 750);
            let y = 0;
            let enemy = this.add.sprite(x, y, 'zigzagEnemy');
            enemy.baseX = x;
            enemy.moveOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
            enemy.shootCooldown = Phaser.Math.Between(30, 60); 
            this.enemies.push(enemy);
        }
        
        //Enemy projectile movement
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            let bullet = this.enemyBullets[i];
            bullet.y += 5;

            if (bullet.y > 600) {
                bullet.destroy();
                this.enemyBullets.splice(i, 1);
            }
        }
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            enemy.y += 1.5;
            enemy.x = enemy.baseX + Math.sin(enemy.y * 0.05 + enemy.moveOffset) * 50;
            enemy.shootCooldown--;
            //Enemy projectiles
            if (enemy.shootCooldown <= 0) {
                let bullet = this.add.sprite(enemy.x, enemy.y + 20, 'arrow');
                this.enemyBullets.push(bullet);
                enemy.shootCooldown = Phaser.Math.Between(30, 60); 
            }
            if (enemy.y > 600) {
                enemy.destroy();
                this.enemies.splice(i, 1);
            }
        }
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            let bullet = this.enemyBullets[i];
            
            let bulletBounds = bullet.getBounds();
            let playerBounds = this.player.getBounds();

            //Phaser.Geom.Rectangle.Inflate(bulletBounds, -10, -10);
            //Phaser.Geom.Rectangle.Inflate(playerBounds, -10, -10);

            if (Phaser.Geom.Intersects.RectangleToRectangle(bulletBounds, playerBounds)) {
                bullet.destroy();
                this.enemyBullets.splice(i, 1);

                this.health -= 1;
                this.healthText.setText("Health: " + this.health);

                if (this.health <= 0 && !this.gameOver) {
                    this.endGame();
                }
            }
        }
        //player emitted object
        if (Phaser.Input.Keyboard.JustDown(this.keys.shoot) && this.bulletCooldown === 0) {
            let bullet = this.add.sprite(this.player.x, this.player.y - 20, 'arrow');
            this.bullets.push(bullet);
            this.bulletCooldown = this.bulletCooldownDelay;
        }
        //Enemies 
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let bullet = this.bullets[i];
            bullet.y -= 17;
            let hit = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                let enemy = this.enemies[j];
                let bulletBounds = bullet.getBounds();
                let enemyBounds = enemy.getBounds();

                //Phaser.Geom.Rectangle.Inflate(bulletBounds, -25, -14);
                //Phaser.Geom.Rectangle.Inflate(enemyBounds, -20, -13);

                if (Phaser.Geom.Intersects.RectangleToRectangle(bulletBounds, enemyBounds)) {
                    this.score += 1;
                    this.scoreText.setText("Score: " + this.score);

                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        this.highScoreText.setText("High Score: " + this.highScore);
                    }
                    enemy.destroy();
                    this.enemies.splice(j, 1);
                    
                    
                    hit = true;
                    break;
                }
            }
            for (let j = this.pathFollowers.length - 1; j >= 0; j--) {
                let enemy = this.pathFollowers[j];
                let bulletBounds = bullet.getBounds();
                let enemyBounds = enemy.getBounds();
                
                if (Phaser.Geom.Intersects.RectangleToRectangle(bulletBounds, enemyBounds)) {
                    this.score += 1;
                    this.scoreText.setText("Score: " + this.score);

                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        this.highScoreText.setText("High Score: " + this.highScore);
                    }
                    enemy.destroy();
                    this.pathFollowers.splice(j, 1);
                    hit = true;
                    break;
                }
            }
            if (hit || bullet.y < 0) {
                bullet.destroy();
                this.bullets.splice(i, 1);
            }
        }
        //path enemy
        
        if (this.trackingEnemyTimer >= this.trackingEnemyInterval) {
            this.trackingEnemyTimer = 0;

            let follower = this.add.follower(this.bomberPath, 0, 0, 'bomberEnemy');
            follower.startFollow({
                duration: 6000,
                yoyo: false,
                repeat: 0
            });
            this.pathFollowers.push(follower);
        }
        for (let i = this.pathFollowers.length - 1; i >= 0; i--) {
            let follower = this.pathFollowers[i];
            if (follower.y > 580) {
                follower.destroy();
                this.pathFollowers.splice(i, 1);
                this.score = Math.max(0, this.score - 1);
                this.scoreText.setText("Score: " + this.score);
            }
        }
        if (this.gameOver && this.input.keyboard.checkDown(this.keys.returnToTitle)) {
            this.scene.stop();
            this.scene.start('TitleScene');
        }
    }
    initGame() {
        this.bullets = [];
        this.enemyBullets = [];
        this.pathFollowers = [];
        this.enemies = [];
        this.enemySpawnTimer = 0;
        this.trackingEnemyTimer = 0;
        this.bulletCooldown = 0;
        this.health = 3;
        this.score = 0;
        this.gameOver = false;
        this.scoreText.setText("Score: 0");
        this.healthText.setText("Health: 3");
        let storedHighScore = localStorage.getItem('highScore') || 0;
        this.highScore = parseInt(storedHighScore);
        this.highScoreText.setText("High Score: " + this.highScore);
        this.enemySpawnInterval = 60;
            this.trackingEnemyInterval = 120;
    }
    endGame() {
        this.gameOver = true;
        this.add.text(300, 250, "Game Over", {
            fontSize: '32px',
            fill: '#fff'
        });
        this.add.text(240, 300, "Press T to return to Title", {
            fontSize: '20px',
            fill: '#fff'
        });
        let storedHighScore = localStorage.getItem('highScore') || 0;
        if (this.score > storedHighScore) {
            localStorage.setItem('highScore', this.score);
        }
        for (let enemy of this.enemies) {
            enemy.destroy();
        }
        this.enemies = [];


        for (let bullet of this.bullets) {
            bullet.destroy();
        }
        this.bullets = [];


        for (let bullet of this.enemyBullets) {
            bullet.destroy();
        }
        this.enemyBullets = [];
        for (let follower of this.pathFollowers) {
                follower.destroy();
        }
        this.pathFollowers = [];
    }
}
window.MovementScene = MovementScene;
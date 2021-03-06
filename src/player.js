/**
 * all entities prepended with spr_ are purely for textual purposes and have no correlation to the rendered version of the game
 * 
 * width and height depict on the size of the player in the actual world in pixels
 */
class Player {

    constructor(x, y, spd) {

        // position & animation
        this.spr_width = 64;
        this.spr_height = 64;

        this.cf = 3;
        // maxcf is the total number of animation frames a sheet has
        this.maxcf = 13;

        this.dt = 100;
        this.dt_max = 75;
        this.dt_count = 0;

        this.img = new Image();

        this.isLeft = false;
        this.isRight = false;
        this.isDown = false;
        this.isUp = false;
        this.shouldFollow = false; // Is the following key pressed?

        // the position on the spritesheet where each directional frame starts eg: the down walking animation may start at 0
        //        this.leftY = 1184;
        //        this.rightY = 592;
        //        this.downY = 0;
        //        this.upY = 1846;
        //        this.previousY = 0;

        // Physics & game stats
    
        this.hp = 100;
        this.atk = 50;
        this.spd = spd;
        this.velocity_spd = 3.3;
        // starting velocity after direction change
        this.velocity_start = 55;

        // maximum velocity achievable by player through normal movement
        // set this slightly lower than what you want the maximum to be due to the amount of time it takes to update from input
        this.velocity_max = 100;
        // rate at which the velocity returns to zero if the player decides to suddenly change direction
        this.velocity_decay = this.velocity_spd * 8;

        this.body = new p2.Body({
            position: [x, y],
            mass: 1,
            type: p2.Body.DYNAMIC
        });

        this.shape = new p2.Box({
            width: 64,
            height: 64,
            collisionGroup: Constants.GROUP_PLAYER,
            collisionMask: Constants.groups.GROUP_WALL | Constants.groups.GROUP_ENEMY | Constants.groups.GROUP_HOSTAGE
        });

        this.body.addShape(this.shape);


        // bullets
        this.projectile = null;
        this.bullet_spd = 650;
        this.bullet_width = 5;
        this.bullet_height = 10;
        // if this.proj has already been added to the 
        this.bullet_isAdded = true;

        // rotation

        this.rotation = 0;
        this.rotation_added = 0;
        // 0 degrees is to the right of the image, use this to correct that
        this.rotation_offset = 90;
        this.mouseX = null;
        this.mouseY = null;

        // where the player actually is on the screen
        this.absoluteX = game.screen_width / 2 + (this.width / 2);
        this.absoluteY = game.screen_height / 2 + (this.height / 2);

    }

    load() {
        return new Promise((resolve, reject) => {

            let start = Date.now();
            this.img.src = "src/assets/spritesheets/player.png";

            this.img.onload = () => {
                resolve(Date.now() - start);
            }
            this.img.onerror = () => {
                reject();
            }
        });
    }

    // get what direction the player is in translated to what direction its pointing to on the sprite sheet
    getKeyFrame() {

        //        if (this.isLeft) {
        //            this.previousY = this.leftY;
        //            return this.leftY;
        //        }
        //        if (this.isRight) {
        //            this.previousY = this.rightY;
        //            return this.rightY;
        //        }
        //        if (this.isUp) {
        //            this.previousY = this.upY;
        //            return this.upY;
        //        }
        //        if (this.isDown) {
        //            this.previousY = this.downY;
        //            return this.downY;
        //        }
        //        return this.previousY;

        return 0;
    }

    update(dt, clickX, clickY) {
        // scaling dt with velocity
        //let velocity_average = (Math.abs(this.body.velocity[0]) + Math.abs(this.body.velocity[1])) > 1 ? (Math.abs(this.body.velocity[0]) + Math.abs(this.body.velocity[1])) : 1;
        //this.dt = 250 / velocity_average < this.dt_max ? this.dt_max : 300 / velocity_average;



        this.dt_count = (dt || 1 / 60) + (this.dt_count || 0);
        // if we've passed our delta time, reset the counter and keep going
        if (this.dt_count >= this.dt) {
            this.cf++;
            this.dt_count = 0;
        }
        if (this.cf >= this.maxcf) {
            this.cf = 0;
        } else if (!this.isLeft && !this.isUp && !this.isDown && !this.isRight) {
            this.cf = 0;
        }


        // if left and not over max velocity
        if (this.isLeft && Math.abs(this.body.velocity[0]) < this.velocity_max) {

            if (this.velocity[0] > -this.velocity_start) {
                this.setXVelocity(-this.velocity_start);
            }
            this.body.velocity[0] -= this.velocity_spd;
        }
        if (!this.isLeft && this.body.velocity[0] < 0) {
            this.body.velocity[0] /= this.velocity_decay;
        }

        if (this.isRight && this.body.velocity[0] < this.velocity_max) {

            if (this.velocity[0] < this.velocity_start) {
                this.setXVelocity(this.velocity_start);
            }

            this.body.velocity[0] += this.velocity_spd;
        }
        if (!this.isRight && this.body.velocity[0] > 0) {
            this.body.velocity[0] /= this.velocity_decay;
        }

        if (this.isDown && this.body.velocity[1] < this.velocity_max) {
            if (this.velocity[1] < this.velocity_start) {
                this.setYVelocity(this.velocity_start);
            }

            this.body.velocity[1] += this.velocity_spd;
        }
        if (!this.isDown && this.body.velocity[1] > 0) {
            this.body.velocity[1] /= this.velocity_decay;
        }

        if (this.isUp && Math.abs(this.body.velocity[1]) < this.velocity_max) {
            if (this.velocity[1] > -this.velocity_start) {
                this.setYVelocity(-this.velocity_start);
            }
            this.body.velocity[1] -= this.velocity_spd;
        }
        if (!this.isUp && this.body.velocity[1] < 0) {
            this.body.velocity[1] /= this.velocity_decay;
        }

        if (this.shotCooldown > 0) {
            this.shotCooldown--;
        } else {
            this.shotCooldown = 0;
        }

    }

    draw() {

        // if rotation has changed, so if the user holds their mouse in one spot, it doesn't keep added the same rotational value
        if (this.rotation_added !== 0) {
            ctx_player.translate(game.screen_width / 2, game.screen_height / 2);

            ctx_player.rotate(this.rotation_added * (Math.PI  / 180));

            // Move registration point back to the top left corner of canvas
            ctx_player.translate(-game.screen_width / 2, -game.screen_height / 2);

            this.rotation_added = 0;
        }

        ctx_player.drawImage(this.img, this.spr_width * this.cf, this.getKeyFrame(), this.spr_width, this.spr_height,
            this.x - Camera.x, this.y - Camera.y, this.getWidth(), this.getHeight());
    }

    rotate(rot) {

        // if we cross ogre 360, reset the rotation to 0 plus the overflow 
        if (this.rotation + rot > 360) {
            //this.setRotation(0 + (this.rotation - (this.rotation + rot)));
            this.rotation = 0 + (this.rotation - (this.rotation + rot));

            //  going under 0, we set to 360 + how far we went under
        } else if (this.rotation + rot < 0) {
            //this.setRotation(360 + (this.rotation - rot));
            this.rotation = 360 + (this.rotation - rot);
        }

        this.rotation_added = rot;
    }

    /**
     * x1 : old mouseX position
     * x2 : new mouseX position same with Y values
     */
    rotateToMouse(x2, y2) {

        // if the mouse hasn't moved
        if (this.mouseX == x2 && this.mouseY == y2) {
            return;
        } else {
            let angle = angle360(this.absoluteX, this.absoluteY, x2, y2) + this.rotation_offset;
            
            // fix this https://stackoverflow.com/a/39574258
            this.setRotation(angle);
        }
    }

    drawBoundingBox() {
        Renderer.drawShapeBoundingBox(ctx, this.shape, this.centerX, this.centerY, this.getWidth(), this.getHeight());
    }

    /** 
     * shoot at a given x and y coordinate
     */
    shoot() {
        this.projectile = new Projectile(this.x, this.y, this.bullet_width, this.bullet_height, this.bullet_spd, this.rotation, this.rotation_offset, this.velocity[0], this.velocity[1]);
        audio.playSound("shot");

    }


    get velocity() {
        return this.body.velocity;
    }

    setYVelocity(v) {
        this.velocity[1] = v;
    }

    setXVelocity(v) {
        this.velocity[0] = v;
    }

    get x() {
        return this.body.position[0];
    }

    get y() {
        return this.body.position[1];
    }

    setX(x) {
        this.body.position[0] = x;
    }

    setY(y) {
        this.body.position[1] = y;
    }

    get centerX() {
        return this.x + (this.width / 2);
    }
    get centerY() {
        return this.y + (this.height / 2);
    }

    get width() {
        return this.shape.width;
    }
    get height() {
        return this.shape.height;
    }

    setRotation(rotation) {
        this.rotation_added = rotation - this.rotation;
        this.rotation = rotation;
    }

    getWidth() {
        return this.shape.width;
    }

    getHeight() {
        return this.shape.height;
    }

    setWidth(w) {
        this.shape.width = w;
    }
    setHeight(h) {
        this.shape.height = h;
    }
}
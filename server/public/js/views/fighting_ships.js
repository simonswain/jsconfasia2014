/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.fighting_ships = Backbone.View.extend({
  template: _.template('<div class="canvas"></div><div class="fx"></div>'),
  initialize : function(opts) {
    _.bindAll(this, 'onClose', 'render', 'start', 'stop', 'draw', 'tick','makeShip');
    this.render();
    $(window).on('resize', this.render);
  },
  onClose: function(){
    $(window).off('resize', this.render);
    this.stop();
  },
  draw: function(){

    var self = this;

    if(!this.running){
      return;
    }

    var ctx = this.cview.getContext('2d');
    var ctxfx = this.fxview.getContext('2d');

    ctx.save();
    ctxfx.save();

    ctxfx.fillStyle = 'rgba(1,1,1,.18)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/16;
    var xh = this.h/16;

    var draw_stars = function(){
      var star;
      for (var i in self.stars) {
        star = self.stars[i];
        ctx.fillStyle = '#369';
        ctx.strokeStyle = '#69c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * xw/64, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
      }
    }();

    var draw_booms = function(){
      var boom;
      for (var i in self.booms) {
        boom = self.booms[i];
        ctxfx.fillStyle = '#ffffff';
        ctxfx.strokeStyle = boom.color;
        ctxfx.lineWidth = 2;
        ctxfx.beginPath();
        ctxfx.arc(boom.x,boom.y, boom.r * xw/64, 0, 2 * Math.PI, true);
        ctxfx.fill();
        ctxfx.stroke();
      }
    }();

    var draw_ships = function(){
      // ships
      var z = xw / 8;
      for ( var i in self.ships ) {
        var ship = self.ships[i]
        //console.log(ship);
        // ship energy indicator/shield

        ctx.fillStyle = false;
        ctx.strokeStyle = false;

        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.strokeStyle = ship.tint;
        if (ship.hit){
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = ship.color;
        };
        ctx.lineWidth = Math.min(1,ship.power);
        
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.energyf * xw/4, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = false;
        ctx.strokeStyle = false;


        // draw ship body
        ctx.save();
        ctx.translate(ship.x, ship.y);        
        // rotate 45 degrees clockwise
        ctx.rotate(de_ra(ship.a));

        ctx.lineWidth = z/2;
        ctx.fillStyle = ship.color;
        ctx.strokeStyle = ship.color;
        ctx.beginPath();

        ctx.moveTo(0, -1.5*z);
        ctx.lineTo(z, z);
        ctx.lineTo(0, 0);
        ctx.lineTo(-z, z);
        ctx.lineTo(0, -1.5*z);

        ctx.closePath();     
        ctx.stroke();
        ctx.fill();
        ctx.restore();

        // if shooting draw laser
        if (ship.laser) {
          ctx.lineWidth = xw/32;
          ctx.strokeStyle = 'rgba(255,255,255,0.8)'; //ship.color;
          ctx.beginPath();
          ctx.moveTo(ship.x, ship.y);
          ctx.lineTo(ship.laserx, ship.lasery);
          ctx.closePath();     
          ctx.stroke();
        }

      }
    }();

    this.booms = [];

    var draw_missiles = function(){
      for (var i in self.missiles) {
        var missile = self.missiles[i]
        ctx.fillStyle = missile.color;
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, xw/32, 0, 2 * Math.PI, true);
        ctx.fill();
      }
    }();

    ctx.restore();
    ctxfx.restore();

    this.requestId = window.requestAnimationFrame(this.draw);

  },
  tick: function(){

    var self = this;

    if(!this.running){
      return;
    }

    var xw = this.w/16;
    var xh = this.h/16;

    var tick_missiles = function(){
      for ( var i in self.missiles ) {
        var missile = self.missiles[i];

        // missile out of gas?
        missile.ttl = missile.ttl - 1;
        if ( missile.ttl == 0 ) {
          self.missiles.splice(i, 1);
          continue;
        }

        // target gone?
        if (self.ships[missile.target] === undefined) {
          self.missiles.splice(i, 1);
          continue;
        }

        // unaimed missile
        if(!missile.target) {
          missile.x = missile.x + missile.v * Math.cos(missile.theta);
          missile.y = missile.y + missile.v * Math.sin(missile.theta);
          continue;
        }
        
        // home in on target
        var other = self.ships[missile.target];
        var a = G.angle ( other.x, other.y, missile.x, missile.y );
        var t = missile.v/2;
        missile.x = missile.x + t * Math.cos(a);
        missile.y = missile.y + t * Math.sin(a);

        // missile hit?
        var r = G.distance ( other.x, other.y, missile.x, missile.y );
        if ( r < 5 ) {
          self.missiles.splice(i, 1);
          self.booms.push({
            x: other.x,
            y: other.y,
            r: 20,
            color: other.color
          });
        }
      }
    }();

    var tick_ships = function(){

      var ship, star, theta, r, g, angle, thrust;
      var i, j;

      for (i in self.ships ) {
        self.ships[i].hit = false;
        self.ships[i].laser = false;
      }

      for (i in self.ships ) {

        ship = self.ships[i];

        // charge ship up to max energy
        ship.energy = ship.energy + ( ship.recharge * ( 1 - ( 1 / ship.energy_max ) * ship.damage ) );
        if ( ship.energy > ship.energy_max ) {
          ship.energy = ship.energy_max;
        }

        // heal damage
        ship.damage = ship.damage - ship.recharge;
        if ( ship.damage < 0 ) {
          ship.damage = 0;
        }

        // ship is destroyed!
        if (ship.damage > ship.energy_max) {
          self.booms.push({
            x: ship.x,
            y: ship.y,
            r: ship.energy_max,
            color: ship.color
          });
          self.ships.splice(i, 1);
          continue;
        }

        // apply gravity from stars to ships
        for(j in self.stars) {
          star = self.stars[j];

          // angle betweek ship and star
          theta = G.angle ( star.x, star.y, ship.x, ship.y );
          // distance to star
          r = G.distance ( ship.x, ship.y, star.x, star.y );

          // gravity

          // calc gravity vector
          g = 10 * ( 100 / ( r*r ) )

          if ( g > 100 ) {
            g = 100;
          }

          // force of gravity on ship
          ship.fg = g;

          // convert gravity to xy. apply
	  gx = g * Math.cos(theta);
	  gy = g * Math.sin(theta);

	  ship.vx = ship.vx + gx;
	  ship.vy = ship.vy + gy;

          //thrust ship at 90 deg to star

          angle = de_ra ( ra_de (theta) + (ship.rot * 90) );
          thrust = ship.fg;
	  ship.vx = ship.vx + thrust * Math.cos(angle);
	  ship.vy = ship.vy + thrust * Math.sin(angle);
        }


        // inertial damping
        ship.vx = ship.vx * 0.92;
        ship.vy = ship.vy * 0.92;

        ship.x = ship.x + ship.vx;
        ship.y = ship.y + ship.vy;

        if ( ship.x < 0 ) {
          ship.x = 0;
	  ship.vx = - ship.vx * 0.5;
        }

        if ( ship.x > self.w ) {
          ship.x = self.w;
	  ship.vx = - ship.vx * 0.5;
        }

        if ( ship.y < 0 ) {
          ship.y = 0;
	  ship.vy = - ship.vy * 0.5;
        }

        if ( ship.y > self.h ) {
          ship.y = self.h;
	  ship.vy = - ship.vy * 0.5;
        }

        // angle ship is facing
        ship.a = ra_de ( G.angle ( 0, 0, ship.vx, ship.vy ) ) - 90;

        ship.energypc = ( 100 / ship.energy_max ) * ship.energy;
        ship.energyf = ( 1 / ship.energy_max ) * ship.energy;
        if(ship.energyf < 0){
          ship.energyf = 0;
        }
        self.ships[i].theta = theta;

        // check opponent ships in vicinity

        // flocking to / away from opponents and friendlies
        var a = 0, t = 0, c = 0;
        for (var ii in self.ships) {
          var other = self.ships[ii];
          var theta = G.angle ( other.x, other.y, ship.x, ship.y );
          var range = G.distance ( ship.x, ship.y, other.x, other.y );
          if(range < 8 * xw){
            c ++;
            // run away from bigger, chase smaller
            if ( other.power > ship.power ) {
              a = a + de_ra ( ra_de (theta) + 180 );
            } else {
              a = a + de_ra ( ra_de (theta) );
            }
            t = t + 0.1;
          }
        }
        if(c>0){
          a = a / c;
          a = a % 360;
          t = ship.impulse / 20;
	  ship.vx = ship.vx + t * Math.cos(a);
	  ship.vy = ship.vy + t * Math.sin(a);
        }

        // combat mode?
        if ( ship.energy > 20 ) {
          for ( var ii in self.ships ) {
            var other = self.ships[ii];

            if ( other.hue != ship.hue && random1to(1500) == 1 ) {
              self.missiles.push(self.makeMissile({
                x:ship.x, y:
                ship.y,
                color: other.color,
                target: ii
              }));
            }

            if ( other.hue != ship.hue && ship.energy > 20 ) {
              var rng = G.distance ( ship.x, ship.y, other.x, other.y );
              if ( rng < ( ship.range * ship.energyf ) ) {
                ship.energy = ship.energy - 1;
                ship.laser = true;

                var f = ( random1to(2) == 1 ) ? -1 : 1;
                ship.laserx = other.x + ( f * random1to( 20 - ship.accuracy ) );
                ship.lasery = other.y + ( f * random1to( 20 - ship.accuracy ) );
                if ( G.distance ( ship.x, ship.y, other.x, other.y ) < 20 ) {
                  other.hit = true;
                  other.energy = other.energy - rng/5;
                  other.recharge = other.recharge - rng/50;
                  if ( other.recharge < 0 ) {
                    other.recharge = 0;
                  }
                  other.damage = other.damage + rng/5;
                }
              }
            }
          }

        }

      }

    }();

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;

    this.trails = true;
    this.init_ships = 16;

    this.period = 16;

    this.stars = [];
    this.ships = [];
    this.missiles = [];
    this.fxs = [];

    var init_stars = function(){
      for(var i=0, ii = random1to(3); i<ii; i++){
        self.stars.push ({
          x: (self.w/4)+(random1to(self.w)/2),
          y: (self.h/4)+(random1to(self.h)/2),
          r: 10 + random1to(20),
          mass: 50 + random1to(50)
        });
      }

    }();

    var init_ships = function(){
      var limit = random1to(30) + 5;
      for (var i=0; i<limit; i++){
        self.ships.push(self.makeShip());
      }
    }();


  },
  makeMissile: function (opts) {
    var opts = opts || {};
    return {
      x: opts.x || 0,
      y: opts.y || 0,
      v: opts.v || 20 + random1to(20)/100,
      target: opts.target || false,
      color: opts.color || '#fff',
      theta: opts.theta || random1to (360)-1,
      ttl: 50 + random1to(50)
    }
  },
  makeShip: function (opts) {

    var x = ( this.w / 2 ) + ( this.w / 4 ) - random1to(this.w / 2 );
    var y = ( this.h / 2 ) + ( this.h / 4 ) - random1to(this.h / 2 );

    var vx = ( 4 - random1to(8) ) * 0.5;
    var vy = ( 4 - random1to(8) ) * 0.5;

    var a = random1to(360);
    var v = 5 + random1to(5);

    var hue = random1to(4) - 1

    if ( hue === 0 ) {
      // blue
      var color = '#00cccc';
      var tint = 'rgba(0,255,255,0.25)';
    }
    if ( hue === 1 ) {
      // red
      var color = '#ff0000';
      var tint = 'rgba(255,0,0,0.5)';
    }
    if ( hue === 2 ) {
      // yellow
      var color = '#ffff00';
      var tint = 'rgba(255,255,0,0.25)';
    }
    if ( hue === 3 ) {
      // green
      var color = '#00ff00';
      var tint = 'rgba(0,255,0,0.25)';
    }

    var energy_max = 20 + random1to(10);
    var impulse = random1to(5);
    var ship = {
      x: x,
      y: y,
      vx:vx,
      vy:vy,
      a: a,
      rot: ((Math.random() > 0.5) ? 1 : -1),
      hue: hue,
      energy_max: energy_max,
      damage: 0,
      energy: 0,
      recharge: 1 + ( random1to(10) ) / 10,
      range: 50 + random1to(50),
      accuracy: random1to(10),
      power: random1to(4),
      impulse: impulse,
      color: color,
      tint: tint,
      v: v
    };
    return ship;

  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);
    setInterval(this.init.bind(this), 20000);

    // restart every 20s
  },
  stop: function(){
    this.running = false;
    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    if(this.requestId){
      window.cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }
  },
  fitToView: function(){
    var sx = this.cw / this.w;
    var sy = this.ch / this.h;
    this.scale = Math.min(sx, sy);

    this.x = (this.cw / 2) - ((this.w * this.scale)/2);
    this.y = (this.ch / 2) - ((this.h * this.scale)/2);
  },
  render : function(){
    this.stop();
    this.$el.html(this.template());
    this.$('.canvas').html('<canvas id="canvas"></canvas>');
    this.$('.fx').html('<canvas id="fx"></canvas>');

    // virtual scren size
    this.w = 1024;
    this.h = 768;
    // actual screen size
    this.cview = document.getElementById('canvas');
    this.cw = this.cview.width = this.$('.canvas').width();
    this.ch = this.cview.height = this.$('.canvas').height();

    this.fxview = document.getElementById('fx');
    this.fxview.width = this.$('.fx').width();
    this.fxview.height = this.$('.fx').height();

    this.fitToView();

    this.start();

  }
});

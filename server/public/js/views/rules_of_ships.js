/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

var CYCLES = [
  '#f00',
  '#0f0',
  '#00f',
  '#ff0',
  '#0ff',
  '#f0f',
  '#fff'];

App.Views.rules_of_ships = Backbone.View.extend({
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

    var xw = this.w/4;
    var xh = this.h/4;

    var draw_booms = function(){
      var boom;
      for (var i in self.booms) {
        boom = self.booms[i];
        boom.ttl --;
        if(boom.ttl < 0){
          self.booms.splice(i, 1);
          continue;
        }

        boom.x = Number(boom.x);
        boom.y = Number(boom.y);

        ctxfx.fillStyle = boom.color;
        ctxfx.strokeStyle = boom.color;

        if(boom.type && boom.type == 'nop'){
        }

        if(boom.type && boom.type === 'ship'){
          ctxfx.lineWidth = xw/64;
          ctxfx.beginPath();
          ctxfx.arc(boom.x, boom.y, ((20 - boom.ttl) * xw/16), 0, 2 * Math.PI, true);
          ctxfx.closePath();
          ctxfx.stroke();
        }       
        if(!boom.type || boom.type == 'missile'){
          ctxfx.fillStyle = '#ffffff';
          ctxfx.strokeStyle = boom.color;
          ctxfx.lineWidth = 2;
          ctxfx.beginPath();
          ctxfx.arc(boom.x,boom.y, boom.r * xw/64, 0, 2 * Math.PI, true);
          ctxfx.fill();
          ctxfx.stroke();
        }
        if(!boom.type || boom.type == 'boom'){
          ctxfx.beginPath();
          ctxfx.arc(boom.x, boom.y, boom.r * xw/64, 0, 2 * Math.PI, true);
          ctxfx.fill();
          ctxfx.closePath();
          ctxfx.stroke();
        }
      }
    }();


    var draw_ships = function(){
      // ships
      var z = xw / 16;
      for ( var i in self.ships ) {

        var ship = self.ships[i]

        if(!ship){
          continue;
        }

        // ship energy indicator/shield

        ctx.fillStyle = false;
        ctx.strokeStyle = false;

        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.strokeStyle = ship.tint;
        if (ship.hit){
          ctx.fillStyle = '#666';
          ctx.strokeStyle = ship.color;
        };

        ctx.lineWidth = z/4;
        
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

        ctx.lineWidth = z;
        ctx.fillStyle = ship.color;
        ctx.strokeStyle = ship.color;
        ctx.beginPath();
        ctx.moveTo(0, -2*z);
        ctx.lineTo(z, z);
        ctx.lineTo(0, 0);
        ctx.lineTo(-z, z);
        ctx.lineTo(0, -2*z);
        ctx.closePath();     
        ctx.stroke();
        ctx.fill();
        ctx.restore();


        // if shooting draw laser
        if (ship.laser) {

          var color = CYCLES[random0to(7)];
          ctx.strokeStyle = '#fff';
          ctx.lineCap = 'round';
          ctx.lineWidth = xw/48;
          ctx.beginPath();
          ctx.moveTo(ship.x, ship.y);
          ctx.lineTo(ship.laserx, ship.lasery);
          ctx.closePath();     
          ctx.stroke();


          ctxfx.strokeStyle = color;
          ctxfx.lineCap = 'round';
          ctxfx.lineWidth = xw/64;
          ctxfx.beginPath();
          ctxfx.moveTo(ship.x, ship.y);
          ctxfx.lineTo(ship.laserx, ship.lasery);
          ctxfx.closePath();     
          ctxfx.stroke();

          ctxfx.fillStyle = '#fff';
          ctxfx.lineWidth = 2;
          ctxfx.beginPath();
          ctxfx.arc(ship.laserx, ship.lasery, xw/48, 0, 2 * Math.PI, true);
          ctxfx.fill();
        }

      }
    }();

    var draw_missiles = function(){
      for (var i in self.missiles) {
        var missile = self.missiles[i]
        ctx.fillStyle = missile.color;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, xw/48, 0, 2 * Math.PI, true);
        ctx.fill();
      }
    }();

    ctx.fillStyle = '#fff';

    var tw = this.w/16;
    var th = this.h/16;

    if(this.ships.length > 0){
      ctx.font = '32pt arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('energy', this.w/2, th);
      ctx.fillText('damage', this.w/2, 2*th);
      // ctx.fillText('recharge', this.w/2, 3*th);
      // ctx.fillText('accuracy', this.w/2, 4*th);
    }

    if(this.ships[0]){
      // energy
      ctx.fillStyle = '#444';
      ctx.fillRect(this.w/2 - 2 * tw, th - th/4, - (6*tw/50) * 50, th*0.8);
      ctx.fillStyle = '#0cc';
      ctx.fillRect(this.w/2 - 2 * tw, th - th/4, - (6*tw/this.ships[0].energy_max) * this.ships[0].energy, th*0.8);
      ctx.closePath();
      // damage
      ctx.fillStyle = '#444';
      ctx.fillRect(this.w/2 - 8 * tw, 2*th - th/4, (6*tw/50) * 50, th*0.7);

      ctx.fillStyle = '#c00';
      ctx.fillRect(this.w/2 - 8 * tw, 2*th - th/4, (6*tw/this.ships[0].energy_max) *  this.ships[0].damage, th*0.7);
      ctx.closePath();

      //ctx.textAlign = 'right';
      //ctx.fillText(this.ships[0].energy.toFixed(0), 6*tw, th);
      // ctx.fillText(this.ships[0].damage.toFixed(0), 6*tw, 2*th);
      // ctx.fillText(this.ships[0].energy.toFixed(0), 6*tw, th);

      // ctx.fillText(this.ships[0].recharge.toFixed(0), 6*tw, 3*th);
      // ctx.fillText(this.ships[0].accuracy.toFixed(0), 6*tw, 4*th);

    }

    if(this.ships[1]){

      // energy
      ctx.fillStyle = '#444';
      ctx.fillRect(this.w/2 + 2 * tw, th - th/4, (6*tw/50) * 50, th*0.8);
      ctx.fillStyle = '#c0c';
      ctx.fillRect(this.w/2 + 2 * tw, th - th/4, (6*tw/this.ships[1].energy_max) * this.ships[1].energy, th*0.8);
      ctx.closePath();
      
      // damage
      ctx.fillStyle = '#444';
      ctx.fillRect(this.w/2 + 8 * tw, 2*th - th/4, -(6*tw/50) * 50, th*0.7);

      ctx.fillStyle = '#c00';
      ctx.fillRect(this.w/2 + 8 * tw, 2*th - th/4, -(6*tw/this.ships[1].energy_max) *  this.ships[1].damage, th*0.7);
      ctx.closePath();


      // ctx.fillStyle = '#fff';

      // ctx.fillText(this.ships[1].damage.toFixed(0), this.w - 6*tw, 2*th);
      // ctx.fillText(this.ships[1].recharge.toFixed(0), this.w - 6*tw, 3*th);
      // ctx.fillText(this.ships[1].accuracy.toFixed(0), this.w - 6*tw, 4*th);
    }


    ctx.font = '48pt arial';
    ctx.fillStyle = '#0cc';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.scores[0], xw/2, this.h * 0.8);

    ctx.font = '48pt arial';
    ctx.fillStyle = '#c0c';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.scores[1], this.w - xw/2, this.h * 0.8);


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
          other.energy = other.energy - 10;
          other.damage = other.damage + 10;
          if ( other.energy < 0 ) {
            other.energy = 0;
          }
          self.booms.push({
            x: other.x,
            y: other.y,
            r: 20,
            color: other.color,
            type: 'missile',
            ttl: 5
          });
        }
      }
    }();

    this.theta += 0.01;

    if(this.theta >= 360){
      this.theta = 0;
    }

    var tick_ships = function(){

      var ship, theta, r, g, angle, thrust;
      var i, j;

      for (i in self.ships ) {
        self.ships[i].hit = false;
        self.ships[i].laser = false;
      }

      _.each(self.ships, function(ship, ix){

        if(!ship){
          return;
        }

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

        if ( ship.recharge < ship.recharge_max ) {
          ship.recharge += 0.1;
        }

        // ship is destroyed!
        if (ship.damage > ship.energy_max) {

          self.booms.push({
            x: ship.x,
            y: ship.y,
            r: ship.energy_max,
            color: ship.color,
            type: 'ship',
            ttl: 20
          });

          self.booms.push({
            x: ship.x,
            y: ship.y,
            r: ship.energy_max,
            color: ship.color,
            type: 'missile',
            ttl: 5
          });

          if(ix === 0){
            self.scores[1] ++;
            self.ships[0] = false;
          } else {
            self.scores[0] ++;
            self.ships[1] = false;
          }
        }

        var other;
        var theta = self.theta;
        var fx = 3 * xw;
        if(ix === 0){
          ship.x = ((self.w/2 ) - fx * Math.sin(theta)) - 2 * xw;
          ship.y = (self.h/2) - fx * Math.cos(theta);
          other = self.ships[1];
          if(other){
            ship.a = ra_de(G.angle ( ship.x, ship.y, other.x, other.y )) - 90;
          }
        }

        if(ix === 1){
          theta = 180 - theta;
          fx = -fx;
          ship.x = ((self.w/2) + fx * Math.sin(theta)) + 2 * xw;
          ship.y = (self.h/2) + fx * Math.cos(theta);

          other = self.ships[0];
          if(other){
            ship.a = ra_de(G.angle ( ship.x, ship.y, other.x, other.y )) - 90;
          }

        }

        if ( ship.x < 0 ) {
          ship.x = this.w;
        }

        if ( ship.x > self.w ) {
          ship.x = 0;
        }

        if ( ship.y < 0 ) {
          ship.y = this.h;
        }

        if ( ship.y > self.h ) {
          ship.y = 0;
        }

        ship.energypc = ( 100 / ship.energy_max ) * ship.energy;
        ship.energyf = ( 1 / ship.energy_max ) * ship.energy;
        if(ship.energyf < 0){
          ship.energyf = 0;
        }
        self.ships[i].theta = theta;

        // check opponent ships in vicinity

        // combat mode?
        if ( ship.energy > 20 ) {
          for ( var ii in self.ships ) {
            var other = self.ships[ii];
            
            if (other && other.hue != ship.hue && random1to(50) == 1 ) {
              self.missiles.push(self.makeMissile({
                x:ship.x, y:
                ship.y,
                color: other.color,
                target: ii
              }));
            }

            if (other && other.hue != ship.hue && ship.energy > 20 ) {
              var rng = G.distance ( ship.x, ship.y, other.x, other.y );
              if ( rng < ( ship.range * ship.energyf * 4 ) ) {
                ship.energy = ship.energy - 1;
                ship.laser = true;

                var f = ( random1to(2) == 1 ) ? -1 : 1;
                ship.laserx = other.x + ( f * random1to( 20 - ship.accuracy*10 ) );
                ship.lasery = other.y + ( f * random1to( 20 - ship.accuracy*10 ) );
                if ( G.distance ( ship.x, ship.y, other.x, other.y ) < 500 ) {
                  other.hit = true;
                  other.energy = other.energy - rng/2000;
                  if ( other.energy < 0 ) {
                    other.energy = 0;
                  }
                  other.recharge = other.recharge - rng/500;
                  if ( other.recharge < 0 ) {
                    other.recharge = 0;
                  }
                  other.damage = other.damage + rng/1250;
                }
              }
            }
          }

        }

      });

    }();

    if(!this.ships[0] || !this.ships[1]){
      if(!this.restarting){
        clearTimeout(this.restarter);
        this.restarting = true;
        this.restarter = setTimeout(this.init.bind(this), 2500);
      }
    }
    
    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }

    this.tickTimer = setTimeout(this.tick.bind(this), this.period);

  },
  init: function(){
    var self = this;
    
    this.theta = 0;

    this.booms = [];
    this.restarting = false;

    var xw = this.w/16;
    var xh = this.h/16;

    this.period = 16;

    this.ships = [];
    this.missiles = [];
    this.fxs = [];

    this.ships[0] = this.makeShip();
    this.ships[0].x = this.w/2 - 2 * xw;
    this.ships[0].y = this.h/2 + xh;
    this.ships[0].a = 0;
    this.ships[0].hue = '#0ff';
    this.ships[0].color = '#0ff';
    this.ships[0].tint =  'rgba(0,255,255,0.25)';

    this.ships[1] = this.makeShip();
    this.ships[1].x = this.w/2 + 2 * xw;
    this.ships[1].y = this.h/2 - xh;
    this.ships[1].a = 180;
    this.ships[1].hue = '#f0f';
    this.ships[1].color = '#f0f';
    this.ships[1].tint =  'rgba(255,0,255,0.25)';

    this.restarter = setTimeout(this.init.bind(this), 15000);
    setTimeout(this.tick.bind(this), this.period);

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
      var color = '#ff00ff';
      var tint = 'rgba(255,0,255,0.5)';
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

    var energy_max = 20 + random1to(30);
    var impulse = random1to(5);
    var ship = {
      x: x,
      y: y,
      vx:vx,
      vy:vy,
      a: a,
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

    ship.recharge_max = ship.recharge;

    return ship;

  },
  start: function () {
    this.scores = {
      0: 0,
      1: 0
    }
    this.init();
    this.running = true;
    this.draw();
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

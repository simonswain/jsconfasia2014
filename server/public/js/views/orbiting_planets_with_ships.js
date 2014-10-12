/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.orbiting_planets_with_ships = Backbone.View.extend({
  template: _.template('<div class="canvas"></div><div class="fx"></div>'),
  initialize : function(opts) {
    _.bindAll(this, 'onClose', 'render', 'start', 'stop', 'draw', 'tick');
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

    if(this.reset){
      ctx.fillStyle = '#000000';
      ctx.fillRect(0,0,this.cw,this.ch);
      ctxfx.fillStyle = '#000000';
      ctxfx.fillRect(0,0,this.cw,this.ch);
      this.reset = false;
    }

    ctx.save();
    ctxfx.save();

    ctxfx.fillStyle = 'rgba(1,1,1,.005)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/16;
    var xh = this.h/16;

    // draw here

    var draw_stars = function(){
      var star;
      for (var i in self.stars) {
        star = self.stars[i];
        ctx.fillStyle = '#900';	
        ctx.strokeStyle = '#c00';	

        var p = 12;
        var r = xw/3;
        var m = 0.7;
        ctx.save();
        ctx.beginPath();
        ctx.translate(star.x, star.y);
        ctx.moveTo(0,0-r);
        for (var i = 0; i < p; i++) {
          ctx.rotate(Math.PI / p);
          ctx.lineTo(0, 0 - (r*m));
          ctx.rotate(Math.PI / p);
          ctx.lineTo(0, 0 - r);
        }
        ctx.fill();
        ctx.restore();

        // ctx.lineWidth = 2;			
        // ctx.beginPath();
        // ctx.arc(star.x, star.y, xw/3, 0, 2 * Math.PI, true);
        // ctx.fill();
        // ctx.stroke();

      }
    }();

    // planets
    var draw_planets = function(){
      var planet;
      for (var i in self.planets) {
        planet = self.planets[i];
        ctx.fillStyle = '#0cc';
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.size * xw/32, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();

        ctxfx.fillStyle = '#0cc';
        ctxfx.strokeStyle = '#0ff';
        ctxfx.lineWidth = 2;
        ctxfx.beginPath();
        ctxfx.arc(planet.x, planet.y, planet.size * xw/96, 0, 2 * Math.PI, true);
        ctxfx.fill();
        ctxfx.stroke();

      }
    }();


    var draw_ships = function(){
      var ships = self.ships;
      var ship;
      for(var i=0, ii=ships.length; i<ii; i++){
        ship = ships[i];
        ctx.fillStyle = 'rgba(100%,100%,100%,1)';	
        ctx.strokeStyle = 'rgba(100%,100%,100%,1)';	
        ctx.lineWidth = 2;			
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, xw/16, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();   

        ctxfx.fillStyle = 'rgba(100%,100%,100%,1)';	
        ctxfx.strokeStyle = 'rgba(100%,100%,100%,1)';	
        ctxfx.lineWidth = 2;			
        ctxfx.beginPath();
        ctxfx.arc(ship.x, ship.y, xw/32, 0, 2 * Math.PI, true);
        ctxfx.fill();
        ctxfx.stroke();   

      }
    }();

    ctx.restore();
    ctxfx.restore();

    this.requestId = window.requestAnimationFrame(this.draw);

  }, 
  tick:function(){

    var self = this;

    if(!this.running){
      return;
    }

    // tick here

    var tick_planets = function(){
      var planet;
      for (var i in self.planets) {
        planet = self.planets[i];
        planet.d += planet.v;
        planet.d = planet.d % 360;
        planet.x = (self.w/2) + planet.r * Math.cos(planet.d);
        planet.y = (self.h/2) + planet.r * Math.sin(planet.d);
      }
    }();

    var tick_ships = function(){

      var ships = self.ships;
      var planet = self.planet;
      var ship;
      var r, g, theta, angle;

      // ships = _.filter(ships, function(x){
      //   return (x.age < 250);
      // });
          
      if(ships.length < 5 && random0to(100) < 100){
        ships.push({
          x: random0to(self.w),
          y: random0to(self.h),
          vx: 0,
          vy: 0,
          age: 0,
          thrust: 0.2 + random.from1to(5)/5
        });
        
      }

      var j, r, g, theta, angle, planet;

      for(var i=0, ii=ships.length; i<ii; i++){
        ship = ships[i];
        ship.age ++;
        
        for(j in self.stars){
          star = self.stars[j];  
          // angle between ship and planet
          theta = G.angle ( star.x, star.y, ship.x, ship.y );

          // angle between ship and star
          r = G.distance ( ship.x, ship.y, star.x, star.y );

          // force of gravity from star on ship - calc gravity vector
          g = 400 * ( 10 / ( r * r ) )
          if ( g > 3 ) {
            g = 3;
          }
          angle = de_ra ( ra_de (theta) + 90 ); 
          ship.vx = ship.vx + (0.5 * ship.thrust * g) * Math.cos(angle);
          ship.vy = ship.vy + (0.5 * ship.thrust * g) * Math.sin(angle);
          // convert gravity to xy. apply
          ship.vx = ship.vx + g * Math.cos(theta);
          ship.vy = ship.vy + g * Math.sin(theta);      
        }

        
        for(j in self.planets){
          planet = self.planets[j];  
          // angle between ship and planet
          theta = G.angle ( planet.x, planet.y, ship.x, ship.y );

          // angle between ship and planet
          r = G.distance ( ship.x, ship.y, planet.x, planet.y );

          // force of gravity from planet on ship
          // calc gravity vector
          g = 200 * ( 10 / ( r * r ) )
          if ( g > 3 ) {
            g = 3;
          }
          angle = de_ra ( ra_de (theta) + 90 ); 
          ship.vx = ship.vx + (0.5 * ship.thrust * g) * Math.cos(angle);
          ship.vy = ship.vy + (0.5 * ship.thrust * g) * Math.sin(angle);
          // convert gravity to xy. apply
          ship.vx = ship.vx + g * Math.cos(theta);
          ship.vy = ship.vy + g * Math.sin(theta);      
        }

        // damping
        ship.vx = ship.vx * 0.95;
        ship.vy = ship.vy * 0.95;

        ship.x += ship.vx * .25;
        ship.y += ship.vy * .25;
        if(ship.x < 0) {
          ship.x = 0;
          ship.vx = -ship.vx;
        }
        if(ship.y < 0) {
          ship.y = 0;
          ship.vy = -ship.vy;
        }
        if(ship.x > self.w) {
          ship.x = self.w;
          ship.vx = -ship.vx;
        }
        if(ship.y > self.h) {
          ship.y = self.h;
          ship.vy = -ship.vy;
        }
      }

      self.ships = ships;

    }();

    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;
    this.period = 25;

    this.stars = [];
    this.planets = [];
    this.ships = [];

    this.reset = true;

    var init_stars = function(){
      // just one star for now
      self.stars.push (self.makeStar());
      // for(var i=0, ii = random1to(3) + 1; i<ii; i++){
      //   self.stars.push (self.makeStar());
      // }
    }();

    
    var init_planets = function(){
      for(var i=0, ii = random1to(3) + 1; i<ii; i++){
        self.planets.push (self.makePlanet());
      }
    }();


  },
  makeStar: function() {
    var star = {
      x: this.w/2,
      y: this.h/2
    };
    return star;
  },
  makePlanet: function() {
    var planet = {
      size: random.from0to(Math.min(this.w,this.h) * 0.01),
      r: Math.min(this.w,this.h) * 0.1 + random.from0to(Math.min(this.w,this.h) * 0.4),
      d: random.from0to(360),
      v: 0.0001 * (random.from0to(100)),
      x: 0,
      y: 0
    };
    return planet;
  },
  makeShip: function() {
    var ship = {
      size: random.from0to(Math.min(this.w,this.h) * 0.01),
      r: (Math.min(this.w,this.h) * 0.2) + (random.from0to(Math.min(this.w,this.h) * 0.1)),
      d: random.from0to(360),
      v: 0.001 * (random.from0to(100)),
      x: 0,
      y: 0
    };
    return shoop;
  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    this.tick();
    setInterval(this.init.bind(this), 60000);

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

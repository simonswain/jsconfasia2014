/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.gravity = Backbone.View.extend({
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

    ctx.save();
    ctxfx.save();

    ctxfx.fillStyle = 'rgba(1,1,1,.025)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/16;
    var xh = this.h/16;

    // planet
    var draw_planet = function(){
      var planet = self.planet;
      ctx.fillStyle = '#369';	
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, xw, 0, 2 * Math.PI, true);            
      ctx.fill();
    }();

    // planet
    var draw_ships = function(){
      var ships = self.ships;
      var ship;
      for(var i=0, ii=ships.length; i<ii; i++){
        ship = ships[i];

        ctx.lineWidth = xw/16;
        ctx.lineCap = 'round';
       
        // g vector
        ctx.strokeStyle = '#f00';	
        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y) 
        ctx.lineTo(self.w/2, self.h/2);
        ctx.stroke();
        ctx.closePath();

        // velo vector
        ctx.strokeStyle = '#f00';	
        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y) 
        ctx.lineTo(ship.x + (ship.vx  * 10), ship.y + (ship.vy * 10));
        ctx.stroke();
        ctx.closePath();

        // thrust vector
        ctx.strokeStyle = '#f00';	
        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y) 
        ctx.lineTo(ship.x + (ship.tx  * 100), ship.y + (ship.ty * 100));
        ctx.stroke();
        ctx.closePath();


        ctx.fillStyle = '#fff';	
        ctx.strokeStyle = '#fff';	
        ctx.lineWidth = 2;			
        ctx.beginPath();
        //ctx.rect(ship.x, ship.y, 12, 12);
        ctx.arc(ship.x, ship.y, xw/4, 0, 2 * Math.PI, true);
        ctx.closePath()
        ctx.fill();
        ctx.stroke();   

        ctxfx.fillStyle = 'rgba(100%,100%,100%,0.25)';	
        ctxfx.lineWidth = 2;			
        ctxfx.beginPath();
        ctxfx.arc(ship.x, ship.y, xw/8, 0, 2 * Math.PI, false);
        ctxfx.fill();

        ctx.font = '24pt arial';

        ctx.fillStyle = '#fff';
        ctx.textBaseline='middle';
        ctx.fillText( 'vx: ' + ship.vx.toFixed(2), ship.x + xw/2, ship.y - xh/3);
        ctx.fillText( 'vy: ' + ship.vy.toFixed(2), ship.x + xw/2, ship.y + xh/3);
         
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

    var tick_ships = function(){

      var ships = self.ships;
      var planet = self.planet;
      var ship;
      var r, g, theta, angle;
          
      while(ships.length < 1){
        ships.push({
          x: random0to(self.w),
          y: random0to(self.h),
          vx: 0,
          vy: 0,
          age: 0,
          rot: ((Math.random() > 0.5) ? 1 : -1),
          maxage: 500 + random0to(500),
          thrust: 1.5
        });
      }

      // ships = _.filter(ships, function(x){
      //   return (x.age < x.maxage);
      // });

      for(var i=0, ii=ships.length; i<ii; i++){
        ship = ships[i];
        ship.age ++;

        // angle between ship and planet
        theta = G.angle ( planet.x, planet.y, ship.x, ship.y );

        // angle between ship and planet
        r = G.distance ( ship.x, ship.y, planet.x, planet.y );

        // force of gravity from planet on ship

        // calc gravity vector
        g = 400 * ( 10 / ( r * r ) )

        if ( g > 3 ) {
          g = 3;
        }

        // thrust vector
        angle = de_ra ( ra_de (theta) + (ship.rot * 90) ); 
        ship.tx = (0.35 * ship.thrust * g) * Math.cos(angle)
        ship.ty =  + (0.35 * ship.thrust * g) * Math.sin(angle)
        ship.vx = ship.vx + ship.tx;
        ship.vy = ship.vy + ship.ty;

        // convert gravity to xy. apply
        ship.vx = ship.vx + g * Math.cos(theta);
        ship.vy = ship.vy + g * Math.sin(theta);      

        ship.vx = ship.vx * 0.97;
        ship.vy = ship.vy * 0.97;

        ship.x += ship.vx;
        ship.y += ship.vy;
        if(ship.x < 0) {
          ship.x = 0;
          ship.vx = -ship.vx;
        }
        if(ship.y < 0) {
          ship.y = 0;
          ship.vy = -ship.vy;
        }
        if(ship.x > this.w) {
          ship.x = this.w;
          ship.vx = -ship.vx;
        }
        if(ship.y > this.h) {
          ship.y = this.h;
          ship.vy = -ship.vy;
        }
     }

      self.ships = ships;
    }();

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    this.trails = true;
    this.period = 16;
    this.planet = {
      x: this.w/2,
      y: this.h/2
    };
    this.ships = [];
  },

  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);
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

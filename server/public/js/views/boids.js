/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.boids = Backbone.View.extend({
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

    ctxfx.fillStyle = 'rgba(1,1,1,.18)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/16;
    var xh = this.h/16;

    // draw here

    var draw_boids = function(){
      // boids
      var z = xw / 8;
      for ( var i in self.boids ) {
        var boid = self.boids[i]

        ctx.fillStyle = false;
        ctx.strokeStyle = false;

        // draw boid body
        ctx.save();
        ctx.translate(boid.x, boid.y);
        ctx.rotate(de_ra(boid.a + 90));

        ctx.lineWidth = z/2;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#fff';
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

        // ctx.fillStyle = '#aaa';
        // ctx.font = '10pt arial';
        // ctx.textAlign = 'left';
        // ctx.fillText(boid.a.toFixed(2), boid.x + 16, boid.y + 16);

      }
    }();

    //

    ctx.restore();
    ctxfx.restore();

    this.requestId = window.requestAnimationFrame(this.draw);

  },
  tick: function(){

    var self = this;

    if(!this.running){
      return;
    }

    // tick here

    var tick_boids = function(){

      var xw = self.w/16;
      var xh = self.h/16;

      var boid, theta, r, g, angle, thrust;
      var i, j;

      // determine center position of all boids
      var xx, yy;
      xx = 0;
      yy = 0;
      var c = 0;
      self.boids.forEach(function(other){
        xx += other.x;
        yy += other.y;
        c++;
      });

      xx = xx/c
      yy = yy/c;

      self.boids.forEach(function(boid){

        var c;
        var dx, dy;

        // boid's current velocity
        var angle = de_ra(boid.a);
	var vx = boid.v * Math.cos(angle);
	var vy = boid.v * Math.sin(angle);

        // now apply flocking to it


        // separation

        // this is the sum of change to vx/vy we will apply
        dx = 0;
        dy = 0;

        self.boids.forEach(function(other){
          var range = G.distance (other.x, other.y, boid.x, boid.y);
          if(range > 0 && range < (2*xw)){
            var angle = G.angle (other.x, other.y, boid.x, boid.y);
	    dx -= Math.cos(angle) * (1/range);
	    dy -= Math.sin(angle) * (1/range);
          }
        });

        vx += boid.v * dx * 0.7;
        vy += boid.v * dy * 0.7;

        // alignment


        // this is the sum of change to vx/vy we will apply
        dx = 0;
        dy = 0;
        c = 0;
        self.boids.forEach(function(other){
          if(other === boid){
            return;
          }
          var angle = de_ra(other.a);
	  dx += Math.cos(angle) * 0.1
	  dy += Math.sin(angle) * 0.1;
          c++;
        });

        vx += boid.v * (dx/c)
        vy += boid.v * (dy/c);

        // cohesion

        // this is the sum of change to vx/vy we will apply
        c = 0;

        angle = G.angle (xx, yy, boid.x, boid.y);

	vx += boid.v * Math.cos(angle) * 0.05;
	vy += boid.v * Math.sin(angle) * 0.05;



        boid.x += vx;
        boid.y += vy;


        boid.a = ra_de(Math.atan2(vy, vx));

        // wrap-around

        if ( boid.x < 0 ) {
          boid.x = self.w;
        }

        if ( boid.x > self.w ) {
          boid.x = 0;
        }

        if ( boid.y < 0 ) {
          boid.y = self.h;
        }

        if ( boid.y > self.h ) {
          boid.y = 0;
        }

      });

    }();

    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;

    this.boids = [];

    var limit = random1to(30) + 20;
    limit = 150;
    var makeBoids = function(){
      for (var i=0; i<limit; i++){
        self.boids.push(self.makeBoid());
      }
    }();

    this.period = 20;

  },
  makeBoid: function (opts) {
    var boid = {
      // location
      x: ( this.w / 2 ),
      y: ( this.h / 2 ),

      // velocity
      a: random1to(360),
      v: (random1to(10) + 5)/4,

      // acceleration
      da: 0,
      dv: 0
    };
    return boid;
  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);
    //setInterval(this.init.bind(this), 20000);

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

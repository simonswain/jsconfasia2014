/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.rules_of_boid = Backbone.View.extend({
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
      var z = xw/2;
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


    var arrow = function(x, y, angle, color){
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle - Math.PI/2);
      if(color){ 
        ctx.strokeStyle = color;
      }
      var zz = xw/4
      ctx.beginPath();
      ctx.moveTo(-zz, zz) 
      ctx.lineTo(0, 0)
      ctx.lineTo(zz, zz) 
      ctx.stroke();
      ctx.closePath();   
      ctx.restore();
    }

    ctx.lineWidth = xw/8;


    var yy;
 

    // alignment
    yy = this.h * 0.5;
    ctx.strokeStyle = '#c0c';
    ctx.beginPath();
    ctx.moveTo(this.w/2 - 2.1*xw, yy - 2*xw);
    ctx.lineTo(this.w/2 - 1.9*xw, yy - 4*xw);
    ctx.stroke();

    arrow(this.w/2 - 1.9*xw, yy - 4*xw, 0.53*Math.PI);

    ctx.beginPath();
    ctx.moveTo(this.w/2 + 2.1*xw, yy - 2*xw);
    ctx.lineTo(this.w/2 + 1.9*xw, yy - 4*xw);
    ctx.stroke();

    arrow(this.w/2 + 1.9*xw, yy - 4*xw, 0.46*Math.PI);

    // separation
    yy = this.h * 0.48;
    ctx.strokeStyle = '#0cc';

    ctx.beginPath();
    ctx.moveTo(this.w/2 - xw, yy);
    ctx.lineTo(this.w/2 + xw, yy);
    ctx.stroke();

    arrow(this.w/2 - xw, yy, 0);
    arrow(this.w/2 + xw, yy, Math.PI);

    // alignment
    yy = this.h * 0.48;
    ctx.strokeStyle = '#c00';

    ctx.beginPath();
    ctx.moveTo(this.w/2 - 5*xw, yy);
    ctx.lineTo(this.w/2 - 3*xw, yy);
    ctx.stroke();
    arrow(this.w/2 - 3*xw, yy, Math.PI);

    ctx.beginPath();
    ctx.moveTo(this.w/2 + 3*xw, yy);
    ctx.lineTo(this.w/2 + 5*xw, yy);
    ctx.stroke();
    arrow(this.w/2 + 3*xw, yy, 0);


    ctx.restore();
    ctxfx.restore();

    this.requestId = window.requestAnimationFrame(this.draw);

  },
  tick: function(){

    var self = this;

    if(!this.running){
      return;
    }
    //

    this.frame ++;
    if(this.frame > 5){
      this.frame = 0;
    }

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;

    var xw = this.w/16;
    var xh = this.h/16;

    this.frame = 0;

    this.boids = [];

    this.boids = [];
    this.boids[0] = this.makeBoid();
    this.boids[0].x = this.w/2 - 2 * xw;
    this.boids[0].a = -90;

    this.boids[1] = this.makeBoid();
    this.boids[1].x = this.w/2 + 2 * xw;
    this.boids[1].a = -90;
    
    this.period = 2000;

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

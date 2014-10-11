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

    if(this.frame === 1){
      // separation

      ctx.lineWidth = xw/16;
      ctx.strokeStyle = '#0cc';
      ctx.beginPath();
      ctx.moveTo(this.w/2 - xw, this.h/2);
      ctx.lineTo(this.w/2 + xw, this.h/2);
      ctx.stroke();

      ctxfx.lineWidth = xw/16;
      ctxfx.strokeStyle = '#0cc';
      ctxfx.beginPath();
      ctxfx.moveTo(this.w/2 - xw, this.h/2);
      ctxfx.lineTo(this.w/2 + xw, this.h/2);
      ctxfx.stroke();
    }


    if(this.frame === 3){
      // alignment

      ctx.lineWidth = xw/16;
      ctx.strokeStyle = '#0cc';

      ctx.beginPath();
      ctx.moveTo(this.w/2 - 2*xw, this.h/2 - 2*xw);
      ctx.lineTo(this.w/2 - 2*xw, this.h/2 - 4*xw);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.w/2 + 2*xw, this.h/2 - 2*xw);
      ctx.lineTo(this.w/2 + 2*xw, this.h/2 - 4*xw);
      ctx.stroke();


      ctxfx.lineWidth = xw/16;
      ctxfx.strokeStyle = '#0cc';

      ctxfx.beginPath();
      ctxfx.moveTo(this.w/2 - 2*xw, this.h/2 - 2*xw);
      ctxfx.lineTo(this.w/2 - 2*xw, this.h/2 - 4*xw);
      ctxfx.stroke();

      ctxfx.beginPath();
      ctxfx.moveTo(this.w/2 + 2*xw, this.h/2 - 2*xw);
      ctxfx.lineTo(this.w/2 + 2*xw, this.h/2 - 4*xw);
      ctxfx.stroke();

    }



    if(this.frame === 5){
      // alignment

      ctx.lineWidth = xw/16;
      ctx.strokeStyle = '#0cc';

      ctx.beginPath();
      ctx.moveTo(this.w/2 - 2*xw, this.h/2);
      ctx.lineTo(this.w/2 - 0.5*xw, this.h/2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.w/2 + 2*xw, this.h/2);
      ctx.lineTo(this.w/2 + 0.5*xw, this.h/2);
      ctx.stroke();


      ctxfx.lineWidth = xw/16;
      ctxfx.strokeStyle = '#0cc';

      ctxfx.beginPath();
      ctxfx.moveTo(this.w/2 - 2*xw, this.h/2);
      ctxfx.lineTo(this.w/2 - 0.5*xw, this.h/2);
      ctxfx.stroke();

      ctxfx.beginPath();
      ctxfx.moveTo(this.w/2 + 2*xw, this.h/2);
      ctxfx.lineTo(this.w/2 + 0.5*xw, this.h/2);
      ctxfx.stroke();

    }

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

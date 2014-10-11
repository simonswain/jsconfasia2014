/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.game_loop = Backbone.View.extend({
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

    ctxfx.fillStyle = 'rgba(1,1,1,.01)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    this.gridxy = 16;
    var xw = this.w/this.gridxy;
    var xh = this.h/this.gridxy;


    var y;
    var hh = this.h - 2*xh;
    y = (hh / 1000) * this.height;
    
    ctx.fillStyle = '#0cc';	
    ctx.beginPath();
    ctx.arc(this.w/2, this.h - xh - y, xw/2, 0, 2 * Math.PI, true);           
    ctx.fill();
    ctx.stroke();   

    ctxfx.fillStyle = '#044';	
    ctxfx.beginPath();
    ctxfx.arc(this.w/2, this.h - xh - y, xw/2, 0, 2 * Math.PI, true);           
    ctxfx.fill();
    ctxfx.stroke();   

    // draw here

    if(this.ticked){
      ctx.fillStyle = '#fff';
    } else { 
      ctx.fillStyle = '#999';
    }

    ctx.font = '48pt arial';
    ctx.textAlign = 'right';
    ctx.fillText(this.height.toFixed(0), this.w/2 - xw, this.h/2 - 2*xh);
    ctx.fillText(this.velo.toFixed(0), this.w/2 - xw, this.h/2);
    ctx.fillText(this.gravity, this.w/2 - xw, this.h/2 + 2*xh);

    ctx.textAlign = 'left';
    ctx.fillText('height', this.w/2 + xw, this.h/2 - 2*xh);
    ctx.fillText('velocity', this.w/2 + xw, this.h/2);
    ctx.fillText('gravity', this.w/2 + xw, this.h/2 + 2*xh);



    var delta = new Date().getTime() - this.t;
    
    if(!this.fps || new Date().getTime() - this.sec > 1000){
      this.fps = (1000/delta).toFixed(0);
      this.sec = new Date().getTime();
    }
    
    ctx.fillStyle = '#900';
    ctx.textAlign = 'right';
    ctx.fillText(this.fps, this.w/2 - xw, this.h/2 - 4*xh);

    ctx.textAlign = 'left';
    ctx.fillText('fps', this.w/2 + xw, this.h/2 - 4*xh);

    ctx.restore();
    ctxfx.restore();

    this.t = new Date().getTime();
    this.ticked = false;


    this.requestId = window.requestAnimationFrame(this.draw);

  },
  tick: function(){

    var self = this;

    if(!this.running){
      return;
    }

    this.ticked = true;

    this.height -= - this.velo;
    this.velo -= this.gravity
    if(this.height < 0){
      this.velo = - this.velo;
    }

    if(this.height > 1000){
      this.velo = 0;
      this.height = 1000;
    }

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  toggle: function(){
    if(this.period === 500){
      this.period = 25
    } else {
      this.period = 500
    }
  },
  init: function(){
    var self = this;
    this.t = new Date().getTime();
    this.height = 1000;
    this.velo = 0;
    this.gravity = .98

    this.period = 25;

  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);

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

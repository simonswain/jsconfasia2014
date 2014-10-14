/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.rules_of_life = Backbone.View.extend({
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

    var xw = this.w/this.gridxy;
    var xh = this.h/this.gridxy;

    // draw here

    var frame = this.frames[this.frame];
    var grid = this.grid;
    var x, y;

    var cell;    
    var color;

    for(y = 0; y<3; y ++){

      for(x = 0; x<3; x ++){

        if(this.phase === 0){
          continue;
        }

        cell = frame[(y*3) + x];
        color = '#333';

        if(cell === 0){
          color = '#333';
        }

        if(cell === 1){
          color = '#fff';
        }

        if(this.phase === 1){
          switch(cell){
          case 2:
            color = '#333';
            break;

          case 3:
            color = '#fff';
            break;

          case 4:
            color = '#fff';
            break;
          }
        }

        if(this.phase === 2){
          switch(cell){
          case 2:
            color = '#090';
            break;

          case 3:
            color = '#900';
            break;

          case 4:
            color = '#090';
            break;
          }
        }

        ctx.lineStyle = '#222';
        ctx.lineWidth = 8;
        ctx.fillStyle = color;

        //console.log('frame', this.frame, 'phase', this.phase, 'x', x, 'y', y, 'cell:', cell, color);

        ctx.beginPath();
        ctx.rect((this.w/2 - 1.5*xw) + (x * xw), (this.h/2 - 1.5*xh) + (y * xh), xw, xh);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();     

        ctxfx.lineStyle = '#222';
        ctxfx.lineWidth = 8;
        ctxfx.fillStyle = color;

        ctxfx.beginPath();
        ctxfx.rect((this.w/2 - 1.5*xw) + (x * xw), (this.h/2 - 1.5*xh) + (y * xh), xw, xh);
        ctxfx.fill();
        ctxfx.stroke();
        ctxfx.closePath();     

        // ctx.fillStyle = '#aaa';
        // ctx.font = '12pt arial';
        // ctx.textAlign = 'left';
        // ctx.fillText(x+ ' ' + y + ' ' + cell + ' ' + color, (this.w/2 - 1.5*xw) + (x * xw) + xw/4, (this.h/2 - 1.5*xh) + (y * xh) + xh/4 );

      } 
    }

    //

    ctx.restore();
    ctxfx.restore();

    // ctx.fillStyle = '#aaa';
    // ctx.font = '12pt arial';
    // ctx.textAlign = 'right';
    // ctx.fillText(this.frame, 16, 16);
    // ctx.fillText(this.phase, 16, 32);

    //setTimeout(this.draw.bind(this), 2000);
    this.requestId = window.requestAnimationFrame(this.draw);

  },
  tick: function(){

    var self = this;

    if(!this.running){
      return;
    }

    this.phase ++;
    if(this.phase === 3){
      this.phase = 0;
      this.frame ++;
      if(this.frame === this.frames.length){
        // frame 1 is splashscreen
        this.frame = 1;
      }
    }

   //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;

    this.gridxy = 6;

    // 0 = show black
    // 1 = show white
    // 2 = blank to green
    // 3 = white to red
    // 4 = white to green

    this.frame = 0;
    this.phase = 1;

    this.frames = [
      [
        0, 0, 0,
        0, 0, 0,
        0, 0, 0,
      ],
      [
        0, 0, 0,
        0, 3, 0,
        0, 0, 0,
      ],
      [
        0, 3, 0,
        0, 3, 0,
        0, 0, 0,
      ],
      [
        0, 2, 0,
        3, 4, 3,
        0, 2, 0,
      ],
      // [
      //   0, 0, 0,
      //   3, 2, 3,
      //   0, 4, 0,
      // ],
      [
        0, 4, 0,
        4, 3, 4,
        0, 4, 0,
      ]
    ];

    this.period = 1500;

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

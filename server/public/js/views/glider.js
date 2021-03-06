/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.glider = Backbone.View.extend({
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

    ctxfx.fillStyle = 'rgba(1,1,1,.5)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/this.gridxy;
    var xh = this.h/this.gridxy;
    // draw here

    var grid = this.grid;
    var x, xx, y, yy;
    for(x = 0, xx = grid.length; x<xx; x ++){
      for(y = 0, yy = grid[x].length; y<yy; y ++){
        if(!grid[x][y]){
          continue;
        }
        // don't draw border cells
        if(x === 0 || y === 0 || x === xx-1 || y === yy-1){
          continue;
        }

        ctx.beginPath();
        ctx.fillStyle = '#0ff';
        ctx.lineStyle = '#000';
        ctx.lineWidth = xw/10;
        ctx.rect(x * xw, y * xh, xw, xh);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();     

     
      } 
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

    // tick here

    var next = [];
    var grid = this.grid;

    var x, xx, y, yy, xxx, yyy;
    var i, ii, c, list; // count of neighbours
    for(x = 0, xx = grid.length; x<xx; x ++){
      next[x] = [];
      for(y = 0, yy = grid[x].length; y<yy; y ++){

        next[x][y] = grid[x][y];

        list = [
          [x-1, y-1], [x,y-1], [x+1,y-1],
          [x-1, y], [x+1,y],
          [x-1, y+1], [x,y+1], [x+1,y+1]
        ];
        c = 0;

        //console.log(x,y, grid[x][y]);
        for(i=0, ii = list.length; i<ii; i++){         
          xxx = list[i][0];
          if(xxx < 0){
            xxx = xx - 1;
          }
          if(xxx >= xx){
            xxx = 0;
          }
          if(typeof grid[xxx] === 'undefined'){
            continue;
          }
          yyy = list[i][1];
          if(yyy < 0){
            yyy = yy - 1;
          }
          if(yyy >= yy){
            yyy = 0;
          }
          if(grid[xxx][yyy]){
            c ++;
          }
        }

        if(grid[x][y] && c === 2){
          next[x][y] = true;
        } else if(c === 3){
          next[x][y] = true;
        } else {
          next[x][y] = false;
        }
      }
    }
    //console.log(next);
    this.grid = next;

    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;

    this.gridxy = 12;


    // which grid we are coming from
    this.q = 0;
    this.grid = [];
    
    var i, x, y;
    this.grid = [];
    for(x = 0; x<this.gridxy; x ++){
      this.grid[x] = [];
      for(y = 0; y<this.gridxy; y ++){
        this.grid[x][y] = 0;
      } 
    }

    this.grid[1][0] = 1;
    this.grid[2][1] = 1;
    this.grid[0][2] = 1;
    this.grid[1][2] = 1;
    this.grid[2][2] = 1;

    this.period =  250;

  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);
    //setInterval(this.init.bind(this), 15000);

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

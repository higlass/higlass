import PIXI from 'pixi.js';
import slugid from 'slugid';

export function WigglePixiTrack() {
    let width = 200;
    let height = 15;
    let resizeDispatch = null;

    let chart = function(selection) {
        selection.each(function(d) {
            let localResizeDispatch = resizeDispatch == null ? d3.dispatch('resize') :
                resizeDispatch;
            let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);

            width = d.width;
            height = d.height;

            console.log('this:', d3.select(this));
            d3.select(this).on('resize', function(e) {
                console.log('resize:', e);
            });
            let canvas = d3.select(this).append('canvas');

            var renderer = PIXI.autoDetectRenderer(800, 600, { antialias: true,
            view: canvas.node() });

            // create the root of the scene graph
            var stage = new PIXI.Container();

            stage.interactive = true;

            var graphics = new PIXI.Graphics();

            // set a fill and line style
            graphics.beginFill(0xFF3300);
            graphics.lineStyle(4, 0xffd900, 1);

            // draw a shape
            graphics.moveTo(50,50);
            graphics.lineTo(250, 50);
            graphics.lineTo(100, 100);
            graphics.lineTo(50, 50);
            graphics.endFill();

            // set a fill and a line style again and draw a rectangle
            graphics.lineStyle(2, 0x0000FF, 1);
            graphics.beginFill(0xFF700B, 1);
            graphics.drawRect(50, 250, 120, 120);

            // draw a rounded rectangle
            graphics.lineStyle(2, 0xFF00FF, 1);
            graphics.beginFill(0xFF00BB, 0.25);
            graphics.drawRoundedRect(150, 450, 300, 100, 15);
            graphics.endFill();

            // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
            graphics.lineStyle(0);
            graphics.beginFill(0xFFFF0B, 0.5);
            graphics.drawCircle(470, 90,60);
            graphics.endFill();


            stage.addChild(graphics);

            // run the render loop
            animate();

            function animate() {

                renderer.render(stage);
                requestAnimationFrame( animate );
            }

            function sizeChanged(params) {
                console.log('resizing renderer', params);
                renderer.resize(params.width, params.height);
            }
        });
    }

    chart.width = function(_) {
        if (!arguments.length) return width;
        else width = _;
        return chart;
    }

    chart.height = function(_) {
        if (!arguments.length) return height;
        else height = _;
        return chart;
    }

    chart.resizeDispatch = function(_) {
        if (!arguments.length) return resizeDispatch;
        else resizeDispatch = _;
        return chart;
    }

    return chart;
}

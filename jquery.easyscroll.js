/**
 * Created by alexeyprudnikov on 20.10.17.
 * add custom scrollbar to element
 * methodOrOptions = {
 * showBar: 'default', 'always', 'hover', 'none' - default is for standard browser bar
 * speed: 50,
 * height: 333, 'window'
 * topOffset: 220
 * }
 * or call method on existed scrollbar instance
 * methodOrOptions = 'refresh';
 */
(function($, window, document) {

    $.fn.easyscroll = function(methodOrOptions) {

        if(typeof methodOrOptions == 'string' && typeof $(this).data('easyscroll') != 'undefined') {
            if (methodOrOptions == 'refresh') {
                $(this).data('easyscroll').refresh();
                return;
            }
        }

        var blockHideScrollbar = false;
        const SCROLLBAR_TOGGLE = 0;
        const SCROLLBAR_SHOW = 1;
        const SCROLLBAR_HIDE = 2;

        var $container = $(this);
        // unbind all triggers
        $container.off();
        // clear default css height if set
        $container.css('height','');

        // set init data
        var full_height = $container.height();
        var ratio = 1;

        // initial settings
        var settings = {
            container_height        :   333,
            container_top_offset    :   0,
            default_scrollbar       :   true,
            scrollbar_show          :   'always',
            scroll_speed            :   20  // more is quicker
        };

        // define scrollbar and slider styles
        var scrollbar_style = {
            "z-index":999,
            "position": "absolute",
            "top":"0px",
            "right":"13px",
            "width":"13px",
            "padding-right":"3px",
            "padding-left":"3px",
            "background-color":"#eee",
            "display":"none",
            "opacity":0.8
        };
        var slider_style = {
            "position":"absolute",
            "top":"0px",
            "background-color":"#999",
            "width":"7px",
            "height":"10px",
            "border-radius":"5px"
        };

        // if old scrollbar exists, remove this first
        if($('div[parent-selector="'+$container.selector+'"]').length > 0) {
            $('div[parent-selector="'+$container.selector+'"]').remove();
        }

        var $scrollBar = $('<div parent-selector="'+$container.selector+'"/>').css(scrollbar_style);
        var $slider = $('<div class="scrollbarSlider"/>').css(slider_style);
        $scrollBar.append($slider);
        $scrollBar.insertAfter($container);

        function init() {

            if(methodOrOptions) {
                if(methodOrOptions.showBar !== undefined) {
                    settings.scrollbar_show = methodOrOptions.showBar;
                    delete methodOrOptions.showBar;
                }
                if(methodOrOptions.speed !== undefined) {
                    settings.scroll_speed = methodOrOptions.speed;
                    delete methodOrOptions.speed;
                }
            }

            setSize();  // first, before setEvents() because of calc of ratio

            if(checkTouchDevice() === true || settings.scrollbar_show == 'default') {
                // standard scrollbar by mobile
                $container.css('overflow-y','auto');
            } else {
                $container.css('overflow-y','hidden');
                setEvents();
                if(settings.scrollbar_show == 'always') {
                    showHideScrollBar(SCROLLBAR_SHOW)
                }
            }
        }

        function setSize() {
            setContainer(); // always by setSize because of $(window).height() calc
            var height = settings.container_height - settings.container_top_offset;
            ratio = full_height/height;
            $container.height(height);
            $scrollBar.height(height);
            $scrollBar.css("top", $container.position().top);
            $slider.height(height/ratio);
            // to top (temp. lösung)
            $container.scrollTop(0);
            $slider.css("top",0);
            if(settings.scrollbar_show == 'always') {
                showHideScrollBar(SCROLLBAR_TOGGLE);
            }
        }

        function setContainer() {
            var tmp_options = {};
            if(methodOrOptions) {
                if(methodOrOptions.height !== undefined) {
                    if (methodOrOptions.height == 'window') {
                        tmp_options.container_height = $(window).height(); // to the bottom of browser window
                        // offset only by full window
                        if(methodOrOptions.topOffset !== undefined) {
                            tmp_options.container_top_offset = methodOrOptions.topOffset;
                        }
                    } else {
                        var tmp_height = parseInt(methodOrOptions.height,10);
                        if(tmp_height > 0) {
                            tmp_options.container_height = tmp_height;
                        }
                    }
                }
                $.extend(settings, tmp_options);
            }
        }

        function setEvents() {

            // set defaults from settings
            if(settings.scrollbar_show == 'hover') {
                // show on hover
                $container.hover(function(){showHideScrollBar(SCROLLBAR_SHOW)}, function(){showHideScrollBar(SCROLLBAR_HIDE)});
                $scrollBar.hover(function(){showHideScrollBar(SCROLLBAR_SHOW)}, function(){showHideScrollBar(SCROLLBAR_HIDE)});
            }

            // scroll content
            $container.bind('wheel', function(e) {
                var $this = $(this);
                var thistop = $this.scrollTop();
                var scrolltop = $slider.position().top;
                var slider_speed = settings.scroll_speed/ratio;
                if(e.originalEvent.deltaY < 0) {
                    // scrolling up
                    $this.scrollTop(thistop - settings.scroll_speed);
                    if((scrolltop - slider_speed) > 0) {
                        $slider.css("top", scrolltop - slider_speed);
                    } else {
                        $slider.css("top", 0);
                    }
                } else {
                    // scrolling down
                    $this.scrollTop(thistop + settings.scroll_speed);
                    if((scrolltop + slider_speed) < ($scrollBar.height() - $slider.height())) {
                        $slider.css("top", scrolltop + slider_speed);
                    } else {
                        $slider.css("top", $scrollBar.height() - $slider.height());
                    }
                }
            });

            // drag slider
            $slider.draggable({
                containment: "parent",
                start: function() {
                    blockHideScrollbar = true;
                },
                drag: function() {
                    var $this = $(this);
                    // round to next int aliquot to settings.scroll_speed
                    var containerTop = Math.ceil($slider.position().top*ratio/settings.scroll_speed) * settings.scroll_speed;
                    $container.scrollTop(containerTop);
                },
                stop: function() {
                    blockHideScrollbar = false;
                }
            });
        }

        function checkTouchDevice() {
            if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
                return true;
            } else {
                return false;
            }
        }

        function showHideScrollBar(action) {
            if(action == SCROLLBAR_SHOW && ratio > 1) {
                $scrollBar.show();
            } else if(action == SCROLLBAR_HIDE && blockHideScrollbar === false) {
                $scrollBar.hide();
            } else if(action == SCROLLBAR_TOGGLE) {
                if(ratio > 1) {
                    $scrollBar.show();
                } else {
                    $scrollBar.hide();
                }
            }
            return;
        }

        $(document).ready(function() {
            init();
        });

        $(window).off("resize", setSize).resize(setSize);

        this.refresh = function() {
            setTimeout(function(){
                console.log('refresh easyscroll');
                $container.css('height','');
                full_height = $container.height();
                setSize();
                showHideScrollBar(SCROLLBAR_TOGGLE);
            }, 100);
        };

        // set container data
        $container.data('easyscroll', this);

        return;
    };

})(jQuery, window, document);

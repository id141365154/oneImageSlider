;
(function($) {
	var defaults = {

		//GENERAL
		infiniteLoop: true,
		usePreload: true,

		//STATUSES
		statusSelector: '',
		statuses: {
			notFound: 'Sorry, image not found. 404',
			loading: 'Loading...'
		},

		//CONTROLS
		controls: true,
		nextSelector: $('.ois-next'),
		prevSelector: $('.ois-prev'),
		paggerSelector: '',

		// AUTO
		auto: false,
		pause: 4000,
		autoStart: true,
		autoDirection: 'next',
		stopAutoOnClick: false,
		stopAutoOnHover: false,
		autoDelay: 0,

		// TOUCH
		touchEnabled: true,
		swipeThreshold: 40, // percent of image width
		preventDefaultSwipeX: true,
		preventDefaultSwipeY: false,

		// PAGER
		/*pager: false,
		pagerContainerSelector: null,
		buildPager: null,
		*/


	}

	$.fn.oneImageSlider = function(options) {

			if (this.length === 0) {
				return this;
			}

			// support multiple elements
			if (this.length > 1) {
				this.each(function() {
					$(this).oneImageSlider(options);
				});
				return this;
			}

			// create a namespace to be used throughout the plugin
			var slider = {},
				// set a reference to our slider element
				elWrap = $(this),
				el = $(this).find('img');


			var init = function(callback) {
					// Return if slider is already initialized
					if ($(el).data('oneImageSlider')) {
						return;
					}

					// merge user-supplied options with the defaults
					slider.settings = $.extend({}, defaults, options);

					// store the current state of the slider (if currently animating, working is true)
					slider.working = false;

					slider.imagesListArray = el.attr('data-images').split(',');
					slider.imagesListArray.unshift(el.attr('src'));


					//preload next & last images on start
					if (slider.settings.usePreload) {
						imgCache(slider.imagesListArray, 0);


					};

					if (slider.settings.touchEnabled) {
						initTouch();
					}

					if (slider.settings.auto) {
						initAuto();
					}

					//elWrap.css('overflow', 'hidden');

					//METHODS
					slider.methods = {};
					slider.methods.nextSlide = function() {
						toAanimate('back', true, null, function() {
							toSlide('next');
						});
					};

					slider.methods.prevSlide = function() {
						toAanimate('forward', true, null, function() {
							toSlide('prev');

						});
					};

					//EVENTS

					slider.settings.nextSelector.bind('click', function() {
						slider.methods.nextSlide();
					});

					slider.settings.prevSelector.bind('click', function() {
						slider.methods.prevSlide();
					});


					el.on('error', function() {
						slider.settings.statusSelector.text(slider.settings.statuses.notFound);
					});

					return callback();

				} //END INIT

			//FUNCTIONS

			/*Load new src for img tag*/
			function toSlide(direction) { // direction: 'prev', 'next' or [index]

				var currentUrl = el.attr('src');
				var newUrl = '';
				for (var i = slider.imagesListArray.length - 1; i >= 0; i--) {

					if (slider.imagesListArray[i] == currentUrl) {
						if (direction == 'prev') {
							var prev = getAdjacentIndexesLoop(slider.imagesListArray, i).prev;
							if (!slider.settings.infiniteLoop && prev == slider.imagesListArray.length - 1) {
								return;
							}
							newUrl = slider.imagesListArray[prev];

							imgCache(slider.imagesListArray, prev);
						}
						if (direction == 'next') {
							var next = getAdjacentIndexesLoop(slider.imagesListArray, i).next;
							if (!slider.settings.infiniteLoop && next == 0) {
								return;
							}
							newUrl = slider.imagesListArray[next];

							imgCache(slider.imagesListArray, next);
						}
						if (Number.isInteger(direction)) {
							if (direction <= isInteger.length - 1 && direction >= 0) {
								newUrl = slider.imagesListArray[direction];

							}
						}
					}
				};

				el.trigger('onBeforeSlide', {
					'el': el,
					'slider': slider
				});

				el.attr('src', newUrl);

				el.trigger('onAfterSlide', {
					'el': el,
					'slider': slider
				});


			}

			function imgCache(imgArr, currentIndex) {
				//add to cache prev & next imagesv
				if (options.usePreload) {

					new Image().src = imgArr[getAdjacentIndexesLoop(imgArr, currentIndex).prev];
					new Image().src = imgArr[getAdjacentIndexesLoop(imgArr, currentIndex).next];


				}
			}



			function getAdjacentIndexesLoop(array, index) {
				var result = {
					prev: '',
					current: '',
					next: ''
				}

				result.current = index;

				if ((index + 1) > array.length - 1) {
					result.next = 0;
				} else {
					result.next = index + 1;
				}

				if ((index - 1) < 0) {
					result.prev = array.length - 1;
				} else {
					result.prev = index - 1;
				}
				return result;
			}

			/*Animate slide change*/
			function toAanimate(direction, auto, percent, halfAnimCallback) { // back / forward

				if (!slider.working) {

					var distance = 300;
					var autoDuration = 50; // total animation time [ms]
					var translateAmount = distance * percent / 100;
					var opacityAmount = 1 - Math.abs(percent / 100);

					if (auto) {

						var i = 0;
						var speed = distance / autoDuration;
						var opacitySpeed = 1 / autoDuration;


						var currentTranslate = getTranslateValue(el)[4];
						var interval = setInterval(function() {
							slider.working = true;
							if (i <= autoDuration) {
								var value = 0;
								if (currentTranslate != undefined) {
									value = currentTranslate * 1 + Math.abs(currentTranslate * 1 - i * speed) - currentTranslate + i * speed;
								} else {
									value = i * speed
								}
								if (direction == 'back') {
									value = value * (-1);
								}
								applyCss(value, 1 - i * opacitySpeed);
							} else {
								clearInterval(interval);

								halfAnimCallback();
								applyCss(0, 0);
								slider.settings.statusSelector.text(slider.settings.statuses.loading);
								slider.working = false;

								el.bind('load', function() {
									slider.settings.statusSelector.text('');
									el.animate({
										opacity: 1
									}, 400, function() {
										el.unbind('load');
									});
								});
							}
							i++;
						}, 1);
					} else { // if touch moving
						applyCss(translateAmount, opacityAmount);
					}
				} //end ?!slider.working
			}

			function initTouch() {
				// initialize object to contain all touch values
				slider.touch = {
					start: {
						x: 0,
						y: 0
					},
					end: {
						x: 0,
						y: 0
					}
				};
				elWrap.bind('touchstart MSPointerDown pointerdown', onTouchStart);
				elWrap.bind('touchend MSPointerUp pointerup', onTouchEnd);
			}

			var onTouchStart = function(e) {

				slider.touchMove = {};
				slider.touchMove.originalEvent = e.originalEvent;
				slider.touchMove.touchPoints = (typeof slider.touchMove.originalEvent.changedTouches !== 'undefined') ? slider.touchMove.originalEvent.changedTouches : [slider.touchMove.originalEvent];
				// record the starting touch x, y coordinates
				slider.touch.start.x = slider.touchMove.touchPoints[0].pageX;
				slider.touch.start.y = slider.touchMove.touchPoints[0].pageY;
				slider.touch.originalPos = el.position();
				// bind a "touchmove" event to the viewport
				elWrap.bind('touchmove MSPointerMove pointermove', onTouchMove);
				slider.touchMove.value = 0;
				slider.touchMove.change = 0;
				slider.touchMove.elWidth = el.width();
			}

			var onTouchMove = function(e) {

				slider.touchMove.originalEvent = e.originalEvent;
				slider.touchMove.touchPoints = (typeof slider.touchMove.originalEvent.changedTouches !== 'undefined') ? slider.touchMove.originalEvent.changedTouches : [slider.touchMove.originalEvent];

				// if scrolling on y axis, do not prevent default
				slider.touchMove.xMovement = Math.abs(slider.touchMove.touchPoints[0].pageX - slider.touch.start.x);
				slider.touchMove.yMovement = Math.abs(slider.touchMove.touchPoints[0].pageY - slider.touch.start.y);

				// x axis swipe
				if ((slider.touchMove.xMovement * 3) > slider.touchMove.yMovement && slider.settings.preventDefaultSwipeX) {
					e.preventDefault();
				}
				// y axis swipe
				if ((slider.touchMove.yMovement * 3) > slider.touchMove.xMovement && slider.settings.preventDefaultSwipeY) {
					e.preventDefault();
				}

				slider.touchMove.change = slider.touchMove.touchPoints[0].pageX - slider.touch.start.x;
				slider.touchMove.perc = slider.touchMove.change * 100 / slider.touchMove.elWidth;

				//detect direction
				slider.touchMove.direction = {};
				this.preChange = 0;
				if (slider.touchMove.change > this.preChange) {
					slider.touchMove.direction.anim = 'forward';
					slider.touchMove.direction.load = 'prev';
				} else {
					slider.touchMove.direction.load = 'next';
					slider.touchMove.direction.anim = 'back';
				}
				this.preChange = slider.touchMove.change;
				toAanimate(slider.touchMove.direction.anim, false, slider.touchMove.perc);
			}

			var onTouchEnd = function(e) {

				elWrap.unbind('touchmove MSPointerMove pointermove');
				if (slider.touchMove.change != 0) {

					if (slider.touchMove.perc >= slider.settings.swipeThreshold || slider.touchMove.perc <= slider.settings.swipeThreshold * (-1)) {
						toAanimate(slider.touchMove.direction.anim, true, null, function() {
							toSlide(slider.touchMove.direction.load);
						});
					} else { //if not enough slide mooving return image to start position;
						var currentTranslate = Math.ceil(getTranslateValue(el)[4]);
						var backAnimInterval = setInterval(function() {
							if (currentTranslate != 0) {
								applyCss(currentTranslate, 1);
								if (currentTranslate > 0) {
									currentTranslate--;
								} else {
									currentTranslate++;
								}
							} else {
								clearInterval(backAnimInterval)
							}
						}, 1);
					}
				}
			}

			function getTranslateValue(elem) {
				var matrix = elem.css('transform');
				var values = matrix.slice(6).replace('(', '').replace('/ /', '').split(',');
				return values;
			}

			/*apply SSC properties are used in animation*/
			function applyCss(translateAmount, opacityAmount) {
				el.css({
					'-webkit-transform': 'translateX(' + translateAmount + 'px)',
					'-moz-transform': 'translateX(' + translateAmount + 'px)',
					'-ms-transform': 'translateX(' + translateAmount + 'px)',
					'-o-transform': 'translateX(' + translateAmount + 'px)',
					'transform': 'translateX(' + translateAmount + 'px)',
					'opacity': opacityAmount
				});
			}


			function initAuto() {
				slider.auto = {};
				setTimeout(function() {
					el.bind('onAfterSlide', function() {
						slider.settings.autoStart = true;
					});

					if (slider.settings.stopAutoOnHover) {
						el.on('mouseover', function() {
							slider.settings.stopAutoOnHover = true;
						});
						el.on('mouseout', function() {
							slider.settings.stopAutoOnHover = false;
						});
					}

					if (slider.settings.stopAutoOnClick) {
						el.on('click', function() {
							slider.settings.stopAutoOnClick = true;
						});
					}

					slider.auto.interval = setInterval(function() {

						if (slider.settings.autoStart && slider.settings.stopAutoOnHover == false && slider.settings.stopAutoOnClick == false) {
							if (slider.settings.autoDirection == 'next') {
								slider.methods.nextSlide();
							}
							if (slider.settings.autoDirection == 'prev') {
								slider.methods.prevSlide();
							}
						}
					}, slider.settings.pause);
				}, slider.settings.autoDelay);
			}



			//INITIALIZE SLIDER
			//init();
			return init(function() {
				return slider;
			});

			$(el).data('oneImageSlider', this);

		} //end of pluigin
})(jQuery);
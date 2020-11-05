/* Vars for the divChanger*/

var tabEnum = Object.freeze({"HOME":0, "ABOUT ME":1, "PICTURES":2, "DOWNLOADS":3, "LIFE GOALS":4 })

/* TODO: change func from using index to enum*/
var tabIndex = [
    '#home',
    '#about-me',
    '#pictures',
    '#projects',
    '#life-goals'
];

var tabNavStack = ['home', 'home'];

var tabStack = ['#home', '#home'];

var valueID = [];

var files;

var navbarToggler = 1;

/* Day/Nightmode Switcher*/

function toggleDarkLight() {
    var $body = $("body");
    $body.toggleClass("dark-mode light-mode")
}

var initPhotoSwipeFromDOM = function(gallerySelector) {

    // parse slide data (url, title, size ...) from DOM elements
    // (children of gallerySelector)
    var parseThumbnailElements = function(el) {
        var thumbElements = el.childNodes,
            numNodes = thumbElements.length,
            items = [],
            figureEl,
            linkEl,
            size,
            item;

        for(var i = 0; i < numNodes; i++) {

            figureEl = thumbElements[i]; // <figure> element

            // include only element nodes
            if(figureEl.nodeType !== 1) {
                continue;
            }

            linkEl = figureEl.children[0]; // <a> element

            size = linkEl.getAttribute('data-size').split('x');

            // create slide object
            item = {
                src: linkEl.getAttribute('href'),
                w: parseInt(size[0], 10),
                h: parseInt(size[1], 10)
            };



            if(figureEl.children.length > 1) {
                // <figcaption> content
                item.title = figureEl.children[1].innerHTML;
            }

            if(linkEl.children.length > 0) {
                // <img> thumbnail element, retrieving thumbnail url
                item.msrc = linkEl.children[0].getAttribute('src');
            }

            item.el = figureEl; // save link to element for getThumbBoundsFn
            items.push(item);
        }

        return items;
    };

    // find nearest parent element
    var closest = function closest(el, fn) {
        return el && ( fn(el) ? el : closest(el.parentNode, fn) );
    };

    // triggers when user clicks on thumbnail
    var onThumbnailsClick = function(e) {
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : e.returnValue = false;

        var eTarget = e.target || e.srcElement;

        // find root element of slide
        var clickedListItem = closest(eTarget, function(el) {
            return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
        });

        if(!clickedListItem) {
            return;
        }

        // find index of clicked item by looping through all child nodes
        // alternatively, you may define index via data- attribute
        var clickedGallery = clickedListItem.parentNode,
            childNodes = clickedListItem.parentNode.childNodes,
            numChildNodes = childNodes.length,
            nodeIndex = 0,
            index;

        for (var i = 0; i < numChildNodes; i++) {
            if(childNodes[i].nodeType !== 1) {
                continue;
            }

            if(childNodes[i] === clickedListItem) {
                index = nodeIndex;
                break;
            }
            nodeIndex++;
        }



        if(index >= 0) {
            // open PhotoSwipe if valid index found
            openPhotoSwipe( index, clickedGallery );
        }
        return false;
    };

    // parse picture index and gallery index from URL (#&pid=1&gid=2)
    var photoswipeParseHash = function() {
        var hash = window.location.hash.substring(1),
            params = {};

        if(hash.length < 5) {
            return params;
        }

        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if(!vars[i]) {
                continue;
            }
            var pair = vars[i].split('=');
            if(pair.length < 2) {
                continue;
            }
            params[pair[0]] = pair[1];
        }

        if(params.gid) {
            params.gid = parseInt(params.gid, 10);
        }

        return params;
    };

    var openPhotoSwipe = function(index, galleryElement, disableAnimation, fromURL) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;

        items = parseThumbnailElements(galleryElement);

        // define options (if needed)
        options = {

            // define gallery index (for URL)
            galleryUID: galleryElement.getAttribute('data-pswp-uid'),

            getThumbBoundsFn: function(index) {
                // See Options -> getThumbBoundsFn section of documentation for more info
                var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
                    pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                    rect = thumbnail.getBoundingClientRect();

                return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
            }

        };

        // PhotoSwipe opened from URL
        if(fromURL) {
            if(options.galleryPIDs) {
                // parse real index when custom PIDs are used
                // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
                for(var j = 0; j < items.length; j++) {
                    if(items[j].pid == index) {
                        options.index = j;
                        break;
                    }
                }
            } else {
                // in URL indexes start from 1

            }
        } else {
            options.index = parseInt(index, 10);
        }

        // exit if index not found
        if( isNaN(options.index) ) {
            return;
        }

        if(disableAnimation) {
            options.showAnimationDuration = 0;
        }

        // Pass data to PhotoSwipe and initialize it
        gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();

        gallery.listen('beforeResize', function() {
            // gallery.viewportSize.x - width of PhotoSwipe viewport
            // gallery.viewportSize.y - height of PhotoSwipe viewport
            // window.devicePixelRatio - ratio between physical pixels and device independent pixels (Number)
            //                          1 (regular display), 2 (@2x, retina) ...


            // calculate real pixels when size changes
            realViewportWidth = gallery.viewportSize.x * window.devicePixelRatio;

            // Code below is needed if you want image to switch dynamically on window.resize

            // Find out if current images need to be changed
            if(useLargeImages && realViewportWidth < 1000) {
                useLargeImages = false;
                imageSrcWillChange = true;
            } else if(!useLargeImages && realViewportWidth >= 1000) {
                useLargeImages = true;
                imageSrcWillChange = true;
            }

            // Invalidate items only when source is changed and when it's not the first update
            if(imageSrcWillChange && !firstResize) {
                // invalidateCurrItems sets a flag on slides that are in DOM,
                // which will force update of content (image) on window.resize.
                gallery.invalidateCurrItems();
            }

            if(firstResize) {
                firstResize = false;
            }

            imageSrcWillChange = false;

        });


    };

    // loop through all gallery elements and bind events
    var galleryElements = document.querySelectorAll( gallerySelector );

    for(var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i+1);
        galleryElements[i].onclick = onThumbnailsClick;
    }

    // Parse URL and open gallery if it contains #&pid=3&gid=1
    var hashData = photoswipeParseHash();
    if(hashData.pid && hashData.gid) {
        openPhotoSwipe( hashData.pid ,  galleryElements[ hashData.gid - 1 ], true, true );
    }
};





$(document).ready(function(){
    // execute above function
    initPhotoSwipeFromDOM('.my-gallery');

    $.get('https://ndrr.xyz/gallery/', (data) =>
    {
        var listing = getDirectoryFiles(data);

		console.log(listing);
		
        if(listing != null){
            console.log(listing);
            $(listing).each(function (index, value) {

                console.log(value);
                if(valueID[valueID.length-1] != value) {
                    //$("#body").append("<img class='userImage' width='350px' height='auto'src='https://ndrr.xyz/gallery/" + value + "'>");
                    valueID.push(value);
                }
            });
        }


    });

    function getDirectoryFiles(text)
    {
        var files = text.match(/([0-9]+[.])\w+/g);
        files = files.map((x) => x.replace('href="', ''));

        return files;
    }






    /* function to change div */
    function divChange(){
        var i;

        for(i = 0; i < tabIndex.length; i++){


            if((tabStack[0] == tabIndex[i]) && !$(tabStack[0]).hasClass('visible')){

                if(tabIndex.indexOf(tabStack[0]) > tabIndex.indexOf(tabStack[1])){

                    $(tabStack[0]).removeClass('hidden');
                    $(tabStack[0]).addClass('visible');

                    //$(tabStack[1]).addClass('animated fadeOutLeft'); //

                    /*
                    $(tabStack[0]).attr('class', 'visible animated fadeInRight');
                    $(tabStack[1]).attr('class', 'animated fadeOutLeft');
                    */

                }else{
                    $(tabStack[0]).removeClass('hidden');
                    $(tabStack[0]).addClass('visible');
                    //$(tabStack[1]).addClass('animated fadeOutRight');

                    /*
                    $(tabStack[0]).attr('class', 'visible animated fadeInLeft');
                    $(tabStack[1]).attr('class', 'animated fadeOutRight');
                    */

                }
            }


            else if(tabStack[0] != tabIndex[i]){
                console.log("Hiding: " + tabIndex[i]);
                $(tabIndex[i]).removeClass('visible');
                $(tabIndex[i]).addClass('hidden');
            }


        }

        var j;

        for(j = 0; j < tabIndex.length; j++){
            $(tabIndex[j]).removeClass('animated fadeInLeft fadeInRight fadeOutLeft fadeOutRight');
        }


        console.log("\n")
    }



    /* typed.js */

    var typed = new Typed('#typed',{
        stringsElement: '#typed-strings',
                backDelay: 4000, /* Delay in text change */
                typeSpeed: 15, /* Typing speed */
                backSpeed: 0,
                showCursor: false,
                loop: true
                
        });






    $('.navbar-nav>li>a').on('click', function(){
        $('.navbar-collapse').collapse('hide');
    });



    /* divChanger btns*/
    $(document).click(function(event) {
        var input = $(event.target).text();


        switch(input){
            case "HOME":
                tabStack[1] = tabStack[0];
                tabStack[0] = '#home';

                tabNavStack[1] = tabNavStack[0];
                tabNavStack[0] = 'home';

                $('#nav-'+tabNavStack[1]).removeClass('h1_nav_selected');
                $('#nav-'+tabNavStack[0]).addClass('h1_nav_selected');
                console.log("home")
                divChange();

                break;

            case "ABOUT ME":
                tabStack[1] = tabStack[0];
                tabStack[0] = '#about-me';

                tabNavStack[1] = tabNavStack[0];
                tabNavStack[0] = 'about-me';

                $('#nav-'+tabNavStack[1]).removeClass('h1_nav_selected');
                $('#nav-'+tabNavStack[0]).addClass('h1_nav_selected');
                console.log("about-me")
                divChange();

                break;

            case "PICTURES":
                tabStack[1] = tabStack[0];
                tabStack[0] = '#pictures';

                tabNavStack[1] = tabNavStack[0];
                tabNavStack[0] = 'pictures';

                $('#nav-'+tabNavStack[1]).removeClass('h1_nav_selected');
                $('#nav-'+tabNavStack[0]).addClass('h1_nav_selected');
                console.log("pictures")
                divChange();

                break;

            case "PROJECTS":
                tabStack[1] = tabStack[0];
                tabStack[0] = '#projects';

                tabNavStack[1] = tabNavStack[0];
                tabNavStack[0] = 'projects';

                $('#nav-'+tabNavStack[1]).removeClass('h1_nav_selected');
                $('#nav-'+tabNavStack[0]).addClass('h1_nav_selected');
                console.log("downloads")
                divChange();

                break;

            case "LIFE GOALS":
                tabStack[1] = tabStack[0];
                tabStack[0] = '#life-goals';

                tabNavStack[1] = tabNavStack[0];
                tabNavStack[0] = 'life-goals';

                $('#nav-'+tabNavStack[1]).removeClass('h1_nav_selected');
                $('#nav-'+tabNavStack[0]).addClass('h1_nav_selected');
                console.log("life-goals")
                divChange();

                break;

        }

    });


});


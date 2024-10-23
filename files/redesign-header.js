/*закомментирована короткая шапка*/
/*закомментированы мувики*/

$(document).ready(function() {
  var winWidth = $(window).width(); 

  redesignHeaderJsMouseTooltip()
  redesignHeaderJsMouseTooltipMovies()
  redesignHeaderJsMouseTooltipHistory()
  puzzleHeaderRepetitionCountJsTooltip()
  userMenuDesktop()
  userMenuTablet()  
  openHistory()

/* на короткой шапке */
  //  if ((winWidth > 1270) && ($('.redesign-header').hasClass('redesign-header__short-menu'))) {
  //   mainMenuDesktopUpd()
  //   if(window.is_mobile) {
  //     deleteAllAttr()
  //   }    
  // }  
  
  // if ((winWidth > 900) && (!$('.redesign-header').hasClass('redesign-header__short-menu'))){
  //   mainMenuDesktopUpd()
  //   if(window.is_mobile) {
  //     deleteAllAttr()
  //   }    
  // } 

  if (winWidth > 900){
    mainMenuDesktopUpd()
    if(window.is_mobile) {
      deleteAllAttr()
    }    
  } 

/* на короткой шапке */
  // if ((winWidth > 992 && winWidth <= 1270) && ($('.redesign-header').hasClass('redesign-header__short-menu'))) {
  //   mainMenuTabletUpdAddMore()
  //   mainMenuDesktopUpd()
  // }

  if (winWidth > 767 && winWidth <= 900) {
    mainMenuTabletUpdAddMore() 
    mainMenuTabletUpd()        
  }

/* на короткой шапке мувики внутрь кнопки еще */
  // if ((winWidth > 767 && winWidth <= 900) && ($('.redesign-header').hasClass('redesign-header__short-menu'))) {
  //   headerMoviesButtonShort()
  // }

  if (($('html').hasClass('mobile') && ($('html').hasClass('phone') || $('html').hasClass('iphone'))) || winWidth <= 767 ) {
    mainMenuMobileUpd()
  }

  // if (($('html').hasClass('mobile') && ($('html').hasClass('phone') || $('html').hasClass('iphone'))) || winWidth <= 500 ) {
  //   headerMoviesButton()
  //    на короткой шапке кнопку випа в мобильное меню 
  //   if ($('.redesign-header').hasClass('redesign-header__short-menu')){
  //     headerVipButton()
  //   }
  // } 

});

var redesignHeaderJsMouseTooltipHistory = function() { 
  new jBox('Mouse', {
    addClass : 'redesign-header__history-tooltip puzzle-tooltip_type_mouse puzzle-tooltip_theme_white puzzle-tooltip_size_m',
    attach : $('.redesign-header_js_mouse-tooltip-history'),
    zIndex : 8000,
    adjustTracker: true,
    getContent: 'data-content',
  });
};


var redesignHeaderJsMouseTooltip = function() { 
  new jBox('Mouse', {
    addClass : 'redesign-header__history-tooltip puzzle-tooltip_type_mouse puzzle-tooltip_theme_white puzzle-tooltip_size_m',
    attach : $('.redesign-header_js_mouse-tooltip'),
    zIndex : 8000,
    adjustTracker: true,
    getContent: 'data-content',
  });
};

var redesignHeaderJsMouseTooltipMovies = function() { 
  new jBox('Tooltip', {
    addClass : 'puzzle-tooltip_theme_white puzzle-tooltip_size_m puzzle-tooltip_style_buble',
    attach : $('.redesign-header_js_mouse-tooltip-movies'),
    zIndex : 8000,
    maxWidth : 190,
    adjustTracker: true,
    getContent: 'data-content',
  });
};

var puzzleHeaderRepetitionCountJsTooltip = function() { 
  new jBox('Mouse', {
    id : 'repetitionModeHint',
    attach : $('.puzzle-header__repetition-count_js_tooltip'),
    zIndex : 8000,
    adjustTracker: true,
    content : typeof contentForHintRepetition !== "undefined" ? contentForHintRepetition : ''
  });
};

var puzzleHeaderSearchHideWordsJsTooltip = function() {
  new jBox('Mouse', {
    id : 'repetitionModeHint',
    attach : $('.j-search-word_is_hide_header'),
    zIndex : 8000,
    adjustTracker: true,
    content: localizeGetText({l:'word_is_hide_by_settings',v:'слово скрыто настройками словаря',t:'first',n:'dictionary'}),
  });
};

var userMenuDesktop = function() { 
  var timerId = null;
  if ((!$('html').hasClass('no-touchscreen')) && (!($('html').hasClass('touchscreen') && $('html').hasClass('pc')))) return;
  // если класс no-touchscreen отсутствует  и  классы touchscreen и pc отсутствуют  выходим из функции
  $(document).on('mouseenter', '.redesign-header__user-pic_js_hover', function() {
    clearTimeout(timerId);
    $parent = $(this).parents('.redesign-header__user');
    $parent.find('.redesign-header__user-menu').fadeIn(200);      // ?
  });

  $(document).on('mouseenter', '.redesign-header__user-menu', function() {      // ?
    clearTimeout(timerId);
  });

  $(document).on('mouseleave', '.redesign-header__user', function() {
    timerId = setTimeout(function() {
      $(this).find('.redesign-header__user-menu').fadeOut(200);     // ?
    }, 200);
  });
};

var userMenuTablet = function() {
  if ($('html').hasClass('no-touchscreen') || ($('html').hasClass('touchscreen') && $('html').hasClass('pc'))) return;
  // если класс no-touchscreen ЕСТЬ или классы touchscreen и pc ЕСТЬ выходим из функции
  var eventType = $('html').hasClass('pc') ? 'click' : 'touchstart';
  var $parent = $('.redesign-header__user');
  var $userMenu = $parent.find('.redesign-header__user-menu');      // ?

  $(document).on(eventType, '.redesign-header__user-pic_js_hover', function() {
    if (($userMenu).is(':visible')) {
      $userMenu.fadeOut(100);
    } else {
      $userMenu.fadeIn(100);
    }
  });
  // close main menu on body click
  $(document).on(eventType, 'body', function(event) {
    var $target = $(event.target);
    if (!($target.parents('.redesign-header__user').length) && !($target.hasClass('redesign-header__user'))) {
      $userMenu.fadeOut(100);
    }
  });
};


var deleteAllAttr = function() { 
 $(".redesign-header__menu-item").removeAttr("href");
};

var deleteMainAttr = function() { 
  $(".redesign-header__menu-item").eq(0).removeAttr("href");
  $(".redesign-header__menu-item").eq(1).removeAttr("href");
  $(".redesign-header__menu-item").eq(2).removeAttr("href");
  $(".redesign-header__menu-item").eq(3).removeAttr("href");
  $(".redesign-header__menu-item").eq(4).removeAttr("href");
};

var mainMenuDesktopUpd = function() { 
  var timerId = null;

  $(".redesign-header__upd-menu-item > .redesign-header__menu-item_js_hover").on("mouseenter", function(){
    clearTimeout(timerId);
    $('.redesign-header__upd-menu-submenu').slideUp(0);
    $(this).siblings('.redesign-header__upd-menu-submenu').slideDown(0);
  });
  $(document).on('mouseleave', '.redesign-header__menu', function() {
    timerId = setTimeout(function() {
      $('.redesign-header__upd-menu-submenu').slideUp(0);
    }, 200);
  });

  $(document).on('click',".redirect-click",function(e) {
        window.location = $(this).data('url');
  });
};


var mainMenuTabletUpdAddMore = function() { 
  var $menuLeft = $('.redesign-header__upd-menu-list');
  var menuItems = $menuLeft.find('.redesign-header__menu-item');
  if (menuItems.length > 5) {

    var moreItem = document.createElement('li');
    moreItem.classList = 'redesign-header__upd-menu-item redesign-header__menu-more';
    for (var i = 5; i < menuItems.length; i++) {
      moreItem.innerHTML = '<div class="redesign-header__menu-item redesign-header__menu-item_js_hover"><span>Ещё</span> (<mark>'+ (menuItems.length - 5) + '</mark>)</div>';
    }

    var moreItemSubmenu = document.createElement('div');
    moreItemSubmenu.classList = 'redesign-header__upd-menu-submenu redesign-header__menu-more-submenu js-place-movies';
    for (var i = 5; i < menuItems.length; i++) {
      moreItemSubmenu.appendChild(menuItems.eq(i).attr('class','').addClass('redesign-header__upd-submenu-item redesign-header__upd-submenu-item_more').get(0));      
    }

    moreItem.append(moreItemSubmenu);
    $menuLeft.append(moreItem);

    deleteMainAttr()  
  } else {
    deleteAllAttr()   
  }

};


var mainMenuTabletUpd = function() { 
  var eventType = $('html').hasClass('no-touchscreen') || $('html').hasClass('pc') ? 'click' : 'touchstart';
  $(".redesign-header__upd-menu-item > .redesign-header__menu-item_js_hover").on(eventType, function(){
    if($(this).hasClass('is-active')){
      $(this).removeClass("is-active");
      $(this).siblings('.redesign-header__upd-menu-submenu').slideUp(200);
    } else {
      $(".redesign-header__upd-menu-item > .redesign-header__menu-item_js_hover").removeClass("is-active");
      $(this).addClass("is-active");
      $('.redesign-header__upd-menu-submenu').slideUp(200);
      $(this).siblings('.redesign-header__upd-menu-submenu').slideDown(200);
      }
  });
  // close main menu on body click
  $(document).on(eventType, 'body', function(event) {
    var $target = $(event.target);
    if (!($target.parents('.redesign-header__menu').length) && !($target.hasClass('redesign-header__menu'))) {
     $(".redesign-header__upd-menu-item > .redesign-header__menu-item_js_hover").removeClass("is-active");
     $('.redesign-header__upd-menu-submenu').slideUp(200);
    }
  }); 
};


var mainMenuMobileUpd = function() {
  var eventType = $('html').hasClass('no-touchscreen') || $('html').hasClass('pc') ? 'click' : 'touchend';
  $('.js-open-mobile-menu, .js-mask-mobile-menu, .js-close-mobile-menu').on(eventType, function(event){
    event.preventDefault();
    if($('.js-open-mobile-menu').hasClass('active')){ 
      $('.js-open-mobile-menu').removeClass('active');
      $('.js-mask-mobile-menu').hide();
      $('.js-redesign-header-upd-menu-list').animate({
        left : "-250px"
      },500);
      $('.js-close-mobile-menu').animate({
        left : "-50px"
      },500);
      $('body').css('height','auto');
      $('body').css('width','auto');
      $('body').css('overflow','scroll');
      $('body').css('position','static');     
      $('.redesign-header__menu').css('zIndex','6');
      setTimeout(function(){ $('.redesign-header__menu').css('zIndex','4'); }, 500);
    }
    else{ 
      $('.js-open-mobile-menu').addClass('active');
      $('.js-mask-mobile-menu').show();
      $('.js-redesign-header-upd-menu-list').animate({
        left : "0px"
      },500);
      $('.js-close-mobile-menu').animate({
        left : "270px"
      },500);
      $('body').css('height','100%');
      $('body').css('width','100%');
      $('body').css('overflow','hidden');
      $('body').css('position','fixed');
      $('.redesign-header__menu').css('zIndex', '5');
    }
  });

  /* на короткой шапке ниче не делаем с notices */
  if (!$('.redesign-header').hasClass('redesign-header__short-menu')) {
    $('.redesign-header__menu-right').append($('.redesign-header__notices'));
  }  
 // $('.redesign-header__notices').addClass('is-mobile');
}


/**
 * При открытии/закрытии попапа с историей кликов заменяем текст тултипа по наведению
 */
function changeHistoryWordTooltipText() {
  var tooltip = $(".redesign-header_js_mouse-tooltip-history");
  var lastText = tooltip.attr("data-content");
  var nextText = tooltip.attr("data-content_after_click");

  tooltip.attr("data-content", nextText);
  tooltip.attr("data-content_after_click", lastText);
}

function openPopupHistoryWord(button, popup) {
  if (window.isOpenPopupHistoryWord)
    return false;

  changeHistoryWordTooltipText();

  button.addClass("is-active");
  popup.slideDown(200, function () {
    window.isOpenPopupHistoryWord = true;
  });
}

function closePopupHistoryWord(button, popup){
  if (!window.isOpenPopupHistoryWord)
    return false;

  document.removeEventListener('click', setEventHistory);
  changeHistoryWordTooltipText();
  button.removeClass("is-active");
  popup.slideUp(200, function () {
    window.isOpenPopupHistoryWord = false;
  });
}

//доп проверка на открытость, иначе на мобилках открывает и закрывает одномоментно
window.isOpenPopupHistoryWord = false;
function setEventHistory(e) {
  var $target = $(e.target);
  if(
    !$target.hasClass("js-redesign-header-history-popup")
    && !$target.hasClass("redesign-header_js_mouse-tooltip-history")
    && $target.closest(".js-redesign-header-history-popup").length <= 0
    && $target.closest(".redesign-header_js_mouse-tooltip-history").length <= 0
  ) {
    closePopupHistoryWord($('.js-redesign-header-history-button'), $('.js-redesign-header-history-popup'));
  }
}
/**
 * Открываем/закрываем историю кликов слов (иконка в хедере)
 */
var openHistory = function() {
  var button = $('.js-redesign-header-history-button');
  var popup = $('.js-redesign-header-history-popup');

  $("body").on('click', ".js-redesign-header-history-button, .js-redesign-header-history-popup-close", function(){
    if (button.hasClass('is-active')) {
      closePopupHistoryWord(button, popup);
      if (($('html').hasClass('mobile') && ($('html').hasClass('phone') || $('html').hasClass('iphone'))) || winWidth <= 767 ) {
        $("body").removeClass('noScroll');
      }

    }
    else {
      document.addEventListener('click', setEventHistory);
      //doPreloader(1);
      $.post('/api2/wordClickHistory/getHTMLPopup', {}, function (res) {
        doPreloader(0);
        if(res.status) {
          popup.html(res.response.html);
          openPopupHistoryWord(button, popup);
        }
        else if(res.response.error){
          console.error(res);
          alert(res.response.error);
        }
        else
          alert("Error!");
      }, 'json');
      if (($('html').hasClass('mobile') && ($('html').hasClass('phone') || $('html').hasClass('iphone'))) || winWidth <= 767 ) {
        $("body").addClass('noScroll');
      }
    }
  });
};

var headerMoviesButton = function() {
  var placeMobileMoviesBt = document.createElement('div');
  placeMobileMoviesBt.classList = 'place-mobile-movies-button';
  $('.js-redesign-header-upd-menu-list').append(placeMobileMoviesBt);
  $('.redesign-header').each(function(){
    $(this).find('.place-mobile-movies-button').append($(this).find('.js-header-movies-button'));
  }); 
}

var headerMoviesButtonShort = function() {
  var placeMobileMoviesBt = document.createElement('div');
  placeMobileMoviesBt.classList = 'place-mobile-movies-button-i';
  $('.js-place-movies').append(placeMobileMoviesBt);
  $('.redesign-header').each(function(){
    $(this).find('.place-mobile-movies-button-i').append($(this).find('.js-header-movies-button'));
  }); 
}

var headerVipButton = function() {
  var placeMobileVipBt = document.createElement('div');
  placeMobileVipBt.classList = 'place-mobile-vip-button';
  $('.js-redesign-header-upd-menu-list').prepend(placeMobileVipBt);
  $('.redesign-header').each(function(){
    $(this).find('.place-mobile-vip-button').append($(this).find('.js-menu-vip-btn-short-header'));
  });   
}

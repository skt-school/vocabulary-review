function reloadScript() {
location.reload();
};



function startScript() {


var PuzzleSprint = {
  index: -1,
  max_index: 0,
  level: 0,
  words: {},

  word: {},
  word_ind: 0,

  results: [],
  box: {
    $main: {},
    $word: {},
    $translation: {}
  },
  select_disabled: true,
  score: 0,
  score_total: 0,
  progress: {
    initial: 60,
    added: 0
  },
  $progress_bar: {},
  in_rating: 0,
  adjust_level: 1,
  benefit: {},

  _elapsed_time: 0,
  _elapsed_time_start: 0,
  _request: null,

  _isForeignUser: ['ru', 'en'].indexOf(site_language) === -1, //иностранец?
  _loadIndex: 0, //какой сейчас загружаем индекс фейкового перевода (короче под каким индексом слово)
  _maxRequests: 3, //максимум запросов за раз на получение фейковых переводов
  _countRequests: 0, //кол-во запросов на получение фейкового перевода
  _isFinish: false, //финал? время закончилось?
  _alreadyInit: false, //была ли преждевременная инициализация, чтобы запустить получение переводов
  _countRequestsForNewWord: 0, //сколько сейчас запросов на получение новых слов
  _maxCountRequestsForNewWord: 2, //максимум запросов получения новых слов

  BTN_WRONG: 0,
  BTN_CORRECT: 1,

  waitLoading: false,
  completedWords: {},
  viewedWords: false, //если слово было добавлено в результат, нам не надо еще раз его добавлять
  timeOutEndByLoading: null,

  countSelectWords: 0, //сколько слов всего выбрали

  init: function isInitForeign(isInitForeign) {
    //если инициализируем преждевременно
    if (isInitForeign)
      this._alreadyInit = true;
    //если уже инициализировали преждевременно - не нужно заного это делать
    else if (this._alreadyInit) {
      this.nextWord(true);
      return false;
    }

    this.benefit = new this.Benefit();
    this.box.$main = $('.puzzle-sprint__main__box');
    this.box.$word = $('.puzzle-sprint__word > span');
    this.box.$translation = $('.puzzle-sprint__word_translation > span');
	this.box.$translation2 = $('.puzzle-sprint__word_translation2 > span');
	this.box.$translation3 = $('.puzzle-sprint__word_translation3 > span');
	
    this.$progress_bar = $('.b-progressbar_wrap');

    this.words = window.puzzle_sprint_words || [];
    this.max_index = this.words.length - 1;

    if (typeof this.words[0] === 'undefined') return;
    this._loadTranslate(!!this.words[0][0].isAlreadyTakeFakeTranslation);
    this.correct = 0;

    if (!isInitForeign)
      this.nextWord(true);

    this.setupSettings();
  },


  onSelect: function(btn_type) {
    if (this.select_disabled || this._isFinish || this.waitLoading) {
      console.log('on select', new Date().getTime(), btn_type, this.select_disabled, this._isFinish, this.waitLoading);
      return false;
    }

    if (this.countSelectWords < 1) {
      logExponeaStart(PuzzleSprint.in_rating);
    }

    this.countSelectWords++;

    if (this.countSelectWords === 5)
      sendActivate('words', PuzzleSprint.in_rating ? 'danetka' : 'danetka_dictionary');

    var delay = 300, self = this, cls = '';

    //если не русский и есть запрос
    if (this._isForeignUser && this._request) {
      console.log('has request', this._isForeignUser, this._request);
      return false;
    }

    this.select_disabled = true;
    this._elapsed_time = (+new Date() - this._elapsed_time_start) / 1000;

    if (this.words[ this.level ] && typeof this.words[ this.level ][ this.word_ind ] !== "undefined")
      this.words[ this.level ][ this.word_ind ].shown = 1;
    else {
      for ( var i = this.level; i > -1; i-- ) {
        if (this.words[ i ]) {
          this.level = i;
          this.word_ind = 0;
          break;
        }
      }
    }

    if ((this.word.correct && btn_type === this.BTN_CORRECT)
      || (!this.word.correct && btn_type === this.BTN_WRONG)) {
      cls = 'b-field__body_right';
      this.correct = 1;
    } else {
      cls = 'b-field__body_wrong';
      this.correct = 0;
    }

    if (this.correct) {
      if (storage.get('danetka-sound') === null || storage.get('danetka-sound') == 1) {
        audio.playSound('./media/yes.mp3');
      }
	  
	  this.score = this.score >= 0 && this.score < 10 ? this.score + 1 : 1;
      

      //для не русских всегда лвл будет 0. т.к. по 1 слову получаем за раз
      if (this._isForeignUser)
        this.level = 0;
      else {
        this.level = this.level >= 9 ? this.level : this.level + 1;
        if (this.level > 9)
          this.level = 9;
      }

      this.benefit.correct();
    } else {
      if (storage.get('danetka-sound') === null || storage.get('danetka-sound') == 1) {
        audio.playSound('./media/no.mp3');
      }
      this.score = this.score > 0 ? -1 : this.score - 1;
      this.level = 0;
      this.benefit.wrong();
    }

    if (!this.adjust_level) this.level = 0;

    var key = this.word.word + this.word.visible_translation;
	 var key2 = this.word.word + this.word.visible_translation2;
	 var key3 = this.word.word + this.word.visible_translation3;
    //если слово еще не было добавлено в результат
    if (typeof this.viewedWords[ key ] === "undefined") {
      this.viewedWords[ key ] = 1;
      this.results.push({
        word_id: this.word.id,
        word: this.word.word,
        correct: this.score,
        elapsed_time: this._elapsed_time,
        translation: this.word.translation,
        fake_translation: !this.word.correct ? this.word.visible_translation : '',
		fake_translation2: !this.word.correct ? this.word.visible_translation2 : '',
		fake_translation3: !this.word.correct ? this.word.visible_translation3 : ''
      });

      this.score_total += this.score;
    }

    this.box.$word.parents('.b-field__body').addClass(cls);

    
    $('.b-total-count__num').text(this.score_total);
    $('.b-total-count').find('span').html(localize({l:'point_pluralize',v:this.score_total,t:'first'}));
    self.nextWord();

    setTimeout(function() {  
      self.box.$word.parents('.b-field__body').removeClass('b-field__body_right b-field__body_wrong');
      self.moveProgress();
      self.select_disabled = SprintTimer._duration <= 0;
    }, delay);
  },

  setupSettings: function() {
    var self = this;

    $('#in-sound-support').change(function() {
      this.checked ? storage.set('danetka-sound', 1) : storage.set('danetka-sound', 0);
    });
  },

  onFinish: function() {
    var self = this;
    this._isFinish = true;
  
    $.ajax({
      url: '/',
      method: 'post',
      data: {
        ajax_action: "ajax_sprint_saveRound",
        results: JSON.stringify(this.results),
        in_rating: this.in_rating	
      },
      type: 'json'
    }).done(function(response) {
      if (response.no_credits) {
        location.href = '/no-credits?from=danetka';
        return;
      }
      self.box.$main.fadeTo(500, 0, null, function() {
        var s = '';
        if (self.results.length === 0) s = '/?e';
        if (response.score_id) {
          s = '/?score_id=' + response.score_id + (/(\&|\?)plankey\=/i.test(location.href) ? "&byPlan=1" : "");
        }
        if (response.triggerInvolvingPopup) {
          s += (response.score_id ? ('&taskNum=' + response.taskNum) : ('?taskNum=' + response.taskNum));  
        }

        location.href = self.in_rating ? '/danetka/score' + s : '/words/danetka/score/';
      });
    }).fail(function(xhr, status) {
      console.error('failed', status);
    });

  },

  nextWord: function (isFirstWord) {
    this.index++;
    //если время не закончилось, то мы не имеем права завершать
    if (!this.in_rating && typeof this.words[0][this.index] === 'undefined' && SprintTimer._duration <= 0) {
      this.onFinish();
      return;
    }

    //Randomly select a word. копируем объект, чтобы узнать предыдущее слово
    var lastWord = Object.assign({}, this.word);

    for (var i = Math.floor(Math.random() * puzzle_sprint_words[this.level].length); i < this.words[this.level].length; i++) {
      

      this.word = this.words[this.level][i];
      this.word_ind = i;
      break;
	  
    }
	
    var randomIndex = Math.floor(Math.random() * puzzle_sprint_words[this.level].length);
    var word = this.word.word;
	
	for (var i = 0; i < puzzle_sprint_words[this.level].length; i++)  {
		var random = Math.random(); 
		if (random < 0.7){
		    puzzle_sprint_words[this.level][i].visible_translation = puzzle_sprint_words[this.level][i].translation; 
	        puzzle_sprint_words[this.level][i].visible_translation2 = puzzle_sprint_words[this.level][i].fake_translation;
		    puzzle_sprint_words[this.level][i].visible_translation3 = puzzle_sprint_words[this.level][i].fake_translation2;
			} 
		else {
			puzzle_sprint_words[this.level][i].visible_translation = puzzle_sprint_words[this.level][i].fake_translation;
	        puzzle_sprint_words[this.level][i].visible_translation2 = puzzle_sprint_words[this.level][i].translation;
	        puzzle_sprint_words[this.level][i].visible_translation3 = puzzle_sprint_words[this.level][i].fake_translation2;
		};
	    if (random < 0.7) {
		    puzzle_sprint_words[this.level][i].correct = true
		}
	    else {
			puzzle_sprint_words[this.level][i].correct = false
			};
		if(
      Object.keys(lastWord).length > 0 //обязательно уже было слово до этого
      && lastWord.word == this.word.word
      && this.word.visible_translation == lastWord.visible_translation
    ) {
		
	 this.nextWord(true);
      return false;
	
    }
		}
		
    var visible_translation = this.word.visible_translation;
	var visible_translation2 = this.word.visible_translation2;
	var visible_translation3 = this.word.visible_translation3;
    if (this._isForeignUser && isFirstWord && !this.word.isAlreadyTakeFakeTranslation) {
      word = '';
      visible_translation = '';
	  visible_translation2 = '';
	  visible_translation3 = '';
    }
    this.box.$word.html(word);
    this.box.$translation.text(visible_translation);
	this.box.$translation2.text(visible_translation2);
	this.box.$translation3.text(visible_translation3);
    this.box.$main.data('correct', this.word.correct);

    this._elapsed_time_start = +new Date();
    this.loadNewWords();
  },


  /**
   * Загружаем фейковые переводы для слова
   * @param isFirstWord - если это первое слово, это надо его данные вывести на экран
   * @returns {boolean}
   * @private
   */
  _loadTranslate: function isFirstWord(isFirstWord){
    //если финишь, или рус юзер или запросов итак уже много или же дошли до последнего слова
    if (this._isFinish || !this._isForeignUser || this._countRequests >= this._maxRequests || this._loadIndex > this.words[0].length) {
      //если уже было последнее слово, то загружаем пачку новых слов
      if (this._isForeignUser && this._loadIndex > this.words[0].length)
        this.loadNewWords(true);

      return false;
    }

    //получаем след слово для загрузки
    for (var i = this._loadIndex; i < this.words[0].length; i++ ) {
      if(!this.words[0][i] || this.words[0][i].isAlreadyTakeFakeTranslation)
        continue;

      this._loadIndex = i;
      break;
    }

    //если первое слово, то ставим на паузу, чтобы время не шло
    if (isFirstWord)
      SprintTimer.setPause();

    var word = this.words[0][ this._loadIndex ];
    if (!word || !word.word || word.correct){
      this._loadIndex++;
      this._loadTranslate();
      return false;
    }

    var tempLoadIndex = this._loadIndex;
    var self = this;

    this._loadIndex++;
    this._countRequests++;

    //запускаем сразу следующий запрос на перевод
    this._loadTranslate();

    $.ajax({
      url: "/",
      type: 'POST',
      dataType: 'json',
      data: {
        ajax_action: "ajax_sprint_getFakeTranslate",
        word: word.word,
        translate: word.translation,
        part_of_speech: word.part_of_speech,
      },
      success: function (res) {
        //если первое слово, то разрешаем запуск времени
        if (isFirstWord)
          SprintTimer.setPause(true);

        if (res.status) {

          if (self.words[0][ tempLoadIndex ].fake_translation == self.words[0][ tempLoadIndex ].visible_translation)
            self.words[0][ tempLoadIndex ].visible_translation = res.fakeTranslation;

          self.words[0][ tempLoadIndex ].fake_translation = res.fakeTranslation;
          self.words[0][ tempLoadIndex ].isAlreadyTakeFakeTranslation = true;

          if(self.word_ind == tempLoadIndex){
            self.word = self.words[0][ tempLoadIndex ];
            self.box.$word.text(self.word.word);
            self.box.$translation.text(self.word.visible_translation);
          }
        }
        else
          self.insertDataByWord(tempLoadIndex);

        self._countRequests--;
        self._loadTranslate();
      },
      error: function() {
        if(isFirstWord)
          SprintTimer.setPause(true);

        self.insertDataByWord(tempLoadIndex);

        self._countRequests--;
        self._loadTranslate();
      }
    });
  },

  insertDataByWord: function(tempLoadIndex) {
    //если перевод фейковый не получили, то выводим оригинальный перевод
    this.words[0][ tempLoadIndex ].isAlreadyTakeFakeTranslation = true;
    this.words[0][ tempLoadIndex ].visible_translation = this.words[0][ tempLoadIndex ].translation;
    this.words[0][ tempLoadIndex ].fake_translation = this.words[0][ tempLoadIndex ].translation;
    this.words[0][ tempLoadIndex ].correct = true;

    if(this.word_ind == tempLoadIndex){
      this.word = this.words[0][ tempLoadIndex ];
      this.box.$word.text(this.word.word);
      this.box.$translation.text(this.word.visible_translation);
      this.box.$main.data('correct', this.word.correct);
    }
  },

  moveProgress: function() {
    var firstDisabledItem = this.$progress_bar.find('.is-disabled:first'), addTime = 0, self = this;

    $('.b-progressbar__item').find('small').text('');

    if (this.correct) {
      firstDisabledItem.removeClass('is-disabled');
      firstDisabledItem.find('small').text(this.correct ? '+' + this.score : '0');
      this.elemToTarget(firstDisabledItem, $('.b-total-count__num'), 800, 'right');

      if (firstDisabledItem.next('.b-progressbar__circle:not(.is-done)').length) {
        this.elemToTarget(firstDisabledItem.next('.b-progressbar__circle'), $('.b-timer__num'), 800, '', 1);
        firstDisabledItem.next('.b-progressbar__circle').addClass('is-done');
        addTime = firstDisabledItem.next('.b-progressbar__circle').data('time');

        // setTimeout(function() {
        self.benefit.buildBenefitBar();
        // }, 50);
      }
    } else {
      if (firstDisabledItem.prev('.b-progressbar__circle.is-done').length) {
        firstDisabledItem.prev('.b-progressbar__circle').removeClass('is-done');
      } else {
        firstDisabledItem.prevAll('.b-progressbar__item').addClass('is-disabled');
      }
    }

    this.results[this.results.length - 1].benefit = addTime;

    this.progress.added += addTime;
    SprintTimer.addTime(addTime);
    this.updateTimer($('div.b-timer__num').data('time') + addTime);
  },

  elemToTarget: function(elem, target, duration, trend) {
    if (elem.length === 0) return;

    var newElem = (elem.clone());
    var startAngle, endAngle;
    duration = duration || 600;

    switch (trend) {
      case 'left':
        startAngle = '33';
        endAngle = '331';
        break;

      case 'right':
        startAngle = '30';
        endAngle = '30';
        break;

      default:
        startAngle = '33';
        endAngle = '331';
        break;
    }

    newElem.css({
      position: 'absolute',
      zIndex: '9999',
      transform: 'scale(1.5)',
      left: elem.offset().left,
      top: elem.offset().top
    });
    $('body').append(newElem);

    var path = {
      start: {
        x: elem.offset().left,
        y: elem.offset().top,
        angle: startAngle,
        length: 0.611
      },
      end: {
        x: target.offset().left,
        y: target.offset().top,
        angle: endAngle,
        length: 0.567
      }
    };

    newElem.animate({
        path: new $.path.bezier(path),
        opacity: .2
      }, duration, function() {
        newElem.remove()
      }
    );

  },

  updateTimer: function(timeLeft) {
    var $svgWatch = $('.b-timer__watch-svg'), tickCoef;

    tickCoef = 1.232 / ((30 + this.progress.added) / 30);
    var fill = 100 - ((30 + this.progress.added) - timeLeft) * tickCoef;

    $('div.b-timer__num').data('time', timeLeft).text(timeLeft);
    $svgWatch.data('fill', fill);
    $('.b-timer__watch-svg-fill').css('stroke-dashoffset', $svgWatch.data('fill') + '%');
  },

 
  /**
   * Загружаем новые слова
   * @param isNeedLoad - true: обязательно загрузить слова, если это не рус данетка
   * @returns {boolean}
   */
  loadNewWords: function loadNewWords(isNeedLoad) {
    var i, level = 0, unshown = 0, exclude = [], levels = [], self = this;
    var levels_count = Object.keys(this.words).length;

    if (isNeedLoad && this._isForeignUser) {
      this._countRequestsForNewWord++;
      //преждевременно можем загрузить только 2 раза, т.к. юзер и до них может не дойти
      if(this._countRequestsForNewWord > this._maxCountRequestsForNewWord)
        return false;

      levels.push(0);
      for (i = 0; i < this.words[0].length; i++)
        exclude.push(this.words[0][i].id);
    }
    else {
      for (level; level < levels_count; level++) {
        if (typeof this.words[level] !== 'undefined') {
          for (i = 0; i < this.words[level].length; i++) {
            if (!this.words[level][i].shown) unshown++;

            exclude.push(this.words[level][i].id);
          }
        } else {
          this.words[level] = [];
        }

        var countWords = this._isForeignUser ? 10 : 5;
        if (unshown <= countWords) levels.push(level);
        unshown = 0;
      }
    }

    if (levels.length > 0) {
      if (this._request) return;

      console.log('start request', new Date().getTime(), levels);

      this._request = $.ajax({
        url: '/',
        type: 'post',
        data: {
          ajax_action: "ajax_sprint_loadNewWords",
          levels: levels,
          exclude: JSON.stringify(exclude),
          in_rating: this.in_rating
        },
        success: function(response) {
          console.log('end request', new Date().getTime());
          //если стоял таймер окончания тренировки (если запрос долгий) - сбрасываем его
          self.clearTimeoutRequest();

          var isWasOnPause = SprintTimer.isPause();
          if(isWasOnPause)
            SprintTimer.setPause(true);

          self._request = null;

          

          for (var level in response) {
            if (response.hasOwnProperty(level)) {
              self.words[level] = self.words[level].concat(response[level]);
              //загружаем переводы слов для полученных слов (если это не рус данетка)
              self._loadTranslate();
            }
          }

          //если было на паузе, то нужно продолжить показывать следующее слово
          if (isWasOnPause) {
            self.waitLoading = false;
            self.nextWord();
          }
        }
      }).fail(function(xhr, status) {
        console.log('error request', new Date().getTime());
        console.error('failed', status);
        self.clearTimeoutRequest();
        self.showEndWordsPopup();
      });
    }
  },

  /**
   * Очищаем setTimeout и убираем "загрузку на весь экран"
   */
  clearTimeoutRequest: function(){
    doPreloader(0);
    if (this.timeOutEndByLoading) {
      clearTimeout(this.timeOutEndByLoading);
      this.timeOutEndByLoading = null;
    }
  },

  Benefit: function() {
    this.correct = function() {
      this.correct_consecutive++;
      if (this.correct_consecutive === this.values[this.stage].w) {
        this.stage = this.stage >= maxStage ? maxStage : this.stage + 1;
        this.correct_consecutive = 0;
      }
    };

    this.wrong = function() {
      this.correct_consecutive = 0;
    };

    this.buildBenefitBar = function() {
      if (this.correct_consecutive > 0) return;

      $wrapper.html('');
      for (var i = 0; i < this.values[this.stage].w; i++) {
        $wrapper.append($square_template);
      }
      var $_circle = $($circle_template).clone();
      $_circle.text('+' + this.values[this.stage].t + ' sec');
      $_circle.data('time', this.values[this.stage].t);

      $wrapper.append($_circle);
    };

    var $wrapper = $('.b-progressbar_wrap'),
      $square_template = '<div class="b-progressbar__item is-disabled"><small></small></div>',
      $circle_template = '<div class="b-progressbar__circle" data-time="0">0</div>';

    this.values = [
      {w: 3, t: 1},
      {w: 4, t: 2},
      {w: 5, t: 3},
      {w: 6, t: 4},
      {w: 7, t: 5},
	  {w: 8, t: 4},
	  {w: 9, t: 3},
	  {w: 10, t: 2},
	  {w: 11, t: 1}
    ];

    this.stage = 0;
    this.correct_consecutive = 0;

    var maxStage = this.values.length - 1;

    this.buildBenefitBar();
  }
};

/////////////////////////////////
/////////////////////////////////
////////////////////////////////

var PuzzleSprint2 = {
  index: -1,
  max_index: 0,
  level: 0,
  words: {},

  word: {},
  word_ind: 0,

  results: [],
  box: {
    $main: {},
    $word: {},
    $translation: {}
  },
  select_disabled: true,
  score: 0,
  score_total: 0,
  progress: {
    initial: 60,
    added: 0
  },
  $progress_bar: {},
  in_rating: 0,
  adjust_level: 1,
  benefit: {},

  _elapsed_time: 0,
  _elapsed_time_start: 0,
  _request: null,

  _isForeignUser: ['ru', 'en'].indexOf(site_language) === -1, //иностранец?
  _loadIndex: 0, //какой сейчас загружаем индекс фейкового перевода (короче под каким индексом слово)
  _maxRequests: 3, //максимум запросов за раз на получение фейковых переводов
  _countRequests: 0, //кол-во запросов на получение фейкового перевода
  _isFinish: false, //финал? время закончилось?
  _alreadyInit: false, //была ли преждевременная инициализация, чтобы запустить получение переводов
  _countRequestsForNewWord: 0, //сколько сейчас запросов на получение новых слов
  _maxCountRequestsForNewWord: 2, //максимум запросов получения новых слов

  BTN_WRONG: 0,
  BTN_CORRECT: 1,

  waitLoading: false,
  completedWords: {},
  viewedWords: false, //если слово было добавлено в результат, нам не надо еще раз его добавлять
  timeOutEndByLoading: null,

  countSelectWords: 0, //сколько слов всего выбрали

  init: function(isInitForeign) {
    //если инициализируем преждевременно
    if (isInitForeign)
      this._alreadyInit = true;
    //если уже инициализировали преждевременно - не нужно заного это делать
    else if (this._alreadyInit) {
      this.nextWord(true);
      return false;
    }

    this.benefit = new this.Benefit();
    this.box.$main = $('.puzzle-sprint2__main__box');
    this.box.$word = $('.puzzle-sprint2__word > span');
    this.box.$translation = $('.puzzle-sprint2__word_translation > span');
	this.box.$translation2 = $('.puzzle-sprint2__word_translation2 > span');
	this.box.$translation3 = $('.puzzle-sprint2__word_translation3 > span');
    this.$progress_bar = $('.b-progressbar_wrap2');

   
    this.words = window.puzzle_sprint_words2 || [];
    this.max_index = this.words.length - 1;

    if (typeof this.words[0] === 'undefined') return;
    this._loadTranslate(!!this.words[0][0].isAlreadyTakeFakeTranslation);
    this.correct = 0;

    if (!isInitForeign)
      this.nextWord(true);

    this.setupSettings();
  },

  onSelect: function(btn_type) {
    if (this.select_disabled || this._isFinish || this.waitLoading) {
      console.log('on select', new Date().getTime(), btn_type, this.select_disabled, this._isFinish, this.waitLoading);
      return false;
    }

    if (this.countSelectWords < 1) {
      logExponeaStart(PuzzleSprint.in_rating);
    }

    this.countSelectWords++;

    if (this.countSelectWords === 5)
      sendActivate('words', PuzzleSprint.in_rating ? 'danetka' : 'danetka_dictionary');

    var delay = 300, self = this, cls = '';

    //если не русский и есть запрос
    if (this._isForeignUser && this._request) {
      console.log('has request', this._isForeignUser, this._request);
      return false;
    }

    this.select_disabled = true;
    this._elapsed_time = (+new Date() - this._elapsed_time_start) / 1000;

    if (this.words[ this.level ] && typeof this.words[ this.level ][ this.word_ind ] !== "undefined")
      this.words[ this.level ][ this.word_ind ].shown = 1;
    else {
      for ( var i = this.level; i > -1; i-- ) {
        if (this.words[ i ]) {
          this.level = i;
          this.word_ind = 0;
          break;
        }
      }
    }

    if ((this.word.correct && btn_type === this.BTN_CORRECT)
      || (!this.word.correct && btn_type === this.BTN_WRONG)) {
      cls = 'b-field__body_right';
      this.correct = 1;
    } else {
      cls = 'b-field__body_wrong';
      this.correct = 0;
    }

    if (this.correct) {
      if (storage.get('danetka-sound') === null || storage.get('danetka-sound') == 1) {
        audio.playSound('./media/yes.mp3');
      }
      this.score = this.score >= 0 && this.score < 10 ? this.score + 1 : 1;

      //для не русских всегда лвл будет 0. т.к. по 1 слову получаем за раз
      if (this._isForeignUser)
        this.level = 0;
      else {
        this.level = this.level >= 9 ? this.level : this.level + 1;
        if (this.level > 9)
          this.level = 9;
      }

      this.benefit.correct();
    } else {
      if (storage.get('danetka-sound') === null || storage.get('danetka-sound') == 1) {
        audio.playSound('./media/no.mp3');
      }
      this.score = this.score > 0 ? -1 : this.score - 1;
      this.level = 0;
      this.benefit.wrong();
    }

    if (!this.adjust_level) this.level = 0;

    var key = this.word.word + this.word.visible_translation;
	var key2 = this.word.word + this.word.visible_translation2;
	var key3 = this.word.word + this.word.visible_translation3;
    //если слово еще не было добавлено в результат
    if (typeof this.viewedWords[ key ] === "undefined") {
      this.viewedWords[ key ] = 1;
      this.results.push({
        word_id: this.word.id,
        word: this.word.word,
        correct: this.score,
        elapsed_time: this._elapsed_time,
        translation: this.word.translation,
        fake_translation: !this.word.correct ? this.word.visible_translation : '',
		fake_translation2: !this.word.correct ? this.word.visible_translation2 : '',
		fake_translation3: !this.word.correct ? this.word.visible_translation3 : ''
      });

      this.score_total += this.score;
    }

    this.box.$word.parents('.b-field__body').addClass(cls);

    
    $('.b-total-count__num2').text(this.score_total);
    $('.b-total-count').find('span').html(localize({l:'point_pluralize',v:this.score_total,t:'first'}));
    self.nextWord();

    setTimeout(function() {
      self.box.$word.parents('.b-field__body').removeClass('b-field__body_right b-field__body_wrong');
      self.moveProgress();
      self.select_disabled = SprintTimer._duration <= 0;
    }, delay);
  },

  setupSettings: function() {
    var self = this;

    $('#in-sound-support').change(function() {
      this.checked ? storage.set('danetka-sound', 1) : storage.set('danetka-sound', 0);
    });
  },

  onFinish: function() {
    var self = this;
    this._isFinish = true;

    $.ajax({
      url: '/',
      method: 'post',
      data: {
        ajax_action: "ajax_sprint_saveRound",
        results: JSON.stringify(this.results),
        in_rating: this.in_rating
      },
      type: 'json'
    }).done(function(response) {
      if (response.no_credits) {
        location.href = '/no-credits?from=danetka';
        return;
      }
      self.box.$main.fadeTo(500, 0, null, function() {
        var s = '';
        if (self.results.length === 0) s = '/?e';
        if (response.score_id) {
          s = '/?score_id=' + response.score_id + (/(\&|\?)plankey\=/i.test(location.href) ? "&byPlan=1" : "");
        }
        if (response.triggerInvolvingPopup) {
          s += (response.score_id ? ('&taskNum=' + response.taskNum) : ('?taskNum=' + response.taskNum));
        }

        location.href = self.in_rating ? '/danetka/score' + s : '/words/danetka/score/';
      });
    }).fail(function(xhr, status) {
      console.error('failed', status);
    });
  },

  nextWord: function(isFirstWord) {
    this.index++;
    //если время не закончилось, то мы не имеем права завершать
    if (!this.in_rating && typeof this.words[0][this.index] === 'undefined' && SprintTimer._duration <= 0) {
      this.onFinish();
      return;
    }

    //Randomly select a word. копируем объект, чтобы узнать предыдущее слово
    var lastWord = Object.assign({}, this.word);

    for (var i = Math.floor(Math.random() * puzzle_sprint_words2[this.level].length); i < this.words[this.level].length; i++) {
      

      this.word = this.words[this.level][i];
      this.word_ind = i;
      break;
	  
    }
	
    var randomIndex = Math.floor(Math.random() * puzzle_sprint_words2[this.level].length);
    var word = this.word.word;
	
    	for (var i = 0; i < puzzle_sprint_words2[this.level].length; i++)  {
		var random = Math.random(); 
		if (random < 0.7){
		    puzzle_sprint_words2[this.level][i].visible_translation = puzzle_sprint_words2[this.level][i].translation; 
	        puzzle_sprint_words2[this.level][i].visible_translation2 = puzzle_sprint_words2[this.level][i].fake_translation;
		    puzzle_sprint_words2[this.level][i].visible_translation3 = puzzle_sprint_words2[this.level][i].fake_translation2;
			} 
		else {
			puzzle_sprint_words2[this.level][i].visible_translation = puzzle_sprint_words2[this.level][i].fake_translation;
	        puzzle_sprint_words2[this.level][i].visible_translation2 = puzzle_sprint_words2[this.level][i].translation;
	        puzzle_sprint_words2[this.level][i].visible_translation3 = puzzle_sprint_words2[this.level][i].fake_translation2;
		};
	    if (random < 0.7) {
		    puzzle_sprint_words2[this.level][i].correct = true
		}
	    else {
			puzzle_sprint_words2[this.level][i].correct = false
			};
		if(
      Object.keys(lastWord).length > 0 //обязательно уже было слово до этого
      && lastWord.word == this.word.word
      && this.word.visible_translation == lastWord.visible_translation
    ) {
		
	 this.nextWord(true);
      return false;
	
    }
		}

    var visible_translation = this.word.visible_translation;
	var visible_translation2 = this.word.visible_translation2;
	var visible_translation3 = this.word.visible_translation3;
    if (this._isForeignUser && isFirstWord && !this.word.isAlreadyTakeFakeTranslation) {
      word = '';
      visible_translation = '';
	  visible_translation2 = '';
	  visible_translation3 = '';
    }
    this.box.$word.html(word);
    this.box.$translation.text(visible_translation);
	this.box.$translation2.text(visible_translation2);
	this.box.$translation3.text(visible_translation3);
    this.box.$main.data('correct', this.word.correct);

    this._elapsed_time_start = +new Date();
    this.loadNewWords();
  },

  /**
   * Загружаем фейковые переводы для слова
   * @param isFirstWord - если это первое слово, это надо его данные вывести на экран
   * @returns {boolean}
   * @private
   */
  _loadTranslate: function(isFirstWord){
    //если финишь, или рус юзер или запросов итак уже много или же дошли до последнего слова
    if (this._isFinish || !this._isForeignUser || this._countRequests >= this._maxRequests || this._loadIndex > this.words[0].length) {
      //если уже было последнее слово, то загружаем пачку новых слов
      if (this._isForeignUser && this._loadIndex > this.words[0].length)
        this.loadNewWords(true);

      return false;
    }

    //получаем след слово для загрузки
    for (var i = this._loadIndex; i < this.words[0].length; i++ ) {
      if(!this.words[0][i] || this.words[0][i].isAlreadyTakeFakeTranslation)
        continue;

      this._loadIndex = i;
      break;
    }

    //если первое слово, то ставим на паузу, чтобы время не шло
    if (isFirstWord)
      SprintTimer.setPause();

    var word = this.words[0][ this._loadIndex ];
    if (!word || !word.word || word.correct){
      this._loadIndex++;
      this._loadTranslate();
      return false;
    }

    var tempLoadIndex = this._loadIndex;
    var self = this;

    this._loadIndex++;
    this._countRequests++;

    //запускаем сразу следующий запрос на перевод
    this._loadTranslate();

    $.ajax({
      url: "/",
      type: 'POST',
      dataType: 'json',
      data: {
        ajax_action: "ajax_sprint_getFakeTranslate",
        word: word.word,
        translate: word.translation,
        part_of_speech: word.part_of_speech,
      },
      success: function (res) {
        //если первое слово, то разрешаем запуск времени
        if (isFirstWord)
          SprintTimer.setPause(true);

        if (res.status) {

          if (self.words[0][ tempLoadIndex ].fake_translation == self.words[0][ tempLoadIndex ].visible_translation)
            self.words[0][ tempLoadIndex ].visible_translation = res.fakeTranslation;

          self.words[0][ tempLoadIndex ].fake_translation = res.fakeTranslation;
          self.words[0][ tempLoadIndex ].isAlreadyTakeFakeTranslation = true;

          if(self.word_ind == tempLoadIndex){
            self.word = self.words[0][ tempLoadIndex ];
            self.box.$word.text(self.word.word);
            self.box.$translation.text(self.word.visible_translation);
          }
        }
        else
          self.insertDataByWord(tempLoadIndex);

        self._countRequests--;
        self._loadTranslate();
      },
      error: function() {
        if(isFirstWord)
          SprintTimer.setPause(true);

        self.insertDataByWord(tempLoadIndex);

        self._countRequests--;
        self._loadTranslate();
      }
    });
  },

  insertDataByWord: function(tempLoadIndex) {
    //если перевод фейковый не получили, то выводим оригинальный перевод
    this.words[0][ tempLoadIndex ].isAlreadyTakeFakeTranslation = true;
    this.words[0][ tempLoadIndex ].visible_translation = this.words[0][ tempLoadIndex ].translation;
    this.words[0][ tempLoadIndex ].fake_translation = this.words[0][ tempLoadIndex ].translation;
    this.words[0][ tempLoadIndex ].correct = true;

    if(this.word_ind == tempLoadIndex){
      this.word = this.words[0][ tempLoadIndex ];
      this.box.$word.text(this.word.word);
      this.box.$translation.text(this.word.visible_translation);
      this.box.$main.data('correct', this.word.correct);
    }
  },

  moveProgress: function() {
    var firstDisabledItem = this.$progress_bar.find('.is-disabled:first'), addTime = 0, self = this;

    $('.b-progressbar__item').find('small').text('');

    if (this.correct) {
      firstDisabledItem.removeClass('is-disabled');
      firstDisabledItem.find('small').text(this.correct ? '+' + this.score : '0');
      this.elemToTarget(firstDisabledItem, $('.b-total-count__num2'), 800, 'right');

      if (firstDisabledItem.next('.b-progressbar__circle:not(.is-done)').length) {
        this.elemToTarget(firstDisabledItem.next('.b-progressbar__circle'), $('.b-timer__num'), 800, '', 1);
        firstDisabledItem.next('.b-progressbar__circle').addClass('is-done');
        addTime = firstDisabledItem.next('.b-progressbar__circle').data('time');

        // setTimeout(function() {
        self.benefit.buildBenefitBar();
        // }, 50);
      }
    } else {
      if (firstDisabledItem.prev('.b-progressbar__circle.is-done').length) {
        firstDisabledItem.prev('.b-progressbar__circle').removeClass('is-done');
      } else {
        firstDisabledItem.prevAll('.b-progressbar__item').addClass('is-disabled');
      }
    }

    this.results[this.results.length - 1].benefit = addTime;

    this.progress.added += addTime;
    SprintTimer.addTime(addTime);
    this.updateTimer($('div.b-timer__num').data('time') + addTime);
  },

/* animated points*/
  elemToTarget: function(elem, target, duration, trend) {
    if (elem.length === 0) return;

    var newElem = (elem.clone());
    var startAngle, endAngle;
    duration = duration || 600;

    switch (trend) {
      case 'left':
        startAngle = '33';
        endAngle = '331';
        break;

      case 'right':
        startAngle = '30';
        endAngle = '30';
        break;

      default:
        startAngle = '33';
        endAngle = '331';
        break;
    }
    
    newElem.css({
      position: 'absolute',
      zIndex: '9999',
      transform: 'scale(1.5)',
      left: elem.offset().left,
      top: elem.offset().top
    });
    $('body').append(newElem);

    var path = {
      start: {
        x: elem.offset().left,
        y: elem.offset().top,
        angle: startAngle,
        length: 0.611
      },
      end: {
        x: target.offset().left,
        y: target.offset().top,
        angle: endAngle,
        length: 0.567
      }
    };

    newElem.animate({
        path: new $.path.bezier(path),
        opacity: .2
      }, duration, function() {
        newElem.remove()
      }
    );

  },

  updateTimer: function(timeLeft) {
    var $svgWatch = $('.b-timer__watch-svg'), tickCoef;

    tickCoef = 1.232 / ((30 + this.progress.added) / 30);
    var fill = 100 - ((30 + this.progress.added) - timeLeft) * tickCoef;

    $('div.b-timer__num').data('time', timeLeft).text(timeLeft);
    $svgWatch.data('fill', fill);
    $('.b-timer__watch-svg-fill').css('stroke-dashoffset', $svgWatch.data('fill') + '%');
  },

 

  /*
   * Загружаем новые слова
   * @param isNeedLoad - true: обязательно загрузить слова, если это не рус данетка
   * @returns {boolean}
   */
  loadNewWords: function(isNeedLoad) {
    var i, level = 0, unshown = 0, exclude = [], levels = [], self = this;
    var levels_count = Object.keys(this.words).length;

    if (isNeedLoad && this._isForeignUser) {
      this._countRequestsForNewWord++;
      //преждевременно можем загрузить только 2 раза, т.к. юзер и до них может не дойти
      if(this._countRequestsForNewWord > this._maxCountRequestsForNewWord)
        return false;

      levels.push(0);
      for (i = 0; i < this.words[0].length; i++)
        exclude.push(this.words[0][i].id);
    }
    else {
      for (level; level < levels_count; level++) {
        if (typeof this.words[level] !== 'undefined') {
          for (i = 0; i < this.words[level].length; i++) {
            if (!this.words[level][i].shown) unshown++;

            exclude.push(this.words[level][i].id);
          }
        } else {
          this.words[level] = [];
        }

        var countWords = this._isForeignUser ? 10 : 5;
        if (unshown <= countWords) levels.push(level);
        unshown = 0;
      }
    }

    if (levels.length > 0) {
      if (this._request) return;

      console.log('start request', new Date().getTime(), levels);

      this._request = $.ajax({
        url: '/',
        type: 'post',
        data: {
          ajax_action: "ajax_sprint_loadNewWords",
          levels: levels,
          exclude: JSON.stringify(exclude),
          in_rating: this.in_rating
        },
        success: function(response) {
          console.log('end request', new Date().getTime());
          //если стоял таймер окончания тренировки (если запрос долгий) - сбрасываем его
          self.clearTimeoutRequest();

          var isWasOnPause = SprintTimer.isPause();
          if(isWasOnPause)
            SprintTimer.setPause(true);

          self._request = null;

          

          for (var level in response) {
            if (response.hasOwnProperty(level)) {
              self.words[level] = self.words[level].concat(response[level]);
              //загружаем переводы слов для полученных слов (если это не рус данетка)
              self._loadTranslate();
            }
          }

          //если было на паузе, то нужно продолжить показывать следующее слово
          if (isWasOnPause) {
            self.waitLoading = false;
            self.nextWord();
          }
        }
      }).fail(function(xhr, status) {
        console.log('error request', new Date().getTime());
        console.error('failed', status);
        self.clearTimeoutRequest();
        self.showEndWordsPopup();
      });
    }
  },

  /**
   * Очищаем setTimeout и убираем "загрузку на весь экран"
   */
  clearTimeoutRequest: function(){
    doPreloader(0);
    if (this.timeOutEndByLoading) {
      clearTimeout(this.timeOutEndByLoading);
      this.timeOutEndByLoading = null;
    }
  },

  Benefit: function() {
    this.correct = function() {
      this.correct_consecutive++;
      if (this.correct_consecutive === this.values[this.stage].w) {
        this.stage = this.stage >= maxStage ? maxStage : this.stage + 1;
        this.correct_consecutive = 0;
      }
    };

    this.wrong = function() {
      this.correct_consecutive = 0;
    };

    this.buildBenefitBar = function() {
      if (this.correct_consecutive > 0) return;

      $wrapper.html('');
      for (var i = 0; i < this.values[this.stage].w; i++) {
        $wrapper.append($square_template);
      }
      var $_circle = $($circle_template).clone();
      $_circle.text('+' + this.values[this.stage].t + ' sec');
      $_circle.data('time', this.values[this.stage].t);

      $wrapper.append($_circle);
    };

    var $wrapper = $('.b-progressbar_wrap2'),
      $square_template = '<div class="b-progressbar__item is-disabled"><small></small></div>',
      $circle_template = '<div class="b-progressbar__circle" data-time="0">0</div>';

    this.values = [
      {w: 3, t: 1},
      {w: 4, t: 2},
      {w: 5, t: 3},
      {w: 6, t: 4},
      {w: 7, t: 5},
	  {w: 8, t: 4},
	  {w: 9, t: 3},
	  {w: 10, t: 2},
	  {w: 11, t: 1}
    ];

    this.stage = 0;
    this.correct_consecutive = 0;

    var maxStage = this.values.length - 1;

    this.buildBenefitBar();
  }
};



///////////////////////////
//////////////////////////////
/////////////////////////////



/**
 * Загружаем рейтинг
 * @param period
 * @param count
 * @param id
 * @param callback
 */
function setRating(period, count, id, callback) {
  ( function() {  
  }, 'json');
}

/**
 * Нажимаем на переключение табов у рейтинга
 * @param self
 * @param id
 * @param period
 */
function changeActiveTabs(self, id, period) {
  $('.du_rating').hide();
  $('.mind-battle__rating__header__element').removeClass('is-active');
  $('#' + id).show();
  $(self).addClass('is-active');

  var isLoaded = $(self).attr("data-is_loaded");
  //если не загружен рейтинг
  if (isLoaded == 0) {
    setRating(period, 3, id, function () {
      $(self).attr("data-is_loaded", 1);
      $('#' + id + " .j-sprint_top100_rating").show();
    });
  }
}

var SprintTimer;
$(function() {

  if (!/danetka\/score/i.test(location.href)) {
    setRating(1, 3, "du_rating_day", function () {
      $("#du_rating_day .j-sprint_top100_rating").show();
    });
  }


  var $body = $('body');

  $body.on('click', '.j-sprint_top100_rating', function () {
    var period = $('.mind-battle__rating__header__element.is-active').data('period');
    var self = $(this);

    var lastText = self.find("span").html();
    self.find("span").html("Loading...");
    var id = $('.mind-battle__rating__header__element.is-active').data('id');

    setRating(period, 100, id, function () {
      self.hide();
      self.find("span").html(lastText);
    });
  });

  if (typeof window.sprint_score_page !== 'undefined') return;
  
  
  var selectedTime = document.getElementById('dropdownMenu').value;
  var timer;
  if (selectedTime == 30){timer = 31}
  else if (selectedTime == 45){timer = 46}
  else if (selectedTime == 60){timer = 61}
  else {timer = 31};

  SprintTimer = new Timer({
    duration: timer,
    onTimeEnd: function(onTimeEnd) {
	  var spanElement = document.getElementById('buttons');
	  var spanElement2 = document.getElementById('buttons2');
	  var spanElement3 = document.getElementById('blue-team');
	  var spanElement4 = document.getElementById('red-team');
      var number1 = parseInt(document.getElementById('total-num').innerText);
      var number2 = parseInt(document.getElementById('total-num2').innerText);
      var targetDiv1 = document.getElementById('finish_picture_1');
	  var targetDiv2 = document.getElementById('finish_picture_2');
	  var finalAudio = new Audio('./media/finish.mp3');	
	  var imageElement = document.createElement('img');
	  var imageElement_2 = document.createElement('img');
      var imageElement1 = document.createElement('img');
	  var imageElement2 = document.createElement('img');
	  var imageElement3 = document.createElement('img');
	  var imageElement4 = document.createElement('img');   
	  var clockElement = document.getElementById('b-sprint__clock');
	  var clockElement2 = document.getElementById('b-timer');
	  var totalResult = number1 + number2;
	  var totalScore = document.createElement("div");
	  var wordGame = document.getElementById('word-game');
	  var wordGame2 = document.getElementById('word-game2');
	  
	  totalScore.id = 'totalScore';
	  totalScore.className = 'total-score';
	  totalScore.textContent = `Total: ${totalResult}`;	  
	  
	  wordGame.classList.remove('b-field__body_right', 'b-field__body_wrong');
	  wordGame2.classList.remove('b-field__body_right', 'b-field__body_wrong');	
	  finalAudio.play();
	  imageElement.src = './media/Blue-team.png';
	  imageElement_2.src = './media/Red-team.png';
	  imageElement1.src = './media/victory.gif';
	  imageElement2.src = './media/defeat.gif';
	  imageElement3.src = './media/draw.gif';
	  imageElement4.src = './media/draw.gif';
	  imageElement.height = 150; 
	  imageElement_2.height = 150;
      imageElement1.height = 150; imageElement1.width = 350; 	  
      imageElement2.height = 150; imageElement2.width = 350; 
      imageElement3.height = 150; imageElement2.width = 350; 	
      
	  clockElement2.parentNode.replaceChild(totalScore, clockElement2);

	  spanElement.parentNode.removeChild(spanElement);
	  spanElement2.parentNode.removeChild(spanElement2);
	  spanElement3.parentNode.replaceChild(imageElement, spanElement3);
	  spanElement4.parentNode.replaceChild(imageElement_2, spanElement4);
      PuzzleSprint.select_disabled = true;  
	  PuzzleSprint2.select_disabled = true;  
     if (number1 > number2) {
	  targetDiv1.appendChild(imageElement1);
	  targetDiv2.appendChild(imageElement2);}
     if (number1 < number2) {  
	  targetDiv1.appendChild(imageElement2);
	  targetDiv2.appendChild(imageElement1);}		  
	  if (number1 === number2) {
	  targetDiv1.appendChild(imageElement3);
	  targetDiv2.appendChild(imageElement4);}       
    }, 
    onTick: function(timeLeft) {
      PuzzleSprint.updateTimer(timeLeft);
	  PuzzleSprint2.updateTimer(timeLeft);
    }
  });

  // setTimeout(function(){SprintTimer.stop()}, 0);

  if (window.new_game) sprint_startGame();

  
  
  
  
  $body.on('click', '.j-play_sprint', function() {
    sprint_startGame();
  });

  $body.on('click', '.j-puzzle_sprint_btn', function() {
    if (PuzzleSprint.select_disabled || PuzzleSprint.waitLoading) {
      console.log('click', PuzzleSprint.select_disabled, PuzzleSprint.waitLoading);
      return false;
    }
    PuzzleSprint.onSelect(parseInt($(this).data('correct')));
  });



  
  
  
$body.on('click', '.j-puzzle_sprint2_btn', function() {
    if (PuzzleSprint2.select_disabled || PuzzleSprint2.waitLoading) {
      console.log('click', PuzzleSprint2.select_disabled, PuzzleSprint2.waitLoading);
      return false;
    }

    PuzzleSprint2.onSelect(parseInt($(this).data('correct')));
  });
  
  
  $body.keydown(function(e) {
    if (PuzzleSprint.select_disabled || PuzzleSprint.waitLoading) {
      console.log('keydown', e.keyCode, PuzzleSprint.select_disabled, PuzzleSprint.waitLoading);
      return false;
    }

	
	
    if (e.keyCode == 37) { // left
      PuzzleSprint.onSelect(1);
    } else if (e.keyCode == 39) { // right
      PuzzleSprint.onSelect(0);
    }
  });

  $(window).blur(function() {
    
  });

  doInitForForeignUser();
});


function doInitForForeignUser() {
  
  PuzzleSprint.init(true);
  PuzzleSprint2.init(true);
}

function sprint_startGame() {
  
  if (!window.danetka_allowed) {
    location.href = '/no-credits?from=danetka';
    return;
  }
  $('#sprint-front').hide();
  $('#sprint-game').show();

  PuzzleSprint.init();
  PuzzleSprint.select_disabled = false;
  PuzzleSprint.in_rating = typeof window.in_rating !== 'undefined' ? parseInt(window.in_rating) : 0;
  PuzzleSprint.adjust_level = typeof window.adjust_level !== 'undefined' ? parseInt(window.adjust_level) : 1;
  PuzzleSprint.box.$main.fadeTo(300, 1);

PuzzleSprint2.init();
  PuzzleSprint2.select_disabled = false;
  PuzzleSprint2.in_rating = typeof window.in_rating !== 'undefined' ? parseInt(window.in_rating) : 0;
  PuzzleSprint2.adjust_level = typeof window.adjust_level !== 'undefined' ? parseInt(window.adjust_level) : 1;
  PuzzleSprint2.box.$main.fadeTo(300, 1);
  
  SprintTimer.start();
}

function logExponeaStart(in_rating) {
  $.post('/', {
    ajax_action: 'ajax_log_danetka_start',
    by_vocabulary: in_rating ? 'false' : 'true',
  });
}


}



(function ( $ ) {
 	/*budgetCalculator plugin*/
	/* @author Sergey Kravtsov <skravtsov@evergreens.com.ua>
    * Copyright (c) 2013 Sergey Kravtsov - released under MIT License
	* Require: 
	
	  jQuery 1.9 or better - http://jquery.com/download/
	  jBeep - https://code.google.com/p/jbeep/
	  jquery.transit - http://ricostacruz.com/jquery.transit/
	
	* RU description (search EN below):
	
	* Позволяет последовательно задавать вопросы пользователю и считать бюджет на основании этого
	* Каждый ответ на каждый вопрос имеет цену
	* Опции: current_question - номер начального вопроса
	* last_question - номер последнего вопроса
	* show_stats_func(answers, $this) - функция вывода статистики вопросов и ответов.
		 Массив answers содержит в себе qid - ид вопроса,aid - ид ответа,answer - текст ответа, budget - цену
		 массив не ассоциативный, доступ к ключам по номеру 0,1,2,3
		 $this - текущий объект budgetCalculator
	* soundURL - звук который проигрывается при обновлении бюджета
	* currency - знак валюты
	* currency_pos - prev если до числа: $100, post если после: 100 грн.
	
	EN description:
	
	* Allows user to consistently ask questions and calculate the budget on the basis of this
	* Each answer to each question has a price
	* Options: current_question - the initial question number
	* Last_question - last question number
	* Show_stats_func (answers, $this) - function display statistics, questions and answers.
		 answers array contains the answers fields: qid - question id, aid - answer id, answer - answer text, budget - the price
		 Not an associative array, access to the keys by the number 0,1,2,3
		 $this - current budgetCalculator object
	* SoundURL - the sound that is played when budget updates
	* Currency - currency sign
	* Currency_pos - 'prev' if currency sign puts before value: $100, 'post' if after: 100 UAH.
	
	*/
	
	budgetCalculator=function($element, options){
		this.$element=$($element);
		this.answers=new Array();
		this.clickEnabled=true;
		
		this.settings = $.extend({
            // These are the defaults.
            current_question: 1,
            last_question: $($element).find('.question').length,
			show_stats_func:this.showStatsDummy,
			clear_stats_func:this.clearStatsDummy,
			soundURL:'',
			currency:'',
			currency_pos:'prev'
			
        }, options );
		
		this.current_question=this.settings.current_question;
		this.init();
	}
	
   budgetCalculator.prototype.init = function() {
 		$element=this.$element;
		var _this=this;
		

		
		$element.find('.answer-block').click(function(){
			//alert(_this.$element.attr('id'));
			_this.makeAnswer(this);	
		});
	
		
		$element.find('#back-block').click(function(){
			_this.goBack(_this.current_question);				
		});
		
        return this;
 
    };
 
 
	budgetCalculator.prototype.enableClick=function(flag){
		$element=this.$element;
		if(flag){
			$element.find('.answer-img').css('cursor','pointer');	
			$element.find('.selected-img').css('cursor','pointer');	
			this.clickEnabled=true;
		}else{
			$element.find('.answer-img').css('cursor','default');
			$element.find('.selected-img').css('cursor','pointer');			
			this.clickEnabled=false;
		}
	}

	budgetCalculator.prototype.makeAnswer=function(obj){
		if(this.clickEnabled==false)return;
		this.enableClick(false);
		var _this=this;
		
		
		/*clear styles to answers*/
		
		$(obj).parent().find('.answer-img').css({perspective: '0px', rotateY: '0deg'});
		$(obj).parent().find('.selected-img').hide();
		$(obj).parent().find('.answer-img').show();
		
		/*animate current answer transitions*/
		$(obj).children('.answer-img').transition({
			 perspective: '100px',
			 rotateY: '90deg'}, 200, function(){
				 var ablock=$(this).parent();
				 var quid=ablock.parent().parent().attr('qid');
				 
				 _this.setAnswer(quid, ablock.attr('aid'), ablock.children('.answer-title').text());
				 
				 ablock.children('.answer-img').hide();
				 ablock.children('.selected-img').fadeIn(200,function(){
					  _this.nextQuestion(quid);
				 });
				 
				 
			 }
		);	
	}

	
	budgetCalculator.prototype.setAnswer=function(qid,aid,answer){
		$element=this.$element;
		if(qid>0)
		 $element.find('#back-block').fadeIn('fast');
		var new_budget=this.calculateBudget(qid,aid);
		
		this.answers.push([qid,aid,answer,new_budget]);
		
		if(new_budget>0){
		this.updateBudgetBlock();
		}
				  
		//$('#info').append('<p>qid='+qid+' answer: id='+aid+', text: '+answer+'</p>');
	
	}
	
	
	budgetCalculator.prototype.calculateBudget=function(qid,aid){
		$element=this.$element;
		var iaid=parseInt(aid);
		var budget=parseInt($element.find('div[qid='+qid+'] div[aid='+aid+']').attr('price'));
		return budget;
	}
	budgetCalculator.prototype.nextQuestion=function(qid){
		var nextqid=parseInt(qid)+1;
		var _this=this;
		$element=this.$element;
		
		if(qid==this.settings.last_question){ //last_question
			$element.find("div[qid='"+qid+"']").fadeOut(1000,function(){
			_this.showStats();
			});
			return;
		}
		this.current_question=nextqid;
	//	$('#info').append('<p>nextqid='+nextqid+'</p>');
		$element.find("div[qid='"+qid+"']").fadeOut(500,function(){
	
			$(this).parent().children("div[qid='"+nextqid+"']").fadeIn(100, function(){
			_this.enableClick(true);
			});
		});
	}
	
	
	
	budgetCalculator.prototype.updateBudgetBlock=function(){
	var $element=this.$element;
	 var _this=this;
	 $element.find('#budget-block').fadeIn('fast');
	 //$.playSound($element.settings.soundURL);
	 if(this.settings.soundURL!='')
		 jBeep(this.settings.soundURL);
	 $element.find('#budget-block .informer').transition({scale:1.0, rotate: '-30deg'},150,function(){
		 var btxt;
		 if(_this.settings.currency_pos=='prev')btxt=_this.settings.currency+$.fn.budgetCalculator.sumBudget(_this.answers);
		 else btxt=$.fn.budgetCalculator.sumBudget(_this.answers)+_this.settings.currency;
	 $element.find('#budget-block .informer').text(btxt);
	 $element.find('#budget-block .informer').transition({scale:1.0, rotate: '0deg'},300);
	 });	
	}
		
	budgetCalculator.prototype.goBack=function(qid){
		$element=this.$element;
		var _this=this;
		var prevqid=parseInt(qid)-1;
		if(this.clickEnabled==false)return;
		this.enableClick(false);
		
		this.answers.pop();
		this.updateBudgetBlock();
		
		if(prevqid==1){
			 $element.find('#back-block').fadeOut('fast');
		}
		$element.find("div[qid='"+qid+"']").fadeOut(500,function(){
				$(this).parent().children("div[qid='"+prevqid+"']").fadeIn(100, function(){
					_this.current_question=prevqid;
					_this.enableClick(true);
				});
			});
	}
	 
	 budgetCalculator.prototype.repeat=function(){
		 $element=this.$element;
		var _this=this;
		$element.find(".question").hide();
		$element.find('#back-block').fadeOut('fast');
		$element.find('#budget-block').fadeOut('fast');
		
		this.answers=new Array();
		$element.find("#stats").hide();
		this.settings.clear_stats_func(this);
		$element.find('.answer-img').css({perspective: '0px', rotateY: '0deg'});
		$element.find('.selected-img').hide();
		$element.find('.answer-img').show();
		this.current_question=this.settings.current_question;
		$element.find("div[qid='"+this.settings.current_question+"']").fadeIn(500,function(){
		_this.enableClick(true);	
		});
		
		
	 }
	 	budgetCalculator.prototype.clearStatsDummy=function($this){
		$element=$this.$element;
		$element.find('#stats').html('');
			
	}
	budgetCalculator.prototype.showStatsDummy=function(answers,$this){
		$element=$this.$element;
		$element.find('#stats').append(answers.join());
		$element.find('#stats').fadeIn();
			
	}
	budgetCalculator.prototype.showStats=function(){
		$element=this.$element;
		$element.find('#back-block').fadeOut();
		this.settings.show_stats_func(this.answers,this);
		
	}
	
	 $.fn.budgetCalculator = function(options) {
      return this.each(function() {
        if (!$.data(this, "budgetCalculatorPlugin")) {
          return $.data(this, "budgetCalculatorPlugin", new budgetCalculator(this, options));
        }
      });
    };
	
	$.fn.budgetCalculator.sumBudget=function(answers){
		var sum=0;
		for(var i=0;i<answers.length;i++)
			sum+=parseInt(answers[i][3]);
		
		return sum;
	}
	
 
}( jQuery ));
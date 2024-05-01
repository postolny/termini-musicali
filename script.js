/*
 * Copyright (c) 2024 Postolny I. A.
 * (https://postolny.github.io/ | terminimusicali@gmail.com)
 * Данный скрипт написан с той лишь целью,
 * чтобы предоставить людям возможность бесплатно
 * воспользоваться словарём. Однако это не предполагает,
 * что кто-либо может воспроизводить данный скрипт
 * в том или ином виде или распространять его,
 * нарушая тем самым авторские права.
 */
$(document).ready(function() {

  var history = [];
  var copy = '<span id="copyButton"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/></svg></span>';
  var playBtnRand = '<span id="playButtonRandom"></span><br>';
  var playBtn = '<span id="playButton"></span><br>';
  var lastPlayedInterval = "";
  var lastNameInterval = "";
  var intervalli = {};
  var playClicked = false;
  var delayTime = 1000;
  var usedComposers = [];

  // Загрузка данных из json и кэширование результатов
  const loadData = (function() {
    // Объект для кэширования данных
    const cache = {};

    return function(url) {
      if (cache[url]) {
        // Если данные уже загружены, возвращаем их из кэша
        return Promise.resolve(cache[url]);
      } else {
        // Иначе выполняем запрос
        return new Promise((resolve, reject) => {
          $.getJSON(url)
            .done(data => {
              // Сохраняем данные в кэше
              cache[url] = data;
              resolve(data);
            })
            .fail(reject);
        });
      }
    };
  })();

  async function loadDataAndProcess() {
    try {
      const dizionario = await loadData('data/data.json');

      console.log('Данные из data.json', dizionario);

      const tooltips = await loadData('data/tooltips.json');

      console.log('Данные из tooltips.json', tooltips);

      // Заполняем объект подсказками
      tooltips.forEach(function(item) {
        tooltips[item.word] = item.tooltip;
      });

      function addTitle() {
        // Добавляем атрибут title для слов, обёрнутых в теги <i>
        $('i').each(function() {
          var word = $(this).text().trim(); // Получаем слово
          var tooltip = tooltips[word]; // Получаем подсказку для этого слова
          if (tooltip) {
            // Если есть подсказка, добавляем атрибут title
            $(this).attr('title', tooltip);
          }
        });
      }

      const randomArray = await loadData('data/data.json');

      console.log('Данные из data.json для случайного термина:', randomArray);

      function loadRandomData() {
        var rand = Math.floor(Math.random() * randomArray.length);
        $("#rand").html('<span>' + randomArray[rand].label + '</span>' + copy + playBtnRand + randomArray[rand].value);
        handlePlayButton(randomArray[rand], "#playButtonRandom");
        addTitle();
        replaceTextWithLinks();
      }

      loadRandomData();

      var timeout;

      $('.random-icon').click(function() {

        loadRandomData(); // Вызываем функцию при нажатии на иконку

        var icon = $(this);

        // Проверяем, есть ли уже класс running
        if (!icon.hasClass('running')) {
          icon.removeClass('running paused').hide(0).show(0).addClass('running');

          clearTimeout(timeout);
          timeout = setTimeout(function() {
            icon.addClass('paused').removeClass('running');
          }, 1000);
        }
        scrollToElement('#rand', '#termineCasuale');
      });

      // Инициализация автозаполнения при загрузке страницы
      $("#search-tr").autocomplete({
        source: function(request, response) {
          var term = request.term.toLowerCase();
          var exactMatch = []; // Массив для точных совпадений с введённым словом
          var rest = []; // Массив для остальных слов

          var filteredData = dizionario.filter(function(item) {
            return item.label.toLowerCase().indexOf(term) !== -1;
          });

          // Проходим по каждому элементу в массиве filteredData
          filteredData.forEach(function(item) {
            if (item.label.toLowerCase() === term) {
              exactMatch.push(item);
            } else {
              rest.push(item);
            }
          });

          // Получение ответа объединением массивов exactMatch и rest
          response(exactMatch.concat(rest));
        },
        select: function(event, ui) {
          var term = ui.item.label.toLowerCase();
          var foundItem = dizionario.find(function(item) {
            return item.label.toLowerCase() === term || item.value.toLowerCase() === term;
          });
          if (term !== "") {
            if (foundItem && history.indexOf(foundItem.label) === -1) {
              history.push(term); // Добавляем запрос в историю
              updateHistory(); // Обновляем отображение истории
            } else if (foundItem) {
              // Если элемент уже есть в истории, просто отображаем его
              var index = history.indexOf(foundItem.label);
              if (index !== -1) {
                updateHistory();
                $("#history li").removeClass("current");
                $("#history li:eq(" + index + ")").addClass("current");
              }
            }
          }
          $("#search-tr").val(ui.item.label);
          $("#search-res").html('<span>' + ui.item.label + '</span>' + copy + playBtn + ui.item.value);
          setTimeout(function() {
            $('#search-tr').blur(); // Снять фокус с поля ввода
          }, 0);
          handlePlayButton(ui.item, "#playButton");
          addTitle();
          replaceTextWithLinks();
          scrollToElement('#search-res', '#buttonWrap');
          // Вызов функции с задержкой, дабы избежать конфликта функций прокрутки
          setTimeout(smoothScrollToCurrent, 1000);
          return false; // отменяем стандартное поведение
        },
        autoFocus: true,
        maxHeight: 200,
        scroll: true,
        focus: function(event, ui) {
          // Предотвращаем автоматическое заполнение поля ввода
          return false;
        }
      });

      $('#search-tr').on('keydown', function(event) {
        if (event.keyCode === $.ui.keyCode.DOWN || event.keyCode === $.ui.keyCode.UP) {
          event.preventDefault();
        }
      });

      var previousValue = $('#search-tr').val();

      $('#search-tr').on('input', function(event) {
        var currentValue = $(this).val();

        if (currentValue === '' && previousValue !== '') {
          $("#search-res").html('');
        }

        previousValue = currentValue;

        if (currentValue !== '') {
          $('#clearInput').css('opacity', '1');
        } else {
          $('#clearInput').css('opacity', '0');
        }
      });

      // Обработчик события отпускания клавиши
      $('#search-tr').on('keyup', function(event) {
        if (event.which === 8) { // Проверяем нажатие клавиши Backspace
          var currentValue = $(this).val();

          // Проверяем, был ли текст удален
          if (currentValue === '') {
            $("#search-res").html('');
          }
        }
      });

      $('#clearInput').on('click', function() {
        $('#search-tr').val('').focus();
        $("#search-res").html('');
        $(this).css('opacity', '0');
      });

      // Обработка клика по ссылке
      $("#search-res").on("click", "a", function(event) {
        event.preventDefault();
        var term = $(this).text().trim().toLowerCase();
        var foundItem = dizionario.find(function(item) {
          return item.label.toLowerCase() === term || item.value.toLowerCase() === term;
        });
        // Если найденный элемент не добавлен в историю, то он добавляется, а история обновляется
        if (foundItem && history.indexOf(foundItem.label) === -1) {
          $("#search-res").html('<span>' + foundItem.label + '</span>' + copy + playBtn + foundItem.value);
          $("#search-tr").val(foundItem.label); // Подставляем в поле результат обработки клика по ссылке
          history.push(foundItem.label); // Добавляем переход в историю
          updateHistory(); // Обновляем отображение истории

          // Добавляем класс "current" к последнему элементу в #history
          $("#history li").removeClass("current");
          $("#history li:last-child").addClass("current");
          // А иначе, если элемент уже есть в истории, он просто отображается без изменений
        } else if (foundItem) {
          $("#search-res").html('<span>' + foundItem.label + '</span>' + copy + playBtn + foundItem.value);
          $("#search-tr").val(foundItem.label); // Подставляем в поле результат обработки клика по ссылке
          // Если элемент уже есть в истории, просто отображаем его
          var index = history.indexOf(foundItem.label);
          if (index !== -1) {
            updateHistory();
            $("#history li").removeClass("current");
            $("#history li:eq(" + index + ")").addClass("current");
          }
        }
        handlePlayButton(foundItem, "#playButton");
        addTitle();
        replaceTextWithLinks();
        scrollToElement('#search-res', '#buttonWrap');
        // Вызов функции с задержкой, дабы избежать конфликта функций прокрутки
        setTimeout(smoothScrollToCurrent, 1000);
      });

      // Функция для прокрутки до текущего элемента в списке истории
      function smoothScrollToCurrent() {
        $("#history li.current").get(0).scrollIntoView({
          behavior: "smooth"
        });
      }

      // Функция для обновления отображения истории
      function updateHistory() {
        var historyHtml = "";
        for (var i = 0; i < history.length; i++) {
          var className = (i === history.length - 1) ? "current" : ""; // Добавляем класс "current" к последнему элементу
          historyHtml += "<li class='" + className + "'><a href='#'>" + history[i] + "</a></li>";
        }
        var historyList = "<ul>" + historyHtml + "</ul>";

        if (history.length > 0) {
          var historyWithHeader = "<h4>История</h4>" + historyList;
          $("#history").html(historyWithHeader);
        } else {
          $("#history").empty(); // Очищаем содержимое, если история пуста
        }
      }

      // Обработчик клика по ссылке в блоке #history
      $("#history").on("click", "a", function(event) {
        event.preventDefault();
        $("#history li").removeClass("current"); // Убираем класс "current" у всех элементов списка
        $(this).parent().addClass("current"); // Добавляем класс "current" к родительскому элементу текущей ссылки
        var term = $(this).text().trim().toLowerCase();
        var foundItem = dizionario.find(function(item) {
          return item.label.toLowerCase() === term || item.value.toLowerCase() === term;
        });
        if (foundItem) {
          $("#search-res").html('<span>' + foundItem.label + '</span>' + copy + playBtn + foundItem.value);
          $("#search-tr").val(foundItem.label);
        }

        // Проверяем, нужно ли показывать крестик
        if (foundItem.label !== '') {
          $('#clearInput').css('opacity', '1');
        } else {
          $('#clearInput').css('opacity', '0');
        }
        handlePlayButton(foundItem, "#playButton");
        addTitle();
        replaceTextWithLinks();
        scrollToElement('#search-res', '#buttonWrap');
      });

      // Обработчик клика по ссылке в .about
      $(".about").on("click", "a", function(event) {
        event.preventDefault();
        var term = $(this).text().trim().toLowerCase();
        var foundItem = dizionario.find(function(item) {
          return item.label.toLowerCase() === term || item.value.toLowerCase() === term;
        });
        // Если найденный элемент не добавлен в историю, то он добавляется, а история обновляется
        if (foundItem && history.indexOf(foundItem.label) === -1) {
          $("#search-res").html('<span>' + foundItem.label + '</span>' + copy + playBtn + foundItem.value);
          $("#search-tr").val(foundItem.label); // Подставляем в поле результат обработки клика по ссылке
          history.push(foundItem.label); // Добавляем переход в историю
          updateHistory(); // Обновляем отображение истории
        } else if (foundItem) {
          $("#search-res").html('<span>' + foundItem.label + '</span>' + copy + playBtn + foundItem.value);
          $("#search-tr").val(foundItem.label); // Подставляем в поле результат обработки клика по ссылке
          // Если элемент уже есть в истории, просто отображаем его
          var index = history.indexOf(foundItem.label);
          if (index !== -1) {
            updateHistory();
            $("#history li").removeClass("current");
            $("#history li:eq(" + index + ")").addClass("current");
          }
        }

        replaceTextWithLinks();
        // Проверяем, имеет ли ссылка класс no-scroll
        if (!$(this).hasClass("no-scroll")) {
          // Запускаем функцию прокрутки
          scrollToElement('#search-res', '#buttonWrap');
        } else {
          // Если имеет предотвращаем выполнение действия по умолчанию
          event.preventDefault();
        }
      });

      function replaceTextWithLinks() {
        $('#search-res, #rand').contents().each(function() {
          if (this.nodeType === Node.TEXT_NODE) {
            var replacedText = $(this).text()
              .replace(/#([\w'-]+)/g, function(match, words) {
                // Заменяем дефисы и апострофы на пробелы и возвращаем результат
                var cleanedWords = words.replace(/[-]/g, ' ');
                // Создаем ссылку, вставляя слова внутри тега <a>, сохраняя апостроф
                return "<a href='#'>" + cleanedWords.replace(/'/g, '&#39;') + "</a>";
              })
              .replace(/\*/g, '<br>&nbsp;• ');

            $(this).replaceWith(replacedText);
          }
        });
      }

      $("#rand").on("click", "a", function(event) {
        event.preventDefault();
        var term = $(this).text().trim().toLowerCase();
        var foundItem = dizionario.find(function(item) {
          return item.label.toLowerCase() === term;
        });
        if (foundItem) {
          $("#rand").html('<span>' + foundItem.label + '</span>' + copy + playBtnRand + foundItem.value);
        }
        handlePlayButton(foundItem, "#playButtonRandom");
        addTitle();
        replaceTextWithLinks();
        scrollToElement('#rand', '#termineCasuale');
      });

      function handlePlayButton(uiItem, buttonSelector) {
        var playButton = $(buttonSelector);
        var playIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 14.959V9.04C2 8.466 2.448 8 3 8h3.586a.98.98 0 0 0 .707-.305l3-3.388c.63-.656 1.707-.191 1.707.736v13.914c0 .934-1.09 1.395-1.716.726l-2.99-3.369A.98.98 0 0 0 6.578 16H3c-.552 0-1-.466-1-1.041M16 8.5c1.333 1.778 1.333 5.222 0 7M19 5c3.988 3.808 4.012 10.217 0 14"/></svg>';
        var stopIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18M1 12C1 5.925 5.925 1 12 1s11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12"/><path fill="currentColor" d="M8 8h8v8H8z"/></svg>';
        var audio = new Audio(uiItem.audio); // Создаем объект Audio

        // Изначально устанавливаем иконку воспроизведения
        setPlayButtonIcon(false);

        // Функция для установки иконки на кнопке воспроизведения
        function setPlayButtonIcon(isPlaying) {
          var iconPath = isPlaying ? stopIcon : playIcon;
          playButton.html(iconPath);
          uiItem.isPlaying = isPlaying; // Сохраняем состояние проигрывания
        }

        playButton.off("click").on("click", function() {

          if (!uiItem.isPlaying || audio.paused) {
            // Если не воспроизводится или на паузе, начинаем воспроизведение заново
            audio.currentTime = 0; // Сбрасываем текущую позицию
            audio.play();
            setPlayButtonIcon(true); // Устанавливаем иконку паузы
          } else {
            // Если уже воспроизводится, ставим на паузу
            audio.pause();
            setPlayButtonIcon(false); // Устанавливаем иконку воспроизведения
          }
        });

        // Обработчик события завершения проигрывания аудио
        $(audio).on("ended", function() {
          setPlayButtonIcon(false); // Восстанавливаем иконку воспроизведения
        });

        // Проверяем наличие аудио для выбранного элемента
        if (uiItem.audio) {
          // Показываем кнопку воспроизведения
          playButton.show();
        } else {
          // Если аудио отсутствует, скрываем кнопку воспроизведения
          playButton.hide();
        }
      }

      const quizArray = await loadData('data/quiz.json');

      console.log('Данные из quiz.json', quizArray);

      var usedQuestions = [];
      var totalQuestions = quizArray.length;

      function getRandomQuestion() {
        var remainingQuestions = quizArray.filter(function(question) {
          return !usedQuestions.includes(question);
        });

        if (remainingQuestions.length === 0) {
          // Если все вопросы использованы, начинаем заново
          //usedQuestions = [];
          remainingQuestions = quizArray.slice(); // Копируем все вопросы
        }

        var randomIndex = Math.floor(Math.random() * remainingQuestions.length);
        var randomQuestion = remainingQuestions[randomIndex];
        usedQuestions.push(randomQuestion); // Добавляем использованный вопрос в список
        return randomQuestion;
      }

      function displayQuestion() {
        var randomQuestion = getRandomQuestion();
        $('#question-text').text(randomQuestion.question);

        var answersContainer = $('#answers-container');
        answersContainer.empty(); // Очищаем контейнер перед добавлением новых кнопок

        // Создаем кнопки на основе ответов
        randomQuestion.answers.forEach(function(answer, index) {
          var answerButton = $('<button type="button" class="answer-btn">' + answer + '</button>');
          answerButton.click(function() {
            handleAnswer(randomQuestion, index);
            $("#answerModal").fadeIn();
          });
          answersContainer.append(answerButton);
        });
      }

      $(".quizModalClose").click(function() {
        $(".quizModalWrapper, .active").removeClass('active');
      });

      function handleAnswer(question, selectedIndex) {
        var correctIndex = question.correctIndex;
        if (selectedIndex === correctIndex) {
          $("#quizModalContent").text('Правильный ответ!');
          $(".quizModalWrapper, .active").addClass('active');
        } else {
          $("#quizModalContent").text('Неправильный ответ. Правильный ответ был: ' + question.answers[correctIndex]);
          $(".quizModalWrapper, .active").addClass('active');
        }

        if (usedQuestions.length === totalQuestions) {
          finishQuiz();
        } else {
          displayQuestion();
        }
      }

      function finishQuiz() {
        $('#quiz-result').text('Викторина завершена!');
        $('#quiz-container button').prop('disabled', true); // Отключаем кнопки
      }

      displayQuestion();

      const intervalli = await loadData('data/intervalli.json');

      console.log('Данные из intervalli.json', intervalli);

      function playSound(note) {
        var audioElement = document.getElementById('audio' + note);

        if (audioElement) {
          if (audioElement.readyState === 4) {
            audioElement.currentTime = 0; // Сбросить текущее время воспроизведения до начала
            audioElement.play().catch(function(error) {
              console.error("Ошибка воспроизведения звука:", error);
            });
          } else {
            $(".intervalloPlayButton").addClass('loading'); // Добавить класс для показа спиннера

            // Обработчик события загрузки аудио
            audioElement.oncanplay = function() {
              $(".intervalloPlayButton").removeClass('loading'); // Удалить класс после загрузки аудио
              audioElement.play(); // Начать воспроизведение после загрузки
            };
          }
        } else {
          console.error("audioElement не найден", note);
        }
      }

      // Функция проверки интервала и вывода сообщения
      function handleIntervalCheck(expectedIntervalType) {
        if (!playClicked) {
          showAlert("Сначала нажмите кнопку Проиграть интервал");
          return;
        }

        var resultMessage;
        var currentIntervalName = intervalli[lastNameInterval];

        if (currentIntervalName === expectedIntervalType) {
          resultMessage = "Верно! " + currentIntervalName + ".";
        } else {
          resultMessage = "Неверно! Не " + expectedIntervalType + ", а " + currentIntervalName + ".";
        }

        showAlert(resultMessage);
        playClicked = false; // Сброс флага после проверки
      }

      $("#unisono").on("click", function() {
        handleIntervalCheck("Унисон");
      });

      $("#secondaMinore").on("click", function() {
        handleIntervalCheck("Малая секунда");
      });

      $("#secondaMaggiore").on("click", function() {
        handleIntervalCheck("Большая секунда");
      });

      $("#terzaMinore").on("click", function() {
        handleIntervalCheck("Малая терция");
      });

      $("#terzaMaggiore").on("click", function() {
        handleIntervalCheck("Большая терция");
      });

      $("#quarta").on("click", function() {
        handleIntervalCheck("Кварта");
      });

      $("#tritono").on("click", function() {
        handleIntervalCheck("Увеличенная кварта");
      });

      $("#quinta").on("click", function() {
        handleIntervalCheck("Квинта");
      });

      $("#sestaMinore").on("click", function() {
        handleIntervalCheck("Малая секста");
      });

      $("#sestaMaggiore").on("click", function() {
        handleIntervalCheck("Большая секста");
      });

      $("#settimaMinore").on("click", function() {
        handleIntervalCheck("Малая септима");
      });

      $("#settimaMaggiore").on("click", function() {
        handleIntervalCheck("Большая септима");
      });

      $("#ottava").on("click", function() {
        handleIntervalCheck("Октава");
      });

      $("#nonaMinore").on("click", function() {
        handleIntervalCheck("Малая нона");
      });

      $("#nonaMaggiore").on("click", function() {
        handleIntervalCheck("Большая нона");
      });

      $("#decimaMinore").on("click", function() {
        handleIntervalCheck("Малая децима");
      });

      $("#decimaMaggiore").on("click", function() {
        handleIntervalCheck("Большая децима");
      });

      $(".intervalloPlayButton").click(function() {
        playClicked = true; // Установка флага, что кнопка "Проиграть интервал" была нажата

        var allNotes = Object.keys(intervalli).flatMap(interval => interval.split('-'));
        var note1 = allNotes[Math.floor(Math.random() * allNotes.length)];
        var note2 = allNotes[Math.floor(Math.random() * allNotes.length)];

        playSound(note1);
        setTimeout(function() {
          playSound(note2);

          lastPlayedInterval = note1 + "-" + note2;
          console.log("Проигран интервал:", lastPlayedInterval);
          console.log("Название интервала:", intervalli[lastPlayedInterval]);
          lastNameInterval = lastPlayedInterval; // Обновляем последний интервал
        }, delayTime); // Задержка 1s или 0
      });

      $('#toggleTimeout').change(function() {
        // Проверяем состояние чекбокса
        if ($(this).is(':checked')) {
          // Если чекбокс отмечен, обнуляем delayTime
          delayTime = 0;
        } else {
          // Если чекбокс не отмечен, устанавливаем delayTime обратно в 1000
          delayTime = 1000;
        }
      });

      function showAlert(text) {
        var alert = $('#quizModalContent');
        alert.text(text);
        $(".quizModalWrapper, .active").addClass('active');
      }

      const composers = await loadData('data/composers.json');

      console.log('Данные из composers.json', composers);

      // Функция для случайного выбора композитора из массива
      function getRandomComposer() {
        // Фильтруем композиторов, исключая уже выбранных
        var availableComposers = composers.filter(function(composer) {
          return usedComposers.indexOf(composer) === -1;
        });

        if (availableComposers.length === 0) {
          // Если все композиторы уже выбраны, сбрасываем массив и начинаем сначала
          usedComposers = [];
          availableComposers = composers;
        }

        // Выбираем случайного композитора из доступных
        var randomIndex = Math.floor(Math.random() * availableComposers.length);
        var randomComposer = availableComposers[randomIndex];

        // Добавляем выбранного композитора в массив уже выбранных
        usedComposers.push(randomComposer);

        return randomComposer;
      }

      // При загрузке страницы выбираем случайного композитора и отображаем его фотографию на карточке
      var randomComposer = getRandomComposer();

      $('.card .front').css('background-image', randomComposer.image);

      function composerButtonClick() {
        var composerName = $('.composer').val().replace(/ё/g, 'е').toUpperCase().replace(/\s+/g, ' ').trim();
        var resultMessage;
        // Проверяем, заполнено ли поле .composer
        if (composerName === '') {
          // Если не заполнено, выводим сообщение
          resultMessage = 'Пожалуйста, заполните поле!';
          showAlert(resultMessage);
        } else {
          // Проверяем ответ
          if (composerName === randomComposer.name.replace(/ё/g, 'е').toUpperCase().replace(/\s+/g, ' ')) {
            $('.back p').html('Правильно! ' + '<div>' + randomComposer.desc + '</div>');
          } else {
            $('.back p').text('Неправильно. Правильный ответ: ' + randomComposer.name);
          }

          // Поворачиваем карточку и показываем ответ
          $('.card').css('transform', 'rotateY(.5turn)');
        }
      }

      $('.composerButton').click(composerButtonClick);

      $(document).on("keydown", function(event) {
        if (event.key === "Enter") {
          composerButtonClick();
        }
      });

      $('.flipButton').click(function() {
        // Поворачиваем карточку обратно
        $('.card').css('transform', 'rotateY(0)');
        // Выбираем нового случайного композитора
        randomComposer = getRandomComposer();
        $('.card .front').css('background-image', randomComposer.image);
        // Очищаем поле
        $('.composer').val('');
      });

    } catch (error) {
      console.log("Не удалось загрузить данные.");
    }
  }

  loadDataAndProcess();

  $(document).tooltip();

  function scrollToElement(sourceSelector, targetSelector) {
    var $source = $(sourceSelector);
    var $target = $(targetSelector);
    var targetOffset = $target.offset().top;

    // Прокручиваем страницу так, чтобы верх source элемента была выровнена с верхом target элемента
    $('html, body').animate({
      scrollTop: targetOffset
    }, 500);
  }

  $('.input-char').click(function() {
    var char = $(this).text();
    var input = $('#search-tr');

    var cursorPos = input.prop('selectionStart');
    var textBefore = input.val().substring(0, cursorPos);
    var textAfter = input.val().substring(cursorPos);
    input.val(textBefore + char + textAfter);
    input.focus();
    var newPos = cursorPos + char.length;
    input.prop('selectionStart', newPos);
    input.prop('selectionEnd', newPos);

    // Добавляем событие input после вставки символа
    input.trigger('input');
  });

  //Копирование результата поиска
  $('#rand, #search-res').on('click', '#copyButton', function() {
    var $sourceContainer;
    // Проверяем в каком контейнере был клик
    if ($(this).closest('#rand').length) {
      $sourceContainer = $('#rand');
    } else if ($(this).closest('#search-res').length) {
      $sourceContainer = $('#search-res');
    }

    var textToCopy = $sourceContainer.text().trim();
    var htmlToCopy = $sourceContainer.html();
    var tempDiv = $('<div>').html(htmlToCopy).css({
      position: 'absolute',
      left: '-1000px',
      whiteSpace: 'pre-wrap'
    });
    $('body').append(tempDiv);
    var range = document.createRange();
    range.selectNodeContents(tempDiv[0]);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    tempDiv.remove();

    var $alert = $('#clipboardAlert');
    $alert.text('Текст скопирован в буфер обмена');
    $alert.fadeIn();
    setTimeout(function() {
      $alert.fadeOut();
    }, 2000);
  });

  $(".openModal").click(function() {
    $("#historyModal").fadeIn();
  });

  $(".close").click(function() {
    $("#historyModal").fadeOut();
  });

  $(document).on("keydown", function(event) {
    // Открытие окна истории по нажатию Ctrl + M (или той же клавиши с кодом 77 для русской раскладки)
    if (event.ctrlKey && event.altKey && (event.key === 'm' || event.keyCode === 77)) {
      $("#historyModal").fadeIn();
    }
    // Закрытие окна истории по нажатию Escape
    if (event.key === "Escape") {
      $("#historyModal").fadeOut();
      $(".quizModalWrapper, .active").removeClass('active');
    }
    // Очистка поля поиска и удаление результатов поиска по нажатию Ctrl + Backspace
    if (event.ctrlKey && event.key === "Backspace") {
      $('#search-tr').val('').focus();
      $("#search-res").html('');
      $('#clearInput').css('opacity', '0');
    }
  });

  $("#search-all").on("keyup", function() {
    var s = $(this).val().toLowerCase();
    $(".search-all tbody tr").filter(function() {
      $(this).toggle($(this).text().toLowerCase().indexOf(s) > -1);
    });
  });

  var currentYear = new Date().getFullYear();
  $('#currentYear').html("&copy; " + currentYear + " ");

  var email = "terminimusicali@gmail.com";
  var obfuscatedEmail = "";
  for (var i = 0; i < email.length; i++) {
    obfuscatedEmail += "&#" + email.charCodeAt(i) + ";";
  }
  $('#indirizzoSegreto span').html('<a href="mailto:' + email + '">' + obfuscatedEmail + '</a>');

  // Dark mode

  // Функция для переключения темы
  function toggleDarkMode() {
    $('body').toggleClass('dark-mode');
    $('.light-mode-icon').toggle();
    $('.dark-mode-icon').toggle();
    // Сохраняем выбор пользователя
    const isDarkMode = $('body').hasClass('dark-mode');
    localStorage.setItem('dark-mode', isDarkMode);
  }

  $('.icon').click(function() {
    toggleDarkMode();
  });

  // Проверяем, была ли выбрана темная тема при предыдущем посещении сайта
  const isDarkMode = localStorage.getItem('dark-mode') === 'true';
  if (isDarkMode) {
    $('body').addClass('dark-mode');
    $('.light-mode-icon').hide();
    $('.dark-mode-icon').show();
  }

  $('.show-hidden-content').click(function(e) {
    e.preventDefault();
    $('.hidden-content').toggleClass('visible');
    $('.dots').toggle();
    $(this).text(function(i, text) {
      return text === "Показать больше" ? "Показать меньше" : "Показать больше";
    });
  });

});
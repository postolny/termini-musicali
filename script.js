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
  var composerAudio = $("#audioElement")[0];
  var currentData;
  var mergedArray;
  var updateQuestion = false;

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

      const ru = await loadData('data/ru.json');

      console.log('Данные из ru.json', ru);

      // установка массива данных по умолчанию
      currentData = dizionario;

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

      // Функция для определения языка на основе символа
      function getLanguage(key) {
        var russianCharacters = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
        var differentCharacters = 'abcdefghijklmnopqrstuvwxyzàèéìòù';

        if (russianCharacters.includes(key.toLowerCase())) {
          return 'ru';
        } else if (differentCharacters.includes(key.toLowerCase())) {
          return 'dizionario';
        } else {
          return 'unknown'; // если символ не принадлежит ни одному языку
        }
      }

      // Обработчик изменения языка
      function changeLanguage(language) {
        if (language === 'dizionario') {
          currentData = dizionario; // устанавливаем массив данных словаря иностранных терминов
        } else if (language === 'ru') {
          currentData = ru; // устанавливаем массив данных русского словаря
        } else {
          console.log('Неизвестный язык: ', language);
        }
        // Автоматическое переключение радиокнопок
        $("input[name='language'][value='" + language + "']").prop('checked', true);

        console.log('Текущий язык: ', language);

      }

      // Обработка событий клавиатуры для автоматического переключения языка
      $(document).on('keypress', function(event) {
        var key = event.key;
        var detectedLanguage = getLanguage(key);

        if (detectedLanguage !== 'unknown') {
          console.log('Обнаруженный язык: ', detectedLanguage);
          changeLanguage(detectedLanguage);
        } else {
          console.log('Неизвестный символ: ', key);
        }
      });

      $("input[name='language']").change(function() {
        console.log("Язык переключен");
        const selectedLanguage = $(this).val(); // получаем выбранный язык
        console.log("Выбранный язык:", selectedLanguage);
        if (selectedLanguage === "dizionario") {
          currentData = dizionario; // устанавливаем массив данных словаря иностранных терминов
          // При ручном переключении языка сбрасываем данные, устанавливаем фокус и скрываем крестик
          $('#search-tr').val('');
          $("#search-res").html('');
          $('#clearInput').css('opacity', '0');
        } else if (selectedLanguage === "ru") {
          currentData = ru; // устанавливаем массив данных русского словаря
          $('#search-tr').val('');
          $("#search-res").html('');
          $('#clearInput').css('opacity', '0');
        }
        console.log("Текущие данные:", currentData);
      });

      function loadRandomData() {
        mergedArray = dizionario.concat(ru); // объединяем два массива
        var rand = Math.floor(Math.random() * mergedArray.length);
        $("#rand").html('<span>' + mergedArray[rand].label + '</span>' + copy + playBtnRand + mergedArray[rand].value);
        handlePlayButton(mergedArray[rand], "#playButtonRandom");
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

      function sanitizeText(text) {
        // Заменяем * на | с пробелами
        text = text.replace(/\*/g, ' | ');

        // Очищаем ссылки
        return text.replace(/#([a-zA-Zа-яА-ЯёЁ0-9'àèéìòóù]+(?:-[a-zA-Zа-яА-ЯёЁ0-9'àèéìòóù]+)*)/g, function(match, p1) {
          return p1.replace(/-/g, ' ');
        });
      }

      // Функция для отображения и подсветки текста
      function displayAndHighlight(searchTerm) {
        var content = '';
        var found = false;
        var data = showRU ? ru : dizionario; // Используем данные в зависимости от выбранного языка

        if (searchTerm) {
          var sanitizedSearchTerm = sanitizeText(searchTerm);
          var regex = new RegExp(sanitizedSearchTerm, 'gi');
          $.each(data, function(index, item) {
            if (item && item.value) {
              var label = item.label;
              var value = sanitizeText(item.value);
              if (label.match(regex) || value.match(regex)) {
                found = true;
                var highlightedLabel = label.replace(regex, function(match) {
                  return '<span class="highlight">' + match + '</span>';
                });
                var highlightedText = value.replace(regex, function(match) {
                  return '<span class="highlight">' + match + '</span>';
                });
                content += '<p><strong>' + highlightedLabel + '</strong></p>';
                content += '<p>' + highlightedText + '</p>';
              }
            } else {
              console.warn('Элемент с индексом ' + index + ' не имеет свойства value: ', item);
            }
          });
        } else {
          $.each(data, function(index, item) {
            if (item && item.value) {
              content += '<p><strong>' + item.label + '</strong></p>';
              content += '<p>' + sanitizeText(item.value) + '</p>';
            } else {
              console.warn('Элемент с индексом ' + index + ' не имеет свойства value: ', item);
            }
          });
        }
        if (!found) {
          content += '<p>Ничего не найдено</p>';
        }
        $('#content').html(content);
        if (searchTerm) {
          currentIndex = -1;
          highlights = $('.highlight');
        }
        addTitle();
      }

      var highlights = [];
      var currentIndex = -1;

      function navigateHighlights(direction) {
        if (highlights.length > 0) {
          highlights.removeClass('currentWord');
          currentIndex = (currentIndex + direction + highlights.length) % highlights.length;
          var currentHighlight = highlights.eq(currentIndex);
          currentHighlight.addClass('currentWord');
          var windowHeight = $('#fullscreenWindow').height();
          var highlightPosition = currentHighlight.offset().top - $('#fullscreenWindow').offset().top;
          if (highlightPosition < 0 || highlightPosition > windowHeight) {
            $('#fullscreenWindow').animate({
              scrollTop: $('#fullscreenWindow').scrollTop() + highlightPosition - (windowHeight / 2)
            }, 200);
          }
        }
      }

      $('#searchInDictionary').on('input', function() {
        var searchTerm = $(this).val();
        displayAndHighlight(searchTerm);
        toggleClearButton(searchTerm);
      });

      $('#prev').on('click', function() {
        navigateHighlights(-1);
      });

      $('#next').on('click', function() {
        navigateHighlights(1);
      });

      let showRU = false;

      // Обработчик переключателя направления перевода в окне чтения полного текста
      $('#toggle-language').on('click', function() {
        var content = '';
        if (showRU) {
          $(this).text('ру');
        } else {
          $(this).text('ин-яз');
        }
        showRU = !showRU;
        displayAndHighlight($('#searchInDictionary').val()); // Обновляем отображение после переключения языка
      });

      $('#googleSearchButton').on('click', function() {
        searchInGoogle();
      });

      function searchInGoogle() {
        var query = $('#search-tr').val();
        if (query === "") {
          showAlert("Чтобы искать в Google введите слово в поле поиска.");
          return;
        }
        var googleUrl = determineGoogleUrl(query);
        // window.location.href = googleUrl + encodeURIComponent(query);
        window.open(googleUrl + encodeURIComponent(query), '_blank');
      }

      function determineGoogleUrl(query) {
        var russianRegex = /[а-яА-ЯёЁ]/;
        if (russianRegex.test(query)) {
          return 'https://www.google.ru/search?hl=ru&q=';
        } else {
          return 'https://www.google.it/search?hl=it&q=';
        }
      }

      $(document).on("keydown", function(event) {
        if (event.ctrlKey) {
          if (event.key === "ArrowLeft") {
            navigateHighlights(-1);
          } else if (event.key === "ArrowRight") {
            navigateHighlights(1);
          }
        }
        if ((event.ctrlKey && event.key === "Backspace") || (event.target.id === "clear-search")) {
          clearSearch();
        }
        // Очистка поля поиска и удаление результатов поиска по нажатию Ctrl + Backspace
        if (event.ctrlKey && event.key === "Backspace") {
          $('#search-tr').val('').focus();
          $("#search-res").html('');
          $('#clearInput').css('opacity', '0');
        }
        // Открытие окна истории по нажатию Ctrl + Alt + M (или той же клавиши с кодом 77 для русской раскладки)
        if (event.ctrlKey && event.altKey && (event.key === 'm' || event.keyCode === 77)) {
          $("#historyModal").fadeIn();
          updateHistory();
        }
        // Открытие окна чтения полного текста по нажатию Ctrl + Alt + L (или той же клавиши с кодом 76 для русской раскладки)
        if (event.ctrlKey && event.altKey && (event.key === 'l' || event.keyCode === 76)) {
          openFullscreen();
        }
        // Закрытие окна истории по нажатию Ctrl + Q
        if (event.ctrlKey && (event.key === 'q' || event.keyCode === 81)) {
          $("#historyModal").fadeOut();
          // Закрытие окна чтения полного текста
          $(".quizModalWrapper, .active").removeClass('active');
          // Если флаг true, обновляем вопрос в Викторине
          if (updateQuestion) {
            if (usedQuestions.length === totalQuestions) {
              finishQuiz();
            } else {
              displayQuestion();
            }
            updateQuestion = false; // Сброс флага после обновления
          }
          // Закрытие окна чтения полного текста
          closeFullscreen();
          // Поворачиваем карточку обратно
          flipButtonClick();
        }
        // Проверяем правильный ответ по нажатию Enter
        if (event.keyCode === 13) {
          composerButtonClick();
        }
        // Поиск в Google
        if (event.ctrlKey && event.altKey && (event.key === 'g' || event.keyCode === 71)) {
          searchInGoogle();
        }
      });

      $('#clear-search').on('click', function() {
        clearSearch();
      });

      function clearSearch() {
        $('#searchInDictionary').val('');
        $('#fullscreenWindow').animate({
          scrollTop: 0
        }, 300);
        displayAndHighlight('');
        toggleClearButton('');
      }

      function toggleClearButton(value) {
        if (value) {
          $('#clear-search').css('visibility', 'visible');
        } else {
          $('#clear-search').css('visibility', 'hidden');
        }
      }

      displayAndHighlight('');

      // Инициализация автозаполнения при загрузке страницы
      $("#search-tr").autocomplete({
        source: function(request, response) {
          var term = request.term.toLowerCase();
          var exactMatch = []; // Массив для точных совпадений с введённым словом
          var rest = []; // Массив для остальных слов

          var filteredData = currentData.filter(function(item) {
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
          var foundItem = currentData.find(function(item) {
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
          $("#search-tr").val(ui.item.label).blur();
          $("#search-res").html('<span>' + ui.item.label + '</span>' + copy + playBtn + ui.item.value);
          handlePlayButton(ui.item, "#playButton");
          addTitle();
          replaceTextWithLinks();
          scrollToElement('#search-res', '.languageSwitch');
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

      $('#search-tr').on('input', function(event) {
        var currentValue = $(this).val();
        // Если значение не пустое, показываем крестик
        if (currentValue !== '') {
          $('#clearInput').css('opacity', '1');
        } else {
          $('#clearInput').css('opacity', '0');
        }
      });

      // Обработчик события отпускания клавиши (для удаления результатов поиска в #search-res при удалении выделенного в поле #search-tr текста нажатием Backspace)
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
        // Получаем значение атрибута data-language
        var language = $(this).data("language");
        console.log("Клик на языке:", language);
        // Устанавливаем текущий массив данных в зависимости от выбранного языка
        currentData = (language === "dizionario") ? dizionario : ru;

        // Переключаем радиокнопки на соответствующий язык
        $("input[name='language']").filter("[value='" + language + "']").prop("checked", true).change();

        var term = $(this).text().trim().toLowerCase();
        var foundItem = currentData.find(function(item) {
          return item.label.toLowerCase() === term || item.value.toLowerCase() === term;
        });

        // Проверяем, должна ли отображаться кнопка очистки ввода
        if (foundItem.label !== '') {
          $('#clearInput').css('opacity', '1');
        } else {
          $('#clearInput').css('opacity', '0');
        }

        // Если найденный элемент не добавлен в историю, то он добавляется, а история обновляется
        if (foundItem && history.indexOf(foundItem.label) === -1) {
          $("#search-res").html('<span>' + foundItem.label + '</span>' + copy + playBtn + foundItem.value);
          $("#search-tr").val(foundItem.label).blur(); // Подставляем в поле результат обработки клика по ссылке
          history.push(foundItem.label); // Добавляем переход в историю
          updateHistory(); // Обновляем отображение истории

          // Добавляем класс "current" к последнему элементу в #history
          $("#history li").removeClass("current");
          $("#history li:last-child").addClass("current");
          // А иначе, если элемент уже есть в истории, он просто отображается без изменений
        } else if (foundItem) {
          $("#search-res").html('<span>' + foundItem.label + '</span>' + copy + playBtn + foundItem.value);
          $("#search-tr").val(foundItem.label).blur(); // Подставляем в поле результат обработки клика по ссылке
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
        scrollToElement('#search-res', '.languageSwitch');
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
          // $("#history").empty(); // Очищаем содержимое, если история пуста
          $("#history").html("История поиска и переходов пока отсутствует");
        }
        // Устанавливаем атрибут data-language для каждой ссылки
        $("#history a").each(function() {
          var term = $(this).text().trim().toLowerCase();
          var language = "ru"; // По умолчанию устанавливаем русский язык

          // Проверяем, есть ли слово в массиве данных dizionario
          if (dizionario.some(item => item.label.toLowerCase() === term || item.value.toLowerCase() === term)) {
            language = "dizionario";
          }

          // Устанавливаем атрибут data-language
          $(this).attr("data-language", language);
        });
      }

      // Обработчик клика по ссылке в блоке #history
      $("#history").on("click", "a", async function(event) {
        event.preventDefault();
        $("#history li").removeClass("current");
        $(this).parent().addClass("current");
        var term = $(this).text().trim().toLowerCase();

        var language = $(this).data("language");
        console.log("Клик на языке в Истории:", language);
        // Устанавливаем текущий массив данных в зависимости от выбранного языка
        currentData = (language === "dizionario") ? dizionario : ru;
        // Переключаем радиокнопки на соответствующий язык
        $("input[name='language']").filter("[value='" + language + "']").prop("checked", true).change();
        // Проверяем, существует ли элемент в текущем массиве данных
        var foundItem = currentData.find(function(item) {
          return item.label.toLowerCase() === term || item.value.toLowerCase() === term;
        });

        console.log("Найденный элемент:", foundItem);

        // Если элемент найден, обновляем результаты поиска и другие элементы интерфейса
        if (foundItem) {
          $("#search-res").html('<span>' + foundItem.label + '</span>' + copy + playBtn + foundItem.value);
          $("#search-tr").val(foundItem.label).blur();

          // Проверяем, должна ли отображаться кнопка очистки ввода
          if (foundItem.label !== '') {
            $('#clearInput').css('opacity', '1');
          } else {
            $('#clearInput').css('opacity', '0');
          }

          handlePlayButton(foundItem, "#playButton");
          addTitle();
          replaceTextWithLinks();
          scrollToElement('#search-res', '.languageSwitch');
        }

      });

      $("#openModal").click(function() {
        $("#historyModal").fadeIn();
        updateHistory();
      });

      // $(".close").click(function() {
      //   $("#historyModal").fadeOut();
      // });

      // $("#historyModal").draggable({
      //   handle: "#modalHeader",
      //   containment: "window"
      // });

      var historyModal = $("#historyModal");
      var modalHeader = $("#modalHeader");
      var isDragging = false;
      var startX, startY, initialX, initialY;

      function startDrag(e) {
        isDragging = true;
        var event = e.type.startsWith('touch') ? e.touches[0] : e;
        startX = event.pageX;
        startY = event.pageY;
        initialX = historyModal.position().left;
        initialY = historyModal.position().top;
        document.addEventListener(e.type.startsWith('touch') ? "touchmove" : "mousemove", drag, {
          passive: false
        });
        document.addEventListener(e.type.startsWith('touch') ? "touchend" : "mouseup", stopDrag);
        e.preventDefault();
      }

      function drag(e) {
        if (isDragging) {
          var event = e.type.startsWith('touch') ? e.touches[0] : e;
          var deltaX = event.pageX - startX;
          var deltaY = event.pageY - startY;
          historyModal.css({
            left: initialX + deltaX,
            top: initialY + deltaY
          });
          e.preventDefault();
        }
      }

      function stopDrag() {
        isDragging = false;
        document.removeEventListener("mousemove", drag);
        document.removeEventListener("touchmove", drag);
        document.removeEventListener("mouseup", stopDrag);
        document.removeEventListener("touchend", stopDrag);
      }

      modalHeader.on("mousedown touchstart", function(e) {
        startDrag(e.originalEvent);
      });

      $(".close").on("click touchend", function(e) {
        e.stopPropagation();
        $("#historyModal").fadeOut();
      });

      // Обработчик клика по ссылке в .about
      $(".about").on("click", "a", function(event) {
        // Проверяем, имеет ли ссылка класс no-scroll
        if ($(this).hasClass('no-scroll')) {
          // Если имеет, выходим из обработчика
          return;
        }
        event.preventDefault();
        // Получаем значение атрибута data-language
        var language = $(this).data("language");
        console.log("Клик на языке:", language);
        // Устанавливаем текущий массив данных в зависимости от выбранного языка
        currentData = (language === "dizionario") ? dizionario : ru;

        // Переключаем радиокнопки на соответствующий язык
        $("input[name='language']").filter("[value='" + language + "']").prop("checked", true).change();

        var term = $(this).text().trim().toLowerCase();
        var foundItem = currentData.find(function(item) {
          return item.label.toLowerCase() === term || item.value.toLowerCase() === term;
        });

        if (foundItem) {
          // Проверяем, должна ли отображаться кнопка очистки ввода
          if (foundItem.label !== '') {
            $('#clearInput').css('opacity', '1');
          } else {
            $('#clearInput').css('opacity', '0');
          }

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
        }
        replaceTextWithLinks();
        scrollToElement('.about', '.languageSwitch');
        // Вызов функции с задержкой, дабы избежать конфликта функций прокрутки
        setTimeout(smoothScrollToCurrent, 1000);
      });

      function replaceTextWithLinks() {
        $('#search-res, #rand, .about').contents().each(function() {
          if (this.nodeType === Node.TEXT_NODE) {
            var replacedText = $(this).text()
              .replace(/#([\w'àèéìòóùА-Яа-яёЁ-]+)/g, function(match, words) {
                // Заменяем дефисы и апострофы на пробелы
                var cleanedWords = words.replace(/[-]/g, ' ');
                // Создаем ссылку, вставляя слова внутри тега <a>, сохраняя апостроф
                return "<a href='#'>" + cleanedWords.replace(/'/g, '&#39;') + "</a>";
              })
              .replace(/\*/g, '<br>&nbsp;• ');

            $(this).replaceWith(replacedText);
          }
        });

        // Устанавливаем атрибут data-language для каждой ссылки
        $("#search-res a, .about a").not(".no-scroll").each(function() {
          var term = $(this).text().trim().toLowerCase();
          var language = "ru"; // По умолчанию устанавливаем русский язык

          // Проверяем, есть ли слово в массиве данных dizionario
          if (dizionario.some(item => item.label.toLowerCase() === term || item.value.toLowerCase() === term)) {
            language = "dizionario";
          }

          // Устанавливаем атрибут data-language
          $(this).attr("data-language", language);
        });
      }

      $("#rand").on("click", "a", function(event) {
        event.preventDefault();
        var term = $(this).text().trim().toLowerCase();
        var foundItem = mergedArray.find(function(item) {
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

        // Проверка определены ли uiItem и uiItem.audio
        if (uiItem && uiItem.audio) {
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

          // Показываем кнопку воспроизведения
          playButton.show();
        } else {
          // Если uiItem или uiItem.audio отсутствует, скрываем кнопку воспроизведения
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
          // Если все вопросы использованы, возвращаем null
          return null;
        }

        var randomIndex = Math.floor(Math.random() * remainingQuestions.length);
        var randomQuestion = remainingQuestions[randomIndex];
        usedQuestions.push(randomQuestion); // Добавляем использованный вопрос в список
        return randomQuestion;
      }

      function displayQuestion() {
        var randomQuestion = getRandomQuestion();
        $('#question-text').html(randomQuestion.question);

        if (randomQuestion === null) {
          finishQuiz();
          return;
        }

        var answersContainer = $('#answers-container');
        answersContainer.empty(); // Очищаем контейнер перед добавлением новых кнопок

        // Создаем кнопки на основе ответов
        randomQuestion.answers.forEach(function(answer, index) {
          var answerButton = $('<button type="button" class="answer-btn">' + answer + '</button>');
          answerButton.click(function() {
            handleAnswer(randomQuestion, index);
          });
          answersContainer.append(answerButton);
        });
        animateButtons();

      }

      function updateRemainingQuestions() {
        var remainingCount = totalQuestions - usedQuestions.length;
        $('#remaining-count').text(remainingCount);
      }

      $(".quizModalHeader span").click(function() {
        $(".quizModalWrapper, .active").removeClass('active');

        // $("body").css("overflow", "auto");
        // $(".diagonal-header h1, .darkmodeIcon").css("paddingRight", 0);

        if (updateQuestion) {
          if (usedQuestions.length === totalQuestions) {
            finishQuiz();
          } else {
            displayQuestion();
          }
          updateQuestion = false; // Сброс флага после обновления
        }
      });

      function handleAnswer(question, selectedIndex) {
        var correctIndex = question.correctIndex;
        var article = question.article; // Получаем статью

        var correctIcon = '<svg id="correct" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="60" stroke-dashoffset="60" d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="60;0"/></path><path stroke-dasharray="14" stroke-dashoffset="14" d="M8 12L11 15L16 10"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.2s" values="14;0"/></path></g></svg>';
        var incorrectIcon = '<svg id="incorrect" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"><path stroke-dasharray="60" stroke-dashoffset="60" d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="60;0"/></path><path stroke-dasharray="8" stroke-dashoffset="8" d="M12 12L16 16M12 12L8 8M12 12L8 16M12 12L16 8"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.2s" values="8;0"/></path></g></svg>';

        var contentHtml = '<p>Вопрос: ' + question.question + '</p><ul>';

        question.answers.forEach(function(answer, index) {
          if (index === correctIndex) {
            contentHtml += '<li>' + correctIcon + ' ' + answer + '</li>';
          } else {
            contentHtml += '<li>' + incorrectIcon + ' ' + answer + '</li>';
          }
        });

        contentHtml += '</ul><p>' + article + '</p>';

        $("#quizModalContent").html(contentHtml);
        $(".quizModalWrapper, .active").addClass('active');

        // $("body").css("overflow", "hidden");
        // $(".diagonal-header h1, .darkmodeIcon").css("paddingRight", scrollbarWidth);

        updateRemainingQuestions(); // Обновляем количество оставшихся вопросов
        displayImages();
        // Установка флага для обновления вопроса при закрытии модального окна
        updateQuestion = true;
      }

      function displayImages() {
        var folderPath = "images/quiz/";

        $('#quizModalContent').html(function(index, html) {
          return html.replace(/#(\w+)/g, function(match, p1) {
            return '<img src="' + folderPath + p1 + '.png">';
          });
        });

        $('#quizModalContent img').each(function() {
          var src = $(this).attr('src');
          if (!src.startsWith(folderPath)) {
            src = folderPath + src;
            $(this).attr('src', src);
          }
        });
      }

      function finishQuiz() {
        $('#quiz-result').text('Викторина завершена!');
        $('#quiz-container button').prop('disabled', true); // Отключаем кнопки
      }

      // Функция для анимации кнопок
      function animateButtons() {
        $('.answer-btn').each(function(index) {
          $(this).delay(200 * index).fadeIn({
            duration: 500,
            start: function() {
              $(this).addClass('revealing');
            }
          });
        });
      }
      $('#remaining-count').text(totalQuestions);
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

      // Функция для изменения иконки кнопки воспроизведения
      function togglePlayPauseIcon() {
        $("#playPauseIcon").attr("src", composerAudio.paused ? "images/play.svg" : "images/stop.svg");
      }

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

      // При загрузке страницы выбираем случайного композитора

      var randomComposer = getRandomComposer();

      // Сведения о композиторе на лицевой стороне карточки
      $('.card .front p').text(randomComposer.desc);

      function composerButtonClick() {
        var composerValue = $('.composer').val();
        if (composerValue !== undefined) {
          var composerName = composerValue.replace(/ё/g, 'е').toUpperCase().replace(/\s+/g, ' ').replace(/иоганн себастьян бах/ig, 'БАХ').replace(/франц йозеф гайдн|йозеф гайдн/ig, 'ГАЙДН').replace(/вольфганг амадей моцарт|иоанн хризостом вольфганг амадей теофил моцарт/ig, 'МОЦАРТ').replace(/людвиг ван бетховен/ig, 'БЕТХОВЕН').replace(/франц шуберт|франц петер шуберт/ig, 'ШУБЕРТ').replace(/фредерик шопен|фредерик францишек шопен/ig, 'ШОПЕН').replace(/роберт шуман|роберт александр шуман/ig, 'ШУМАН').replace(/ференц лист|франц лист/ig, 'ЛИСТ').replace(/модест петрович мусоргский/ig, 'МУСОРГСКИЙ').replace(/петр ильич чайковский/ig, 'ЧАЙКОВСКИЙ').replace(/эдвард григ/ig, 'ГРИГ').replace(/александр николаевич скрябин/ig, 'СКРЯБИН').replace(/сергей васильевич рахманинов/ig, 'РАХМАНИНОВ').trim();
          console.log(composerName);
          var resultMessage;
          // Проверяем, заполнено ли поле .composer
          if (composerName === '') {
            // Если не заполнено, выводим сообщение
            resultMessage = 'Пожалуйста, заполните поле!';
            showAlert(resultMessage);
          } else {
            // Проверяем ответ
            if (composerName === randomComposer.name.replace(/ё/g, 'е').toUpperCase().replace(/\s+/g, ' ').replace(/иоганн себастьян бах/ig, 'БАХ').replace(/франц йозеф гайдн|йозеф гайдн/ig, 'ГАЙДН').replace(/вольфганг амадей моцарт|иоанн хризостом вольфганг амадей теофил моцарт/ig, 'МОЦАРТ').replace(/людвиг ван бетховен/ig, 'БЕТХОВЕН').replace(/франц шуберт|франц петер шуберт/ig, 'ШУБЕРТ').replace(/фредерик шопен|фредерик францишек шопен/ig, 'ШОПЕН').replace(/роберт шуман|роберт александр шуман/ig, 'ШУМАН').replace(/ференц лист|франц лист/ig, 'ЛИСТ').replace(/модест петрович мусоргский/ig, 'МУСОРГСКИЙ').replace(/пётр ильич чайковский/ig, 'ЧАЙКОВСКИЙ').replace(/эдвард григ/ig, 'ГРИГ').replace(/александр николаевич скрябин/ig, 'СКРЯБИН').replace(/сергей васильевич рахманинов/ig, 'РАХМАНИНОВ')) {
              console.log(composerName);
              $('.card .back p').html('Правильно!' + '<div>' + randomComposer.musica + '</div>');
              $('.card .back').css('background-image', randomComposer.image);
            } else {
              console.log(composerName);
              $('.card .back p').html('Неправильно! Правильный ответ: ' + randomComposer.name + '<div>' + randomComposer.musica + '</div>');
              $('.card .back').css('background-image', randomComposer.image);
            }

            // Поворачиваем карточку и показываем ответ
            $('.card').css('transform', 'rotateY(.5turn)');
            setOverlaySize();
          }
        }
      }

      $('.composerButton').click(composerButtonClick);

      function flipButtonClick() {
        // Поворачиваем карточку обратно
        $('.card').css('transform', 'rotateY(0)');
        // Выбираем нового случайного композитора
        randomComposer = getRandomComposer();
        $('.card .front p').text(randomComposer.desc);
        // Очищаем поле
        $('.composer').val('');
        playRandomTrack();
      }

      $('.flipButton').click(flipButtonClick);

      // Функция для установки размеров подложки
      function setOverlaySize() {
        var paragraph = $('.back p');
        var overlay = $('#overlay');
        // Учитываем внутренние отступы абзаца
        var paddingX = parseInt(paragraph.css('padding-left')) + parseInt(paragraph.css('padding-right'));
        var paddingY = parseInt(paragraph.css('padding-top')) + parseInt(paragraph.css('padding-bottom'));

        // Устанавливаем размеры подложки с учетом внутренних отступов абзаца
        overlay.css('width', (paragraph.width() + paddingX) + 'px');
        overlay.css('height', (paragraph.height() + paddingY) + 'px');
      }

      function playRandomTrack() {
        var audioFile = randomComposer.composerAudio; // Получаем ссылку на аудиофайл текущего композитора

        // Обработка undefined
        if (composerAudio) {
          composerAudio.src = audioFile; // Устанавливаем аудиофайл в качестве источника для проигрывания
          composerAudio.play(); // Воспроизводим аудио
          togglePlayPauseIcon(); // Меняем иконку кнопки воспроизведения
        } else {
          console.error('composerAudio является undefined');
        }
      }

      // Обработчик события клика по кнопке воспроизведения
      $("#playPauseIcon").click(function() {
        if (composerAudio.paused) {
          playRandomTrack();
        } else {
          composerAudio.pause();
          togglePlayPauseIcon();
        }
      });

      // Обработчик события окончания воспроизведения
      composerAudio.onended = function() {
        togglePlayPauseIcon();
      };

    } catch (error) {
      console.log("Не удалось загрузить данные.");
    }
  }

  loadDataAndProcess();

  $(document).tooltip();

  function scrollToElement(sourceSelector, targetSelector) {
    var $source = $(sourceSelector);
    var $target = $(targetSelector);
    var targetOffset = $target.offset().top - 10;

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

  $("#openFullscreenButton").click(function() {
    openFullscreen();
  });

  $("#closeFullscreenButton").click(function() {
    closeFullscreen();
  });

  // Вычисляем ширину скроллбара
  var scrollbarWidth = window.innerWidth - $(window).width() + "px";

  function openFullscreen() {
    $("#fullscreenWindow").fadeIn();
    $("body").css("overflow", "hidden");
    $("body, .darkmodeIcon").css("paddingRight", scrollbarWidth);
    $("#closeFullscreenButton").css("marginRight", scrollbarWidth);
    $('#search-container').css('marginLeft', '0');
  }

  function closeFullscreen() {
    $("#fullscreenWindow").fadeOut();
    $("body").css("overflow", "auto");
    $("body, .darkmodeIcon").css("paddingRight", 0);
    $("#closeFullscreenButton").css("marginRight", 0);
    $('#search-container').css('marginLeft', '2px');
  }

  $("#search-all").on("input", function() {
    var s = $(this).val().toLowerCase();
    $(".search-all tbody tr").filter(function() {
      $(this).toggle($(this).text().toLowerCase().indexOf(s) > -1);
    });
    toggleClearButton(s); // Обновляем вызов функции toggleClearButton с актуальным значением
  });

  $('#clear-search-all').on('click', function() {
    $('#search-all').val('');
    toggleClearButton(''); // Обновляем вызов функции toggleClearButton с пустым значением
    $(".search-all tbody tr").show(); // Показываем все строки таблицы
  });

  function toggleClearButton(value) {
    if (value) {
      $('#clear-search-all').css('visibility', 'visible');
    } else {
      $('#clear-search-all').css('visibility', 'hidden');
    }
  }

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

  var suDiMeText = $("#suDiMe").html();

  function updateText() {
    var currentHour = new Date().getHours();

    if (currentHour < 5) {
      $("#suDiMe").html(suDiMeText + " Однако час уже поздний и утро вечера мудренее. Советую вам отложить все дела на завтра и пойти спать. Спокойной ночи!");
    } else if (currentHour < 12) {
      $("#suDiMe").html("Доброе утро! " + suDiMeText);
    } else if (currentHour < 17) {
      $("#suDiMe").html("Добрый день! " + suDiMeText);
    } else {
      $("#suDiMe").html("Добрый вечер! " + suDiMeText);
    }
  }

  updateText();
  setInterval(updateText, 60000);

  // Получаем адрес текущей страницы
  var currentPage = window.location.href;
  console.log("Текущая страница: " + currentPage);

  // Обходим все ссылки в футере
  $("footer a").each(function() {
    // Получаем адрес ссылки
    var linkHref = $(this).attr("href");
    console.log("Адрес ссылки: " + linkHref);
    // Проверяем, совпадает ли адрес ссылки с адресом текущей страницы
    if ($(this).attr("href") == currentPage) {
      // Если совпадает, скрываем ссылку и ее родительский элемент <li>
      $(this).parent().hide();
    }
  });

  // Полноэкранный режим

  $("#toggleFullscreen").on("click", function() {
    toggleFullscreen();
  });

  function toggleFullscreen() {
    var element = document.documentElement;
    if (!document.fullscreenElement &&
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
      // Переключение в полноэкранный режим
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      }
      $("#normal-mode-icon").hide();
      $("#fullscreen-mode-icon").show();
    } else {
      exitFullscreen();
    }
  }

  function exitFullscreen() {
    if (document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }
  // Обработчик события для выхода из полноэкранного режима (иначе не меняется иконка)
  $(document).on("fullscreenchange", function(event) {
    if (!document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.mozFullScreenElement &&
      !document.msFullscreenElement) {
      $("#normal-mode-icon").show();
      $("#fullscreen-mode-icon").hide();
    }
  });

});
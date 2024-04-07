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

  var myArray1;
  var randomArray;
  var tooltips = {};
  var history = [];
  var copy = '<span id="copyButton"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/></svg></span>';
  var playBtnRand = '<span id="playButtonRandom"></span><br>';
  var playBtn = '<span id="playButton"></span><br>';

  // Загрузка данных JSON

  $.getJSON('data/data.json').done(function(data) {
    myArray1 = data;

    console.log(myArray1);

    $.getJSON('data/tooltips.json').done(function(data) {
      tooltips = data;
      console.log(tooltips);
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

      function loadRandomData() {
        $.getJSON('data/data.json').done(function(data) {
          randomArray = data;
          console.log(randomArray);
          var rand = Math.floor(Math.random() * randomArray.length);
          $("#rand").html('<span>' + randomArray[rand].label + '</span>' + copy + playBtnRand + randomArray[rand].value);
          handlePlayButton(randomArray[rand], "#playButtonRandom");
          addTitle();
          replaceTextWithLinks();
        }).fail(function() {
          setTimeout(loadRandomData, 5000);
        });
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

          var filteredData = myArray1.filter(function(item) {
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
          var foundItem = myArray1.find(function(item) {
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
        var foundItem = myArray1.find(function(item) {
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
        var foundItem = myArray1.find(function(item) {
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
        var foundItem = myArray1.find(function(item) {
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

    }).fail(function() {
      console.log("Не удалось загрузить данные.");
    });
  }).fail(function() {
    console.log("Не удалось загрузить данные.");
  });

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
    // Открытие окна истории по нажатию Ctrl + M
    if (event.ctrlKey && event.keyCode === 77) {
      $("#historyModal").fadeIn();
    }
    // Закрытие окна истории по нажатию Escape
    if (event.key === "Escape") {
      $("#historyModal").fadeOut();
    }
    // Очистка поля поиска и удаление результатов поиска по нажатию Ctrl + Backspace
    if (event.ctrlKey && event.key === "Backspace") {
      event.preventDefault();
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
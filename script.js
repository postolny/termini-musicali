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
          $("#rand").html('<span>' + randomArray[rand].label + '</span><span id="copyButton"></span><br>' + randomArray[rand].value);
          addTitle();
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
            }
          }
          $("#search-tr").val(ui.item.label);
          $("#search-res").html('<span>' + ui.item.label + '</span><span id="copyButton"></span><br>' + ui.item.value);
          addTitle();
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

      $('#search-tr').on('input', function() {
        if ($(this).val() !== '') {
          $("#search-res").html('');
          $('#clearInput').css('opacity', '1');
        } else {
          $('#clearInput').css('opacity', '0');
        }
      });

      $('#clearInput').on('click', function() {
        $('#search-tr').val('');
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
          $("#search-res").html('<span>' + foundItem.label + '</span><span id="copyButton"></span><br>' + foundItem.value);
          $("#search-tr").val(foundItem.label); // Подставляем в поле результат обработки клика по ссылке
          history.push(foundItem.label); // Добавляем переход в историю
          updateHistory(); // Обновляем отображение истории
          // А иначе, если элемент уже есть в истории, он просто отображается без изменений
        } else if (foundItem) {
          $("#search-res").html('<span>' + foundItem.label + '</span><span id="copyButton"></span><br>' + foundItem.value);
          $("#search-tr").val(foundItem.label); // Подставляем в поле результат обработки клика по ссылке
        }
        addTitle();
      });

      // Функция для обновления отображения истории
      function updateHistory() {
        var historyHtml = "";
        for (var i = 0; i < history.length; i++) {
          historyHtml += "<li><a href='#'>" + history[i] + "</a></li>";
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
        var term = $(this).text().trim().toLowerCase();
        var foundItem = myArray1.find(function(item) {
          return item.label.toLowerCase() === term || item.value.toLowerCase() === term;
        });
        if (foundItem) {
          $("#search-res").html('<span>' + foundItem.label + '</span><span id="copyButton"></span><br>' + foundItem.value);
          $("#search-tr").val(foundItem.label);
        }
        addTitle();
      });

      $("#rand").on("click", "a", function(event) {
        event.preventDefault();
        var term = $(this).text().trim().toLowerCase();
        var foundItem = myArray1.find(function(item) {
          return item.label.toLowerCase() === term;
        });
        if (foundItem) {
          $("#rand").html('<span>' + foundItem.label + '</span><span id="copyButton"></span><br>' + foundItem.value);
        }
        addTitle();
      });
    }).fail(function() {
      console.log("Не удалось загрузить данные.");
    });
  }).fail(function() {
    console.log("Не удалось загрузить данные.");
  });

  $(document).tooltip();
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

  // Удаление результатов по нажатию Escape
  $(document).keyup(function(e) {
    if (e.keyCode === 27) {
      $('#search-tr').val('');
      $("#search-res").html('');
      $('#clearInput').css('opacity', '0');
    }
  });

  $(".openModal").click(function() {
    $("#historyModal").fadeIn();
  });

  $(".close").click(function() {
    $("#historyModal").fadeOut();
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

});
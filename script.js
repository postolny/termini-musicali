$(document).ready(function() {
  var myArray1;

  // Загрузка данных JSON
  $.getJSON('data.json').done(function(data) {
    myArray1 = data;

    console.log(myArray1);

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
        $("#search-tr").val(ui.item.label);
        $("#search-res").html('<span>' + ui.item.label + '</span>: ' + ui.item.value);
        $('#copyButton').css('visibility', 'visible');
        return false; // отменяем стандартное поведение
      },
      autoFocus: false,
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
        $('#copyButton').css('visibility', 'hidden');
      } else {
        $('#clearInput').css('opacity', '0');
      }
    });

    $('#clearInput').on('click', function() {
      $('#search-tr').val('');
      $("#search-res").html('');
      $(this).css('opacity', '0');
      $('#copyButton').css('visibility', 'hidden');
    });

    // Обработка клика по ссылке
    $("#search-res").on("click", "a", function(event) {
      event.preventDefault();
      var term = $(this).text().trim().toLowerCase();
      var foundItem = myArray1.find(function(item) {
        return item.label.toLowerCase() === term || item.value.toLowerCase() === term;
      });
      if (foundItem) {
        $("#search-res").html('<span>' + foundItem.label + '</span>: ' + foundItem.value);
        $("#search-tr").val(foundItem.label); // Подставляем в поле результат обработки клика по ссылке
      }
    });
  });
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
  $('#copyButton').click(function() {
    var textToCopy = $('#search-res').text();
    var tempInput = $('<input>');
    $('body').append(tempInput);
    tempInput.val(textToCopy).select();
    document.execCommand('copy');
    tempInput.remove();
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
      $('#copyButton').css('visibility', 'hidden');
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
  // Проверяем, есть ли значение в localStorage для тёмного режима
  var darkMode = getLocalStorage('darkMode');
  // Если значение в куки указывает на тёмный режим, применяем его
  if (darkMode === 'true') {
    // Включаем темный режим
    enableDarkMode();
  }
  // Обработчик события для переключения тёмного режима
  $('.darkmode').on('click', function() {
    if (darkMode === 'true') {
      darkMode = 'false';
      disableDarkMode();
    } else {
      darkMode = 'true';
      enableDarkMode();
    }
    // Устанавливаем значение в localStorage
    setLocalStorage('darkMode', darkMode);
  });

  function enableDarkMode() {
    // Применяем стили для тёмного режима
    $('body').addClass('dark-mode');
    // Меняем иконку
    $('.light').hide();
    $('.dark').show();
  }

  function disableDarkMode() {
    // Проверяем, есть ли класс dark-mode
    if ($('body').hasClass('dark-mode')) {
      // Удаляем стили для тёмного режима
      $('body').removeClass('dark-mode');
    }
    // Меняем иконку
    $('.dark').hide();
    $('.light').show();
  }

  // Функция для получения значения из localStorage
  function getLocalStorage(key) {
    return localStorage.getItem(key);
  }

  // Функция для установки значения в localStorage
  function setLocalStorage(key, value) {
    localStorage.setItem(key, value);
  }
});
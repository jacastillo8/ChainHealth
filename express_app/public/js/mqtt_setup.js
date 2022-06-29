$(document).ready(function() {
    $('button#approve').on('click', function() {
        let $row = $(this).closest('tr')
        let client = $row.find('.client').text();
        let address = $row.find('.address').text();
        let location = $row.find('.loc input').val();
        $.post('/devices/update/' + client + '/' + address, {loc: location, auth: "0"}, function(res) {
            window.location.reload();
        })
    })
    $('button#reject').on('click', function() {
        let $row = $(this).closest('tr')
        let client = $row.find('.client').text();
        let address = $row.find('.address').text();
        $.post('/devices/update/' + client + '/' + address, {loc: "", auth: "-1"}, function(res) {
            window.location.reload();
        })
    })
    $('.remove').on('click', function() {
        let $row = $(this).closest('tr')
        let client = $row.find('.client').text();
        let address = $row.find('.address').text();
        $.post('/devices/remove/' + client + '/' + address, function(res) {
            window.location.reload();
        })
    })
    $('#search-query').on('keyup', function() {
        var filter = $(this).val().toUpperCase();
        $('table[data-name=devices] .hoverable').each(function() {
          if ($(this).find('.loc').text().toUpperCase().indexOf(filter) > -1) {
            $(this).css('display', "");
          } else {
            $(this).css('display', "none");
          }
        });
      });
});
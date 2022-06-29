$(document).ready(function(){
    $(document.body).on("click", "tr[data-href]", function() {
        window.location.href = this.dataset.href;
    });
    $('#search-query').on('keyup', function(event) {
      var filter = $(this).val().toUpperCase();
      $('#patient-table .hoverable').each(function() {
        if ($(this).find('.name-filter').text().toUpperCase().indexOf(filter) > -1) {
          $(this).css('display', "");
        } else {
          $(this).css('display', "none");
        }
      });
    });
});
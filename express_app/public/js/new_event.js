$(document).ready(function() {
    $('.datetimepicker').datepicker({
        showOtherMonths: true,
        selectOtherMonths: true,
        autoclose: true,
        changeMonth: true,
        changeYear: true,
        orientation: "bottom left"
    });
    // Reset button - clear form
    $("#reset").on('click', function() {
        $('.required').val('');
        $('.required').prop('readonly', false);
    });
})

function formValidation() {
    let valid = true;
    $('.required').each(function() {
        let id = $(this).attr('id');
        if (id !== 'end_date' && $(this).val().length === 0) {
            $('#error').html("\u2022 Field '" + $('label[for=' + id + ']').text().replace(':','') + "' can not be empty!")
            $('#error').addClass('alert alert-danger');
            $('#' + id).css('borderColor', 'red');
            $('#error').fadeIn();
            $('#error').fadeOut(4000);
            return valid = false;
        } else {
            $('#error').html("")
            $('#error').removeClass('alert alert-danger');
            $('#' + id).css('borderColor', '');
        }
    });
    return valid;
}
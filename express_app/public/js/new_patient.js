$(document).ready(function() {
    // JQuery for datepicker 
    $('#datetimepicker').datepicker({
        showOtherMonths: true,
        selectOtherMonths: true,
        autoclose: true,
        changeMonth: true,
        changeYear: true,
        orientation: "bottom left"
    });

    // Form button
    $("#reset").on('click', function() {
        $('.required').val('');
        $('input[type=checkbox]').prop('checked', false);
    });
});

// Form Validation
function formValidation() {
    let valid = true;
    $('.required').each(function() {
        let id = $(this).attr('id');
        if ($(this).val().length === 0) {
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
    if (valid) {
        valid = $('input[type=checkbox]:checked').length > 0;
        if (!valid) {
            $('#error').html("\u2022 Field '" + $('label[for=races]').text().replace(':','') + "' can not be empty!")
            $('#error').addClass('alert alert-danger');
            $('#checkboxes').css('border', '1px solid #dc3545');
            $('#error').fadeIn();
            $('#error').fadeOut(4000);
        }
    }

    return valid;
}
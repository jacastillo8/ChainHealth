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
        if ($('#password').val() !== $('#password2').val()) {
            $('#error').html("\u2022 Passwords do not match!")
            $('#error').addClass('alert alert-danger');
            $('#password').css('borderColor', 'red');
            $('#password2').css('borderColor', 'red');
            $('#error').fadeIn();
            $('#error').fadeOut(4000);
            valid = false;
        } else {
            $('#error').html("")
            $('#error').removeClass('alert alert-danger');
            $('#password').css('borderColor', '');
            $('#password2').css('borderColor', '');
        }
    }
    return valid;
}
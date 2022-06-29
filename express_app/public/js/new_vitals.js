$(document).ready(function() {
    // Available sensors (Arduino)
    let availSensors = {BP:['bpd','bps'],
                        Temp:['temp'], 
                        SPO2:['pulse','spo2'], 
                        Resp:['resp'], 
                        ECG:['ecg']};

    // Send request to server to obtain sensor values
    $("button.btn-mqtt").on('click', function() {
        if (deviceCheck()) {
            let pid = $("input#pid").val();
            let did = $("input#list").val().split('-')[1].replace(' ', '');
            let id = this.id;
            resetField(availSensors[id]);
            for (let i=0; i < Object.keys(availSensors).length; i++) {
                if (id === Object.keys(availSensors)[i]) {
                    $.get("/devices/" + did + '/' + id + '/' + pid, function(data) {
                        for (let j=0; j < availSensors[id].length; j++) {
                            $("input#" + availSensors[id][j]).val(data.msg.split(',')[j]);
                            $("input#" + availSensors[id][j]).prop('readonly', true);
                        }
                    });
                }
            }
        }
    })

    // Reset button - clear form
    $("#reset").on('click', function() {
        $('.required').val('');
        $('.required').prop('readonly', false);
        $('textarea').val('');
    });
});

// Helper function for buttons
function resetField(data) {
    for (let i=0; i < data.length; i++) {
        $('#' + data[i]).val('');
        $('#' + data[i]).prop('readonly', false);
    }
}

// Checks if device field is available
function deviceCheck() {
    if ($('#list').val().length === 0) {
        $('#error').html("\u2022 Field '" + $('label[for=list]').text().replace(':','') + "' can not be empty!")
        $('#error').addClass('alert alert-danger');
        $('#list').css('borderColor', 'red');
        $('#error').fadeIn();
        $('#error').fadeOut(4000);
        return false;
    } else {
        $('#error').html("")
        $('#error').removeClass('alert alert-danger');
        $('#list').css('borderColor', '');
    }
    return true;
}

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
        } else if (id !== 'list' && !$.isNumeric($(this).val())) {
            $('#error').html("\u2022 Field '" + $('label[for=' + id + ']').text().replace(':','') + "' must be a number!")
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
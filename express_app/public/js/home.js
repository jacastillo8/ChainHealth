$(document).ready(function() {
    let image = 1;
    // Rotate images every 10s
    window.setInterval(function() {
        $('#image-home').fadeOut(1000, function() {
            $('#image-home').attr('src', '/images/home/image' + image + '.jpg');
            image = (image + 1) % 3;
        });
        $('#image-home').fadeIn();
    }, 10000);
});
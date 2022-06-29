// Refresh site every 30s
$(document).ready(function() {
    let i = 30;
    setInterval(function() {
        if (i === 0) {
            location.reload();
        } else {
            $('#timer').html(i)
            i--;
        }
    }, 1000);
    // Fades in all divs with class hidden
    $("div.hidding").each(function(index) {
        $(this).delay(400*index).fadeIn(900);
    });
})

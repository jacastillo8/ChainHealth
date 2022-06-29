$(document).ready(function() {
    let tab = $('li.active a').text();
    if (tab === 'Overview') {
        overview();
    } 
    $('li a[href="#a"]').on('click', function() {
        overview();
    });
    $('#submit').on('click', function() {
        if (formValidation()) {
            if ($('#search').val() !== 'insurance') {
                $.get('/blockchain/query/' + $('#search').val(), function(res) {
                    $.post('/blockchain/query/vitals', res[$('#list').val()], function(res) {
                        $('#download').attr({
                            href: '/blockchain/' + res,
                            class: 'btn btn-success btn-block',
                            download: 'query.json'
                        });
                    });
                });
            } else {
                $.post('/blockchain/query/insurance', {}, function(res) {
                    $('#download').attr({
                        href: '/blockchain/' + res,
                        class: 'btn btn-success btn-block',
                        download: 'query.json'
                    });
                });
            }
        }
    });
    $('#search').on('change', function() {
        $('#list').val('').attr('readonly', false);
        let selector = $(this).val();
        if (selector) {
            if (selector !== 'insurance') {
                $.get('/blockchain/query/' + selector, function(res) {
                    $('#data-list').empty();
                    Object.keys(res).forEach(function(key, i) {
                        $('#data-list').append($("<option>").attr('value', key));
                    });
                });
            } else {
                $('#list').val('None').attr('readonly', true);
            }
        } else {
            $('#data-list').empty();
        }
    })
});

function newColor() {
    let hexColor = Math.floor(Math.random()*16777215).toString(16).match(/.{1,2}/g);
    let rgb = [];
    for (let i=0; i < hexColor.length; i++) {
        rgb.push(parseInt('0x' + hexColor[i]));
    }
    return [`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.2)`, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`]
}

function calculateStats(data) {
    Object.keys(data).forEach(function(key) {
        $(`.${key}:eq(0)`).html(max(data[key]));
        $(`.${key}:eq(1)`).html(min(data[key]));
        $(`.${key}:eq(2)`).html(mean(data[key]));
        $(`.${key}:eq(3)`).html(stdev(data[key]));
    });
}

function max(arr) {
    return (Math.max.apply(Math, arr) / 1000).toFixed(2);
}

function min(arr) {
    return (Math.min.apply(Math, arr) / 1000).toFixed(2);
}

function stdev(arr) {
    const n = arr.length;
    const m = Number(mean(arr));
    return Math.sqrt(arr.map(x => Math.pow((x/1000)-m, 2)).reduce((a,b) => a+b, 0) / n).toFixed(2);
}

function mean(arr) {
    const n = arr.length;
    const m = arr.reduce((a,b) => a+b, 0) / n
    return (m / 1000).toFixed(2);
}

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

function overview() {
    $.get('/blockchain/timer', function(res) {
        let invoke = res.invoke.slice(0, 20);
        let query = res.query.slice(0, 20);

        calculateStats({ invoke, query });

        let labels = Array(30).fill().map((_, i) => i+1);
        let color1 = newColor();
        let color2 = newColor();
        let ctx = $('#performance')[0].getContext('2d');
        let line = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels, 
                datasets: [{
                    label: 'Insert',
                    fill: false,
                    data: $.map(invoke, function(value) {
                        return value / 1000;
                    }),
                    borderColor: color1[1],
                    backgroundColor: color1[0],
                    fillColor : color1[0]
                },
                {
                    label: 'Query',
                    fill: false,
                    data: $.map(query, function(value) {
                        return value / 1000;
                    }),
                    borderColor: color2[1],
                    backgroundColor: color2[0],
                    fillColor : color2[0]
                }],
            },
            options: {
                scales: {
                    xAxes: [{
                        ticks: {
                            fontSize: 18
                        }
                    }],
                    yAxes:[{
                        scaleLabel: {
                            display: true,
                            labelString: 'Seconds',
                            fontSize: 18
                        },
                        ticks: {
                            fontSize: 18
                        }
                    }]
                },
                legend: {
                    position: 'right',
                    labels: {
                        fontSize: 18
                    }
                }
            }
        });
    });
    $.get('/blockchain/types', function(res) {
        let data = [];
        let backgroundColors = [];
        let borderColors = [];
        let barDatasets = [];
        let labels = [];
        let keys = Object.keys(res);
        for (let i=0; i < keys.length; i++) {
            var color = newColor();
            var innerKeys = $.map(Object.keys(res[keys[i]]), function(keys) {
                return keys.toUpperCase();
            });
            var values = $.map(res[keys[i]], function(value, i) {
                return value;
            });
            data.push(values.reduce(function(a, b) {
                return a + b;
            }, 0));
            backgroundColors.push(color[0]);
            borderColors.push(color[1]);
            labels.push(keys[i][0].toUpperCase() + keys[i].slice(1));
            barDatasets.push({
                label: keys[i][0].toUpperCase() + keys[i].slice(1),
                data: values,
                backgroundColor: Array(values.length).fill(color[0]),
                borderColor: Array(values.length).fill(color[1]),
                borderWidth: 1
            });
        }
        let ctx = $('.tx-info').each(function(index) {
            if (index === 0) {
                var bar = new Chart(this.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: innerKeys,
                        datasets: barDatasets
                    },
                    options: {
                        scales: {
                            xAxes: [{
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Transaction Type',
                                    fontSize: 18
                                },
                                stacked: true,
                                ticks: {
                                    fontSize: 18
                                }
                            }],
                            yAxes: [{
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Number of Transactions',
                                    fontSize: 18
                                },
                                ticks: {
                                    beginAtZero: true
                                }, 
                                stacked: true,
                                ticks: {
                                    fontSize: 18
                                }
                            }]
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                fontSize: 18
                            }
                        }
                    }
                });
            } else {
                var pie = new Chart(this.getContext('2d'), {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: backgroundColors,
                            borderColor: borderColors,
                            borderWidth: 1
                        }]
                    }, 
                    options: {
                        tooltips: {
                            callbacks: {
                                label: function(tooltipItem, data) {
                                    var dataset = data.datasets[tooltipItem.datasetIndex];
                                  var total = dataset.data.reduce(function(previousValue, currentValue, currentIndex, array) {
                                    return previousValue + currentValue;
                                  });
                                  var currentValue = dataset.data[tooltipItem.index];
                                  var precentage = Math.floor(((currentValue/total) * 100)+0.5);         
                                  return currentValue + ' (' + precentage + "%" + ')';
                                }
                              }
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                fontSize: 18
                            }
                        }
                    }
                });
            }
        });
    });
}
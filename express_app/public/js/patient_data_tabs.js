$(document).ready(function() {
    let pid = $('#pid').val();
    let tab = $('li.active a').text();
    if (tab === 'Overview') {
        $('#a').attr('class', 'tab-pane active');
        overview(pid);
    } else if (tab === 'Vitals') {
        $('#c').attr('class', 'tab-pane active');
        vitals(pid);
    } else if (tab === 'Insurance') {
        $('#b').attr('class', 'tab-pane active');
        insurance(pid);
    }
    $('a[href="#c"]').on('click', function() {
        vitals(pid);
    });
    $('a[href="#a"]').on('click', function() {
        overview(pid);
    });
    $('a[href="#b"]').on('click', function() {
        insurance(pid);
    });
});

function isEquivalent(a, b) {
    // Check if inputs are objects and not null
    if (typeof a == 'object' && a !== null) {
        let aProps = Object.getOwnPropertyNames(a);
    
        // Check individual properties for matches
        for (let i=0; i < aProps.length; i++) {
            let name = aProps[i];
            if (name !== "org") {
                if (!isNaN(a[name])) {
                    if (Number(a[name]) !== Number(b[name])) {
                        return false;
                    }
                } else {
                    if (a[name] !== b[name]) {
                        return false;
                    }
                }
            }
        }

        // At this point both objects are the same
        return true;
    } else {
        return false;
    }
}

function vitals(pid) {
    $("#a div.hidding").each(function() {
        $(this).fadeOut();
    });
    $("#b div.hidding").each(function() {
        $(this).fadeOut();
    });
    $("#c div.hidding").each(function(index) {
        $(this).delay(500*index).fadeIn(1000);
    });
    $.get('/api/vitals/' + pid, function(data) {
        let vitals = data.vitals;

        // Sort response according to date (larger date is first element)
        vitals = vitals.sort(function(a, b) {
            a = new Date(a.date);
            b = new Date(b.date);
            return b-a;
        });

        // Get last 10 elements for display (last 50 medical visits)
        vitals = vitals.slice(0,50);
        // Flip array
        vitals.reverse();

        let bps = [];
        let bpd = [];
        let weight = [];
        let temp = [];
        let pulse = [];
        let resp = [];
        let spo2 = [];

        let xAxis = [];
        let protected = [];
        // Each array will have at most 10 elements
        for (let i=0; i < vitals.length; i++) {
            bps.push(Number(vitals[i].bps));
            bpd.push(Number(vitals[i].bpd));
            weight.push(Number(vitals[i].weight));
            temp.push(Number(vitals[i].temperature));
            pulse.push(Number(vitals[i].pulse));
            resp.push(Number(vitals[i].respiration));
            spo2.push(Number(vitals[i].oxygen_saturation));
            xAxis.push(String(i + 1));
            if (vitals[i].user === null) {
                protected.push(vitals[i]);
            }
        }
        
        // Chart options
        let options = {legend:{
                            display: true,
                            position: 'right'
                        },
                        tooltips: {
                            enabled: true,
                            callbacks: {
                                label: function(tooltipItem, data) {
                                    return data.datasets[tooltipItem.datasetIndex].label + ": " + tooltipItem.yLabel;
                                },
                                title: function() {}
                            }
                        },
                        scales: {
                            xAxes: [{
                                ticks: {
                                    display: false
                                }
                            }],
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true
                                }
                            }]
                        },
                    };

        // Arrays of information
        let sensors = [[bps, bpd], resp,  spo2, pulse, temp, weight];
        let labels = [['Systolic', 'Diastolic'], 'Respiration', 'Oxygen Saturation', 
                    'Pulse', 'Temperature', 'Weight'];
        let colors = [['rgba(255, 99, 132, 0.6)',
                      'rgba(54, 162, 235, 0.6)'],
                      'rgba(255, 206, 86, 0.6)',
                      'rgba(75, 192, 192, 0.6)', 
                      'rgba(153, 102, 255, 0.6)', 
                      'rgba(255, 159, 64, 0.6)', 
                      'rgba(200, 99, 132, 0.6)'];

        // Generate and display charts
        let canvas = $('canvas');
        for (let i=0; i < canvas.length; i++) {
            let context = canvas[i].getContext('2d');
            if (i == 0) {
                let chart = new Chart(context, {
                    type: 'line',
                    data: {
                        labels: xAxis, 
                        datasets: [{
                            label: labels[i][0],
                            fill: false,
                            data: sensors[i][0],
                            borderColor: colors[i][0],
                            backgroundColor: colors[i][0],
                            fillColor : colors[i][0],
                            strokeColor : colors[i][0],
                            pointColor : colors[i][0]
                        },
                        {
                            label: labels[i][1],
                            fill: false,
                            data: sensors[i][1],
                            borderColor: colors[i][1],
                            backgroundColor: colors[i][1],
                            fillColor : colors[i][1],
                            strokeColor : colors[i][1],
                            pointColor : colors[i][1]
                        }],
                    },
                    options: options
                })
            } else {
                options.legend = {display: false};
                let chart = new Chart(context, {
                    type: 'line',
                    data: {
                        labels: xAxis, 
                        datasets: [{
                            label: labels[i],
                            fill: false,
                            data: sensors[i],
                            borderColor: colors[i],
                            backgroundColor: colors[i],
                            fillColor : colors[i],
                            strokeColor : colors[i],
                            pointColor : colors[i]
                        }]
                    },
                    options: options
                })
            }
        }
        if (protected.length !== 0) {
            $('#msg_vit').attr('class', 'alert alert-warning');
            $('#msg_vit').text("Validating data's integrity...");
            // Introduce 2s delay for visualization
            setTimeout(function() {
                $.post("/blockchain/query", { "eid": data.eids, "pid": pid, "type": "vit" }, function(res) {
                    let bcData = JSON.parse(res).reverse();

                    let faulty_indices = [];
                    for (let j=0; j < bcData.length; j++) {
                        if (!isEquivalent(bcData[j], protected[j])) {
                            faulty_indices.push(j); // Abnormal
                        } 
                    }
                    if (faulty_indices.length !== 0) {
                        $('#msg_vit').attr('class', 'alert alert-danger');
                        $('#msg_vit').text('Displayed data has inconsistencies in the following indices: ' + faulty_indices.join(', ') + '. Fixing alterations...');
                        // Introduce 2s delay for visualization
                        setTimeout(function() {
                            let counter = 0;
                            faulty_indices.forEach(function(index) {
                                delete bcData[index].pid;
                                delete bcData[index].org;
                                $.post("/api/vitals/update/" + pid + '/' + data.eids[index], { "vitals": JSON.stringify(bcData[index]) }, function(res) {
                                    counter++;
                                    if (counter === faulty_indices.length) {
                                        setTimeout(function() {
                                            location.reload(true);
                                        }, 5000);
                                    }
                                });
                            });
                        }, 2000);
                    } else {
                        $('#msg_vit').attr('class', 'alert alert-success');
                        $('#msg_vit').text('Displayed data is secured.');
                    }
                });
            }, 2000);
        }
    });
}

function overview(pid) {
    $("#c div.hidding").each(function() {
        $(this).fadeOut();
    });
    $("#b div.hidding").each(function() {
        $(this).fadeOut();
    });
    $("#a div.hidding").each(function(index) {
        $(this).delay(500*index).fadeIn(1000);
    });
    $.get('/patient/' + pid, function(patient) {
        if (patient.mname.length === 0) {
            var fullName = `${patient.title} ${patient.fname} ${patient.lname}`;
        } else {
            var fullName = `${patient.title} ${patient.fname} ${patient.mname} ${patient.lname}`;
        }
        $("#name").html(fullName);
        $("#dob").html(patient.dob);
        $('#gender').html(patient.sex);
        $("#phone").html(patient.phone_contact);
        $("#address").html(`${patient.street}, ${patient.city}, ${patient.state} ${patient.postal_code}`);
        $("#ethnicity").html(patient.ethnicity);
        $("#race").html(patient.race);
    });
    $.get('/patient/' + pid + '/issues', function(data) {
        let issues = data.issue.reverse();
        $('.problems li').remove();
        protected = [];
        for (let i=0; i < issues.length; i++) {
            let template = '<div><strong>Name: </strong><span id="issue_name' + i + '"></span></div>';
            template += '<div><strong>Start Date: </strong><span id="issue_start' + i + '"></span></div>';
            template += '<div><strong>End Date: </strong><span id="issue_end' + i + '"></span></div>';
            template += '<div><strong>Diagnosis: </strong><span id="issue_diagnosis' + i + '"></span></div><br>'
            $('.problems').append('<li>' + template + '</li>');
            $('#issue_name' + i).html(issues[i].title);
            $('#issue_start' + i).html(issues[i].begdate);
            $('#issue_end' + i).html(issues[i].enddate);
            $('#issue_diagnosis' + i).html(issues[i].diagnosis);
            if (issues[i].user === null) {
                protected.push({ title: issues[i].title, begdate: issues[i].begdate, enddate: issues[i].enddate, diagnosis: issues[i].diagnosis, pid: issues[i].pid });
            }
        }
        if (protected.length !== 0) {
            $('#msg_iss').attr('class', 'alert alert-warning');
            $('#msg_iss').text("Validating data's integrity...");
            setTimeout(function() {
                $.post("/blockchain/query", { "eid": null, "pid": pid, "type": "iss" }, function(res) {
                    let bcData = JSON.parse(res).reverse();
                    if (bcData.length !== 0) {
                        let faulty_indices = [];
                        for (let j=0; j < bcData.length; j++) {
                            if (!isEquivalent(bcData[j], protected[j])) {
                                faulty_indices.push(j); // Abnormal
                            } 
                        }
                        if (faulty_indices.length !== 0) {
                            $('#msg_iss').attr('class', 'alert alert-danger');
                            $('#msg_iss').text('Displayed data has inconsistencies in the following indices: ' + faulty_indices.join(', ') + '. Fixing alterations...');
                            // Introduce 2s delay for visualization
                            setTimeout(function() {
                                let counter = 0;
                                faulty_indices.forEach(function(index) {
                                    delete bcData[index].pid;
                                    delete bcData[index].org;
                                    $.post("/api/issue/update/" + pid + '/' + data.cids[index], { "issue": JSON.stringify(bcData[index]) }, function(res) {
                                        counter++;
                                        if (counter === faulty_indices.length) {
                                            setTimeout(function() {
                                                location.reload(true);
                                            }, 5000);
                                        }
                                    });
                                });
                            }, 2000);
                        } else {
                            $('#msg_iss').attr('class', 'alert alert-success');
                            $('#msg_iss').text('Displayed data is secured.');
                        }
                    } else {
                        $('#msg_iss').text('No blockchain data found.');
                    }
                });
            }, 2000);
        }
    });
    $.get('/patient/' + pid + '/medication', function(data) {
        let medications = data.medication.reverse(); 
        $('.meds li').remove();
        let protected = [];
        for (let i=0; i < medications.length; i++) {
            let template = '<div><strong>Name: </strong><span id="med_name' + i + '"></span></div>';
            template += '<div><strong>Start Date: </strong><span id="med_start' + i + '"></span></div>';
            template += '<div><strong>End Date: </strong><span id="med_end' + i + '"></span></div><br>';
            $('.meds').append('<li>' + template + '</li>');
            $('#med_name' + i).html(medications[i].title);
            $('#med_start' + i).html(medications[i].begdate);
            $('#med_end' + i).html(medications[i].enddate);
            if (medications[i].user === null) {
                protected.push({ title: medications[i].title, begdate: medications[i].begdate, enddate: medications[i].enddate, pid: medications[i].pid });
            }
        }
        if (protected.length !== 0) {
            $('#msg_med').attr('class', 'alert alert-warning');
            $('#msg_med').text("Validating data's integrity...");
            setTimeout(function() {
                $.post("/blockchain/query", { "eid": null, "pid": pid, "type": "med" }, function(res) {
                    let bcData = JSON.parse(res).reverse();
                    if (bcData.length !== 0) {
                        let faulty_indices = [];
                        for (let j=0; j < bcData.length; j++) {
                            if (!isEquivalent(bcData[j], protected[j])) {
                                faulty_indices.push(j); // Abnormal
                            } 
                        }
                        if (faulty_indices.length !== 0) {
                            $('#msg_med').attr('class', 'alert alert-danger');
                            $('#msg_med').text('Displayed data has inconsistencies in the following indices: ' + faulty_indices.join(', ') + '. Fixing alterations...');
                            // Introduce 2s delay for visualization
                            setTimeout(function() {
                                let counter = 0;
                                faulty_indices.forEach(function(index) {
                                    delete bcData[index].pid;
                                    delete bcData[index].org;
                                    $.post("/api/medication/update/" + pid + '/' + data.mids[index], { "medication": JSON.stringify(bcData[index]) }, function(res) {
                                        counter++;
                                        if (counter === faulty_indices.length) {
                                            setTimeout(function() {
                                                location.reload(true);
                                            }, 5000);
                                        }
                                    });
                                });
                            }, 2000);
                        } else {
                            $('#msg_med').attr('class', 'alert alert-success');
                            $('#msg_med').text('Displayed data is secured.');
                        }
                    } else {
                        $('#msg_med').text('No blockchain data found.');
                    }
                });
            }, 2000);
        }
    });
    $.get('/patient/' + pid + '/allergies', function(data) {
        let allergies = data.allergy.reverse();
        $('.allergies li').remove();
        let protected = [];
        for (let i=0; i < allergies.length; i++) {
            let template = '<div><strong>Name: </strong><span id="all_name' + i + '"></span></div>';
            template += '<div><strong>Start Date: </strong><span id="all_start' + i + '"></span></div>';
            template += '<div><strong>End Date: </strong><span id="all_end' + i + '"></span></div><br>';
            $('.allergies').append('<li>' + template + '</li>');
            $('#all_name' + i).html(allergies[i].title);
            $('#all_start' + i).html(allergies[i].begdate);
            $('#all_end' + i).html(allergies[i].enddate);
            if (allergies[i].user === null) {
                protected.push({ title: allergies[i].title, begdate: allergies[i].begdate, enddate: allergies[i].enddate, pid: allergies[i].pid });
            }
        }
        if (protected.length !== 0) {
            $('#msg_all').attr('class', 'alert alert-warning');
            $('#msg_all').text("Validating data's integrity...");
            setTimeout(function() {
                $.post("/blockchain/query", { "eid": null, "pid": pid, "type": "all" }, function(res) {
                    let bcData = JSON.parse(res).reverse();
                    if (bcData.length !== 0) {
                        let faulty_indices = [];
                        for (let j=0; j < bcData.length; j++) {
                            if (!isEquivalent(bcData[j], protected[j])) {
                                faulty_indices.push(j); // Abnormal
                            } 
                        }
                        if (faulty_indices.length !== 0) {
                            $('#msg_all').attr('class', 'alert alert-danger');
                            $('#msg_all').text('Displayed data has inconsistencies in the following indices: ' + faulty_indices.join(', ') + '. Fixing alterations...');
                            // Introduce 2s delay for visualization
                            setTimeout(function() {
                                let counter = 0;
                                faulty_indices.forEach(function(index) {
                                    delete bcData[index].pid;
                                    delete bcData[index].org;
                                    $.post("/api/allergy/update/" + pid + '/' + data.aids[index], { "allergy": JSON.stringify(bcData[index]) }, function(res) {
                                        counter++;
                                        if (counter === faulty_indices.length) {
                                            setTimeout(function() {
                                                location.reload(true);
                                            }, 5000);
                                        }
                                    });
                                });
                            }, 2000);
                        } else {
                            $('#msg_all').attr('class', 'alert alert-success');
                            $('#msg_all').text('Displayed data is secured.');
                        }
                    } else {
                        $('#msg_all').text('No blockchain data found.');
                    }
                });
            }, 2000);
        }
    });
    $.get('/patient/' + pid + '/surgeries', function(data) {
        let surgeries = data.surgery.reverse();
        $('.surgeries li').remove();
        let protected = [];
        for (let i=0; i < surgeries.length; i++) {
            let template = '<div><strong>Name: </strong><span id="sur_name' + i + '"></span></div>';
            template += '<div><strong>Date: </strong><span id="sur_start' + i + '"></span></div>';
            template += '<div><strong>Diagnosis: </strong><span id="sur_diagnosis' + i + '"></span></div><br>'
            $('.surgeries').append('<li>' + template + '</li>');
            $('#sur_name' + i).html(surgeries[i].title);
            $('#sur_start' + i).html(surgeries[i].begdate);
            $('#sur_diagnosis' + i).html(surgeries[i].diagnosis);
            if (surgeries[i].user === null) {
                protected.push({ title: surgeries[i].title, begdate: surgeries[i].begdate, enddate: surgeries[i].enddate, diagnosis: surgeries[i].diagnosis, pid: surgeries[i].pid });
            }
        }
        if (protected.length !== 0) {
            $('#msg_sur').attr('class', 'alert alert-warning');
            $('#msg_sur').text("Validating data's integrity...");
            setTimeout(function() {
                $.post("/blockchain/query", { "eid": null, "pid": pid, "type": "sur" }, function(res) {
                    let bcData = JSON.parse(res).reverse();
                    
                    if (bcData.length !== 0) {
                        let faulty_indices = [];
                        for (let j=0; j < bcData.length; j++) {
                            if (!isEquivalent(bcData[j], protected[j])) {
                                faulty_indices.push(j); // Abnormal
                            } 
                        }
                        if (faulty_indices.length !== 0) {
                            $('#msg_sur').attr('class', 'alert alert-danger');
                            $('#msg_sur').text('Displayed data has inconsistencies in the following indices: ' + faulty_indices.join(', ') + '. Fixing alterations...');
                            // Introduce 2s delay for visualization
                            setTimeout(function() {
                                let counter = 0;
                                faulty_indices.forEach(function(index) {
                                    delete bcData[index].pid;
                                    delete bcData[index].org;
                                    $.post("/api/surgery/update/" + pid + '/' + data.sids[index], { "surgery": JSON.stringify(bcData[index]) }, function(res) {
                                        counter++;
                                        if (counter === faulty_indices.length) {
                                            setTimeout(function() {
                                                location.reload(true);
                                            }, 5000);
                                        }
                                    });
                                });
                            }, 2000);
                        } else {
                            $('#msg_sur').attr('class', 'alert alert-success');
                            $('#msg_sur').text('Displayed data is secured.');
                        }
                    } else {
                        $('#msg_sur').text('No blockchain data found.');
                    }
                });
            }, 2000);
        }
    });
}

function insurance(pid) {
    $("#a div.hidding").each(function() {
        $(this).fadeOut();
    });
    $("#c div.hidding").each(function() {
        $(this).fadeOut();
    });
    $("#b div.hidding").each(function(index) {
        $(this).delay(500*index).fadeIn(1000);
    });
    $.get('/patient/insurance/primary/' + pid, function(response) {
        if (response.status === 200) {
            let insurance = response.insurance;
            $("#update_p").css('display', '');
            $("#addnew_p").css('display', 'none');
            // Display insurance
            // Basic Data
            $(".primary #ins_provider").html(insurance.provider);
            $(".primary #ins_plan").html(insurance.plan_name);
            $(".primary #ins_policy").html(insurance.policy_number);
            $(".primary #ins_group").html(insurance.group_number);
            $(".primary #ins_type").html(insurance.policy_type);
            $(".primary #ins_date").html(insurance.date);
            $(".primary #ins_copay").html(insurance.copay);
            // Subscriber Data
            if (insurance.subscriber_mname) {
                var full_name = insurance.subscriber_fname + ' ' + insurance.subscriber_mname + ' ' + insurance.subscriber_lname;
            } else {
                var full_name = insurance.subscriber_fname + ' ' + insurance.subscriber_lname;
            }
            $(".primary #sub_name").html(full_name);
            $(".primary #sub_rel").html(insurance.subscriber_relationship);
            $(".primary #sub_ssn").html(insurance.subscriber_ss);
            $(".primary #sub_dob").html(insurance.subscriber_DOB);
            $(".primary #sub_address").html(insurance.subscriber_street + ', ' + insurance.subscriber_city + ', ' + insurance.subscriber_state + ' ' + insurance.subscriber_postal_code + ' ' + insurance.subscriber_country);
            // Employer Data
            $(".primary #emp_name").html(insurance.subscriber_employer);
            $(".primary #emp_address").html(insurance.subscriber_employer_street + ', ' + insurance.subscriber_employer_city + ', ' + insurance.subscriber_employer_state + ' ' + insurance.subscriber_employer_postal_code + ' ' + insurance.subscriber_employer_country);
        } else {
            $("#update_p").css('display', 'none');
            $("#addnew_p").css('display', '');
        }
    });
    $.get('/patient/insurance/secondary/' + pid, function(response) {
        if (response.status === 200) {
            let insurance = response.insurance;
            $("#update_s").css('display', '');
            $("#addnew_s").css('display', 'none');
            // Display insurance
            // Basic Data
            $(".secondary #ins_provider").html(insurance.provider);
            $(".secondary #ins_plan").html(insurance.plan_name);
            $(".secondary #ins_policy").html(insurance.policy_number);
            $(".secondary #ins_group").html(insurance.group_number);
            $(".secondary #ins_type").html(insurance.policy_type);
            $(".secondary #ins_date").html(insurance.date);
            $(".secondary #ins_copay").html(insurance.copay);
            // Subscriber Data
            if (insurance.subscriber_mname) {
                var full_name = insurance.subscriber_fname + ' ' + insurance.subscriber_mname + ' ' + insurance.subscriber_lname;
            } else {
                var full_name = insurance.subscriber_fname + ' ' + insurance.subscriber_lname;
            }
            $(".secondary #sub_name").html(full_name);
            $(".secondary #sub_rel").html(insurance.subscriber_relationship);
            $(".secondary #sub_ssn").html(insurance.subscriber_ss);
            $(".secondary #sub_dob").html(insurance.subscriber_DOB);
            $(".secondary #sub_address").html(insurance.subscriber_street + ', ' + insurance.subscriber_city + ', ' + insurance.subscriber_state + ' ' + insurance.subscriber_postal_code + ' ' + insurance.subscriber_country);
            // Employer Data
            $(".secondary #emp_name").html(insurance.subscriber_employer);
            $(".secondary #emp_address").html(insurance.subscriber_employer_street + ', ' + insurance.subscriber_employer_city + ', ' + insurance.subscriber_employer_state + ' ' + insurance.subscriber_employer_postal_code + ' ' + insurance.subscriber_employer_country);
        } else {
            $("#update_s").css('display', 'none');
            $("#addnew_s").css('display', '');
        }
    });
}
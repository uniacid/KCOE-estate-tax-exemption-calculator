$(document).ready(function () {
    // Tooltips
    $(function () {
        $('.fa').popover({trigger: "hover"});
    });
    // Mask inputs
    $('#inputPhone').mask("(000) 000-0000", {placeholder: "(___) ___-____"});
    $('#inputNetWorth').mask("000,000,000,000,000.00", {reverse: true});
    $('#inputPriorExemption').mask("000,000,000,000,000.00", {reverse: true});
    $('#inputPriorSpouseExemption').mask("000,000,000,000,000.00", {reverse: true});
    $('#inputEmail').mask("A", {
        translation: {
            "A": { pattern: /[\w@\-.+]/, recursive: true }
        }
    });
    // Range slider
    $("#inputRange").slider({});
    // Show additional options based on value
    $('input[type=radio][name=marriedOption]').change(function (e) {
        if (this.value === 'yes') {
            $('.inputMarried').removeClass('offset-lg-1');
            $('.inputMarried').addClass('offset-lg-2');
            $('.inputMarried').removeClass('offset-md-2');
            $('.inputMarried').addClass('offset-md-1');
            $('.inputMarried').removeClass('col-md-6');
            $('.inputMarried').addClass('col-md-5');
            $('.inputUseSpouseExemptionOption').removeClass('d-none');
            $('.inputPrenuptialAgreement').removeClass('d-none');
            $('.inputPriorSpouseExemption').removeClass('d-none');
        }
        if (this.value === 'no') {
            $('.inputMarried').removeClass('offset-lg-2');
            $('.inputMarried').addClass('offset-lg-1');
            $('.inputMarried').removeClass('offset-md-1');
            $('.inputMarried').addClass('offset-md-2');
            $('.inputMarried').addClass('col-md-6');
            $('.inputMarried').removeClass('col-md-5');
            $('.inputPriorSpouseExemption').addClass('d-none');
            $('.inputUseSpouseExemptionOption').addClass('d-none');
            $('.inputPrenuptialAgreement').addClass('d-none');
        }
    });

     // Parsley plugin initialization with tweaks to style Parsley for Bootstrap 4
    $("#exemptionForm").parsley({
        errorClass: 'is-invalid text-danger',
        successClass: 'is-valid', // Comment this option if you don't want the field to become green when valid. Recommended in Google material design to prevent too many hints for user experience. Only report when a field is wrong.
        errorsWrapper: '<div class="invalid-feedback"></div>',
        errorTemplate: '<span></span>',
        trigger: 'change'
    }); /* If you want to validate fields right after page loading, just add this here : .validate()*/
    // Parsley full doc is avalailable here : https://github.com/guillaumepotier/Parsley.js/

    //jQuery vars
    var current_fs, next_fs, previous_fs; //fieldsets
    var left, opacity, scale; //fieldset properties which we will animate
    var animating; //flag to prevent quick multi-click glitches
    var $sections = $('.form-section');
    var $inputNetWorth = $('#inputNetWorth');
    var $inputPriorExemption = $('#inputPriorExemption');
    var $inputMarriedOption = $('input[type=radio][name=marriedOption]');
    var $inputPrenuptialAgreement = $('input[type=radio][name=inputPrenuptialAgreement]:checked');
    var $inputUseSpouseExemptionOption = $('input[type=radio][name=inputUseSpouseExemptionOption]:checked');
    var $inputPriorSpouseExemption = $('#inputPriorSpouseExemption');
    var $inputFirstName = $('#inputFirstName');
    var $inputLastName = $('#inputLastName');
    var $inputEmail = $('#inputEmail');
    var $inputPhone = $('#inputPhone');
    var expectedNetworthGrowth = [];
    var expectedNetworthExposure = [];
    var chartData = [];
    var estateTaxRate = 0.06;
    $inputNetWorth.val(15000000);
    setupChartView();

    // Mark the current section with the class 'current'
    function navigateTo(index) {
        $sections.removeClass('current').eq(index).addClass('current');
    }

    // Return the current index by looking at which section has the class 'current'
    function curIndex() {
        return $sections.index($sections.filter('.current'));
    }
    // Get exemption value
    function getExemptions() {
        var exemptionAmount = 3500000;
        var initialExemption = ($inputPriorExemption.val() > 0 ? exemptionAmount - $inputPriorExemption.val() : exemptionAmount);
        if ($inputUseSpouseExemptionOption.val() === 'yes') {
            return initialExemption + ($inputPriorSpouseExemption.val() > 0 ? exemptionAmount - $inputPriorSpouseExemption.val() : exemptionAmount);
        } else {
            return initialExemption;
        }
    }

    function formatCurrency(value) {
        var formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        });

        return formatter.format(value);
    }

    function calcCompoundNetworth(principal, rate, years) {
        return Math.round(principal * Math.pow(1 + rate, years));
    }

    function calcTaxExposure(principal, rate, years) {
        var compoundNetworth = calcCompoundNetworth(principal, rate, years);
        console.log('compoundNetworth', compoundNetworth);
        var taxRate = 0.45;
        var currentExemptions = getExemptions();
        console.log('currentExemptions', currentExemptions);
        return (compoundNetworth - currentExemptions) * taxRate;
    }
    var c = calcTaxExposure(15000000, estateTaxRate, 5);
    console.log('calc', c);

    function setupChartView() {
        var fullName = $inputFirstName.val() + ' ' + $inputLastName.val();
        var month = new Date().toLocaleString('default', { month: 'short' });
        var year = new Date().getFullYear();
        var totalNetworth = $inputNetWorth.val();
        // set name
        $('.namePlaceholder').text(fullName);
        $('.datePlaceholder').text(month + ' ' + year);
        // calc current and future networth
        var currentExposure = calcTaxExposure(totalNetworth, estateTaxRate, 1);
        var fiveYearExposure = calcTaxExposure(totalNetworth, estateTaxRate, 5);
        var fifteenYearExposure = calcTaxExposure(totalNetworth, estateTaxRate, 15);

        $('.networthToday').text(formatCurrency(totalNetworth));
        $('.networthInFiveYears').text(formatCurrency(calcCompoundNetworth(totalNetworth, estateTaxRate, 5)));
        $('.networthInFifteenYears').text(formatCurrency(calcCompoundNetworth(totalNetworth, estateTaxRate, 15)));
        // set data
        chartData = generateExpectedNetworthExposure(totalNetworth);
    }

    // Next button click event
    $(".next").click(function () {
        current_fs = $(this).parent().parent();
        next_fs = $(this).parent().parent().next();
        $('#exemptionForm').parsley().whenValidate({
            group: 'block-' + curIndex()
        }).done(function() {
            if (animating) return false;
            animating = true;
            navigateTo(curIndex() + 1);
            console.log('curindex', curIndex());

            if (curIndex() === 2) {
                $('.form-container').removeClass('col-xl-4');
                $('.header-title').addClass('d-none');
                $('.header-title-step3').removeClass('d-none');
                $('.form-container').addClass('col-xl-8');
                setupChartView();
            } else {
                $('.form-container').removeClass('col-xl-8');
                $('.header-title').removeClass('d-none');
                $('.header-title-step3').addClass('d-none');
                $('.form-container').addClass('col-xl-4');
            }
            //activate next step on progressbar using the index of next_fs
            $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");
            //show the next fieldset
            next_fs.show();
            //hide the current fieldset with style
            current_fs.animate({
                opacity: 0
            }, {
                step: function (now, mx) {
                    //as the opacity of current_fs reduces to 0 - stored in "now"
                    //1. scale current_fs down to 80%
                    scale = 1 - (1 - now) * 0.2;
                    //2. bring next_fs from the right(50%)
                    left = (now * 50) + "%";
                    //3. increase opacity of next_fs to 1 as it moves in
                    opacity = 1 - now;

                    current_fs.css({
                        'transform': 'scale(' + scale + ')',
                        'position': 'absolute'
                    });
                    next_fs.css({
                        'left': left,
                        'opacity': opacity
                    });
                },
                duration: 800,
                complete: function () {
                    current_fs.hide();
                    animating = false;
                },
                //this comes from the custom easing plugin
                easing: 'easeInOutBack'
            });
        });



    });
    // Previous button click event
    $(".previous").click(function () {
        if (animating) return false;
        animating = true;

        current_fs = $(this).parent().parent();
        previous_fs = $(this).parent().parent().prev();
        navigateTo(curIndex() - 1);

        //de-activate current step on progressbar
        $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");

        //show the previous fieldset
        previous_fs.show();
        //hide the current fieldset with style
        current_fs.animate({
            opacity: 0
        }, {
            step: function (now, mx) {
                //as the opacity of current_fs reduces to 0 - stored in "now"
                //1. scale previous_fs from 80% to 100%
                scale = 0.8 + (1 - now) * 0.2;
                //2. take current_fs to the right(50%) - from 0%
                left = ((1 - now) * 50) + "%";
                //3. increase opacity of previous_fs to 1 as it moves in
                opacity = 1 - now;
                current_fs.css({
                    'left': left
                });
                previous_fs.css({
                    'transform': 'scale(' + scale + ')',
                    'opacity': opacity,
                });
            },
            duration: 800,
            complete: function () {
                current_fs.hide();
                animating = false;
                $('#progressbar').animate({'margin-top': '100px'}, 0);
                $('#exemptionForm').animate({height: '0px'}, 0);
            },
            //this comes from the custom easing plugin
            easing: 'easeInOutBack'
        });

    });

    $(".submit").click(function () {
        return false;
    });

    // Prepare sections by setting the `data-parsley-group` attribute to 'block-0', 'block-1', etc.
    $sections.each(function(index, section) {
        $(section).find(':input').attr('data-parsley-group', 'block-' + index);
    });
    navigateTo(0);

    // Pie Chart setup
    // am4core.useTheme(am4themes_animated);

    // var chart = am4core.create("chartdiv", am4charts.PieChart3D);
    // chart.hiddenState.properties.opacity = 0; // this creates initial fade-in

    // chart.data = [
    //     {
    //         label: "Lithuania",
    //         litres: 501.9
    //     },
    //     {
    //         label: "Czech Republic",
    //         litres: 301.9
    //     },
    // ];

    // chart.innerRadius = am4core.percent(40);
    // chart.depth = 64;
    // chart.legend = new am4charts.Legend();
    // chart.legend.position = "bottom";

    // var series = chart.series.push(new am4charts.PieSeries3D());
    // series.dataFields.value = "litres";
    // series.dataFields.depthValue = "litres";
    // series.dataFields.category = "label";
    // series.slices.template.cornerRadius = 5;
    // series.colors.step = 3;
    // series.ticks.template.disabled = true;
    // series.slices.template.tooltipText = "";

    // Themes begin
    am4core.useTheme(am4themes_kelly);
    am4core.useTheme(am4themes_animated);
    // Themes end

    // Create chart instance
    var chart = am4core.create("chartdiv", am4charts.XYChart);
    chart.data = chartData;

    // Create daily series and related axes
    // var dateAxis1 = chart.xAxes.push(new am4charts.DateAxis());
    // dateAxis1.renderer.grid.template.location = 0;
    // dateAxis1.renderer.minGridDistance = 40;

    // var valueAxis1 = chart.yAxes.push(new am4charts.ValueAxis());

    // var series1 = chart.series.push(new am4charts.ColumnSeries());
    // series1.name = "Estimated Tax Exposure";
    // series1.dataFields.valueY = "value";
    // series1.dataFields.dateX = "date";
    // series1.dataFields.categoryX = "category";
    // series1.data = expectedNetworthExposure;
    // series1.xAxis = dateAxis1;
    // series1.yAxis = valueAxis1;
    // series1.tooltipText = "{dateX}: [bold]{valueY}[/]";

    // // Create hourly series and related axes
    // var taxExposureAxis = chart.xAxes.push(new am4charts.DateAxis());
    // taxExposureAxis.title.text = "Year";
    // taxExposureAxis.renderer.grid.template.location = 0;
    // taxExposureAxis.renderer.minGridDistance = 40;
    // taxExposureAxis.renderer.labels.template.disabled = true;
    // taxExposureAxis.renderer.grid.template.disabled = true;
    // taxExposureAxis.renderer.tooltip.disabled = true;

    // var valueAxis2 = chart.yAxes.push(new am4charts.ValueAxis());
    // valueAxis2.title.text = "Estimated Networth Growth";
    // valueAxis2.renderer.opposite = true;
    // valueAxis2.renderer.grid.template.disabled = true;
    // valueAxis2.renderer.labels.template.disabled = true;
    // valueAxis2.renderer.tooltip.disabled = true;

    // var series2 = chart.series.push(new am4charts.LineSeries());
    // series2.name = "Estimated Networth Growth*";
    // series2.dataFields.valueY = "value";
    // series2.dataFields.dateX = "date";
    // series2.data = expectedNetworthGrowth;
    // series2.xAxis = taxExposureAxis;
    // series2.yAxis = valueAxis2;
    // series2.strokeWidth = 3;
    // series2.tooltipText = "{dateX}: [bold]{valueY}[/]";

    // Create axes
    var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "date";
    categoryAxis.title.text = "Year";

    // First value axis
    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = "Estimated Networth Growth*";

    // Second value axis
    var valueAxis2 = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis2.title.text = "Estimated Tax Exposure";
    valueAxis2.renderer.opposite = true;

    // First series
    var series = chart.series.push(new am4charts.ColumnSeries());
    series.dataFields.valueY = "networthGrowth";
    series.dataFields.categoryX = "date";
    series.name = "Estimated Tax Exposure";
    series.tooltipText = "{name}: [bold]{valueY}[/]";

    // Second series
    var series2 = chart.series.push(new am4charts.LineSeries());
    series2.dataFields.valueY = "taxExposure";
    series2.dataFields.categoryX = "date";
    series2.name = "Estimated Networth Growth*";
    series2.tooltipText = "{name}: [bold]{valueY}[/]";
    series2.strokeWidth = 3;
    series2.yAxis = valueAxis2;

    // Legend
    chart.legend = new am4charts.Legend();
    chart.legend.position = "bottom";
    chart.legend.useDefaultMarker = true;
    var markerTemplate = chart.legend.markers.template;
    markerTemplate.width = 40;
    markerTemplate.height = 40;
    markerTemplate.stroke = am4core.color("#ccc");

    // Add cursor
    chart.cursor = new am4charts.XYCursor();

    function generateExpectedNetworthExposure(principal) {
        var data = [];
        var currentDate = new Date();
        var year = currentDate.getFullYear();
        var month = currentDate.getMonth();
        var day = currentDate.getDate();

        data.push({
            category: 'Estimated Tax Exposure',
            date: 'Current (' + year + ')',
            taxExposure: calcTaxExposure(principal, estateTaxRate, 1),
            networthGrowth: calcCompoundNetworth(principal, estateTaxRate, 1)
        });
        // 5 yr exposure
        data.push({
            category: 'Estimated Tax Exposure',
            date: '(' + (year + 5) + ')',
            taxExposure: calcTaxExposure(principal, estateTaxRate, 5),
            networthGrowth: calcCompoundNetworth(principal, estateTaxRate, 5)
        });
        // 15 yr exposure
        data.push({
            category: 'Estimated Tax Exposure',
            date: '(' + (year + 15) + ')',
            taxExposure: calcTaxExposure(principal, estateTaxRate, 15),
            networthGrowth: calcCompoundNetworth(principal, estateTaxRate, 15)
        });

        return data;
    }

    function generateExpectedNetworthGrowth(principal) {
        var data = [];
        var currentDate = new Date();
        var year = currentDate.getFullYear();
        var month = currentDate.getMonth();
        var day = currentDate.getDate();
        // firstDate.setDate(firstDate.getDate() - 10);
        // for(var i = 0; i < 10 * 24; i++) {
        //     var newDate = new Date(firstDate);
        // newDate.setHours(newDate.getHours() + i);

        //     if (i == 0) {
        //         var value = Math.round(Math.random() * 10) + 1;
        //     } else {
        //         var value = Math.round(data[data.length - 1].value / 100 * (90 + Math.round(Math.random() * 20)) * 100) / 100;
        //     }
        // data.push({
        //     date: newDate,
        //     value: value
        // });
        // }
        // Current exposure
        //  data.push({
        //     date: currentDate,
        //     value: 0
        // });
         data.push({
            category: 'Estimated Net Worth',
            date: new Date(year + 1, month, day),
            value: calcCompoundNetworth(principal, estateTaxRate, 1)
        });
        // 5 yr exposure
        data.push({
            category: 'Estimated Net Worth',
            date: new Date(year + 5, month, day),
            value: calcCompoundNetworth(principal, estateTaxRate, 5)
        });
        // 15 yr exposure
        data.push({
            category: 'Estimated Net Worth',
            date: new Date(year + 15, month, day),
            value: calcCompoundNetworth(principal, estateTaxRate, 15)
        });

        return data;
    }
});
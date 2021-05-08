$(document).ready(function () {
    // Tooltips
    $(function () {
        $('.fa').popover({trigger: "hover"});
    });
    // Mask inputs
    $('#inputPhone').mask("(000) 000-0000", {placeholder: "(___) ___-____"});
    $('#inputNetWorth, #chartNetWorth').mask("000,000,000,000,000.00", {reverse: true});
    $('#inputPriorExemption, #chartPriorExemption').mask("000,000,000,000,000.00", {reverse: true});
    $('#inputPriorSpouseExemption, #chartPriorSpouseExemption').mask("000,000,000,000,000.00", {reverse: true});
    $('#chartFirstAnalysis, #chartSecondAnalysis').mask("000", {reverse: true});
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
    // Input vars
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
    // Create chart instance
    var chart = am4core.create("chartdiv", am4charts.XYChart);
    // Chart input vars
    var $chartNetWorth = $('#chartNetWorth');
    var $chartNetworthGrowthRate = $('#chartNetworthGrowthRate');
    var $chartFirstAnalysis = $('#chartFirstAnalysis');
    var $chartSecondAnalysis = $('#chartSecondAnalysis');
    var $chartPriorExemption = $('#chartPriorExemption');
    var $chartSpouseExemptionOption = $('input[type=radio][name=chartSpouseExemptionOption]:checked');
    var $chartPriorSpouseExemption = $('#chartPriorSpouseExemption');
    // Data
    var expectedNetworthGrowth = [];
    var expectedNetworthExposure = [];
    var chartData = [];
    var estateTaxRate = 0.06;

    // Mark the current section with the class 'current'
    function navigateTo(index) {
        $sections.removeClass('current').eq(index).addClass('current');
    }

    // Return the current index by looking at which section has the class 'current'
    function curIndex() {
        return $sections.index($sections.filter('.current'));
    }
    // Get exemption value
    function getExemptions(step) {
        var exemptionAmount = 3500000;
        if (step !== 3) {
            var initialExemption = ($inputPriorExemption.cleanVal() > 0 ? exemptionAmount - $inputPriorExemption.cleanVal() : exemptionAmount);
            if ($inputUseSpouseExemptionOption.val() === 'yes') {
                return initialExemption + ($inputPriorSpouseExemption.val() > 0 ? exemptionAmount - $inputPriorSpouseExemption.val() : exemptionAmount);
            } else {
                return initialExemption;
            }
        } else {
            var initialExemption = ($chartPriorExemption.cleanVal() > 0 ? exemptionAmount - $chartPriorExemption.cleanVal() : exemptionAmount);
            if ($chartSpouseExemptionOption.val() === 'yes') {
                return initialExemption + ($chartPriorSpouseExemption.val() > 0 ? exemptionAmount - $chartPriorSpouseExemption.val() : exemptionAmount);
            } else {
                return initialExemption;
            }
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
        console.log('calcTaxExposure', [principal, rate, years]);
        var compoundNetworth = calcCompoundNetworth(principal, rate, years);
        console.log('compoundNetworth', compoundNetworth);
        var taxRate = 0.45;
        var currentExemptions = getExemptions();
        console.log('currentExemptions', currentExemptions);
        return (compoundNetworth - currentExemptions) * taxRate;
    }

    function setupChartView() {
        var fullName = $inputFirstName.val() + ' ' + $inputLastName.val();
        var month = new Date().toLocaleString('default', { month: 'short' });
        var year = new Date().getFullYear();
        var totalNetworth = $inputNetWorth.cleanVal();
        console.log('totalNetworth', totalNetworth);
        // set name
        $('.namePlaceholder').text(fullName);
        $('.datePlaceholder').text(month + ' ' + year);
        // calc current and future networth
        $('.networthToday').text(formatCurrency(totalNetworth));
        $('.networthInFiveYears').text(formatCurrency(calcCompoundNetworth(totalNetworth, estateTaxRate, 5)));
        $('.networthInFifteenYears').text(formatCurrency(calcCompoundNetworth(totalNetworth, estateTaxRate, 15)));
        // set data
        chartData = generateExpectedNetworthExposure(totalNetworth);
        chart.data = chartData;
        // set step 3 fields
        $chartNetWorth.val(totalNetworth);
        $chartNetworthGrowthRate.val(estateTaxRate);
        $chartFirstAnalysis.val(5);
        $chartSecondAnalysis.val(15);
        $chartPriorExemption.val($inputPriorExemption.val());
        $chartPriorSpouseExemption.val($inputPriorSpouseExemption.val());
    }

    function updateChartView() {
        var totalNetworth = $chartNetWorth.cleanVal();
        var newEstateTaxRate = $chartNetworthGrowthRate.cleanVal();
        var newFirstYear = $chartFirstAnalysis.cleanVal();
        var newSecondYear = $chartSecondAnalysis.cleanVal();
        var newPriorExemption = $chartPriorExemption.cleanVal();
        var newPriorSpouseExemption = $chartPriorSpouseExemption.val();
        var useSpouseExemptionOption = $chartSpouseExemptionOption.val();
        // calc current and future networth
        $('.networthToday').text(formatCurrency(totalNetworth));
        $('.networthInFiveYears').text(formatCurrency(calcCompoundNetworth(totalNetworth, estateTaxRate, 5)));
        $('.networthInFifteenYears').text(formatCurrency(calcCompoundNetworth(totalNetworth, estateTaxRate, 15)));
        // set data
        chartData = generateExpectedNetworthExposure(totalNetworth);
        chart.data = chartData;
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

    // $(".submit").click(function () {
    //     return false;
    // });

    $("#updateChartView").click(function () {
        updateChartView();
    });

    // Prepare sections by setting the `data-parsley-group` attribute to 'block-0', 'block-1', etc.
    $sections.each(function(index, section) {
        $(section).find(':input').attr('data-parsley-group', 'block-' + index);
    });
    navigateTo(0);

    // Themes begin
    am4core.useTheme(am4themes_kelly);
    am4core.useTheme(am4themes_animated);
    // Themes end

    // Create axes
    var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "date";
    categoryAxis.title.text = "Year";
    categoryAxis.cursorTooltipEnabled = false;

    // First value axis
    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = "Estimated Networth Growth*";
    valueAxis.cursorTooltipEnabled = false;

    // Second value axis
    var valueAxis2 = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis2.title.text = "Estimated Tax Exposure";
    valueAxis2.renderer.opposite = true;
    valueAxis2.cursorTooltipEnabled = false;

    // First series
    var series = chart.series.push(new am4charts.ColumnSeries());
    series.dataFields.valueY = "networthGrowth";
    series.dataFields.categoryX = "date";
    series.name = "Estimated Networth Growth*";
    series.tooltipText = "{name}: [bold]{valueY}[/]";

    // Second series
    var series2 = chart.series.push(new am4charts.LineSeries());
    series2.dataFields.valueY = "taxExposure";
    series2.dataFields.categoryX = "date";
    series2.name = "Estimated Tax Exposure";
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
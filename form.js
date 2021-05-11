var formJquery = jQuery.noConflict(true);
console.log('jquery ver', formJquery.fn.jquery);
formJquery(document).ready(function () {
    function setupForm() {
        // Hide dynamics generated form
        formJquery('form[name=entity-form]').hide();

        // Tooltips
        formJquery('.fa').popover({trigger: 'hover'});
        // Mask inputs
        formJquery('#inputPhone').mask('(000) 000-0000', {placeholder: '(___) ___-____'});
        formJquery('#inputNetWorth, #chartNetWorth').mask('000,000,000,000,000', {reverse: true});
        formJquery('#inputPriorExemption, #chartPriorExemption').mask('000,000,000,000,000', {reverse: true});
        formJquery('#inputPriorSpouseExemption, #chartPriorSpouseExemption').mask('000,000,000,000,000', {reverse: true});
        formJquery('#chartFirstAnalysis, #chartSecondAnalysis').mask('000', {reverse: true});
        formJquery('#inputEmail').mask('A', {
            translation: {
                'A': { pattern: /[\w@\-.+]/, recursive: true }
            }
        });
        // Range slider
        // formJquery('#inputRange').slider({});
        // Show additional options based on value
        formJquery('input[type=radio][name=inputUseSpouseExemptionOption]').change(function (e) {
            if (this.value === 'yes') {
                formJquery('.inputPriorSpouseExemption').removeClass('d-none');
            } else {
                formJquery('.inputPriorSpouseExemption').addClass('d-none');
            }
        });
        formJquery('input[type=radio][name=marriedOption]').change(function (e) {
            if (this.value === 'yes') {
                formJquery('.inputMarried').removeClass('offset-lg-1');
                formJquery('.inputMarried').addClass('offset-lg-2');
                formJquery('.inputMarried').removeClass('offset-md-2');
                formJquery('.inputMarried').addClass('offset-md-1');
                formJquery('.inputMarried').removeClass('col-md-6');
                formJquery('.inputMarried').addClass('col-md-5');
                formJquery('.inputUseSpouseExemptionOption').removeClass('d-none');
                formJquery('.inputPrenuptialAgreement').removeClass('d-none');
            }
            if (this.value === 'no') {
                formJquery('.inputMarried').removeClass('offset-lg-2');
                formJquery('.inputMarried').addClass('offset-lg-1');
                formJquery('.inputMarried').removeClass('offset-md-1');
                formJquery('.inputMarried').addClass('offset-md-2');
                formJquery('.inputMarried').addClass('col-md-6');
                formJquery('.inputMarried').removeClass('col-md-5');
                formJquery('.inputUseSpouseExemptionOption').addClass('d-none');
                formJquery('.inputPrenuptialAgreement').addClass('d-none');
            }
        });

        // Parsley plugin initialization with tweaks to style Parsley for Bootstrap 4
       formJquery('#exemptionForm').parsley({
           errorClass: 'is-invalid text-danger',
           successClass: 'is-valid', // Comment this option if you don't want the field to become green when valid. Recommended in Google material design to prevent too many hints for user experience. Only report when a field is wrong.
           errorsWrapper: '<div class=\'invalid-feedback\'></div>',
           errorTemplate: '<span></span>',
           trigger: 'change'
       }); /* If you want to validate fields right after page loading, just add this here : .validate()*/
       // Parsley full doc is avalailable here : https://github.com/guillaumepotier/Parsley.js/
    }


    //jQuery vars
    var current_fs, next_fs, previous_fs; //fieldsets
    var left, opacity, scale; //fieldset properties which we will animate
    var animating; //flag to prevent quick multi-click glitches
    var sections = formJquery('.form-section');
    // Input vars
    var inputNetWorth = formJquery('#inputNetWorth');
    var inputPriorExemption = formJquery('#inputPriorExemption');
    var inputMarriedOption = formJquery('input[type=radio][name=marriedOption]');
    var inputPrenuptialAgreement = formJquery('input[type=radio][name=inputPrenuptialAgreement]:checked');
    var inputUseSpouseExemptionOption = formJquery('input[type=radio][name=inputUseSpouseExemptionOption]:checked');
    var inputPriorSpouseExemption = formJquery('#inputPriorSpouseExemption');
    var inputFirstName = formJquery('#inputFirstName');
    var inputLastName = formJquery('#inputLastName');
    var inputEmail = formJquery('#inputEmail');
    var inputPhone = formJquery('#inputPhone');
    // Create chart instance
    var chart = am4core.create('chartdiv', am4charts.XYChart);
    // Chart input vars
    var chartNetWorth = formJquery('#chartNetWorth');
    var chartNetworthGrowthRate = formJquery('#chartNetworthGrowthRate');
    var chartFirstAnalysis = formJquery('#chartFirstAnalysis');
    var chartSecondAnalysis = formJquery('#chartSecondAnalysis');
    var chartPriorExemption = formJquery('#chartPriorExemption');
    var chartSpouseExemptionOption = formJquery('input[type=radio][name=chartSpouseExemptionOption]:checked');
    var chartPriorSpouseExemption = formJquery('#chartPriorSpouseExemption');
    // Data
    var expectedNetworthGrowth = [];
    var expectedNetworthExposure = [];
    var chartData = [];
    var estateTaxRate = 0.06;

    // Mark the current section with the class 'current'
    function navigateTo(index) {
        sections.removeClass('current').eq(index).addClass('current');
    }

    // Return the current index by looking at which section has the class 'current'
    function curIndex() {
        return sections.index(sections.filter('.current'));
    }
    // Get exemption value
    function getExemptions(step) {
        var exemptionAmount = 3500000;
        if (step !== 3) {
            var initialExemption = (inputPriorExemption.cleanVal() > 0 ? exemptionAmount - inputPriorExemption.cleanVal() : exemptionAmount);
            if (inputUseSpouseExemptionOption.val() === 'yes') {
                return initialExemption + (inputPriorSpouseExemption.val() > 0 ? exemptionAmount - inputPriorSpouseExemption.val() : exemptionAmount);
            } else {
                return initialExemption;
            }
        } else {
            var initialExemption = (chartPriorExemption.cleanVal() > 0 ? exemptionAmount - chartPriorExemption.cleanVal() : exemptionAmount);
            if (chartSpouseExemptionOption.val() === 'yes') {
                return initialExemption + (chartPriorSpouseExemption.val() > 0 ? exemptionAmount - chartPriorSpouseExemption.val() : exemptionAmount);
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
        var compoundNetworth = calcCompoundNetworth(principal, rate, years);
        var taxRate = 0.45;
        var currentExemptions = getExemptions();
        return (compoundNetworth - currentExemptions) * taxRate;
    }

    function setupChartView() {
        var fullName = inputFirstName.val() + ' ' + inputLastName.val();
        var month = new Date().toLocaleString('defaut', { month: 'short' });
        var year = new Date().getFullYear();
        var totalNetworth = inputNetWorth.cleanVal();
        // set name
        formJquery('.namePlaceholder').text(fullName);
        formJquery('.datePlaceholder').text(month + ' ' + year);
        // calc current and future networth
        formJquery('.networthToday').text(formatCurrency(totalNetworth));
        formJquery('.networthInFiveYears').text(formatCurrency(calcCompoundNetworth(totalNetworth, estateTaxRate, 5)));
        formJquery('.networthInFifteenYears').text(formatCurrency(calcCompoundNetworth(totalNetworth, estateTaxRate, 15)));
        // set data
        chartData = generateExpectedNetworthExposure(totalNetworth);
        chart.data = chartData;
        // set step 3 fields
        chartNetWorth.val(chartNetWorth.masked(totalNetworth));
        chartNetworthGrowthRate.val(estateTaxRate);
        chartFirstAnalysis.val(5);
        chartSecondAnalysis.val(15);
        chartPriorExemption.val(inputPriorExemption.val());
        chartPriorSpouseExemption.val(inputPriorSpouseExemption.val());
    }

    function submitFormValues() {
        // Map form back yo MS Dynamics fields and submit form
        // entity[ownerid]
        // entity[new_estimatednetworth]
        // entity[new_estatecalc_exemptionamt_primary]
        // entity[kcoe_currentlymarried]
        // entity[new_estatecalc_usespouseexemption_yn]
        // entity[new_estatecalc_exemptionamt_secondary]
        // entity[new_estatecalc_prenuppercentages]
        // entity[firstname]
        // entity[lastname]
        // entity[emailaddress1]'
        // entity[telephone1]
        // entity[companyname]
        // <input type='hidden' id='entity[ownerid]' name='entity[ownerid]' value=' class='form-control'></input>
        // <input type='hidden' name='form_name' value='entity-form-609971ea8bc2e'>
        // <input type='hidden' id='_wpnonce' name='_wpnonce' value='3fa7357515'>
        // <input type='hidden' name='_wp_http_referer' value='/2021-estate-tax-calculator/'>
        // <input type='hidden' name='entity_form_entity' value='lead'>
        // <input type='hidden' name='entity_form_name' value='estate calculator lead form'>
        // <input type='submit' value='Submit' class='btn btn-default' name='entity_form_submit'></input>
    }

    function updateChartView() {
        var totalNetworth = chartNetWorth.cleanVal();
        var newEstateTaxRate = chartNetworthGrowthRate.val();
        var newFirstYear = chartFirstAnalysis.cleanVal();
        var newSecondYear = chartSecondAnalysis.cleanVal();
        var newPriorExemption = chartPriorExemption.cleanVal();
        var newPriorSpouseExemption = chartPriorSpouseExemption.val();
        var useSpouseExemptionOption = chartSpouseExemptionOption.val();
        // calc current and future networth
        formJquery('.networthToday').text(formatCurrency(totalNetworth));
        formJquery('.networthInFiveYears').text(formatCurrency(calcCompoundNetworth(totalNetworth, estateTaxRate, 5)));
        formJquery('.networthInFifteenYears').text(formatCurrency(calcCompoundNetworth(totalNetworth, estateTaxRate, 15)));
        // set data
        chartData = generateExpectedNetworthExposure(totalNetworth);
        chart.data = chartData;
    }

    // Next button click event
    formJquery('.next').click(function () {
        var nextIndex = curIndex() + 1;
        current_fs = formJquery('fieldset.form-section.current');
        next_fs = formJquery('fieldset.form-section').eq(nextIndex);
        console.log('nextIndex', nextIndex);
        console.log('sections', sections);
        console.log('current_fs', current_fs);
        console.log('next_fs', next_fs);
        formJquery('#exemptionForm').parsley().whenValidate({
            group: 'block-' + curIndex()
        }).done(function() {
            if (animating) return false;
            animating = true;
            navigateTo(nextIndex);

            if (curIndex() === 2) {
                formJquery('.form-container').removeClass('col-xl-4').removeClass('col-lg-4').removeClass('col-md-8');
                formJquery('.header-title').addClass('d-none');
                formJquery('.header-title-step3').removeClass('d-none');
                formJquery('.form-container').addClass('col-xl-8').addClass('col-lg-12').addClass('col-md-12');
                setupChartView();
            } else {
                formJquery('.form-container').removeClass('col-xl-8').removeClass('col-lg-12').removeClass('col-md-12');
                formJquery('.header-title').removeClass('d-none');
                formJquery('.header-title-step3').addClass('d-none');
                formJquery('.form-container').addClass('col-xl-4').addClass('col-lg-4').addClass('col-md-8');
            }
            //activate next step on progressbar using the index of next_fs
            formJquery('#progressbar li').eq(nextIndex).addClass('active');
            //show the next fieldset
            next_fs.show();
            //hide the current fieldset with style
            current_fs.hide();
            animating = false;
            // current_fs.animate({
            //     opacity: 0
            // }, {
            //     step: function (now, mx) {
            //         //as the opacity of current_fs reduces to 0 - stored in 'now'
            //         //1. scale current_fs down to 80%
            //         scale = 1 - (1 - now) * 0.2;
            //         //2. bring next_fs from the right(50%)
            //         left = (now * 50) + '%';
            //         //3. increase opacity of next_fs to 1 as it moves in
            //         opacity = 1 - now;

            //         current_fs.css({
            //             'transform': 'scale(' + scale + ')',
            //             'position': 'absolute'
            //         });
            //         next_fs.css({
            //             'left': left,
            //             'opacity': opacity
            //         });
            //     },
            //     duration: 800,
            //     complete: function () {
            //         current_fs.hide();
            //         animating = false;
            //     },
            //     //this comes from the custom easing plugin
            //     // easing: 'easeInOutBack'
            // });
        });



    });
    // Previous button click event
    formJquery('.previous').click(function () {
        if (animating) return false;
        animating = true;

        var prevIndex = curIndex() - 1;
        current_fs = formJquery('fieldset.form-section.current');
        previous_fs = formJquery('fieldset.form-section').eq(prevIndex);

        navigateTo(prevIndex);

        //de-activate current step on progressbar
        formJquery('#progressbar li').eq(prevIndex).removeClass('active');

        //show the previous fieldset
        previous_fs.show();
        //hide the current fieldset with style
        current_fs.hide();
        animating = false;
        // current_fs.animate({
        //     opacity: 0
        // }, {
        //     step: function (now, mx) {
        //         //as the opacity of current_fs reduces to 0 - stored in 'now'
        //         //1. scale previous_fs from 80% to 100%
        //         scale = 0.8 + (1 - now) * 0.2;
        //         //2. take current_fs to the right(50%) - from 0%
        //         left = ((1 - now) * 50) + '%';
        //         //3. increase opacity of previous_fs to 1 as it moves in
        //         opacity = 1 - now;
        //         current_fs.css({
        //             'left': left
        //         });
        //         previous_fs.css({
        //             'transform': 'scale(' + scale + ')',
        //             'opacity': opacity,
        //         });
        //     },
        //     duration: 800,
        //     complete: function () {
        //         current_fs.hide();
        //         animating = false;
        //         formJquery('#progressbar').animate({'margin-top': '100px'}, 0);
        //         formJquery('#exemptionForm').animate({height: '0px'}, 0);
        //     },
        //     //this comes from the custom easing plugin
        //     easing: 'easeInOutBack'
        // });

    });

    // formJquery('.submit').click(function () {
    //     return false;
    // });

    formJquery('#updateChartView').click(function () {
        updateChartView();
    });

    // Setup form
    // if (formJquery('form[name=entity-form]').length) {
        setupForm();
    // }

    // Prepare sections by setting the `data-parsley-group` attribute to 'block-0', 'block-1', etc.
    sections.each(function(index, section) {
        formJquery(section).find(':input').attr('data-parsley-group', 'block-' + index);
    });
    navigateTo(0);

    // Themes begin
    am4core.useTheme(am4themes_kelly);
    am4core.useTheme(am4themes_animated);
    // Themes end

    // Create axes
    var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = 'date';
    categoryAxis.title.text = 'Year';
    categoryAxis.cursorTooltipEnabled = false;

    // First value axis
    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = 'Estimated Networth Growth*';
    valueAxis.cursorTooltipEnabled = false;

    // Second value axis
    var valueAxis2 = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis2.title.text = 'Estimated Tax Exposure';
    valueAxis2.renderer.opposite = true;
    valueAxis2.cursorTooltipEnabled = false;

    // First series
    var series = chart.series.push(new am4charts.ColumnSeries());
    series.dataFields.valueY = 'networthGrowth';
    series.dataFields.categoryX = 'date';
    series.name = 'Estimated Networth Growth*';
    series.tooltipText = '{name}: [bold]{valueY}[/]';

    // Second series
    var series2 = chart.series.push(new am4charts.LineSeries());
    series2.dataFields.valueY = 'taxExposure';
    series2.dataFields.categoryX = 'date';
    series2.name = 'Estimated Tax Exposure';
    series2.tooltipText = '{name}: [bold]{valueY}[/]';
    series2.strokeWidth = 3;
    series2.yAxis = valueAxis2;

    // Legend
    chart.legend = new am4charts.Legend();
    chart.legend.position = 'bottom';
    chart.legend.useDefaultMarker = true;
    var markerTemplate = chart.legend.markers.template;
    markerTemplate.width = 40;
    markerTemplate.height = 40;
    markerTemplate.stroke = am4core.color('#ccc');

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
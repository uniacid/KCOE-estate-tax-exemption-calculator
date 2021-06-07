var formJquery = jQuery.noConflict(true);
// console.log('jquery ver', formJquery.fn.jquery);
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
                formJquery('.inputMarried').removeClass('offset-lg-0');
                // formJquery('.inputMarried').removeClass('offset-xl-2');
                formJquery('.inputMarried').addClass('offset-lg-1');
                // formJquery('.inputMarried').addClass('offset-xl-3');
                formJquery('.inputMarried').removeClass('offset-md-2');
                formJquery('.inputMarried').addClass('offset-md-1');
                formJquery('.inputMarried').removeClass('col-md-5');
                formJquery('.inputMarried').addClass('col-md-4');
                formJquery('.inputUseSpouseExemptionOption').removeClass('d-none');
            }
            if (this.value === 'no') {
                // formJquery('.inputMarried').addClass('offset-xl-2');
                // formJquery('.inputMarried').removeClass('offset-xl-3');
                formJquery('.inputMarried').removeClass('offset-lg-1');
                formJquery('.inputMarried').addClass('offset-lg-0');
                formJquery('.inputMarried').removeClass('offset-md-1');
                formJquery('.inputMarried').addClass('offset-md-2');
                formJquery('.inputMarried').addClass('col-md-5');
                formJquery('.inputMarried').removeClass('col-md-4');
                formJquery('.inputUseSpouseExemptionOption').addClass('d-none');
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
    var inputPriorSpouseExemption = formJquery('#inputPriorSpouseExemption');
    var inputFirstName = formJquery('#inputFirstName');
    var inputLastName = formJquery('#inputLastName');
    var inputCompanyName = formJquery('#inputCompanyName');
    var inputEmail = formJquery('#inputEmail');
    var inputPhone = formJquery('#inputPhone');
    // Create chart instance
    var chart = am4core.create('chartdiv', am4charts.XYChart);
    var futureLawChart = am4core.create('futurechartdiv', am4charts.XYChart);
    // Chart input vars
    var chartNetWorth = formJquery('#chartNetWorth');
    var chartNetworthGrowthRate = formJquery('#chartNetworthGrowthRate');
    var chartFirstAnalysis = formJquery('#chartFirstAnalysis');
    var chartSecondAnalysis = formJquery('#chartSecondAnalysis');
    var chartPriorExemption = formJquery('#chartPriorExemption');
    var chartPriorSpouseExemption = formJquery('#chartPriorSpouseExemption');
    // Data
    var expectedNetworthGrowth = [];
    var expectedNetworthExposure = [];
    var chartData = [];
    var estateTaxRate = 0.06;
    var formHasBeenSubmitted = false;

    // Mark the current section with the class 'current'
    function navigateTo(index) {
        sections.removeClass('current').eq(index).addClass('current');
    }

    // Return the current index by looking at which section has the class 'current'
    function curIndex() {
        return sections.index(sections.filter('.current'));
    }
    // Get exemption value
    function getExemptions(current, updateVals, years) {
        var chartSpouseExemptionOption = formJquery('input[name=chartSpouseExemptionOption]:checked').val();
        var inputUseSpouseExemptionOption = formJquery('input[name=inputUseSpouseExemptionOption]:checked').val();
        var chartPriorSpouseExemption = formJquery('#chartPriorSpouseExemption').val();
        var inputMarriedOption = formJquery('input[name=marriedOption]:checked').val();
        var inflationRate = 0.02;
        var exemptionAmount = 11700000;
        var exemptionSunsetAmount = 5490000;
        if (!current) {
            exemptionAmount = 3500000;
        }
        if (current) {
            if (years > 1 && years < 5) {
                exemptionAmount = Math.round((exemptionAmount * (1 + inflationRate)) ^ years);
            }
            if (years >= 5) {
                exemptionAmount = Math.round(exemptionSunsetAmount * Math.pow(1 + inflationRate, years + 3) / 10000) * 10000;
            }
        }
        if (!updateVals) {
            var initialExemption = (inputPriorExemption.cleanVal() > 0 ? exemptionAmount - inputPriorExemption.cleanVal() : exemptionAmount);
            if (inputUseSpouseExemptionOption === 'yes') {
                return initialExemption + (inputPriorSpouseExemption.val() > 0 ? exemptionAmount - inputPriorSpouseExemption.val() : exemptionAmount);
            } else {
                return initialExemption;
            }
        } else {
            var initialExemption = (chartPriorExemption.cleanVal() > 0 ? exemptionAmount - chartPriorExemption.cleanVal() : exemptionAmount);
            if (chartSpouseExemptionOption === 'yes') {
                var exempt = initialExemption + (chartPriorSpouseExemption > 0 ? exemptionAmount - chartPriorSpouseExemption : exemptionAmount);
                return exempt;
            } else {
                return initialExemption;
            }
        }
    }

    function formatCurrency(value) {
        var formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });

        return formatter.format(value);
    }

    function calcCompoundNetworth(principal, rate, years) {
        if (years === 1) {
            return principal;
        }
        return Math.round(principal * Math.pow(1 + rate, years) / 1000) * 1000;
    }

    function calcTaxExposure(principal, rate, years, current, updateVals) {
        var compoundNetworth = calcCompoundNetworth(principal, rate, years);
        var currentTaxRate = 0.40;
        var futureTaxRate = 0.45;
        var taxRate = currentTaxRate;
        var currentExemptions = getExemptions(current, updateVals, years);
        if (!current) {
            taxRate = futureTaxRate;
        }
        if (years === 1 && principal < currentExemptions) {
            return null;
        }
        if (years === 1) {
            var exposure = Math.round((principal - currentExemptions) * taxRate / 1000) * 1000;
            return (exposure >= 0) ? exposure : null;
        }
        if (years > 1) {
            var exposure = Math.round((compoundNetworth - currentExemptions) * taxRate / 1000) * 1000;
            return (exposure >= 0) ? exposure : null;
        }
    }

    function setupChartView() {
        var fullName = inputFirstName.val() + ' ' + inputLastName.val();
        var month = new Date().toLocaleString('defaut', { month: 'short' });
        var year = new Date().getFullYear();
        var totalNetworth = inputNetWorth.cleanVal();
        var inputUseSpouseExemptionOption = formJquery('input[name=inputUseSpouseExemptionOption]:checked');
        // set name
        formJquery('.namePlaceholder').text(fullName);
        formJquery('.datePlaceholder').text(month + ' ' + year);
        // calc current and future networth
        formJquery('.networthToday').text(formatCurrency(totalNetworth));
        formJquery('.networthInFirstAnalysis').text(formatCurrency(calcCompoundNetworth(totalNetworth, estateTaxRate, 5)));
        formJquery('.networthInSecondAnalysis').text(formatCurrency(calcCompoundNetworth(totalNetworth, estateTaxRate, 15)));
        // set data
        generateExpectedNetworthExposure(totalNetworth, null, 5, 15, false);

        // set step 3 fields
        chartNetWorth.val(chartNetWorth.masked(totalNetworth));
        chartNetworthGrowthRate.val(estateTaxRate * 100);
        chartFirstAnalysis.val(5);
        chartSecondAnalysis.val(15);
        chartPriorExemption.val(inputPriorExemption.val());
        chartPriorSpouseExemption.val(inputPriorSpouseExemption.val());
        // Set chart use spouse exemption option
        formJquery('input[name=chartSpouseExemptionOption][value=' + inputUseSpouseExemptionOption.val() + ']').prop('checked', true);
    }

    function submitFormValues() {
        // Map form back yo MS Dynamics fields and submit form
        var formData = buildFormData();
        // entity[firstname]: Olympia
        // entity[lastname]: Dickerson
        // entity[companyname]: Williamson and Hamilton Co
        // entity[emailaddress1]: zanomi@mailinator.net
        // entity[telephone1]: +1 (519) 142-3096
        // entity[new_estimatednetworth]: 10000000
        // entity[new_estatecalc_exemptionamt_primary]: 0
        // entity[kcoe_currentlymarried]: 0
        // entity[new_estatecalc_usespouseexemption_yn]: 0
        // entity[new_estatecalc_exemptionamt_secondary]: 0
        // form_name: entity-form-609c19a17bcfc
        // _wpnonce: 4b131e5b8f
        // _wp_http_referer: /estate-tax-calculator-2021-dynamics-form/
        // entity_form_entity: lead
        // entity_form_name: estate calculator lead form
        // entity_form_submit: Submit

        formHasBeenSubmitted = true;
        formJquery.post('https://www.kcoe.com/2021-estate-tax-calculator/', formData)
        .done(function (result, status, xhr) {
            console.log('Form submitted successfully', [result, status, xhr]);
        })
        .fail(function (xhr, status, error) {
            console.log('Form submit failed', [xhr, status, error]);
        });
    }

    function buildFormData() {
        var formData = {};
        var wponce = formJquery('#_wpnonce');
        var form_name = formJquery('input[name=form_name]');
        var inputMarriedOption = formJquery('input[name=marriedOption]:checked');
        var inputUseSpouseExemptionOption = formJquery('input[name=inputUseSpouseExemptionOption]:checked');
        // build form entities with our collected data
        formData['entity[firstname]'] = (inputFirstName.val() ? inputFirstName.val() : '');
        formData['entity[lastname]'] = (inputLastName.val() ? inputLastName.val() : '');
        formData['entity[emailaddress1]'] = (inputEmail.val() ? inputEmail.val() : '');
        formData['entity[telephone1]'] = (inputPhone.cleanVal() ? inputPhone.cleanVal() : '');
        formData['entity[companyname]'] = (inputCompanyName.val() ? inputCompanyName.val() : '');

        formData['entity[new_estimatednetworth]'] = (inputNetWorth.cleanVal() ? inputNetWorth.cleanVal() : '0');
        formData['entity[new_estatecalc_exemptionamt_primary]'] = (inputPriorExemption.cleanVal() ? inputPriorExemption.cleanVal() : '0');
        formData['entity[new_estatecalc_exemptionamt_secondary]'] = (inputPriorSpouseExemption.cleanVal() ? inputPriorSpouseExemption.cleanVal() : '0');
        formData['entity[kcoe_currentlymarried]'] = (inputMarriedOption.val() === 'yes' ? 1 : 0);
        formData['entity[new_estatecalc_usespouseexemption_yn]'] = (inputUseSpouseExemptionOption.val() === 'yes' ? 1: 0);

        // Hidden fields
        formData['entity_form_entity'] = 'lead';
        formData['entity_form_name'] = 'estate calculator lead form';
        formData['entity_form_submit'] = 'Submit';
        formData['form_name'] = (form_name.val() ? form_name.val() : '');
        formData['_wpnonce'] = (wponce.val() ? wponce.val() : '');

        return formData;
    }
    // Update charts/view
    function updateChartView() {
        var totalNetworth = chartNetWorth.cleanVal();
        var newEstateTaxRate = chartNetworthGrowthRate.val();
        var newFirstYear = parseInt(chartFirstAnalysis.cleanVal());
        var newSecondYear = parseInt(chartSecondAnalysis.cleanVal());
        // calc current and future networth
        newEstateTaxRate = newEstateTaxRate / 100;
        formJquery('.networthToday').text(formatCurrency(totalNetworth));
        formJquery('.networthGrowthRate').text(chartNetworthGrowthRate.val());
        formJquery('.networthInFirstAnalysis').text(formatCurrency(calcCompoundNetworth(totalNetworth, newEstateTaxRate, newFirstYear)));
        formJquery('.networthAnalysisTimeFirst').text('In ' + newFirstYear + ' Years');
        formJquery('.networthInSecondAnalysis').text(formatCurrency(calcCompoundNetworth(totalNetworth, newEstateTaxRate, newSecondYear)));
        formJquery('.networthAnalysisTimeSecond').text('In ' + newSecondYear + ' Years');
        // set data
        generateExpectedNetworthExposure(totalNetworth, newEstateTaxRate, newFirstYear, newSecondYear, true);
    }

    // Next button click event
    formJquery('.next').click(function () {
        var nextIndex = curIndex() + 1;
        current_fs = formJquery('fieldset.form-section.current');
        next_fs = formJquery('fieldset.form-section').eq(nextIndex);
        formJquery('#exemptionForm').parsley().whenValidate({
            group: 'block-' + curIndex()
        }).done(function() {
            if (animating) return false;
            animating = true;
            navigateTo(nextIndex);

            if (curIndex() === 1) {
                formJquery('.header-title').addClass('d-none');
                formJquery('.header-title-step2').removeClass('d-none');
                formJquery('#progressbar li:last-child').addClass('progressbar-active');
            }
            if (curIndex() === 2) {
                formJquery('.form-container').removeClass('col-xl-4').removeClass('col-lg-4').removeClass('col-md-8');
                formJquery('.header-title-step2').addClass('d-none');
                formJquery('.header-title-step3').removeClass('d-none');
                formJquery('.form-container').addClass('col-xl-8').addClass('col-lg-12').addClass('col-md-12');
                // Setup chart
                setupChartView();
                // Submit form
                if (!formHasBeenSubmitted) {
                    submitFormValues();
                }
            }
            if (curIndex() < 2) {
                formJquery('.form-container').removeClass('col-xl-8').removeClass('col-lg-12').removeClass('col-md-12');
                formJquery('.form-container').addClass('col-xl-4').addClass('col-lg-4').addClass('col-md-8');
            }
            //activate next step on progressbar using the index of next_fs
            formJquery('#progressbar li').eq(nextIndex).addClass('active');
            //show the next fieldset
            next_fs.show();
            //hide the current fieldset with style
            current_fs.hide();
            animating = false;
        });



    });
    // Previous button click event
    formJquery('.previous').click(function () {
        if (animating) return false;
        animating = true;

        var currentIndex = curIndex();
        var prevIndex = curIndex() - 1;
        current_fs = formJquery('fieldset.form-section.current');
        previous_fs = formJquery('fieldset.form-section').eq(prevIndex);

        navigateTo(prevIndex);

        if (curIndex() === 0) {
            formJquery('.header-title').removeClass('d-none');
            formJquery('.header-title-step2').addClass('d-none');
            formJquery('#progressbar li:last-child').removeClass('progressbar-active');
        }
        if (curIndex() === 1) {
            formJquery('.header-title-step3').addClass('d-none');
            formJquery('.header-title-step2').removeClass('d-none');
        }

        if (curIndex() < 2) {
            formJquery('.form-container').removeClass('col-xl-8').removeClass('col-lg-12').removeClass('col-md-12');
            // formJquery('.header-title').removeClass('d-none');
            // formJquery('.header-title-step3').addClass('d-none');
            formJquery('.form-container').addClass('col-xl-4').addClass('col-lg-4').addClass('col-md-8');
        }

        //de-activate current step on progressbar
        formJquery('#progressbar li').eq(currentIndex).removeClass('active');

        //show the previous fieldset
        previous_fs.show();
        //hide the current fieldset with style
        current_fs.hide();
        animating = false;
    });

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

    // Pie Chart setup
    // var pieChart = am4core.create('piechartdiv', am4charts.PieChart3D);
    // pieChart.hiddenState.properties.opacity = 0; // this creates initial fade-in
    // pieChart.innerRadius = am4core.percent(40);
    // pieChart.depth = 20;

    // var seriesPie = pieChart.series.push(new am4charts.PieSeries3D());
    // seriesPie.dataFields.value = 'value';
    // seriesPie.dataFields.depthValue = 'value';
    // seriesPie.dataFields.category = 'label';
    // seriesPie.slices.template.cornerRadius = 5;
    // seriesPie.colors.step = 3;
    // seriesPie.labels.template.disabled = false;
    // seriesPie.ticks.template.disabled = true;
    // seriesPie.labels.template.text = '${value.value}';
    // seriesPie.labels.template.tooltipText = '{category}: ${value.value}';
    // seriesPie.slices.template.propertyFields.fill = 'color';

    // // Legend
    // pieChart.legend = new am4charts.Legend();
    // pieChart.legend.position = 'bottom';
    // pieChart.legend.useDefaultMarker = true;
    // pieChart.legend.valueLabels.template.text = '${value.value}';

    // Create axes
    var dateAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    dateAxis.dataFields.category = 'date';
    dateAxis.title.text = 'Year';
    dateAxis.cursorTooltipEnabled = false;

    // First value axis
    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = '';
    valueAxis.min = 0;
    valueAxis.strictMinMax = true;
    valueAxis.cursorTooltipEnabled = false;
    // valueAxis.tooltipText = '[bold]${value.value}[/]';

    // Second value axis
    var valueAxis2 = chart.yAxes.push(new am4charts.ValueAxis());
    // valueAxis2.title.text = 'Estimated Estate Tax Exposure';
    valueAxis2.renderer.opposite = true;
    valueAxis2.min = 0;
    valueAxis2.strictMinMax = true;
    valueAxis2.cursorTooltipEnabled = false;
    // valueAxis2.tooltipText = '[bold]${value.value}[/]';
    valueAxis2.fill = am4core.color('#FFB2B2');

    // First series
    var series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.valueY = 'netEstateToBeneficiaries';
    series.dataFields.categoryX = 'date';
    series.name = 'Net Estate to Beneficiaries';
    series.tooltipText = '{name} [bold]${valueY}[/]';
    series.strokeWidth = 3;
    series.fillOpacity = 0.2;
    series.stroke = am4core.color('#66B7DC');
    // series.yAxis = valueAxis;
    series.fill = am4core.color('#66B7DC');
    // series.baseAxis = valueAxis;
    series.stacked = true;

    // Second series
    var series2 = chart.series.push(new am4charts.LineSeries());
    series2.dataFields.valueY = 'taxExposure';
    series2.dataFields.categoryX = 'date';
    series2.name = 'Estimated Estate Tax Exposure';
    series2.tooltipText = '{name} [bold]${valueY}[/]';
    series2.strokeWidth = 3;
    series2.fillOpacity = 0.2;
    series2.stroke = am4core.color('#FFB2B2');
    // series2.yAxis = valueAxis2;
    series2.fill = am4core.color('#FFB2B2');
    // series2.baseAxis = valueAxis2;
    series2.stacked = true;
    series2.sequencedInterpolation = true;

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
    chart.cursor.xAxis = dateAxis;

    // Future chart
    // Create axes
    var futureDateAxis = futureLawChart.xAxes.push(new am4charts.CategoryAxis());
    futureDateAxis.dataFields.category = 'date';
    futureDateAxis.title.text = 'Year';
    futureDateAxis.cursorTooltipEnabled = false;

    // First value axis
    var futureValueAxis = futureLawChart.yAxes.push(new am4charts.ValueAxis());
    futureValueAxis.title.text = '';
    futureValueAxis.min = 0;
    futureValueAxis.strictMinMax = true;
    futureValueAxis.cursorTooltipEnabled = false;
    // futureValueAxis.tooltipText = '[bold]${value.value}[/]';

    // Second value axis
    var futureValueAxis2 = futureLawChart.yAxes.push(new am4charts.ValueAxis());
    // futureValueAxis2.title.text = 'Estimated Estate Tax Exposure';
    futureValueAxis2.renderer.opposite = true;
    futureValueAxis2.min = 0;
    futureValueAxis2.strictMinMax = true;
    futureValueAxis2.cursorTooltipEnabled = false;
    // futureValueAxis2.tooltipText = '[bold]${value.value}[/]';
    futureValueAxis2.fill = am4core.color('#FFB2B2');

    // First series
    var futureSeries = futureLawChart.series.push(new am4charts.LineSeries());
    futureSeries.dataFields.valueY = 'netEstateToBeneficiaries';
    futureSeries.dataFields.categoryX = 'date';
    futureSeries.name = 'Net Estate to Beneficiaries';
    futureSeries.tooltipText = '{name} [bold]${valueY}[/]';
    futureSeries.strokeWidth = 3;
    futureSeries.fillOpacity = 0.2;
    futureSeries.stroke = am4core.color('#66B7DC');
    // futureSeries.yAxis = valueAxis;
    futureSeries.fill = am4core.color('#66B7DC');
    // futureSeries.baseAxis = valueAxis;
    futureSeries.stacked = true;

    // Second series
    var futureSeries2 = futureLawChart.series.push(new am4charts.LineSeries());
    futureSeries2.dataFields.valueY = 'taxExposure';
    futureSeries2.dataFields.categoryX = 'date';
    futureSeries2.name = 'Estimated Estate Tax Exposure';
    futureSeries2.tooltipText = '{name} [bold]${valueY}[/]';
    futureSeries2.strokeWidth = 3;
    futureSeries2.fillOpacity = 0.2;
    futureSeries2.stroke = am4core.color('#FFB2B2');
    // futureSeries2.yAxis = valueAxis2;
    futureSeries2.fill = am4core.color('#FFB2B2');
    // futureSeries2.baseAxis = valueAxis2;
    futureSeries2.stacked = true;
    futureSeries2.sequencedInterpolation = true;

    // Legend
    futureLawChart.legend = new am4charts.Legend();
    futureLawChart.legend.position = 'bottom';
    futureLawChart.legend.useDefaultMarker = true;
    var futureMarkerTemplate = futureLawChart.legend.markers.template;
    futureMarkerTemplate.width = 40;
    futureMarkerTemplate.height = 40;
    futureMarkerTemplate.stroke = am4core.color('#ccc');

    // Add cursor
    futureLawChart.cursor = new am4charts.XYCursor();
    futureLawChart.cursor.xAxis = dateAxis;


    function generateExpectedNetworthExposure(principal, newEstateTaxRate, firstYear, secondYear, updateVals) {
        var data = [];
        var futureData = [];
        var currentDate = new Date();
        var year = currentDate.getFullYear();
        var month = currentDate.getMonth();
        var day = currentDate.getDate();
        if (newEstateTaxRate > 0) {
            estateTaxRate = newEstateTaxRate;
        }
        // set pie chart data
        // pieChart.data = [
        //     {
        //         label: 'Net Estate to Beneficiaries',
        //         value: calcCompoundNetworth(principal, estateTaxRate, 1),
        //         color: am4core.color('#66B7DC')
        //     },
        //     {
        //         label: 'Estimated Estate Tax Exposure - Current (' + year + ')',
        //         value: calcTaxExposure(principal, estateTaxRate, 1),
        //         color: am4core.color('#FFB2B2')
        //     },
        // ];
        // Set chart data for current law
        const currentYrExposure = calcTaxExposure(principal, estateTaxRate, 1, true, updateVals);
        const compoundYr = calcCompoundNetworth(principal, estateTaxRate, 1);
        data.push({
            category: 'Estimated Estate Tax Exposure',
            date: 'Current (' + year + ')',
            taxExposure: currentYrExposure,
            netEstateToBeneficiaries: compoundYr - currentYrExposure
        });
        formJquery('.estateTaxExposureToday').text(formatCurrency(currentYrExposure));
        // First analysis exposure
        const firstYrExposure = calcTaxExposure(principal, estateTaxRate, firstYear, true, updateVals);
        const compoundFirstYr = calcCompoundNetworth(principal, estateTaxRate, firstYear);
        data.push({
            category: 'Estimated Estate Tax Exposure',
            date: '(' + (year + firstYear) + ')',
            taxExposure: firstYrExposure,
            netEstateToBeneficiaries: compoundFirstYr - firstYrExposure
        });
        formJquery('.estateTaxExposureInFirstAnalysis').text(formatCurrency(firstYrExposure));
        // Second analysis exposure
        const secondYrExposure = calcTaxExposure(principal, estateTaxRate, secondYear, true, updateVals);
        const compoundSecondYr = calcCompoundNetworth(principal, estateTaxRate, secondYear);
        data.push({
            category: 'Estimated Estate Tax Exposure',
            date: '(' + (year + secondYear) + ')',
            taxExposure: secondYrExposure,
            netEstateToBeneficiaries: compoundSecondYr - secondYrExposure
        });
        formJquery('.estateTaxExposureInSecondAnalysis').text(formatCurrency(secondYrExposure));
        // set xyaxis chart data
        chart.data = data;

        // Set future law chart data
        const futureCurrentYrExposure = calcTaxExposure(principal, estateTaxRate, 1, false, updateVals);
        futureData.push({
            category: 'Estimated Estate Tax Exposure',
            date: 'Current (' + year + ')',
            taxExposure: futureCurrentYrExposure,
            netEstateToBeneficiaries: calcCompoundNetworth(principal, estateTaxRate, 1) - futureCurrentYrExposure
        });
        formJquery('.futureEstateTaxExposureToday').text(formatCurrency(futureCurrentYrExposure));
        // First analysis exposure
        const futureFirstYrExposure = calcTaxExposure(principal, estateTaxRate, firstYear, false, updateVals);
        futureData.push({
            category: 'Estimated Estate Tax Exposure',
            date: '(' + (year + firstYear) + ')',
            taxExposure: futureFirstYrExposure,
            netEstateToBeneficiaries: calcCompoundNetworth(principal, estateTaxRate, firstYear) - futureFirstYrExposure
        });
        formJquery('.futureEstateTaxExposureInFirstAnalysis').text(formatCurrency(futureFirstYrExposure));
        // Second analysis exposure
        const futureSecondYrExposure = calcTaxExposure(principal, estateTaxRate, secondYear, false, updateVals);
        futureData.push({
            category: 'Estimated Estate Tax Exposure',
            date: '(' + (year + secondYear) + ')',
            taxExposure: futureSecondYrExposure,
            netEstateToBeneficiaries: calcCompoundNetworth(principal, estateTaxRate, secondYear) - futureSecondYrExposure
        });
        formJquery('.futureEstateTaxExposureInSecondAnalysis').text(formatCurrency(futureSecondYrExposure));
        // set xyaxis chart data
        futureLawChart.data = futureData;
    }
});
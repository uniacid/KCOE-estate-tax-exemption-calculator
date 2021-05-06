$(document).ready(function () {
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
            $('.inputSpouseExemptionOption').removeClass('d-none');
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
            $('.inputSpouseExemptionOption').addClass('d-none');
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

    //jQuery time
    var current_fs, next_fs, previous_fs; //fieldsets
    var left, opacity, scale; //fieldset properties which we will animate
    var animating; //flag to prevent quick multi-click glitches
    // var fieldValid = true;
    var $sections = $('.form-section');

    function navigateTo(index) {
        // Mark the current section with the class 'current'
        $sections.removeClass('current').eq(index).addClass('current');
    }

    function curIndex() {
        // Return the current index by looking at which section has the class 'current'
        return $sections.index($sections.filter('.current'));
    }

    $(".next").click(function () {
        current_fs = $(this).parent().parent();
        next_fs = $(this).parent().parent().next();

        $('#exemptionForm').parsley().whenValidate({
            group: 'block-' + curIndex()
        }).done(function() {
            if (animating) return false;
            animating = true;
            navigateTo(curIndex() + 1);
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

    // var chart = am4core.create("chartdiv", am4charts.PieChart);
    // var chart;

    am4core.useTheme(am4themes_animated);

    var chart = am4core.create("chartdiv", am4charts.PieChart3D);
    chart.hiddenState.properties.opacity = 0; // this creates initial fade-in

    chart.data = [
        {
            country: "Lithuania",
            litres: 501.9
        },
        {
            country: "Czech Republic",
            litres: 301.9
        },
    ];

    chart.innerRadius = am4core.percent(40);
    chart.depth = 120;

    chart.legend = new am4charts.Legend();
    chart.legend.position = "bottom";

    var series = chart.series.push(new am4charts.PieSeries3D());
    series.dataFields.value = "litres";
    series.dataFields.depthValue = "litres";
    series.dataFields.category = "country";
    series.slices.template.cornerRadius = 5;
    series.colors.step = 3;


});
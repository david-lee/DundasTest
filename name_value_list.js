// define a root namespace and sub-namespace view
var nameValue = {view:{}};

// add replaceAll method to the String prototype
if(typeof String.replaceAll === "undefined") {
    String.prototype.replaceAll = function(regexp, replaceValue) {
        return this.replace(new RegExp(regexp, 'g'), replaceValue);
    }
}

(function($){
    // make a shortcut for the namespace
    var nv = nameValue;

    // configurations for the app
    nv.configs = {
        inputContainerId: '#nv-input-container',
        inputErrorMsgId: '#input-error-msg',
        nvListContainerId: '#nv-list-container',
        nvNavigationId: '#nv-list-navigation',
        nvListBodyId: '#nv-list-body',
        nvPairTemplateId: '#nv-pair-template',
        nvPairXmlTemplateId: '#nv-pair-xml-template',
        nvTotalCountId: '#total-count',
        nvExportView: '#nv-export-view',
        inputDelimiter: '='
    };

    // total number of pairs
    nv.totalCount = 0;

    // it is like a main function in C
    // it should be enhanced to bind view and model later
    nv.controller = function() {
        var initialize = function(options) {
            // reset default configs if custom options are passed
            $.extend(nv.configs, options);

            // initialize home view and show it
            nv.view.home.initialize();
        };

        return {
            initialize: initialize
        }
    }();

    nv.view.home = function() {
        // cache jQuery objects to handle events on links and buttons
        var $inputContainer = $(nv.configs.inputContainerId),
            $input = $inputContainer.find(":text"),
            $inputError = $(nv.configs.inputErrorMsgId),
            $nvListContainer = $(nv.configs.nvListContainerId),
            $nvListBody = $(nv.configs.nvListBodyId),
            $nvTotalCount = $(nv.configs.nvTotalCountId),
            // this inName and inValue are populated during the validation
            inName, inValue;

        // attach all event handlers to the target elements like buttons and links
        var initialize = function() {
            // attach an event handler to input text box to enter name value pair
            $inputContainer.on('keypress', 'input', addPairOnDone);
            $inputContainer.on('click', '#nv-add-button', addPairOnDone);

            // attach an event handler to the checkbox to select all pairs
            $nvListContainer.on('click', 'thead input', selectAllOnClick);

            $nvListContainer.on('click', '#menu-export', exportOnClick);

            $nvListContainer.on('click', '#menu-delete', deletePairOnClick);

            // attach an event handler to sort the pair list by name or value
            $nvListBody.on('click', '#name-col-head, #value-col-head', sortPairsOnClick);

            //$nvListBody.on('dblclick', '.name-col, .value-col', updatePairOnDblClick);

            // add custom events
            $nvListContainer.on('deletePair', deletePair);
            // update the total count on addPair custom event
            $nvTotalCount.on('updateCount', function(evt, newTotalCount){
                $nvTotalCount.text(newTotalCount);
            });
        };

        var displayErrorMessage = function(msg) {
            $inputError.text(msg);
        };

        var clearErrorMessage = function() {
            $inputError.text('');
        };

        // hide name and value list view to show other view like export view
        var hide = function() {
            $inputContainer.hide();
            $nvListContainer.hide();
        };

        var show = function() {
            $inputContainer.show();
            $nvListContainer.show();
        };

        // show export view
        var exportOnClick = function() {
            hide();
            nv.view.exportPair.initialize();
        };

        /*
        var updatePairOnDblClick = function(evt) {
            var $target = $(evt.target),
                text = $target.text(),
                top = $target.offset().top,
                left = $target.offset().left,
                width = $target.width();

            $('<input type="text" value="'+text+'" />')
                .css({position:'absolute', top:top, left:left, width:width})
                .click(function(){
                })
                .blur()
                .appendTo('body');
        };
        */
        // sort the pair list with asc or desc
        var sortPairsOnClick = function() {
            var clickCount = 0, // it keeps being increased
                pairRow,
                prevTarget,
                $tbody = $('tbody');

            return function(evt) {
                var sortOrder = [1, -1], // 1: asc, -1: desc
                    arrows = [".downarrow", ".uparrow"],
                    targetClass = evt.target.getAttribute('class');

                $($('td.'+targetClass).sort(function(a, b){
                    // sortOrder array is used to make the list sorted with asc or desc
                    // as a user clicks the same column several times
                    return ($(a).text() > $(b).text() ? 1 : -1)*sortOrder[clickCount%2];
                })).each(function(){
                    // at this point the pair list has been sorted
                    pairRow = $(this).parent();
                    $tbody.append(pairRow);
                });

                // hide arrow symbol for the other column
                if(prevTarget) {
                    $(prevTarget).find('span').hide();
                }

                // save the current target
                prevTarget = evt.target;

                // show arrow symbol for the current column based on sort order: asc or desc
                $(evt.target).find(arrows[clickCount%2]).show();
                $(evt.target).find(arrows[clickCount%2?0:1]).hide();

                clickCount++;
            }
        }();

        // toggle all other checkboxes
        var selectAllOnClick = function() {
            $nvListBody.find("tbody input:checkbox").each(function(){
                this.checked = $nvListBody.find('thead input:checkbox').is(':checked');
            });
        };

        var isAlphaNumeric = function(text) {
            // regular expression to get only alpha-numeric characters
            var alphanumericExpr = /^[a-z0-9]+$/i;

            return alphanumericExpr.test(text);
        };

        var isNameDuplicated = function(name) {
            var isDup = false,
                $nameCol;
            $(nv.configs.nvListBodyId).find('tbody tr').each(function(){
                $nameCol = $(this).find('.name-col');
                if(name === $nameCol.text()) {
                    isDup = true;
                    displayErrorMessage("There is the same name in the list.");
                    // change the duplicated pair name and reset after few sec
                    $nameCol.css({"background-color":"#FF2222"});
                    setTimeout(function() {$nameCol.css({"background-color":"#FFFFFF"})}, 1000);

                    return false;
                }
            });

            return isDup;
        };

        // validate input name and value pair
        // 1. the format should be 'name = value'
        // 2. names and values can contain only alpha-numeric characters
        // 3. delimiter is '=' and should be only one
        // 4. spaces before and/or after the delimiter may be allowed and will be ignored
        // 5. name should not be duplicated
        var isPairValidate = function() {
            var nvArray,
                inputPair = $input.val();

            // clear previous error message
            clearErrorMessage();

            // check the delimiter
            nvArray = inputPair.split(nv.configs.inputDelimiter);

            // if the length is 1, it means there is no delimiter which is an error
            // if the length is 3 and over, it means there are delimiters more than one which is an error
            if(nvArray.length != 2) {
                displayErrorMessage("Please enter the correct delimiter '=' between name and value.");
                return false;
            }

            // remove all spaces in the name and the value
            inName = $.trim(nvArray[0]);
            inValue = $.trim(nvArray[1]);

            // check the name and the value if it has only alpha-numerica characters
            if(!isAlphaNumeric(inName) || !isAlphaNumeric(inValue)) {
                displayErrorMessage("Only alpha-numeric characters are allowed for the name and the value.");
                return false;
            }

            // check duplicity
            if(isNameDuplicated(inName))
                return false;

            return true;
        };

        // add a pair to the list
        var addPairOnDone = function(evt) {
            // if the keypress is not enter key or mouse click is triggered on the Add button
            // if there is no value or
            // if the name value pair is not validate then just return
            if((evt.type !== 'click' && evt.keyCode !== 13) || !$input.val() || !isPairValidate())
                return;
            else if(evt.type === 'click' && (!$input.val() || !isPairValidate()))
                return;

            // get one pair template which is defined script tag in the html
            var nvPairTmpl = $(nv.configs.nvPairTemplateId).html(),
                // create a variable object to populate the template with input name and value
                params = {name:inName, value:inValue};

            // populate the name and the value to the pair template
            for(var i in params)
                nvPairTmpl = nvPairTmpl.replaceAll("\\{"+i+"\\}", params[i]);

            // add the new pair to top of the list
            $(nvPairTmpl).prependTo('tbody');

            // call addPair custom event to update the count
            $nvTotalCount.trigger('updateCount', ++nv.totalCount);

            if($nvListContainer.is(':hidden'))
                $nvListContainer.show();
        };

        // thisPair - clicked checkbox DOM element
        var deletePair = function(evt, thisPair) {
            $(thisPair).closest('tr').remove();

            $nvTotalCount.trigger('updateCount', --nv.totalCount);
        };

        var deletePairOnClick = function(evt) {
            $nvListBody.find('tbody tr input:checked').each(function(){
                $nvListContainer.trigger('deletePair', this);
            });

            // if there is no more pair list then hide list container
            if(nv.totalCount == 0) {
                $nvListContainer.hide();
                $('thead input').removeAttr('checked');
                $('thead span').hide();
            }
        };

        return {
            initialize: initialize,
            show: show
        }
    }();

    // view object to manage export view
    nv.view.exportPair = function() {
        var $nvExportView = $(nv.configs.nvExportView);

        var initialize = function() {
            $nvExportView.on('click', '#nv-export-header span:last', hide);
            $nvExportView.on('click', '#export-xml, #export-csv', exportOnClick);

            // show this export view
            show('xml');
        };

        // export object to create each type
        // for now it supports XML and CSV type
        var _export = {
            get: function(type) {
                // call export method based on the type
                return this[type]();
            },

            forEachPair: function(callback) {
                var $this,
                    params = [];

                // get all pair's name and value
                $(nv.configs.nvListBodyId).find('tbody tr').each(function(){
                    $this = $(this);
                    params.push({name: $this.find('.name-col').text(), value: $this.find('.value-col').text()});
                });

                callback(params);
            },

            xml: function() {
                // <root> is a kind of dummy tag to make <pairs> real root tag
                // $.html() return all child elements inside the current tag
                // so if <pairs> is the root, the $.html() will return without the tag
                // which is not well-formed xml because there is no root tag
                var $xml = $('<root><pairs></pairs></root>'),
                    exportXmlTmpl;

                this.forEachPair(function(params){
                    var i, len, exportXmlTmpl;

                    for(i = 0, len = params.length; i < len; i++) {
                        // get xml template in html
                        exportXmlTmpl = $(nv.configs.nvPairXmlTemplateId).html();

                        for(var j in params[i])
                            exportXmlTmpl = exportXmlTmpl.replaceAll("\\{"+j+"\\}", params[i][j]);

                        // append all child in  the pairs tag
                        $xml.find('pairs').append(exportXmlTmpl);
                    }
                });

                // it returns all child xml inside <root>
                return $xml.html();
            },

            csv: function() {
                var csv = "";

                this.forEachPair(function(params){
                    for(var i in params)
                        csv += params[i].name + "," + params[i].value + "\n";
                });

                return csv;
            }
        };

        // show the converted data into textarea which is readonly
        var showExportedPair = function(type) {
            $nvExportView.find('textarea').val(_export.get(type));
        };

        var exportOnClick = function(evt) {
            // extract export type from id which is like export-xml
            var type = evt.target.id.split('-')[1].toLocaleLowerCase();
            showExportedPair(type);
        };

        // by default it shows the pair list in XML format
        var show = function(type) {
            $nvExportView.show();
            showExportedPair(type);
        };

        var hide = function() {
            // hide export view
            $nvExportView.hide();
            // reset the export type to default which is xml
            $('#export-xml').get(0).checked = true;
            // move to the home view
            nv.view.home.show();
        };

        return {
            initialize: initialize
        }
    }();

    // begin the app when the DOM is ready
    $(document).ready(function(){
        nv.controller.initialize();
    });

})(jQuery);
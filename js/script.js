// mockDB: declaring variables needed for mocking data base (variables are defined on the end of this script)
var mockDB,
    countDataElements;

$(document).ready(function() {

    var myTable = $('#myTable'),       // table element
        body = $('body');              // body element

    // Table Configuration
    $(myTable).DataTable( {
        data: mockDB,
        columns: [
            { title: "Tag ID" },
            { title: "Tag Name" },
            { title: "Tag Type" },
            { title: "My Feed" },
            { title: "My Favourite" },
            {
              title: "Actions",
              bSortable: false,
              defaultContent: `<span class="editRowAction glyphicon glyphicon-pencil"></span><span class="deleteRowAction glyphicon glyphicon-remove"></span>`
            }
        ],
        columnDefs: [
                    {
                      render: function (data, type, row) {
                        return '<span class="editRowAction colorTagName">' + data + '</span>';
                      },
                      targets: 1
                    },
                    {
                      render: function (data, type, row) {
                        return data === true ? '<span class="move-icon glyphicon glyphicon-ok"></span><span class="hide-text">true</span>' : '<span class="hide-text">false</span>';
                      },
                      targets: [3, 4]
                    }
        ],
        "info":     false,      // hiding info bar
        pagingType: "full_numbers",
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        pageLength: 10,          // default page length

        language: {             // This is optional: text from pagination buttons
          paginate: {           // are replaced with images via css hack.
            first: '‹‹',
            previous: '‹',
            next: '›',
            last: '››'
          },
          aria: {
            paginate: {
              first: 'First',
              previous: 'Previous',
              next: 'Next',
              last: 'Last'
            }
          }
        }
    });

    // Setup of Search Row - add a text input to few footer cell
    $('#myTable tfoot th.colsearch').each(function() {
        $(this).html('<input class="table-search-inputs" type="text" />');
    });

    // Setup of Search Row - add a select to few footer cell
    $('#myTable tfoot th.colselect').each(function() {
        $(this).html(`<select>
                        <option value="">All</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>`);
    });


    // DataTable
    var table = $('#myTable').DataTable();

    // Apply the search and select inside of thead (via tfooter)
    table.columns().every(function() {
        var _this = this;
 
        $('input', this.footer()).on('keyup change', function() {
            if (_this.search() !== this.value) {
                _this.search( this.value ).draw();
            }
        });

        $('select', this.footer()).on('change', function() {
                        var val = $.fn.dataTable.util.escapeRegex($(this).val() );
                        _this.search( val ? '^'+val+'$' : '', true, false ).draw();
                    });
    });


    /* *** TABLE STYLING *** */

      var myTable_wrapper = $('#myTable_wrapper'),
          globalSearch = $('#myTable_filter input'),          // search input for whole table
          tableSearch = $('.table-search-inputs'),            // search inputs from table header
          addNewButton = $('#AddNewButton'),                  // button from header that opens Add New Modal 
          headerOfPage = $('header');                         // header of html document
      $('#myTable tfoot tr').prependTo('#myTable thead');     // set column filters on top of table
      $('#myTable_length').appendTo(myTable_wrapper);         // set Table Length Option on the bottom of table
      $('<br/>').insertBefore(globalSearch);                  // styling Main Filter Input

      /* dynamic events */
      body.on('contextmenu', function(e) {                    // event handler that prevents contextmenu to open on right click
        e.preventDefault();
      })

      globalSearch.on('focus click', function() {             // scroll to top of header on focus
        $('html, body').animate({                             // on search input for whole table
          scrollTop: $(headerOfPage).offset().top
        }, 300);
      });

      tableSearch.on('focus click', function() {              // scroll to top of the table on focus
        $('html, body').animate({                             // on search input from table header
          scrollTop: $(myTable).offset().top
        }, 300);
      });

      addNewButton.on('click', function() {                   // scroll to top of header on click
        $('html, body').animate({                             // on button that opens Add New Modal
          scrollTop: $(headerOfPage).offset().top
        }, 300);
      });

      /* end dynamic events */
    /* *** END TABLE STYLING *** */

    /* *** Row Context Menu *** */
    var rowMenuContent =                                      // template of the row menu
       `<div class="contextMenu text-center">
          <div class="contextmenuContainer">
            <div class="menuIcon text-center">
              <div class="icon-container">
                <span class="menuNewIco glyphicon glyphicon-plus"></span>
              </div>
            </div>
            <div class="menuIcon text-center">
              <div class="icon-container">
                <span class="menuEditIco glyphicon glyphicon-pencil"></span>
              </div>
              <div class="icon-container">
                <span class="menuDeleteIco"></span>
              </div>
            </div>
          </div>
        </div>`;

    $(rowMenuContent).prependTo(body);                        // implementation of element inside of body element

    var rowMenu = $('.contextMenu'),                          // taking reference to the row menu element
        selectedRowContext,                                   // selected row
        menuIsOpen = false,                                   // is context menu already open?
        openingAnimOver = false,                              // is animation of opening of ContextMenu over?
        contextChoice = false,                                // is actions chosen from Contextmenu?
        iconContainer = $('.icon-container'),                 // containers for contextmenu icons
        contextNewIcon = $('.menuNewIco'),                    // add new icon from row context menu
        contextDelIcon = $('.menuDeleteIco'),                 // delete icon from row context menu 
        contextEditIcon = $('.menuEditIco');                  // edit icon from row context menu

    myTable.on('contextmenu dblclick', 'tr:not(:has(th))', openContexMenu); // show the menu on right click on table row that doesn't contain th element
    rowMenu.on('mouseleave', exitContexMenu);                 // events that trigger closing event of ContextMenu

    body.on('click contextmenu', exitIfOpen);                 // close open contextmenu on body click or rightclick
    $('select').on('focus', exitIfOpen);                      // close open contextmenu on focus one of select elements

    function exitIfOpen() {
      if (menuIsOpen) exitContexMenu();
    }

    function contextNewCall(e) {
      e.stopPropagation();                                    // important: to prevent closing of modal on propagated body click event
      exitContexMenu(e);
      openNewModal();                                         // function from Add New Modal section
    }
    function contextEditCall(e) {
      contextChoice = true;                                   // this means that preapreEditModal() later knows...
      prepareEditModal(e);                                    // that it is invoked from contextmenu (that's important for logic!)
    }
    function contextDelCall(e) {
      contextChoice = true;                                   // this means that openDialog() later knows...
      openDialog(e);                                          // that it is invoked from contextmenu (that's important for logic!)
    }

    function exitContexMenu(e) {
      if (e) e.preventDefault();
      if (!dialogIsOpen) {                                    // only if delete row dialog is open... (if contextDelIcon is clicked)
        selectedRowContext.removeClass('rowHighlight');       // unmark selected table row
      }
      rowMenu.css('display', 'none');                         // hide row context menu
      menuIsOpen = false;
      openingAnimOver = false;
    }

    function startIcoAnimations() {
      if (openingAnimOver) {                                  // this is how to prevent bug on contextmenu event in Chrome browser
        $(this).addClass('icon-container-active');            // adding active class to icon-container that contain hovered icon

        let caseOne = $(this).children().hasClass('menuNewIco'),      // icon container contain span element with class...
            caseTwo = $(this).children().hasClass('menuDeleteIco'), 
            caseThree = $(this).children().hasClass('menuEditIco');

        if (caseOne) contextNewIcon.addClass('menuNewIco-hover');     // ...and hover class to it.
        if (caseTwo) contextDelIcon.addClass('menuDeleteIco-hover');  // (this must be done via javascript because css hover animations are buggy in this case:
        if (caseThree) contextEditIcon.addClass('menuEditIco-hover'); // at Chrome browser, icons are hovered before end of animation)

        iconContainer.not(this)
                            .css({'opacity': '.7',            // animation of inactive icons
                                  'background-color': 'transparent',
                                  'transform': 'scale(.8) rotate(-30deg)'
                                });
        $(this).css({'background-color': '#FFFFFF',           // animation of active icon
                     'transform': 'scale(1.05) rotate(-30deg)'});
      }
    }

    function endIcoAnimations() {
      $(this).removeClass('icon-container-active');

      let caseOne = $(this).children().hasClass('menuNewIco'),        // all explanations are above in startIcoAnimations function
          caseTwo = $(this).children().hasClass('menuDeleteIco'),
          caseThree = $(this).children().hasClass('menuEditIco');

      if (caseOne) contextNewIcon.removeClass('menuNewIco-hover');
      if (caseTwo) contextDelIcon.removeClass('menuDeleteIco-hover');
      if (caseThree) contextEditIcon.removeClass('menuEditIco-hover');

      iconContainer.css({'opacity': '1',               // set all values back
                                'background-color': '#DDDDDD',
                                'transform': 'scale(1) rotate(-30deg)'})
                          .delay(300);                        // to ensure that there will no be twitches between choosing next icon after first one.
    }

    function openContexMenu(e) {
      e.preventDefault();
      e.stopPropagation();
      if (menuIsOpen) exitContexMenu(e);                      // if there is already opened menu, close it
      menuIsOpen = true;
      if (dialogIsOpen) cancelAction();                       // if Delete Row Dialog is opend, close it

      let width = rowMenu.css('width').slice(0, -2),          // taking a width of element
          height = rowMenu.css('height').slice(0, -2),        // taking a height of element
          top = (e.pageY - height / 2) - 8 + 'px',            // -7px for adjusting position relative to top of cursor
          left = (e.pageX - width / 2) + 5 + 'px';            // +5px for fine tunning of position of cursor

      rowMenu.css({'top': top,                                // setting position of element and show element
                  'left': left,
                  'display': 'block',
                  'opacity': '.5',
                  'transform': 'scale(1)'});

      $(rowMenu).animate({opacity: 1}, {                      // animating opacity from .5 to 1 and transform css properties of contextMenu
                                                              // now have start value of .5 (value of opacity was setted in previous expression)

        start: function() {                                   // at the start of animation remove event handlers from all three icons
          contextNewIcon.off('click', contextNewCall);        // removing an event handler
          contextEditIcon.off('click', contextEditCall);      // removing an event handler
          contextDelIcon.off('click', contextDelCall);        // removing an event handler
          rowMenu.off('click contextmenu', exitContexMenu);   // removing an event handler
          iconContainer.off('mouseenter', startIcoAnimations);// 
          iconContainer.off('mouseleave', endIcoAnimations);  //
        },
        step: function(now, fx) {
          let degs = 30 + (now * 360);
          if (now <= 1) {
            $(this).css('transform', 'scale(' + now + ') rotate(' + degs + 'deg)');
          }
        },
        done: function() {                                    // at the end of animation add event handlers to all three icons
          openingAnimOver = true;                             // set flag that shows that animation is over
          contextNewIcon.on('click', contextNewCall);         // adding event listener to add new icon from contextmenu
          contextEditIcon.on('click', contextEditCall);       // adding event listener to edit icon from contextmenu
          contextDelIcon.on('click', contextDelCall);         // adding event listener to delete icon: click on it opens confirm dialog
          rowMenu.on('click contextmenu', exitContexMenu);    // adding event listeners that trigger closing event of ContextMenu
          iconContainer.on('mouseenter', startIcoAnimations); //
          iconContainer.on('mouseleave', endIcoAnimations);   //
        },
        duration: 250
      });

      selectedRowContext = $(e.target).parents('tr');         // selected row for actions
      selectedRowContext.addClass('rowHighlight');            // mark selected table row
    }
    /* *** END Row Context Menu *** */


    /* *** ADD NEW MODAL *** */

      var addNewModal = $('#addNewModal'),                    // Add New Modal
          // AddNewButton button that opens addNewModal on click is declared in "Table Styling' section
          newModalClose = $('#NewModalClose'),                // close button from Add New Modal
          addNewForm = $('#addNewForm'),                      // form from Add New Modal
          validateMsg = $('#validateMsg'),                    // place inside Add New Modal next to text input for validation message
          addNewCancel = $('#addNewCancel'),                  // cancel button from Add New Modal
          addNewSubmit = $('#addNewSubmit'),                  // submit button from Add New Modal

      // Input Elements of Add New Modal
          newTagName = $('#addNewModal input[type=text]'),    // text input from Add New Modal
          newTagType = $('#addNewModal select option:selected'), // select element
          defaultTagType = 'Football club'                    // default tag type for select element
          newCheckboxes = $('#addNewModal input[type="checkbox"]'); // array like with both checkboxes
          myNewFeed = $(newCheckboxes[0]),                    // first checkbox
          myNewFavourites = $(newCheckboxes[1]),              // second checkbox
          myNewFeedValue = myNewFeed.is(':checked'),          // value of first checkbox
          myNewFavsValue = myNewFavourites.is(':checked');    // value of second checkbox

      
      addNewButton.on('click', openNewModal);
      addNewButton.on('click', enableANMB);                   // adding event listener to add new button to enable buttons from Add New Modal that maybe were disabled after submiting or canceling previous Add New Modal
      addNewSubmit.on('click', submitNewRow);                 // adding event listener to submit button from Add New Modal
      addNewCancel.on('click', cancelNewRow);                 // adding event listener to cancel button from Add New Modal
      newModalClose.on('click', cancelNewRow);                // adding event listener to close button from Add New Modal

      /* Setting autofocus on first text input */
      addNewModal.on('shown.bs.modal', function() {
        enableANMB();
        newTagName.focus();
      })

      /* Validation of Form from Add New Modal */
      addNewForm.validate({                                   // this function is a configuration of jquery-validate plugin. Please, see documentation on plugin site.
        rules: {
          name: {
            required: true,
            minlength: 3
          }
        },
        messages: {
          firstname: "Name is required."
        },
        errorElement: "em",
        errorPlacement: function ( error, element ) {
          error.appendTo(validateMsg);
        },
        highlight: function ( element, errorClass, validClass ) {
          $(element).parent().addClass("has-error").removeClass("has-success");   // formationg text input when form is invalid
          addNewSubmit.prop('disabled', true).css('cursor', 'not-allowed');       // disabling submit button when form is invalid
          newTagName.focus();                                                     // get focus on text input
        },
        unhighlight: function (element, errorClass, validClass) {
          $(element).parent().addClass("has-success").removeClass("has-error");   // formationg text input when form is valid
          addNewSubmit.prop('disabled', false).css('cursor', 'pointer');          // enabling submit button when form is invalid
        }
      });

      function openNewModal() {                               // function that opens Add New Modal when is invoked
        addNewModal.modal({ backdrop: 'static',               // preventing closing the modal with click anywhere outside of modal
                             keyboard: false }); 
        addNewModal.modal('show');
      }

      function disableANMB() {                                // disable buttons from Add New Modal: preventing submiting or canceling twice on double click
        addNewCancel.prop('disabled', true);
        addNewSubmit.prop('disabled', true);
      }

      function enableANMB() {                                 // enable buttons from Add New Modal: for next time when modal will be open
        addNewCancel.prop('disabled', false);
        addNewSubmit.prop('disabled', false);
      }

      function resetValues() {                                // Setting all inputs to initial value (reseting input values)
        newTagName.val('');
        $('#addNewModal select').val(defaultTagType);         // seting select manualy to the first value from options list (defaulte value is hard coded inside this function)
        myNewFeed.prop('checked', false);
        myNewFavourites.prop('checked', false);
        $('.imageContainer').remove();                        // delete dynamicly added img element from modal
        numPics = 0;                                          // set image counter to zero
        newTagName.parent()                                   // removing validation marks from label
                  .removeClass("has-error has-success");      
      }

      function submitNewRow() {                               // callback function for submit button from Add New Modal
        let isValidate = addNewForm.valid();                  // checking if form is validate via jquery-validate plugin valid() method.
 
        if (isValidate) {                                     // if form is valid than do next actions (otherwise, next step is defined at configuration of jquery-plugin on line 125)
          disableANMB();                                      // disable both buttons from Add New Modal

          let newTagNameValue = newTagName.val(),             // reveal value from name input
              tagTypeValue = newTagType.val();                // reveal value from tag type select element

          let arrayOfValues = [countDataElements + 1, newTagNameValue, tagTypeValue, myNewFeedValue, myNewFavsValue] // put all values together in array for later submiting
          
          table.row.add(arrayOfValues).draw();                // adding of New Row
          table.order([0, 'asc']).draw();                     // setting asceding order of first column
          table.page('last').draw('page');                    // go to the last page where just added row is

          resetValues();                                      // empty all inputs after submiting

          mockDB.push(arrayOfValues);                         // adding new row to mockDB Array (mocking data base)
          countDataElements++;                                // mocking data base action


          addNewModal.modal('hide');                          // hide modal
          new Noty({                                          // showing success nofication after all actions
            text: 'Row Added!',
            theme: 'metroui',
            type: 'success',
            timeout: 1000,
            killer: true
          }).show();
        }
      }

      function cancelNewRow() {
        // Setting all inputs to initial value (reseting input values)
        validateMsg.empty();                                  // empty message place for validation message
        addNewSubmit.prop('disabled', false)                  // enabling submit button after form is canceled
                    .css('cursor', 'pointer');                
        resetValues();                                        // empty all inputs after canceling submit action for better UX

        new Noty({                                            // notification for cancel event
          text: 'Adding canceled.',
          theme: 'metroui',
          type: 'info',
          timeout: 1000,
          killer: true
        }).show();
      }
    /* *** END ADD NEW MODAL *** */


    /* *** EDIT ROW MODAL *** */

      // declaring and defining variables
      var editRowModal = $('#editRowModal'),                  // Edit Row Modal
          closeRowModal = $('#closeRowModal'),                // close button on Edit Row Modal
          editRowForm = $('#editRowForm'),                    // form from from Edit Row Modal
          validateMsgEdit = $('#validateMsgEdit'),            // place inside Edit Row Modal next to text input for validation message
          editRowSubmit = $("#editRowSubmit"),                // submit button from Edit Row Modal
          editRowCancel = $("#editRowCancel"),                // cancel button from Edit Row Modal

      // Variables for callback functions needed for Edit Row Modal buttons
          selectedRow,                                        // row selected for editing: defined in prepareEditModal function
          indexOfRow,                                         // index of selected row (for both edit modal callback functions)
          rowData,                                            // data from selected row (getted in prepareEditModal function)

      // Input Elements of Edit Row Modal
          editTagName = $('#editRowModal input[type=text]'),            // text input from Edit Row Modal
          editTagType = $('#editRowModal select'),                      // select element  from Edit Row Modal
          editCheckboxes = $('#editRowModal input[type="checkbox"]'),   // array like with both checkboxes from Edit Row Modal
          editMyFeed = $(editCheckboxes[0]),                            // first checkbox: My Feed  from Edit Row Modal
          editMyFavs = $(editCheckboxes[1]);                            // second checkbox: My Favorites  from Edit Row Modal

      // Adding Event Listeners
      $('#myTable tbody').on('click', 'span.editRowAction', prepareEditModal); // Adding event listener to edit icon and tag name from second column  
      editRowSubmit.on('click', submitEditModal);             // adding event listener to submit button from Edit Row Modal
      editRowCancel.on('click', cancelEditModal);             // adding event listener to cancel button from Edit Row Modal
      closeRowModal.on('click', cancelEditModal);             // adding event listener to close button from Edit Row Modal

      /* Validation of Form from Add New Modal */
      editRowForm.validate({                                   // this function is a configuration of jquery-validate plugin. Please, see documentation on plugin site.
        rules: {
          name: {
            required: true,
            minlength: 3
          }
        },
        messages: {
          firstname: "Name is required."
        },
        errorElement: "em",
        errorPlacement: function(error, element) {
          error.appendTo(validateMsgEdit);
        },
        highlight: function(element, errorClass, validClass) {
          $(element).parent().addClass("has-error").removeClass("has-success");    // formationg text input when form is invalid
          editRowSubmit.prop('disabled', true).css('cursor', 'not-allowed');       // disabling submit button when form is invalid
        },
        unhighlight: function(element, errorClass, validClass) {
          $(element).parent().addClass("has-success").removeClass("has-error");    // formationg text input when form is valid
          editRowSubmit.prop('disabled', false).css('cursor', 'pointer');          // enabling submit button when form is invalid
        }
      });

      function disableERMB() {                                // disable buttons from Edit Row Modal: preventing submiting or canceling twice on double click
        editRowSubmit.prop('disabled', true);
        editRowCancel.prop('disabled', true);
      }

      function enableERMB() {                                 // enable buttons from Edit Row Modal: for next time when modal will be open
        editRowSubmit.prop('disabled', false);
        editRowCancel.prop('disabled', false);
      }

      function setValEdit() {                                 // Setting inputs values from existing row values
        editTagName.val(rowData[1]);
        editTagType.val(rowData[2]); 
        rowData[3] ? $(editMyFeed).prop('checked', true) : $(editMyFeed).prop('checked', false);
        rowData[4] ? $(editMyFavs).prop('checked', true) : $(editMyFavs).prop('checked', false);
        $('.imageContainer').remove();                        // delete dynamicly added img element from modal
        numPics = 0;                                          // set image counter to zero
        editTagName.parent()                                  // removing validation marks from label
                  .removeClass("has-error has-success");
      }

      // Next function will fill inputs of Edit Row Modal and open it
      function prepareEditModal() {
        enableERMB();                                         // enable buttons that maybe were disabled after submiting or canceling previous Edit Row Modal

        if (menuIsOpen) exitContexMenu();                     // if Row Contextmenu is open, close it and...
        if (contextChoice) {                                  // ...if callback is invoked from contextmenu...
          selectedRow = selectedRowContext;                   // ...take row selected from that context menu.
          contextChoice = false;                              // set negative value at flag contextChoice
        }          
        else selectedRow = $(this).parents('tr');             // else, take table row that contains clicked delete icon from Actions column

        rowData = table.row(selectedRow).data();              // taking array of data contained by row that looks like this: ["3", "Chelsea FC", "Football club", true, true]
        indexOfRow = rowData[0];                              // setting index value of global var indexOfRow for later use in submitEditModal function

        setValEdit();                                         // setting values of inputs based on data of selected row

        editRowModal.modal({ backdrop: 'static',              // preventing closing the modal with click anywhere outside of modal 
                             keyboard: false });  
        editRowModal.modal('show');                           // open modal with filled inputs
      }

      // Next function will be invoked after submiting form from Edit Row Modal
      function submitEditModal() {
        let isFormValid = editRowForm.valid();                  // checking if form is validate via jquery-validate plugin valid() method.
 
        if (isFormValid) {
          disableERMB();                                        // disable both buttons from Edit Row Modal

          let editedValues = [  indexOfRow,                     // array of edited values from edit row modal
                                editTagName.val(), 
                                editTagType.val(),
                                editMyFeed.is(':checked'), 
                                editMyFavs.is(':checked')
                             ],
             notification = new Noty({                          // showing success nofication after all actions
                                text: 'Row Edited!',
                                theme: 'metroui',
                                type: 'success',
                                timeout: 1000,
                                killer: true
                            }),
             compareValues = function compareWithOrginal() {                        // function that return true or false based on
                              for (var i = 0; i < editedValues.length; i++ ) {      // if the data from Edit Row Modal is the same 
                                if (editedValues[i] !== rowData[i]) return false;   // like data from original row or not
                                else continue;
                              }
                                return true;
                            };
         
          if (!compareValues()) {                                     // if there is some changes to data...
            table.row(selectedRow).data(editedValues).draw(false);    // submit changes to table row
            mockDB[indexOfRow-1] = editedValues;                      // replace (array) element inside data array (mocking data base) 
            notification.show();                                      // show success notification
          }
          else {                                                      // otherwise, just show that nothing is changed
            new Noty({                                              
              theme: 'metroui',
              type: 'info',
              text: 'Not Modified!',
              timeout: 1000,
              killer: true
            }).show();
          }

          editRowModal.modal('hide');                         // close modal after submiting form
        }
      }

      function cancelEditModal() {
        disableERMB();                                        // disable both buttons from Edit Row Modal
        setValEdit();                                         // setting values of inputs based on data of selected row for better UX
        validateMsgEdit.empty();                              // empty message place for validation message
        editRowSubmit.prop('disabled', false)                 // enabling submit button after form is canceled
                     .css('cursor', 'pointer');

        editRowModal.modal('hide');                           // close modal after canceling form

        new Noty({                                            // notification for cancel event
          text: 'Editing canceled.',
          theme: 'metroui',
          type: 'info',
          timeout: 1000,
          killer: true
        }).show();
      }
    /* *** END EDIT ROW MODAL *** */


    /* *** DELETING ROW ACTION *** */    

      // declaring and defining variables
      var rowForDel,                                          // row selected for deleting action
          previousSelRow,                                     // variable that will contain previously selected row when new one is selected on click on delete icon from Actions column
          dataRowDel,                                         // data from row for deleting
          confirmDialog,                                      // dialog that shows when delete icon is clicked
          cancelClicked = false,
          dialogIsOpen = false,                               // is dialog open? purpose: for closing dialog on body click
          notyConfirmButton = $('.noty-confirm-button'),      // confirm button from noty dialog
          notyCancelButton = $('.noty-cancel-button'),        // cancel button from noty dialog
          canceledNoty = new Noty({                           // notification for cancel event
                              theme: 'metroui',
                              type: 'info',
                              text: 'Deleting canceled.',
                              timeout: 1000,
                              killer: true
                         }), 
          deleteNoty = new Noty({                             // nofication for delete event
                              theme: 'metroui',
                              type: 'success',
                              text: 'Row Deleted!',
                              timeout: 1000,
                              killer: true
                       });

      $('#myTable tbody').on('click', 'span.deleteRowAction', openDialog);  // adding event listener to delete icon: click on it opens confirm dialog  
      body.on('click', cancelDelOnBody);                      // remove dialog and show notification on body click

      function disableNotyButtons() {
          notyConfirmButton.prop('disabled', true);
          notyCancelButton.prop('disabled', true);
      }

      function deleteRow() {                                  // callback function for confirming case
        disableNotyButtons();                                 // disable dialog buttons
        cancelClicked = false;                                  
        table.row(rowForDel).remove().draw(false);            // selected row deleted

        RowDelIndex = mockDB.indexOf(dataRowDel);             // index of deleted row in mockDB array (mocking data base)
        mockDB.splice(RowDelIndex, 1);                        // deleting selected row from mockDB array (mocking data base)

        confirmDialog.close();                                // closing dialog
        deleteNoty.show();
      }

      function cancelAction() {                               // callback function for canceling case
        disableNotyButtons()
        confirmDialog.close();
        canceledNoty.show();
      }

      function cancelDelOnBody() {                            // remove dialog if dialog is open and show notification on body click 
        if (dialogIsOpen) cancelAction();
      };

      function openDialog(e) {                                // delete selected row callback function
        e.stopPropagation();                                  // very important: don't touch this. it will mess up everything in deleting row action.
        previousSelRow = rowForDel;                           // setting previously selected row before setting new one

        if (menuIsOpen) exitContexMenu();                     // if Row Contextmenu is open, close it and...
        if (contextChoice) {                                  // ...if callback is invoked from contextmenu...
          rowForDel = selectedRowContext;                     // ...take row selected from that context menu.
          contextChoice = false;                              // set negative value at flag contextChoice
        }          
        else rowForDel = $(this).parents('tr');               // else, take table row that contains clicked delete icon from Actions column

        dataRowDel = table.row(rowForDel).data();             // data from row for deleting
        cancelClicked = false;                                // will be false when user click on yes button at dialog (purpose: to prevent showing double notification on delete action)

        confirmDialog = new Noty({                            // confirm dialog configuration
          text: 'Are you sure?',
          theme: 'metroui',
          type: 'alert',
          layout: 'center',
          killer: true,
          buttons: [
            Noty.button('YES', 'btn noty-button noty-confirm-button', deleteRow), // adding attributes to button (disabling button to prevent confirming dialog twice)
            Noty.button('NO', 'btn noty-button noty-cancel-button', cancelAction)
          ],
          callbacks: {
            onShow: function() {                              // after opening dialog, set positive value to flag dialogIsOpen
              dialogIsOpen = true;                            // purpose: for removing dialog on body click
              if (previousSelRow !== undefined) {             // if there is previously selected row, than unmark it
                previousSelRow.removeClass('rowHighlight');
              }
              rowForDel.addClass('rowHighlight');             // highlight selected table row
            },
            onClose: function() {
              dialogIsOpen = false;                           // on closing (no after closing!) dialog, set negative value to flag dialogIsOpen
              rowForDel.removeClass('rowHighlight');          // remove from row higlight class which was added when Row Context Menu was opened or when this dialog was opened 
            }
          }
        });

        confirmDialog.show();                                 // open dialog
      }

    /* *** END OF DELETING ROW ACTION *** */


    /* *** FILE UPLOAD *** */
    var numPics = 0,                                          // small hack because plugin is not working properly
        DropZone = $('.DropZone');                            // element like drop zone

    DropZone.each(function() {
      $(this).fileupload({                                    // initialize the jQuery File Upload plugin 
        dropZone: $(this),                                    // This element will accept file drag/drop uploading
        /*url: 'upload_url',                                  // uncomment and fill with proper values
        type: 'POST',
        dataType: 'json',*/
        autoUpload: false,
        /*disableValidation: false,                           // this options doesn't work because plugin have a bug (stackoverflow)
        maxNumberOfFiles: 1,   */                             // maximum number of files to upload
        acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,          // permissible formats
        add: function (e, data) {
          var acceptFileTypes = /^image\/(gif|jpe?g|png)$/i;                                                                       // manually checking
          if(numPics === 0 && data.originalFiles[0]['type'].length && !acceptFileTypes.test(data.originalFiles[0]['type'])) {      // for proper file types 
            new Noty({
                  theme: 'metroui',
                  type: 'info',
                  text: 'Unsupported file type.',
                  timeout: 1500,
                  killer: true
                }).show();
          } else if (numPics === 0) {                         // if this is a first valid picture to submit  
              data.submit();
              previewImage(data);
              numPics++;
          } else {
            new Noty({
                  theme: 'metroui',
                  type: 'info',
                  text: 'Only one pic is allowed.',
                  timeout: 1500,
                  killer: true
                }).show();
          }
        },
        progressall: function(e, data) {
          var progressDiv = $('div.progress'),                         // div that contain progress bar
              progressBar = $('div.progress .bar'),                    // progress bar div
              buttonContainer = $('div.buttonContainer');              // add photo button
              
          progressDiv.css('visibility', 'visible');                    // show progress bar container
          buttonContainer.css('visibility', 'hidden');                 // hide add photo button

          var progress = parseInt(data.loaded / data.total * 100, 10); // Calculate the completion percentage of the upload
          progressBar.css('width', progress + '%');
          
          if (progress == 100) {                                       // at the end...
            progressDiv.css('visibility', 'hidden');                   // hide progress bar container
            buttonContainer.css('visibility', 'visible');              // show add button
          }
        },
        fail: function(e, data) {
            new Noty({
                  theme: 'metroui',
                  type: 'error',
                  text: 'File is not sent to server.',
                  timeout: 2500,
                  killer: true
           }).show();
        }
      });
    });
    
    function previewImage(pData) {
        var reader = new FileReader();
        reader.readAsDataURL(pData.files[0]);          
        reader.onload = function (e) {
            $('<div class="imageContainer"><img src="' + e.target.result + '"></div>').appendTo(DropZone);
        }
    }

    $(document).on('drop dragover', function (e) {            // prevent the default action when
        e.preventDefault();                                   // a file is dropped on the window
    });
    /* *** END FILE UPLOAD *** */


}); /* *** END document.ready() *** */


/* *** MOCKING DATA BASE *** */
mockDB =  [
            [ "1", "Liverpool FC", "Football club", true, false ],
            [ "2", "Arsenal FC", "Football club", false, true ],
            [ "3", "Chelsea FC", "Football club", true, true ],
            [ "4", "Chicago Bulls", "Basketball club", false, false ],
            [ "5", "Sacramento Kings", "Basketball club", true, false ],
            [ "6", "Novak Djokovic", "Tennis player", true, false ],
            [ "7", "Tiger Woods", "Golf player", true, true ],
            [ "8", "Boston Celtics", "Basketball club", false, true ],
            [ "9", "Indiana Pacers", "Basketball club", true, true ],
            [ "10", "Los Angeles Lakers", "Basketball club", false, false ],
            [ "11", "New York Knicks", "Basketball club", true, false ],
            [ "12", "Andy Murray", "Tennis player", false, false ],
            [ "13", "San Antonio Spurs", "Basketball club", false, false ],
            [ "14", "Stan Wawrinka", "Tennis player", false, true ],
            [ "15", "Dustin Johnson", "Golf player", false, true ],
            [ "16", "Hideki Matsuyama", "Golf player", false, false ],
            [ "17", "Jon Rahm", "Golf player", true, false ],
            [ "18", "FC Girondins de Bordeaux", "Football club", false, true ],
            [ "19", "Olympique de Marseille", "Football club", false, true ],
            [ "20", "OGC Nice", "Football club", false, true ],
            [ "21", "Paris Saint-Germain FC", "Football club", true, true ],
            [ "22", "Olympique lyonnais", "Football club", false, false ]
          ];
countDataElements = mockDB.length;

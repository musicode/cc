/**
 * @file 用于打包模块
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    require('./form/Box');
    require('./form/BoxGroup');
    require('./form/Date');
    require('./form/Number');
    require('./form/Select');
    require('./form/Text');
    require('./form/Validator');

    require('./function/around');
    require('./function/autoScrollDown');
    require('./function/autoScrollUp');
    require('./function/contains');
    require('./function/offsetDate');
    require('./function/debounce');
    require('./function/decimalLength');
    require('./function/disableSelection');
    require('./function/divide');
    require('./function/dragGlobal');
    require('./function/enableSelection');
    require('./function/eventOffset');
    require('./function/eventPage');
    require('./function/extend');
    require('./function/float2Int');
    require('./function/guid');
    require('./function/offsetHour');
    require('./function/imageDimension');
    require('./function/innerOffset');
    require('./function/isActiveElement');
    require('./function/isHidden');
    require('./function/lpad');
    require('./function/minus');
    require('./function/offsetMinute');
    require('./function/firstDateInMonth');
    require('./function/lastDateInMonth');
    require('./function/offsetMonth');
    require('./function/multiply');
    require('./function/nextTick');
    require('./function/offsetParent');
    require('./function/outerOffset');
    require('./function/page');
    require('./function/pageHeight');
    require('./function/pageScrollLeft');
    require('./function/pageScrollTop');
    require('./function/pageWidth');
    require('./function/parseDate');
    require('./function/parsePercent');
    require('./function/parseTime');
    require('./function/pin');
    require('./function/pinGlobal');
    require('./function/plus');
    require('./function/position');
    require('./function/ratio');
    require('./function/replaceWith');
    require('./function/restrain');
    require('./function/scrollBottom');
    require('./function/offsetSecond');
    require('./function/simplifyDate');
    require('./function/simplifyTime');
    require('./function/toNumber');
    require('./function/toString');
    require('./function/ucFirst');
    require('./function/values');
    require('./function/viewport');
    require('./function/viewportHeight');
    require('./function/viewportWidth');
    require('./function/firstDateInWeek');
    require('./function/lastDateInWeek');
    require('./function/offsetWeek');



    require('./helper/AjaxUploader');
    require('./helper/DOMIterator');
    require('./helper/Draggable');
    require('./helper/FlashUploader');
    require('./helper/Input');
    require('./helper/Iterator');
    require('./helper/Keyboard');
    require('./helper/Placeholder');
    require('./helper/Popup');
    require('./helper/Switchable');
    require('./helper/Wheel');

    require('./ui/AutoComplete');
    require('./ui/Calendar');
    require('./ui/Carousel');
    require('./ui/ComboBox');
    require('./ui/ContextMenu');
    require('./ui/Dialog');
    require('./ui/Pager');
    require('./ui/Rater');
    require('./ui/ScrollBar');
    require('./ui/Slider');
    require('./ui/SpinBox');
    require('./ui/Tab');
    require('./ui/Tooltip');
    require('./ui/Tree');
    require('./ui/Uploader');
    require('./ui/Zoom');

    require('./util/browser');
    require('./util/cookie');
    require('./util/detection');
    require('./util/etpl');
    require('./util/FiniteArray');
    require('./util/fullScreen');
    require('./util/input');
    require('./util/instance');
    require('./util/json');
    require('./util/keyboard');
    require('./util/life');
    require('./util/localStorage');
    require('./util/Message');
    require('./util/mimeType');
    require('./util/orientation');
    require('./util/position');
    require('./util/Queue');
    require('./util/Range');
    require('./util/redirect');
    require('./util/string');
    require('./util/swipe');
    require('./util/timer');
    require('./util/touch');
    require('./util/trigger');
    require('./util/url');
    require('./util/visibility');

    require('./util/supload/supload');

});
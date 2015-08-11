/**
 * @file 用于打包模块
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    require('./form/Checkbox');
    require('./form/Date');
    require('./form/File');
    require('./form/Number');
    require('./form/Radio');
    require('./form/RadioGroup');
    require('./form/Range');
    require('./form/Select');
    require('./form/Text');
    require('./form/Validator');

    require('./function/around');
    require('./function/autoScrollDown');
    require('./function/autoScrollUp');
    require('./function/call');
    require('./function/contains');
    require('./function/debounce');
    require('./function/decimalLength');
    require('./function/disableSelection');
    require('./function/divide');
    require('./function/dragGlobal');
    require('./function/enableSelection');
    require('./function/eventOffset');
    require('./function/float2Int');
    require('./function/imageDimension');
    require('./function/init');
    require('./function/innerOffset');
    require('./function/isHidden');
    require('./function/jquerify');
    require('./function/lifeCycle');
    require('./function/lpad');
    require('./function/minus');
    require('./function/multiply');
    require('./function/offsetParent');
    require('./function/outerOffset');
    require('./function/page');
    require('./function/pageHeight');
    require('./function/pageScrollLeft');
    require('./function/pageScrollTop');
    require('./function/pageWidth');
    require('./function/parsePercent');
    require('./function/pin');
    require('./function/pinGlobal');
    require('./function/plus');
    require('./function/position');
    require('./function/replaceWith');
    require('./function/restrain');
    require('./function/scrollBottom');
    require('./function/split');
    require('./function/timer');
    require('./function/toNumber');
    require('./function/viewport');
    require('./function/viewportHeight');
    require('./function/viewportWidth');

    require('./helper/AjaxUploader');
    require('./helper/Draggable');
    require('./helper/FiniteArray');
    require('./helper/FlashUploader');
    require('./helper/Input');
    require('./helper/Iterator');
    require('./helper/Keyboard');
    require('./helper/Message');
    require('./helper/Placeholder');
    require('./helper/Popup');
    require('./helper/Queue');
    require('./helper/Range');
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
    require('./ui/Tab');
    require('./ui/Tooltip');
    require('./ui/Uploader');
    require('./ui/Zoom');

    require('./util/advice');
    require('./util/browser');
    require('./util/cookie');
    require('./util/date');
    require('./util/detection');
    require('./util/dimension');
    require('./util/etpl');
    require('./util/fullScreen');
    require('./util/input');
    require('./util/instance');
    require('./util/json');
    require('./util/keyboard');
    require('./util/localStorage');
    require('./util/mouse');
    require('./util/position');
    require('./util/redirect');
    require('./util/string');
    require('./util/swipe');
    require('./util/time');
    require('./util/url');
    require('./util/visibility');

    require('./util/supload/supload');

});
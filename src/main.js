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

    require('./helper/AjaxUploader');
    require('./helper/Draggable');
    require('./helper/ElementIterator');
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
    require('./ui/Grid');
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
    require('./util/lifeCycle');
    require('./util/localStorage');
    require('./util/Message');
    require('./util/mimeType');
    require('./util/touch');
    require('./util/orientation');
    require('./util/position');
    require('./util/Queue');
    require('./util/Range');
    require('./util/redirect');
    require('./util/string');
    require('./util/swipe');
    require('./util/time');
    require('./util/timer');
    require('./util/trigger');
    require('./util/url');
    require('./util/visibility');

    require('./util/supload/supload');

});
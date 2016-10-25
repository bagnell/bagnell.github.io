/*global define*/
define([
    '../Core/freezeObject'
], function(
    freezeObject) {
    'use strict';

    /**
     * @private
     */
    var ExpressionNodeType = {
        VARIABLE : 0,
        UNARY : 1,
        BINARY : 2,
        CONDITIONAL : 3,
        MEMBER : 4,
        FUNCTION_CALL : 5,
        ARRAY : 6,
        REGEX: 7,
        VARIABLE_IN_STRING : 8,
        LITERAL_NULL : 9,
        LITERAL_BOOLEAN : 10,
        LITERAL_NUMBER : 11,
        LITERAL_STRING: 12,
        LITERAL_COLOR: 13,
        LITERAL_REGEX: 14,
        LITERAL_UNDEFINED: 15
    };

    return freezeObject(ExpressionNodeType);
});

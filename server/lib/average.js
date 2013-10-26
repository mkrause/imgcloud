module.exports = function average(arr) {
    var sum = arr.reduce(function(prev, cur) {
        return prev + cur;
    }, 0);

    var avg;
    if (arr.length == 0) {
        avg = 0;
    } else {
        avg = sum / arr.length;
    }

    return avg;
};
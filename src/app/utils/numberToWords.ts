export const numberToWords = (num: number): string => {
    const digits = num.toString().split('');
    return digits
        .map(digit => {
            switch (digit) {
                case '0': return 'ZERO';
                case '1': return 'ONE';
                case '2': return 'TWO';
                case '3': return 'THREE';
                case '4': return 'FOUR';
                case '5': return 'FIVE';
                case '6': return 'SIX';
                case '7': return 'SEVEN';
                case '8': return 'EIGHT';
                case '9': return 'NINE';
                default: return '';
            }
        })
        .join(' ') + ' Kg';
};

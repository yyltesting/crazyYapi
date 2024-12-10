import test from 'ava';
import {utils} from '../../common/power-string.js';


test('utils',t=>{

    function isPoneAvailable(str){  
        var myreg=/^[1][2,3,4,5,6,7,8,9][0-9]{9}$/;  
        if (!myreg.test(str)) {  
            return false;  
        } else {  
            return true;  
        }  
    };
    var tel = utils.phone();
    t.true(isPoneAvailable(tel));
})
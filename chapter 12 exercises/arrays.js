const {run, topScope} = require("../egg")

topScope.array = (...values) => {
    return values
  }
  
  topScope.length = array => {
    return array.length
  }
  
  topScope.element = (array, n) => {
    return array[n]
  }
  
  console.log(run(`array(1, 2, 3)`))
  //outputs [ 1, 2, 3]
  
  console.log(run(`length(array(1, 2, 3, 4))`))
  //outputs 4
  
  console.log(run(`element(array(1, 2, 3, 4), 2)`))
  //outputs 3. element at index 2
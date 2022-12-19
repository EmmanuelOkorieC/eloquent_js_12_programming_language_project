const {specialForms, run, evaluate} = require("../egg")

specialForms.set = (args, scope) => {
    if (args.length != 2 && args[0].type != "word") {
        throw new SyntaxError("wrong use of set")
    }
    let name = args[0].name
    let value = evaluate(args[1], scope)
    let outerScope = Object.getPrototypeOf(scope)


    if(Object.prototype.hasOwnProperty.call(scope, name)) {
        scope[name] = value
    } else if(Object.prototype.hasOwnProperty.call(outerScope, name)) {
        outerScope[name] = value
    } else {
        throw new ReferenceError("Cannot set Property of Undefined Binding")
    }
}

run(`
  do(define(a, 4),
     define(b, fun(val, do(set(a, val), print(a)))),
     b(6),
     print(a))
`)
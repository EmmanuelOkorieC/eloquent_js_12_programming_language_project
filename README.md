# Eloquent Javascript, 3rd Edition: A modern Introduction to programming
An overview, with solutions and explanation of exercises in chapter Twelve of the ebook [Eloquent Javascript, 3rd Edition](https://eloquentjavascript.net/Eloquent_JavaScript.pdf) by Marijn Haverbeke

## Overview
### Chapter Twelve:  Project: A programming Language 
For this chapter, we built a programming language called **Egg**. Egg will be a tiny, simple language that is powerful enough to express any computation you can think of. It will allow simple abstraction based on functions.

To build our programming language, we need two very important programs, a *parser* and an *evaluator*

#### Parser
Like every other programming language, Egg is going to have it's own syntax or notation. A *parser* is a program that reads a piece of text and produces a data structure that reflects the structure of the program contained in the text. If the text does not form a valid program, the parser should point out the error.

Our language will have a simple and uniform syntax. Everything in Egg is an expression. An expression can be the name of a binding, a number, a string or an application. **Applications** are used for function calls and for constructs like `if` or `while`. A **String** is a sequence of characters that are not double quotes, wrapped in double quotes. A **Number** is a sequence of digits.  **Binding Names** can consist of any character that is not whitespace and that does not have a special meaning in the syntax. 

Binding names that have a special meaning in syntax include "**if**", "**while**", "**define**", "**do**", "**print**". Operators like "**+**", "**-**", "**/**", "*", "**==**", "**>**", "**<**" are also referenced as binding names. To use these binding names in Egg, they have to invoked as functions (applications)

Applications are written the way they are in Javascript, by putting parentheses after an expression and having any number of arguments between those parentheses separated by commas.
```javascript
do(define(x, 10),
   if(>(x, 5),
       print("large"),
       print("small")))
```
The Egg language syntax has no concept of a block, so we need the "**do**" construct to represent doing multiple things in sequence.

##### Data Structure
The data structure that the parser will use to describe a program consists of expression objects, each of which has a **type** property indicating the kind of expression it is and other properties to describe it's content.

Expressions of type "value" represent literal strings or numbers. Their **value** property contains the string or number value that they represent. The number 5 and string "hello" will return Expression objects that look like this
```javascript
//5
{type: "value", value: 5}
//"hello"
{type: "value", value: "hello"}
```
Expression of type "word" are used for identifiers(binding names). Such object have a **name** property that holds the identifiers name as a string. For a binding name of say x, it's expression object will look like this
```javascript
//x
{type: "word", name: "x"}
```
Finally "apply" expressions represent applications. They have an **operator** property that refers to the expression that is being applied as well as an **args** property that holds an array of argument expressions. The syntax ">(x, 5)" from earlier will return an Expression object that looks like this
```javascript
{
  type: "apply",
  operators: {type: "word", name: ">"},
  args: [
     {type: "word", name: "x"},
     {type: "value", value: 5}
  ]
}
```
Such data structure is called a *syntax tree* mainly because they have a tree-like shape. The fact that expressions contain other expressions, which in turn might contain more expressions, is similar to the way tree branches split and split again. 

The Expression in the Egg programming language has a recursive structure (Application expressions contain other expressions) so the parser function we write must be recursive in a way that reflects the recursive nature of the language. 

we'll define three parts to our parser. The first part written as the function `parseExpression` takes a string input (our program syntax) and returns an object containing the data structure for the expression at the start of the string, along with the part of the string left after parsing this expression. 

The second part written as the function `parseApply` is returned at the end of `parseExpression` and takes the data structure   and the string left as arguments. 

when called, it checks If the remaining string does not start with an opening parenthesis, and if this check is true, a final expression object is returned as well as the rest of the program(if any). But If the remaining string starts with an opening parenthesis, it is treated as an application and the `parseExpression` function can be called again, yielding the argument expression as well as the text that remains. This text may in turn contain more arguments or may be the closing parenthesis that ends the list of arguments. 

In the case of a closing parenthesis ending the list of argument, the `parseApply` function is called again and if it is not followed by another opening parenthesis(It is possible to write code like this in Egg, multiplier(2)(3) as an application itself can be applied), The final expression object is returned as well as the rest of the program(if any). we'll look at an example to better understand

The third part `parse` verifies that it has reached the end of the input string after parsing the expression. If it has not and there is an unexpected text after, it throws an error else it returns the final syntax tree object.

Here's the code for the first part:
```javascript
   function parseExpression(program) {
      program = skipSpace(program);
      let match, expr;
      if (match = /^"([^"]*)"/.exec(program)) {
          expr = {type: "value", value: match[1]};
      } else if (match = /^\d+\b/.exec(program)) {
          expr = {type: "value", value: Number(match[0])};
      } else if (match = /^[^\s(),#"]+/.exec(program)) {
          expr = {type: "word", name: match[0]};
      } else {
          throw new SyntaxError("Unexpected syntax: " + program);
      }
      return parseApply(expr, program.slice(match[0].length));
   }
   
   function skipSpace(string) {
     let first = string.search(/\S/);
     if (first == -1) return "";
     return string.slice(first);
    }
```
Because Egg, like JavaScript, allows any amount of whitespace between
its elements, we have to repeatedly cut the whitespace off the start of the program string. That is what the `skipSpace` function helps with. The string method `search` returns the index of the first non white-space character it finds or -1 if it doesn't find any. If the result is -1, it returns an empty string else it returns a new string that removes the white space using the string method `slice`.

After skipping any leading space, `parseExpression` uses three regular expressions to spot the three atomic elements that Egg supports: strings, numbers, and words. The parser constructs a different kind of data structure depending on which one matches. If the input does not match one of these three forms, it is not a valid expression, and the parser throws a `SyntaxError`. 

Say we pass the expression `" define(x, 5)"` to `parseExpression`, it first removes the whitespace in front using `skipSpace` then it matches `define` at the start of the string and assigns it's expression object `{type: word, name: "define"}` to the local binding `expr`. It then proceeds to return the result of calling `parseApply` passing the matched expression object and the remainder of the string `"(x, 5)"`. 

Here's the code for the second part:
```javascript
function parseApply(expr, program) {
   program = skipSpace(program);
   if (program[0] != "(") {
   return {expr: expr, rest: program};
   }
  program = skipSpace(program.slice(1));
  expr = {type: "apply", operator: expr, args: []};
  while (program[0] != ")") {
     let arg = parseExpression(program);
     expr.args.push(arg.expr);
     program = skipSpace(arg.rest);
     if (program[0] == ",") {
       program = skipSpace(program.slice(1));
    } else if (program[0] != ")") {
       throw new SyntaxError("Expected ',' or ')'");
    }
  }
return parseApply(expr, program.slice(1));
}
```

So back to the example, `parseApply` calls `skipSpace` to remove any unneccessary white space. Then it checks if the first character from the remaining program is an opening parenthesis. Yes it is! so it progresses to the code below. It first removes the opening parenthesis then passes the code to `skipSpace` again to remove any unneccessary white space. Then it creates an application object, assigns the current expression object as it's `operator` and reassigns it to `expr`. So for our example, `expr` will become
```javascript
{
  type: "apply", 
  operator: {type: "word", name: "define"},
  args: []
}
```
Then it progresses to the `while` loop. As long as the next character after the opening parenthesis is not a closing parenthesis, it runs the code in the while loop. For our example, it is obviously not. So it progresses to run the code. 

It passes the string `"x, 5)"` to `parseExpression` and assigns it's result to the local binding `arg`. This call matches x and passes the object `{type: "word", name: "x"}` and the remainder of the string `", 5)"` to `parseApply` again. The remaining string starts with a comma not an opening parenthesis, so `parseApply` returns the final expression object for that expression `{expr: {type: "word", name: "x"}, rest: ", 5)"}`.

Back in the `while` loop, the `expr` property from the `arg` object  is added to the `args` array of the newly assigned `expr` object. The code then proceeds to remove any unneccessary white space again from the remaining string(`arg.rest`) using `skipSpace`. It then checks if the next character is a comma and If it is, removes it and any unneccessary white space and reassigns the returned value to `program` so value of `program` from the example at this point will be `"5)"`. If the next character is not a comma, it checks if it is a closing parenthesis and if it is not, it throws a `SyntaxError`.

Now our `program` is `"5)"` and the next character is still not a closing parethesis so it runs the code in the `while` loop again. This time matching "5" and adding its expression object to `args`. The rest of the string is a closing parenthesis `")"` so it doesn't throw an error, breaks out of the while loop and proceeds to call `parseApply` passing the newly assigned `expr` object and the rest of the string with the closing parenthesis removed.

This call to `parseApply` returns the final expression object for the application expression and for our example, it'll look something like this. 
```javascript
{
  expr: {
     type: "apply",
     operator: {type: "word", name: "define"},
     args: [
        {type: "word", name: "x"},
        {type: :value", value: 5}
     ]
  }, 
  rest: ""
}
```
This expression object will be returned in `parseExpression` as the result of calling `parseApply`. Here's the code for The third part and wrapper function `parse`
```javascript
  function parse(program) {
     let {expr, rest} = parseExpression(program);
     if (skipSpace(rest).length > 0) {
        throw new SyntaxError("Unexpected text after program");
     }
     return expr;
  }
```
`parse` takes an input string (our program) as argument, calls `parseExpression` on the string and destructures the object it returns. If the rest of the string after all unnecessary space is removed, is greater than zero(i.e there's an unexpected character at the end after parsing) it throws a `SyntaxError` else it returns the syntax tree
```javascript
console.log(parse("+(a, 10)"))
// outputs
// {
 // type: 'apply',
 // operator: { type: 'word', name: '+' },
  // args: [ { type: 'word', name: 'a' }, { type: 'value', value: 10 } ]
//}
```
Now that we have our syntax tree, we proceed to run it and this is what the evaluator does. You give it a syntax tree and a scope object
that associates names with values, and it will evaluate the expression that the tree represents and return the value that this produces

#### Evaluator
To run the `evaluate` function, we need two Objects, a `specialForms` object and a scope object. The `specialForms` object is used to define special syntax in Egg. It associates words with functions that evaluate such forms. The `specialForms` object will contain the following properties, "**if**", "**while**", "**define**", "**do**".

The scope object represents the environment the Egg program will be run in. It will store all the new bindings defined in the program (mostly done with the special form **define**), and also hold access (via prototype chaining) to binding names with special meaning like the operators [+, -, /, *, <, >, ==] and "**print**". This binding names with special meaning are stored as functions that will be used to evaluate it's application syntax

```javascript
const specialForms = Object.create(null)

function evaluate(expr, scope) {
    if(expr.type == "value") {
        return expr.value
    } else if(expr.type == "word") {
        if(expr.name in scope) {
            return scope[expr.name]
        } else {
            throw new ReferenceError(`Undefined Binding: ${expr.name}`)
        }
    } else if(expr.type == "apply") {
        let {operator, args} = expr
        if(operator.type == "word" && operator.name in specialForms) {
           return specialForms[operator.name](expr.args, scope)
        } else {
            let op = evaluate(operator, scope)
            if(typeof op == "function") {
                return op(...args.map(arg => evaluate(arg, scope)))
            } else {
                throw new TypeError("Applying a non-function")
            }
        }
    }
}
```
The `specialForms` object is empty at first, but we'll define our special syntax for it soon.

The evaluator has code for each of the expression types. A literal value expression produces its value. (For example, the expression 100 just evaluates to the number 100.) For a binding, we must check whether it is actually defined in the scope and, if it is, fetch the binding’s value. If it is not, it throws a `ReferenceError`.

Applications are more involved. If they are a special form, like **if** or **while** or **do** or **define**, we do not evaluate anything and pass the argument expressions, along with the scope, to the function that handles this form. If it is a normal call(like calling the operators or **print**), we evaluate the operator, verify that it is a function, and call it with the evaluated arguments. If the operator exists in the scope object but is not stored as a function, it throws a `TypeError`.

The recursive structure of `evaluate` resembles the similar structure of the parser, and both mirror the structure of the language itself. It would also be possible to integrate the parser with the evaluator and evaluate during parsing, but splitting them up this way makes the program clearer

#### TopScope Object
The object `topScope` represents our scope object's prototype. We’ll use object prototype chains to represent nested scopes so that the program can add bindings to its local scope without changing `topScope`. 

`topScope` will store our arithmetic operators as function values
```javascript
const topScope = Object.create(null);

for (let op of ["+", "-", "*", "/", "==", "<", ">"]) {
topScope[op] = Function("a, b", `return a ${op} b;`);
}
```
In the interest of keeping the code short, we’ll use a `Function` constructor to synthesize a bunch of operator functions in a loop, instead of defining them individually.

Running a code like this `console.log(evaluate(parse("+(2, 3)"), Object.create(topScope)))` will return the result of adding 2 and 3 which is equal to 5. The scope object itself is a new object but one that has access to `topScope` so it can add bindings to it's local object scope and leave `topScope` totally unchanged

A way to output values is also useful, so we’ll wrap `console.log` in a function and call it **print**
```javascript
topScope.print = value => {
   console.log(value);
   return value;
};
```

#### Special Forms
Now let's define the properties for the `specialForms` object. we'll start with **if**
```javascript
specialForms.if = (args, scope) => {
   if (args.length != 3) {
     throw new SyntaxError("Wrong number of args to if");
   } else if (evaluate(args[0], scope) !== false) {
     return evaluate(args[1], scope);
   } else {
     return evaluate(args[2], scope);
   }
 };
```
Egg’s **if** construct expects exactly three arguments. It will evaluate the first, and if the result isn’t the value false, it will evaluate the second. Otherwise, the third gets evaluated. This **if** form is more similar to JavaScript’s ternary `?:` operator than to JavaScript’s `if`.

To be able to use the **if** construct we just defined, we must have access to Boolean values. Since there are only two Boolean values, we do not need special syntax for them. We simply bind two names to the values `true` and `false` and use them.
```javascript
topScope.true = true;
topScope.false = false;
```
We can now evaluate a simple expression that negates a Boolean value.
```javascript
let prog = parse(`if(true, false, true)`);
console.log(evaluate(prog, topScope));
//outputs false
```
Egg also differs from JavaScript in how it handles the condition value to **if**. It will not treat things like zero or the empty string as false, only the precise value false (because of the strict inequality operator used in **if**)
```javascript
evaluate(parse(`
    if("", print(2), print(3))
`), topScope)
//outputs 2 and "" doesn't get treated as false

evaluate(parse(`
    if(>(2, 3), print(2), print(3))
`), topScope)
//outputs 3 as its  first application expression evaluates to false
```
The reason we need to represent **if** as a special form, rather than a regular function, is that all arguments to functions are evaluated before the function is called, whereas **if** should evaluate only either its second or its third argument, depending on the value of the first.

The **while** form is similar.
```javascript
specialForms.while = (args, scope) => {
    if (args.length != 2) {
      throw new SyntaxError("Wrong number of args to while");
    }
    while (evaluate(args[0], scope) !== false) {
      evaluate(args[1], scope);
    }
   // Since undefined does not exist in Egg, we return false,
   // for lack of a meaningful result.
   return false;
};
```
Another basic building block is **do**, which executes all its arguments from top to bottom. Its value is the value produced by the last argument (as it keeps reassigning `value` and ends up returning value of the last argument)
```javascript
  specialForms.do = (args, scope) => {
    let value = false;
    for (let arg of args) {
      value = evaluate(arg, scope);
    }
    return value;
  };
```
we'll also add a final form **define** that would allow us create bindings and give them new values. It expects a word as its first argument and an expression producing the value to assign to that word as its second argument. Since **define**, like everything, is an expression, it must return a value. We’ll make it return the value that was assigned (just like JavaScript’s = operator).
```javascript
 specialForms.define = (args, scope) => {
   if (args.length != 2 || args[0].type != "word") {
   throw new SyntaxError("Incorrect use of define");
   }
   let value = evaluate(args[1], scope);
   scope[args[0].name] = value;
   return value;
 };
```
Now this is enough to run some basic code on Egg. The following function provides a convenient way to parse a program and run it in a fresh scope:
```javascript
  function run(program) {
    return evaluate(parse(program), Object.create(topScope));
  }
```
Let's run some program that computes the sum of the numbers 1 to 10
```javascript
run(`
  do(define(total, 0),
     define(count, 1),
     while(<(count, 11),
             do(define(total, +(total, count)),
                define(count, +(count, 1)))),
     print(total))
`);

//outputs 55
```

#### Functions
A programming language without functions is a poor programming language indeed. Fortunately, it isn’t hard to add a **fun** construct, which treats its last argument as the function’s body and uses all arguments before that as the names of the function’s parameters
```javascript
specialForms.fun = (args, scope) => {
    if(!args.length) {
        throw new SyntaxError("Functions need a body")
    }
    let body = args[args.length - 1]

    let params = args.slice(0, args.length - 1).map(expr => {
        if(expr.type != "word") {
            throw new SyntaxError("Parameter names must be words")
        }
        return expr.name
    })

    return function() {
        if(arguments.length != params.length) {
            throw new TypeError("Wrong number of arguments")
        }
        let localScope = Object.create(scope)
        for(let i = 0; i < arguments.length; i++) {
            localScope[params[i]] = arguments[i]
        }
        return evaluate(body, localScope)
    }
}
```
If the `args` array for **fun** does not exist (If it is called like this fun()), it throws a `SyntaxError`. Otherwise it assigns the last object in the array to the local binding `body`. This will serve as the function's body. 

The rest of the the objects in the array are treated as parameters. we map through them, check if the objects are word objects (as parameters can only be words) and if they are not, a `SyntaxError` is thrown else the map returns a new array with the name value of these objects. This array is assigned to `params`.

what the **fun** function returns is a function expression (ready to be called). 

This function first checks if the length of arguments we pass in when calling it is the same as the length of `params`. If it is not, it throws a `TypeError`. Else it progresses to run the code below it. All functions in Egg will get their own local scope so that local binding names or parameter names stored will be local to that function scope. `localScope` represents this local scope object. 

Next we loop through the `arguments` array, storing the paramater names in `localScope` and assigning each argument value to them. 

At the end, what this function returns is the result of evaluating the `body` object passing in `localScope` as it's scope object. 

And our function works!!
```javascript
run(`
do(define(plusOne, fun(a, +(a, 1))),
print(plusOne(10)))
`);
//outputs 11

run(`
do(define(pow, fun(base, exp,
if(==(exp, 0),
1,
*(base, pow(base, -(exp, 1)))))),
print(pow(2, 10)))
`);
//outputs 1024
```
## Exercises
### Chapter Twelve: Project: A programming Language
* 12.1 [Arrays](https://github.com/EmmanuelOkorieC/eloquent_js_12_programming_language_project/blob/main/chapter%2012%20exercises/arrays.js)

For this exercise, I was tasked to add support for arrays to Egg. By adding the following three functions to the top scope. `array(...values)` to construct an array containing the argument values, `length(array)` to get an array’s length, and `element(array, n)` to fetch the nth element from an array.

This question was pretty straightforward, so here is my implementation
```javascript
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
```
For the first function `array`, the parameter is defined with the rest syntax so that means it will accept all the arguments passed in as an array which i simply return. 

* 12.2 Closure

The way we have defined **fun** allows functions in Egg to reference the surrounding scope, allowing the function’s body to use local values that were visible at the time the function was defined, just like JavaScript functions do.

The following program illustrates this:  function **f** returns a function that adds its argument to **f**’s argument, meaning that it needs access to the local scope inside **f** to be able to use binding **a**.
```javascript
run(`
do(define(f, fun(a, fun(b, +(a, b)))),
print(f(4)(5)))
`);
//outputs 9
```
For this exercise, i was asked to Go back to the definition of the **fun** form and explain which mechanism causes this to work.

Like i pointed out in my overview, it is made possible because every function gets it's own `localScope` object which is created as a new object that makes the old scope object it's prototype. 

So the function **f** gets access to the outer scope object and stores it's own local bindings and parameters (in this case **a**) in the new object (`localScope`). **a** cannot be referenced outside the function scope because practically it wouldn't exist outside the function. Same goes to the function that **f** returns. It's new scope object gets access to **f** function's scope object (whose prototype is the outer scope object) and stores it's own local bindings and parameters (in this case **b**) that can not be referenced outside of it's function scope.

* 12.3 [Comments](https://github.com/EmmanuelOkorieC/eloquent_js_12_programming_language_project/blob/main/chapter%2012%20exercises/comments.js)

For this exercise, I was tasked to make Egg allow comments. For example, whenever it finds a hash sign (**#**), it could treat the rest of the line as a comment and ignore it, similar to `//` in JavaScript. The Author pointed out that it could be achieved by modifying the `skipSpace` function to skip comments as if they are whitespace so that all the points where skipSpace is called will now also skip comments.

The `skipSpace` function will be doing two things now, cutting comments and then white space. To match comments I need a regular expression and to remove them i need the `replace` method
```javascript
function skipSpace(string) {
    let newString = string.replace(/\#\s*.*/g, "")

    let first = newString.search(/\S/)
    if(first == -1) return ""
    return newString.slice(first)
}

console.log(parse(`
    # this a an Egg comment
    if(>(2, 3),
        print(2),
        # here's another comment
        print(3))
`))

//outputs
//{
//  type: 'apply',
//  operator: { type: 'word', name: 'if' },
//  args: [
//  ......
```
This worked but I felt that the code could be improved on. Instead of calling `search` and `slice` to cut white spaces, I could instead use the call to `replace` to do that too. Meaning we probably would not need to call `skipSpace` so many times
```javascript
function skipSpace(string) {
    return string.replace(/\#\s*.*|\s/g, "")
}
```
This worked too!!

* 12.4 [Fixing Scope](https://github.com/EmmanuelOkorieC/eloquent_js_12_programming_language_project/blob/main/chapter%2012%20exercises/fixingScope.js)

Currently, the only way to assign a binding a value is **define**. This construct acts as a way both to define new bindings and to give existing ones a new value.

This ambiguity causes a problem. When you try to give a nonlocal binding a new value, you will end up defining a local one with the same name instead. 

Example
```javascript
run(`
  do(define(a, 4),
     define(b, fun(val, do(define(a, val), print(a)))),
     b(6),
     print(a))
`)
   
 //outputs 
 // 6
 // 4
 
 // because they are in separate scope objects but it is awkward
 // because my goal ideally might be to change the variable
 // in the outer scope and have both my print statements return 6
```
For this exercise, I was tasked to add a special form **set**, similar to **define**, which gives a binding a new value, updating the binding in an outer scope if it doesn’t already exist in
the inner scope. If the binding is not defined at all, it throws a `ReferenceError` (another standard error type).

The author adviced to use `Object.getPrototypeOf` to get the prototype of an object. And also pointed out that scopes do not derive from `Object.prototype` so to call `hasOwnProperty` on them, we might have to use this clumsy expression:
```javascript
Object.prototype.hasOwnProperty.call(scope, name)`;
```
Since **set** would behave mostly like **define**, I started by defining it's structure. **set** must have 2 expression objects and the first must be a word object, If not it throws an error
```javascript
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
```
If the binding already exists in the local scope, It updates it. If not, It checks if it exists in the outer scope and updates it. If the binding is not defined at all, both in the inner and outer scope, It throws a `ReferenceError`
```javascript
run(`
  do(define(a, 4),
     define(b, fun(val, do(set(a, val), print(a)))),
     b(6),
     print(a))
`)

//outputs
// 6
// 6

run(`
  do(define(c, 4),
     define(b, fun(val, do(set(a, val), print(a)))),
     b(6),
     print(c))
`)

// outputs ReferenceError: Cannot set Property of Undefined Binding
```
Now running the same function from earlier, I get 6 from both **print** statements. Also if a value is not defined prior to calling **set**, it throws an error

## Job
### Unicode Handling
Make character strings support the entire byte array via UTF-8.

## Job
### Add C bindings
Much easier to build out the standard library if can call into C.
### Task
Runtime binding.

### Task
Define and include for make file linkage.


## Job
### Atomic array manipulation
Automatically lock arrays for the specified array manipulation function.

## Job
### Prototype CLANG backend
Need to be able to compile the language as run it.

## Job
### Design Union Types
Union types like typescript has would make UScript much easier to work with

Need a formal spec.
### Task
Incorporate the Union definition from TypeScript into *our* spec.

### Reply
Have an equivalent for strictNullChecks that includes null versus undefined.


## Job
### Create our hero statement
Every good language is really direct in what it's trying to solve 

For example, Rust's: <img src='https://dev.imagecdn.uclusion.com/f4d07672-e391-44be-9c1a-a34e66e2890b/d4ffe2bc-60ae-46d2-959d-730f0332823d.png' alt='' title='' width='300' />



Similarly we need to tell the user's what UScript is about, in the simplest words possible.

## Job
### Automated tests for CLANG backend
Need to be able test compiling the language.

## Job
### Region based memory management for garbage collection.
[Region based memory management](https://en.wikipedia.org/wiki/Region-based_memory_management) for garbage collection. That will still be useful even if go with reference counting later as internal references won't have to be tracked.

## Job
### Built in group by
Accepts a function that takes an element of the array as an argument.

## Job
### Null safety
Handle nulls in a developer friendly way.
### Reply
Test run time nullable assigned null.

### Reply
Test compile time non-nullable unassigned.

### Task
Unit tests.

### Task
Implement a null safe operator:



obj?.prop: Returns obj.prop if obj exists; otherwise, it returns undefined.



obj?.[prop]: Returns obj[prop] if obj exists; otherwise, it returns undefined - for dynamic or special characters.



obj.method?.(): Calls obj.method() if obj.method exists; otherwise, it returns undefined.

### Reply
Test compile time nullable unassigned.

### Suggest
Kotlin has good null handling <https://kotlinlang.org/docs/null-safety.html>.

### Reply
Test run time non-nullable unassigned.

### Task
Allow explicitly creating a variable as nullable. Variables are non-nullable by default.


## Job
### Initial pass at UScript syntax
Emphasis on developer experience.
### Task
Automatic referencing and dereferencing.

### Task
Variable binding.


## Job
### My job for testing in view with space.
### Task
See if this task closes.


## Job
### Need a UScript Intellij plugin.
Even for our own usage this is required.
### Suggest
Find a base language plugin upon which to build.


## Job
### Get basic REPL interpreter running
Even if wind up compiled later a basic REPL will give a feel for how usable Demo really is.
### Issue
Don't have a language spec yet. Can bring up a language shell, but without basic language definitions can't go much further.


### Bug
Asynchronous operations taking too long to release memory.

### Bug
Asynchronous handling must be easier.

### Bug
Make shadowing a variable name a compile error - no reason to allow.

### Bug
Website is sloshy on mobile.

### Bug
Problems with nested functions.

### Bug
The prototype needs to startup faster.

### Bug
The spec should explain how extensions will be handled.

### Bug
Taking too long to release memory on string loop test.

### Bug
Array equality should allow passing a comparator.

### Bug
Disallow function definitions within functions.

### Bug
Instance of failing for strings.

### Bug
Our spec has no way to declare a variable immutable. That's required because otherwise no way to hint compiler, code editor, reviewer, etc.

<img src='https://dev.imagecdn.uclusion.com/f4d07672-e391-44be-9c1a-a34e66e2890b/94bd06ef-6f8b-4d0b-9f3c-fac653d8b059.png' alt='' title='' width='730' />

### Bug
Shadowing via variable name case sensitivity should be compile error.

### Bug
Truthy still incomprehensible - need it simpler.

### Bug
Obviously looping past array length should be a compile error.

### Bug
Mutating within a loop fails silently.

### Bug
'var' keyword should really be 'let'

### Bug
NaN implementation missing negative bound.

### Bug
Need a create bug policy visible for users.

### Bug
Not consistent on requiring end line semicolons.

### Suggest
Use GitHub Actions for free since on a public repository.


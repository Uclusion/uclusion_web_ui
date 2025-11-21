## Job
### Add C bindings
Much easier to build out the standard library if can call into C.

#### Task
Runtime binding.

#### Task
Define and include for make file linkage.


## Job
### Null safety
Handle nulls in a developer friendly way.

#### Task
Unit tests.
> ##### Subtask
Test run time nullable assigned null.
> ##### Subtask
Test compile time non-nullable unassigned.
> ##### Subtask
Test compile time nullable unassigned.
> ##### Subtask
Test run time non-nullable unassigned.

#### Task
Implement a null safe operator:



obj?.prop: Returns obj.prop if obj exists; otherwise, it returns undefined.



obj?.[prop]: Returns obj[prop] if obj exists; otherwise, it returns undefined - for dynamic or special characters.



obj.method?.(): Calls obj.method() if obj.method exists; otherwise, it returns undefined.

#### Suggestion
Kotlin has good null handling <https://kotlinlang.org/docs/null-safety.html>.

#### Task
Allow explicitly creating a variable as nullable. Variables are non-nullable by default.


## Job
### Create our hero statement
Every good language is really direct in what it's trying to solve 

For example, Rust's: <img src='https://dev.imagecdn.uclusion.com/f4d07672-e391-44be-9c1a-a34e66e2890b/d4ffe2bc-60ae-46d2-959d-730f0332823d.png' alt='' title='' width='300' />



Similarly we need to tell the user's what UScript is about, in the simplest words possible.

## Job
### Region based memory management for garbage collection.
[Region based memory management](https://en.wikipedia.org/wiki/Region-based_memory_management) for garbage collection. That will still be useful even if go with reference counting later as internal references won't have to be tracked.

## Job
### Design Union Types
Union types like typescript has would make UScript much easier to work with

Need a formal spec.

#### Task
Incorporate the Union definition from TypeScript into *our* spec.
> ##### Subtask
Have an equivalent for strictNullChecks that includes null versus undefined.


## Job
### Need a UScript Intellij plugin.
Even for our own usage this is required.

#### Suggestion
Find a base language plugin upon which to build.


## Job
### Get basic REPL interpreter running
Even if wind up compiled later a basic REPL will give a feel for how usable Demo really is.

#### Issue
Don't have a language spec yet. Can bring up a language shell, but without basic language definitions can't go much further.


## Job
### Initial pass at UScript syntax
Emphasis on developer experience.

#### Task
Automatic referencing and dereferencing.

#### Task
Variable binding.


## Job
### My job for testing in view with space.

#### Task
See if this task closes.



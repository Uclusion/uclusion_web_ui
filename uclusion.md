| No Estimate | Estimated | Done |
|--------------|---------------|--------------|
| [Error handling](#error-handling)| [Get basic grammar defined](#get-basic-grammar-defined)| [Initial pass at UScript syntax](#initial-pass-at-uscript-syntax) |
| | 12-05-2025|  |
| [Need a UScript Intellij plugin.](#need-a-uscript-intellij-plugin.)| [Look for more founders](#look-for-more-founders)| [Prototype CLANG backend](#prototype-clang-backend) |
| | 11-28-2025|  |
| [Find events to attend](#find-events-to-attend)| [Figure out IPC](#figure-out-ipc)| [Main explanatory blog](#main-explanatory-blog) |
| | 11-26-2025|  |
| [Region based memory management for garbage collection.](#region-based-memory-management-for-garbage-collection.)| [Add C bindings](#add-c-bindings)| [Unicode Handling](#unicode-handling) |
| | 11-19-2025| Deployed to prod. |
| [Null safety](#null-safety)| [Design Union Types](#design-union-types)| [Automated tests for CLANG backend](#automated-tests-for-clang-backend) |
| | 11-22-2025| Deployed to stage. |
| [Get basic REPL interpreter running](#get-basic-repl-interpreter-running)| [Create our logo](#create-our-logo)|  |
| | 11-28-2025|  |
| [Create our hero statement](#create-our-hero-statement)| |  |
## Job
### Error handling
We need basic error handling with a returned value scheme like Go.
> ##### $${\color{orange} Reason \space For}$$
By the time you Go 1.13 wrap everything it's very similar to a stack trace.


#### Question
## Can we do better than wrapping errors?

Wrapping errors feels like building a stack trace by hand. What are our options?
### Option
### Support both raise catch and Go style return errors.
The syntax should allow for any combination of raise and return of errors on a function. If you expect the caller to handle the error then lean towards return and otherwise lean towards raise.
> ##### $${\color{lightgreen} Reason \space For}$$
This allows us an immediate two classes of errors - expected to be handled and likely needing to be fixed.

> ##### $${\color{orange} Reason \space For}$$
The flexibility is good but will mean growing the error handling in two directions.


### Option
### Here is my option with a picture.



![](https://dev.imagecdn.uclusion.com/69c38048-113c-4a64-8587-72d03610260c/61c70dec-2416-4661-98e9-e2e2b92499c8.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiI2OWMzODA0OC0xMTNjLTRhNjQtODU4Ny03MmQwMzYxMDI2MGMifQ.7HpKa6wz9gh9yXXWN0uOn-VyQev6wrq-AHAkWqDdsRs)

### Option
### Automatic error context creation
A function will be provided that allows you to return an error with the runtime argument values of the enclosing function automatically included.

#### Issue
Then you would be automatically logging values that might be sensitive.




## Job
### Need a UScript Intellij plugin.
Even for our own usage this is required.

#### Suggestion
Find a base language plugin upon which we can build.


## Job
### Find events to attend
Want to introduce the language at some developer conference.

## Job
### Get basic grammar defined
What are our statement literals? How do you want to define functions? Operators?
> ##### $${\color{green} Reason \space For}$$
Will look at expressions in literals as well.


#### Task
Function declaration syntax.

#### Task
Definition of statement literals.


## Job
### Look for more founders
Our current decision making and coding scaling well so consider talent if available.

## Job
### Figure out IPC
We need a way to define how sub threads or processes will pass data to each other.

#### Question
Something similar to Erlang mailboxes? Go channels? ﻿@TARGET USER﻿ what do you think?
> ##### Reply
What is our main use case?
### Option
### Mailboxes
Each process will have a unique mailbox, and you send to it by broadcasting to it's PID.

### Option
### Pub/Sub
Each process will subscribe to one or more topics, and you send to all receivers

### Option
### Channels
We'd have generic channels as first class objects that any process can write to or read from.
> ##### $${\color{yellow} Reason \space For}$$
Try and see how it goes.




## Job
### Region based memory management for garbage collection.
[Region based memory management](https://en.wikipedia.org/wiki/Region-based_memory_management) for garbage collection. That will still be useful even if we go with reference counting later as internal references won't have to be tracked.

## Job
### Add C bindings
We would have a much easier time building out the standard library if we can call into C.
> ##### $${\color{green} Reason \space For}$$
Starting that integration now will prevent duplicating functionality.

> ##### $${\color{lightgreen} Reason \space For}$$
Agreed - front load this work.


#### Task
Runtime binding.

#### Task
Define and include for make file linkage.


## Job
### Null safety
Handle nulls in a developer friendly way.
> ##### $${\color{lightgreen} Reason \space For}$$
Table stakes feature.

> ##### $${\color{yellow} Reason \space For}$$
Would like us to do better than conditional operators but difficult.


#### Task
Implement a null safe operator:



obj?.prop: Returns obj.prop if obj exists; otherwise, it returns undefined.



obj?.[prop]: Returns obj[prop] if obj exists; otherwise, it returns undefined - for dynamic or special characters.



obj.method?.(): Calls obj.method() if obj.method exists; otherwise, it returns undefined.

#### Task
Allow explicitly creating a variable as nullable. Variables are non-nullable by default.

#### Suggestion
Kotlin has good null handling <https://kotlinlang.org/docs/null-safety.html>.
> ##### $${\color{lightgreen} Reason \space For}$$
Yes I like the way Kotlin easily declares nullable or not.



#### Task
Unit tests.
> ##### Subtask
Test run time non-nullable unassigned.
> ##### Subtask
Test compile time nullable unassigned.
> ##### Subtask
Test compile time non-nullable unassigned.
> ##### Subtask
Test run time nullable assigned null.


## Job
### Get basic REPL interpreter running
Even if we wind up compiled later a basic REPL will give us a feel for how usable Demo really is.

#### Issue
We don't have a language spec yet. We can bring up a language shell, but without basic language definitions we can't go much further.
> ##### Reply
﻿@John Doe﻿ can you create a job with requirements for basic language definitions?


## Job
### Create our hero statement
Every good language is really direct in what it's trying to solve 

For example, Rust's: <img src='https://dev.imagecdn.uclusion.com/9e7bcee9-7203-42af-92ad-578e5832b47b/cfc937e0-580e-4e67-9d3f-205c48784311.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiI5ZTdiY2VlOS03MjAzLTQyYWYtOTJhZC01NzhlNTgzMmI0N2IifQ.hhz1ODnYziWBVlDtTXpr4Kb0LY0x9BFZOI3pPRv5SE8' alt='' title='' width='300' />



Similarly we need to tell the user's what UScript is about, in the simplest words possible.

## Job
### Design Union Types
Union types like typescript has would make UScript much easier to work with

We need to sit down and make a formal spec.
> ##### $${\color{lightgreen} Reason \space For}$$
Yeah, they come in really handy when handling api error responses.


#### Report
Union types are defined [here](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types) (i.e. exactly as defined in TypeScript).

﻿@Samantha Demo﻿ I'd really like your feedback.

#### Task
Incorporate the Union definition from TypeScript into *our* spec.


## Job
### Create our logo
We need a Logo for UScript, something simple, but impactful.

#### Report
What do think of this?

<img src='https://dev.imagecdn.uclusion.com/9e7bcee9-7203-42af-92ad-578e5832b47b/8fa3eb0d-d59b-40e7-989b-7ab435452f97.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiI5ZTdiY2VlOS03MjAzLTQyYWYtOTJhZC01NzhlNTgzMmI0N2IifQ.hhz1ODnYziWBVlDtTXpr4Kb0LY0x9BFZOI3pPRv5SE8' alt='' title='' width='200' />


## Job
### Initial pass at UScript syntax
Emphasis on developer experience.
> ##### $${\color{green} Reason \space For}$$
Should tie in with the testing strategy.


#### Report
Please review the latest checked in syntax docs.
> ##### Reply
Please add a section on arrow functions.


## Job
### Prototype CLANG backend
We need to be able to compile the language as we're running it.

## Job
### Main explanatory blog
Tip of the spear explanation of the value of our new script.

## Job
### Unicode Handling
Make character strings support the entire byte array via UTF-8.

## Job
### Automated tests for CLANG backend
We need to be able test compiling the language.


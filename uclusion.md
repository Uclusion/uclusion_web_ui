| No Estimate | Estimated | | Done | |
|--------------|---------------|--------------|--------------|--------------|
| [Error handling](#5a8db39c-f20e-4537-9b50-b7cef2468849)| [Get basic grammar defined](#e3d224c0-eb33-488d-9cae-9e10ce8317dc)| 12/05| [Initial pass at UScript syntax](#cebd6197-1a64-47f1-9378-67f29965881f)|  |
| [Need a UScript Intellij plugin.](#439ea50a-af31-4299-a7a0-91f7384069ee)| [Look for more founders](#5581c29e-dd95-4609-910a-19c8505ba7a7)| 11/28| [Prototype CLANG backend](#8e3ed95b-d80c-4365-a998-6d8f7ba68b1e)|  |
| [Find events to attend](#fc79642e-2dc0-4120-bb8e-c07fe59add50)| [Figure out IPC](#455a9939-13be-47e2-85de-d417ddf84e11)| 11/26| [Main explanatory blog](#0ec0a5b8-eef1-417c-b529-c44cc0b78da0)|  |
| [Region based memory management for garbage collection.](#ecbf942f-033a-479e-9c86-7386841845da)| [Add C bindings](#f5772840-d413-4f23-8364-307256a7f4df)| 11/19| [Unicode Handling](#6bcbcdd8-0abd-4e47-9519-2489dcdefeb8)| Deployed to prod. |
| [Null safety](#bd0aec7b-70e5-47be-9d6f-a7b1dfe7af65)| [Design Union Types](#f54dfca9-77f7-480b-8df9-7ea5b9344bf1)| 11/22| [Automated tests for CLANG backend](#f632fd36-8603-40c6-af11-40dd33ad9efe)| Deployed to stage. |
| [Get basic REPL interpreter running](#2a83ce04-662f-4824-8372-1c6a82ee048f)| [Create our logo](#5e180eb1-b437-44db-83f1-41596378da1a)| 11/28| |  |
| [Create our hero statement](#ff4514cb-bd95-4ea3-92b0-a3e39e2be7f3)| | | |  |
## Job <a name="5a8db39c-f20e-4537-9b50-b7cef2468849"></a>
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

## Job <a name="439ea50a-af31-4299-a7a0-91f7384069ee"></a>
### Need a UScript Intellij plugin.
Even for our own usage this is required.

#### Suggestion
Find a base language plugin upon which we can build.

## Job <a name="fc79642e-2dc0-4120-bb8e-c07fe59add50"></a>
### Find events to attend
Want to introduce the language at some developer conference.

## Job <a name="e3d224c0-eb33-488d-9cae-9e10ce8317dc"></a>
### Get basic grammar defined
What are our statement literals? How do you want to define functions? Operators?

> ##### $${\color{green} Reason \space For}$$
Will look at expressions in literals as well.

#### Task
Function declaration syntax.

#### Task
Definition of statement literals.

## Job <a name="5581c29e-dd95-4609-910a-19c8505ba7a7"></a>
### Look for more founders
Our current decision making and coding scaling well so consider talent if available.

## Job <a name="455a9939-13be-47e2-85de-d417ddf84e11"></a>
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

## Job <a name="ecbf942f-033a-479e-9c86-7386841845da"></a>
### Region based memory management for garbage collection.
[Region based memory management](https://en.wikipedia.org/wiki/Region-based_memory_management) for garbage collection. That will still be useful even if we go with reference counting later as internal references won't have to be tracked.

## Job <a name="f5772840-d413-4f23-8364-307256a7f4df"></a>
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

## Job <a name="bd0aec7b-70e5-47be-9d6f-a7b1dfe7af65"></a>
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

## Job <a name="2a83ce04-662f-4824-8372-1c6a82ee048f"></a>
### Get basic REPL interpreter running
Even if we wind up compiled later a basic REPL will give us a feel for how usable Demo really is.

#### Issue
We don't have a language spec yet. We can bring up a language shell, but without basic language definitions we can't go much further.

> ##### Reply
﻿@John Doe﻿ can you create a job with requirements for basic language definitions?

## Job <a name="ff4514cb-bd95-4ea3-92b0-a3e39e2be7f3"></a>
### Create our hero statement
Every good language is really direct in what it's trying to solve 

For example, Rust's: <img src='https://dev.imagecdn.uclusion.com/9e7bcee9-7203-42af-92ad-578e5832b47b/cfc937e0-580e-4e67-9d3f-205c48784311.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiI5ZTdiY2VlOS03MjAzLTQyYWYtOTJhZC01NzhlNTgzMmI0N2IifQ.hhz1ODnYziWBVlDtTXpr4Kb0LY0x9BFZOI3pPRv5SE8' alt='' title='' width='300' />



Similarly we need to tell the user's what UScript is about, in the simplest words possible.

## Job <a name="f54dfca9-77f7-480b-8df9-7ea5b9344bf1"></a>
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

## Job <a name="5e180eb1-b437-44db-83f1-41596378da1a"></a>
### Create our logo
We need a Logo for UScript, something simple, but impactful.

#### Report
What do think of this?

<img src='https://dev.imagecdn.uclusion.com/9e7bcee9-7203-42af-92ad-578e5832b47b/8fa3eb0d-d59b-40e7-989b-7ab435452f97.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiI5ZTdiY2VlOS03MjAzLTQyYWYtOTJhZC01NzhlNTgzMmI0N2IifQ.hhz1ODnYziWBVlDtTXpr4Kb0LY0x9BFZOI3pPRv5SE8' alt='' title='' width='200' />

## Job <a name="cebd6197-1a64-47f1-9378-67f29965881f"></a>
### Initial pass at UScript syntax
Emphasis on developer experience.

> ##### $${\color{green} Reason \space For}$$
Should tie in with the testing strategy.

#### Report
Please review the latest checked in syntax docs.

> ##### Reply
Please add a section on arrow functions.

## Job <a name="8e3ed95b-d80c-4365-a998-6d8f7ba68b1e"></a>
### Prototype CLANG backend
We need to be able to compile the language as we're running it.

## Job <a name="0ec0a5b8-eef1-417c-b529-c44cc0b78da0"></a>
### Main explanatory blog
Tip of the spear explanation of the value of our new script.

## Job <a name="6bcbcdd8-0abd-4e47-9519-2489dcdefeb8"></a>
### Unicode Handling
Make character strings support the entire byte array via UTF-8.

## Job <a name="f632fd36-8603-40c6-af11-40dd33ad9efe"></a>
### Automated tests for CLANG backend
We need to be able test compiling the language.


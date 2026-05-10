| No Estimate | Estimated | | Done | |
|--------------|---------------|--------------|--------------|--------------|
| [Error handling](#861ea850-6c4a-4b7a-b74e-2112bf9aea90)| [Add C bindings](#586b1f22-2efd-46d3-b781-307ce7fb2392)| 04/30| [Unicode Handling](#99fe110d-0abd-4699-8c0b-e5257f01f112)| Deployed to prod. |
| [Region based memory management for garbage collection.](#d79f3ea7-313b-4f50-9cde-9d5e220f0ace)| [Figure out IPC](#02cf20d1-ff49-426c-87fb-49bc4ccbc017)| 05/07| [Prototype CLANG backend](#b6a16330-d393-42e5-a56f-08613bb39211)|  |
| [Need a UScript Intellij plugin.](#0260b98a-2777-4c1c-95df-73c341727053)| [Look for more founders](#bed0fd0e-eebe-471a-a6b6-89b2ed2a6cc0)| 05/09| [Automated tests for CLANG backend](#1888169f-9203-4f53-929b-4954bbcbcb00)| Deployed to stage. |
| [Get basic REPL interpreter running](#f20c7eec-90dc-48de-af5d-8530cc73a6cd)| [Create our logo](#e6dc00f5-e134-4977-a60a-46f78b0ce725)| 05/09| [Main explanatory blog](#db79a92a-b477-407c-b531-af0dabbca307)|  |
| [Null safety](#244d958c-93ed-4712-b76a-4a40550d151e)| [Get basic grammar defined](#b9d86ae9-c0e0-483a-b2a4-a8e9420fb325)| 05/16| [Initial pass at UScript syntax](#dd91cc95-3e1d-4633-b5db-e25cb2eb925e)|  |
| [Create our hero statement](#b3ecd020-2fa2-437b-aaa8-78034ba2f573)| [Design Union Types](#aa7cec30-e564-4747-bba3-4afdab740554)| 05/03| |  |
| [Find events to attend](#a5c6dd67-95cc-40d3-a151-6ddc2ebe9aa8)| | | |  |
## Job J-Engineering-3<a name="J-Engineering-3"></a>
### Add C bindings
We would have a much easier time building out the standard library if we can call into C.

> ##### $${\color{green} Reason \space For}$$E-Engineering-3<a name="E-Engineering-3"></a>
Starting that integration now will prevent duplicating functionality.

> ##### $${\color{lightgreen} Reason \space For}$$E-Engineering-5<a name="E-Engineering-5"></a>
Agreed - front load this work.

#### Tasks 
#### Task T-Engineering-1<a name="T-Engineering-1"></a> 
Define and include for make file linkage.

#### Task T-Engineering-2<a name="T-Engineering-2"></a> 
Runtime binding.

## Job J-Engineering-1<a name="J-Engineering-1"></a>
### Error handling
We need basic error handling with a returned value scheme like Go.

> ##### $${\color{orange} Reason \space For}$$E-Engineering-2<a name="E-Engineering-2"></a>
By the time you Go 1.13 wrap everything it's very similar to a stack trace.

#### Assistance 
#### Question Q-Engineering-2<a name="Q-Engineering-2"></a> 
## Can we do better than wrapping errors?

Wrapping errors feels like building a stack trace by hand. What are our options?

> ##### Reply C-Engineering-9<a name="C-Engineering-9"></a> 
This is some info.

### OptionO-1<a name="O-1"></a>
### Automatic error context creation
A function will be provided that allows you to return an error with the runtime argument values of the enclosing function automatically included.

#### Assistance 
#### Issue I-Default-1<a name="I-Default-1"></a> 
Then you would be automatically logging values that might be sensitive.

### OptionO-2<a name="O-2"></a>
### Support both raise catch and Go style return errors.
The syntax should allow for any combination of raise and return of errors on a function. If you expect the caller to handle the error then lean towards return and otherwise lean towards raise.

> ##### $${\color{lightgreen} Reason \space For}$$E-Default-1<a name="E-Default-1"></a>
This allows us an immediate two classes of errors - expected to be handled and likely needing to be fixed.

> ##### $${\color{orange} Reason \space For}$$E-Default-2<a name="E-Default-2"></a>
The flexibility is good but will mean growing the error handling in two directions.

## Job J-Engineering-5<a name="J-Engineering-5"></a>
### Region based memory management for garbage collection.
[Region based memory management](https://en.wikipedia.org/wiki/Region-based_memory_management) for garbage collection. That will still be useful even if we go with reference counting later as internal references won't have to be tracked.

## Job J-Engineering-4<a name="J-Engineering-4"></a>
### Need a UScript Intellij plugin.
Even for our own usage this is required.

#### Assistance 
#### Suggestion S-Engineering-3<a name="S-Engineering-3"></a> 
Find a base language plugin upon which we can build.

## Job J-Engineering-10<a name="J-Engineering-10"></a>
### Get basic REPL interpreter running
Even if we wind up compiled later a basic REPL will give us a feel for how usable Demo really is.

#### Assistance 
#### Issue I-Engineering-1<a name="I-Engineering-1"></a> 
We don't have a language spec yet. We can bring up a language shell, but without basic language definitions we can't go much further.

> ##### Reply C-Engineering-7<a name="C-Engineering-7"></a> 
﻿@John Doe﻿ can you create a job with requirements for basic language definitions?

## Job J-Engineering-9<a name="J-Engineering-9"></a>
### Figure out IPC
We need a way to define how sub threads or processes will pass data to each other.

> ##### $${\color{yellow} Reason \space For}$$E-Engineering-8<a name="E-Engineering-8"></a>
Looks good

#### Assistance 
#### Question Q-Engineering-1<a name="Q-Engineering-1"></a> 
Something similar to Erlang mailboxes? Go channels? ﻿@TARGET USER﻿ what do you think?

> ##### Reply C-Engineering-6<a name="C-Engineering-6"></a> 
What is our main use case?

### OptionO-2<a name="O-2"></a>
### Pub/Sub
Each process will subscribe to one or more topics, and you send to all receivers

### OptionO-1<a name="O-1"></a>
### Mailboxes
Each process will have a unique mailbox, and you send to it by broadcasting to it's PID.

### OptionO-3<a name="O-3"></a>
### Channels
We'd have generic channels as first class objects that any process can write to or read from.

> ##### $${\color{yellow} Reason \space For}$$E-Default-1<a name="E-Default-1"></a>
Try and see how it goes.

#### Question Q-Engineering-3<a name="Q-Engineering-3"></a> 
Is this a question?

#### Question Q-Engineering-5<a name="Q-Engineering-5"></a> 
How long for a question to show up now?

### OptionO-2<a name="O-2"></a>
### Maybe they could wait.
Maybe not though.

### OptionO-1<a name="O-1"></a>
### Forever
Way too long.

#### Question Q-Engineering-4<a name="Q-Engineering-4"></a> 
How long for a question to show up?

### OptionO-2<a name="O-2"></a>
### Maybe they could wait.
Maybe not though.

### OptionO-1<a name="O-1"></a>
### Forever
Way too long.

## Job J-Engineering-2<a name="J-Engineering-2"></a>
### Null safety
Handle nulls in a developer friendly way.

> ##### $${\color{lightgreen} Reason \space For}$$E-Engineering-7<a name="E-Engineering-7"></a>
Table stakes feature.

> ##### $${\color{yellow} Reason \space For}$$E-Engineering-6<a name="E-Engineering-6"></a>
Would like us to do better than conditional operators but difficult.

#### Tasks 
#### Task T-Engineering-3<a name="T-Engineering-3"></a> 
Allow explicitly creating a variable as nullable. Variables are non-nullable by default.

#### Task T-Engineering-4<a name="T-Engineering-4"></a> 
Unit tests.

> ##### Grouped task C-Engineering-2<a name="C-Engineering-2"></a> 
Test compile time non-nullable unassigned.

> ##### Grouped task C-Engineering-3<a name="C-Engineering-3"></a> 
Test run time non-nullable unassigned.

> ##### Grouped task C-Engineering-4<a name="C-Engineering-4"></a> 
Test compile time nullable unassigned.

> ##### Grouped task C-Engineering-5<a name="C-Engineering-5"></a> 
Test run time nullable assigned null.

#### Task T-Engineering-5<a name="T-Engineering-5"></a> 
Implement a null safe operator:



obj?.prop: Returns obj.prop if obj exists; otherwise, it returns undefined.



obj?.[prop]: Returns obj[prop] if obj exists; otherwise, it returns undefined - for dynamic or special characters.



obj.method?.(): Calls obj.method() if obj.method exists; otherwise, it returns undefined.

#### Assistance 
#### Suggestion S-Engineering-1<a name="S-Engineering-1"></a> 
Kotlin has good null handling <https://kotlinlang.org/docs/null-safety.html>.

> ##### $${\color{lightgreen} Reason \space For}$$E-Default-1<a name="E-Default-1"></a>
Yes I like the way Kotlin easily declares nullable or not.

## Job J-sd-1<a name="J-sd-1"></a>
### Look for more founders
Our current decision making and coding scaling well so consider talent if available.

## Job J-Marketing-2<a name="J-Marketing-2"></a>
### Create our hero statement
Every good language is really direct in what it's trying to solve

For example, Rust's: ![](https://dev.imagecdn.uclusion.com/0f13660a-8420-401a-8340-315c9505b2de/ef3f3b90-384e-4a76-98e2-82d2f38f463b.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiIwZjEzNjYwYS04NDIwLTQwMWEtODM0MC0zMTVjOTUwNWIyZGUifQ.tT_0yXgZYmMnylV1p23HSX6CecCPV3Yp7ejgemucaz8)



Similarly we need to tell the user's what UScript is about, in the simplest words possible.

## Job J-sd-3<a name="J-sd-3"></a>
### Find events to attend
Want to introduce the language at some developer conference.

## Job J-Marketing-1<a name="J-Marketing-1"></a>
### Create our logo
We need a Logo for UScript, something simple, but impactful.

#### Reports 
#### Report R-Marketing-1<a name="R-Marketing-1"></a> 
What do think of this?

![](https://dev.imagecdn.uclusion.com/0f13660a-8420-401a-8340-315c9505b2de/a1422a63-9816-4f2f-90c2-7f7b9d65f5f2.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiIwZjEzNjYwYS04NDIwLTQwMWEtODM0MC0zMTVjOTUwNWIyZGUifQ.tT_0yXgZYmMnylV1p23HSX6CecCPV3Yp7ejgemucaz8)

## Job J-mywork-1<a name="J-mywork-1"></a>
### Get basic grammar defined
What are our statement literals? How do you want to define functions? Operators?

> ##### $${\color{green} Reason \space For}$$E-mywork-1<a name="E-mywork-1"></a>
Will look at expressions in literals as well.

#### Tasks 
#### Task T-mywork-1<a name="T-mywork-1"></a> 
Definition of statement literals.

#### Task T-mywork-2<a name="T-mywork-2"></a> 
Function declaration syntax.

## Job J-Engineering-8<a name="J-Engineering-8"></a>
### Design Union Types
Union types like typescript has would make UScript much easier to work with

We need to sit down and make a formal spec.

> ##### $${\color{lightgreen} Reason \space For}$$E-Engineering-1<a name="E-Engineering-1"></a>
Yeah, they come in really handy when handling api error responses.

#### Reports 
#### Report R-Engineering-1<a name="R-Engineering-1"></a> 
Union types are defined [here](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types) (i.e. exactly as defined in TypeScript).

﻿@Samantha Demo﻿ I'd really like your feedback.

#### Tasks 
#### Task T-Engineering-6<a name="T-Engineering-6"></a> 
Incorporate the Union definition from TypeScript into *our* spec.

> ##### Grouped task C-Engineering-8<a name="C-Engineering-8"></a> 
I'm trying a note now but this is grouped task.

#### Notes 
#### Note R-Engineering-3<a name="R-Engineering-3"></a> 
Now try note again with fix.

## Job J-mywork-2<a name="J-mywork-2"></a>
### Unicode Handling
Make character strings support the entire byte array via UTF-8.

## Job J-Engineering-12<a name="J-Engineering-12"></a>
### Prototype CLANG backend
We need to be able to compile the language as we're running it.

## Job J-Engineering-13<a name="J-Engineering-13"></a>
### Automated tests for CLANG backend
We need to be able test compiling the language.

## Job J-sd-2<a name="J-sd-2"></a>
### Main explanatory blog
Tip of the spear explanation of the value of our new script.

## Job J-Engineering-11<a name="J-Engineering-11"></a>
### Initial pass at UScript syntax
Emphasis on developer experience.

> ##### $${\color{green} Reason \space For}$$E-Engineering-4<a name="E-Engineering-4"></a>
Should tie in with the testing strategy.

#### Reports 
#### Report R-Engineering-2<a name="R-Engineering-2"></a> 
Please review the latest checked in syntax docs.

> ##### Reply C-Engineering-1<a name="C-Engineering-1"></a> 
Please add a section on arrow functions.


| No Estimate | Estimated | | Done | |
|--------------|---------------|--------------|--------------|--------------|
| [Error handling](#861ea850-6c4a-4b7a-b74e-2112bf9aea90)| [Add C bindings](#586b1f22-2efd-46d3-b781-307ce7fb2392)| 04/30| [Unicode Handling](#99fe110d-0abd-4699-8c0b-e5257f01f112)| Deployed to prod. |
| [Region based memory management for garbage collection.](#d79f3ea7-313b-4f50-9cde-9d5e220f0ace)| [Figure out IPC](#02cf20d1-ff49-426c-87fb-49bc4ccbc017)| 05/07| [Prototype CLANG backend](#b6a16330-d393-42e5-a56f-08613bb39211)|  |
| [Need a UScript Intellij plugin.](#0260b98a-2777-4c1c-95df-73c341727053)| [Look for more founders](#bed0fd0e-eebe-471a-a6b6-89b2ed2a6cc0)| 05/09| [Automated tests for CLANG backend](#1888169f-9203-4f53-929b-4954bbcbcb00)| Deployed to stage. |
| [Get basic REPL interpreter running](#f20c7eec-90dc-48de-af5d-8530cc73a6cd)| [Create our logo](#e6dc00f5-e134-4977-a60a-46f78b0ce725)| 05/09| [Main explanatory blog](#db79a92a-b477-407c-b531-af0dabbca307)|  |
| [Null safety](#244d958c-93ed-4712-b76a-4a40550d151e)| [Get basic grammar defined](#b9d86ae9-c0e0-483a-b2a4-a8e9420fb325)| 05/16| [Initial pass at UScript syntax](#dd91cc95-3e1d-4633-b5db-e25cb2eb925e)|  |
| [Create our hero statement](#b3ecd020-2fa2-437b-aaa8-78034ba2f573)| [Design Union Types](#aa7cec30-e564-4747-bba3-4afdab740554)| 05/03| |  |
| [Find events to attend](#a5c6dd67-95cc-40d3-a151-6ddc2ebe9aa8)| | | |  |
## Job <a name="586b1f22-2efd-46d3-b781-307ce7fb2392"></a>
### Add C bindings
We would have a much easier time building out the standard library if we can call into C.

> ##### $${\color{green} Reason \space For}$$
#### Question <a name="0c78f264-826c-4e74-b709-25a7dec1dbd8"></a> 
Starting that integration now will prevent duplicating functionality.

> ##### $${\color{lightgreen} Reason \space For}$$ <a name="69366eca-a634-4caa-9717-0be14b2116ef"></a> 
Agreed - front load this work.

#### Tasks 
#### Task <a name="be3c524d-0c69-4d27-8b9e-5ecd13c8f277"></a> 
Define and include for make file linkage.

#### Task <a name="839ca51b-2305-4cf3-8fc0-5eea5c402d7a"></a> 
Runtime binding.

## Job <a name="861ea850-6c4a-4b7a-b74e-2112bf9aea90"></a>
### Error handling
We need basic error handling with a returned value scheme like Go.

> ##### $${\color{orange} Reason \space For}$$
#### Question <a name="f5cd81d5-06e3-411e-8511-c8bc549140f3"></a> 
By the time you Go 1.13 wrap everything it's very similar to a stack trace.

#### Assistance 
#### Question <a name="40b4e4a1-f4b9-4fd3-a6bf-b44ef7608fcd"></a> 
## Can we do better than wrapping errors?

Wrapping errors feels like building a stack trace by hand. What are our options?

### Option<a name="82bc16ca-1de0-4649-b82f-ef3da9d4bcd1"></a>
### Automatic error context creation
A function will be provided that allows you to return an error with the runtime argument values of the enclosing function automatically included.

#### Assistance 
#### Issue <a name="3a7f4ff0-ec1e-4000-9145-7520d5c3ccf5"></a> 
Then you would be automatically logging values that might be sensitive.

### Option<a name="f36cfb6c-d720-4f30-bc23-404ad9587346"></a>
### Support both raise catch and Go style return errors.
The syntax should allow for any combination of raise and return of errors on a function. If you expect the caller to handle the error then lean towards return and otherwise lean towards raise.

> ##### $${\color{lightgreen} Reason \space For}$$
#### Question <a name="9f0dec8a-7afd-4d6f-98bd-150daa2ddc6e"></a> 
This allows us an immediate two classes of errors - expected to be handled and likely needing to be fixed.

> ##### $${\color{orange} Reason \space For}$$
#### Question <a name="18719dc4-961d-482d-b43c-b5e01d1ff0d9"></a> 
The flexibility is good but will mean growing the error handling in two directions.

## Job <a name="d79f3ea7-313b-4f50-9cde-9d5e220f0ace"></a>
### Region based memory management for garbage collection.
[Region based memory management](https://en.wikipedia.org/wiki/Region-based_memory_management) for garbage collection. That will still be useful even if we go with reference counting later as internal references won't have to be tracked.

## Job <a name="0260b98a-2777-4c1c-95df-73c341727053"></a>
### Need a UScript Intellij plugin.
Even for our own usage this is required.

#### Assistance 
#### Suggestion <a name="2e054397-793c-40ee-861a-7f1991ab6cfd"></a> 
Find a base language plugin upon which we can build.

## Job <a name="f20c7eec-90dc-48de-af5d-8530cc73a6cd"></a>
### Get basic REPL interpreter running
Even if we wind up compiled later a basic REPL will give us a feel for how usable Demo really is.

#### Assistance 
#### Issue <a name="61d6a61e-dcc6-456e-abca-ca205ad9a9a3"></a> 
We don't have a language spec yet. We can bring up a language shell, but without basic language definitions we can't go much further.

> ##### Reply <a name="e064aabf-92ba-4fc2-bf05-7ff1e216d8c2"></a> 
﻿@John Doe﻿ can you create a job with requirements for basic language definitions?

## Job <a name="02cf20d1-ff49-426c-87fb-49bc4ccbc017"></a>
### Figure out IPC
We need a way to define how sub threads or processes will pass data to each other.

> ##### $${\color{yellow} Reason \space For}$$
#### Question <a name="a1892a6b-83ff-4d1e-86ba-ec3ed046f1c6"></a> 
Looks good

#### Assistance 
#### Question <a name="1aa2ebac-8f7e-4f0a-90ce-67fe5365fd82"></a> 
Something similar to Erlang mailboxes? Go channels? ﻿@TARGET USER﻿ what do you think?

> ##### Reply <a name="82cb63a0-206d-4c79-b05a-4baca7323a62"></a> 
What is our main use case?

### Option<a name="f7d9ef42-30a3-4935-a454-9aedf4ea3ce0"></a>
### Pub/Sub
Each process will subscribe to one or more topics, and you send to all receivers

### Option<a name="b762c66b-c1f7-4cda-aab3-c122666b3f8b"></a>
### Mailboxes
Each process will have a unique mailbox, and you send to it by broadcasting to it's PID.

### Option<a name="b0efa767-5245-4700-9926-fc911976f016"></a>
### Channels
We'd have generic channels as first class objects that any process can write to or read from.

> ##### $${\color{yellow} Reason \space For}$$
#### Question <a name="c1525173-bf19-4da0-82c8-5ae91eb06144"></a> 
Try and see how it goes.

## Job <a name="244d958c-93ed-4712-b76a-4a40550d151e"></a>
### Null safety
Handle nulls in a developer friendly way.

> ##### $${\color{lightgreen} Reason \space For}$$
#### Question <a name="ebadf5d4-2442-4f06-a000-eaf81d71d690"></a> 
Table stakes feature.

> ##### $${\color{yellow} Reason \space For}$$
#### Question <a name="97de6ee0-adf9-4367-b90e-10f8a3e6e7ea"></a> 
Would like us to do better than conditional operators but difficult.

#### Tasks 
#### Task <a name="e1e2f3ee-c139-40e7-a41f-7d6f0dc1e3f0"></a> 
Allow explicitly creating a variable as nullable. Variables are non-nullable by default.

#### Task <a name="bacf66b2-d90a-4379-a03d-64ce9a2c7b41"></a> 
Unit tests.

> ##### Grouped task <a name="68d11f1a-e377-496e-8172-88857caefd86"></a> 
Test compile time non-nullable unassigned.

> ##### Grouped task <a name="4db1bd28-91a8-45dc-ab1e-26a98e4b31ef"></a> 
Test run time non-nullable unassigned.

> ##### Grouped task <a name="7fdad886-61b3-4dad-a32f-7ca2c63d9456"></a> 
Test compile time nullable unassigned.

> ##### Grouped task <a name="1ad925b7-a170-4e6a-bbc1-069a824f3077"></a> 
Test run time nullable assigned null.

#### Task <a name="af4010bd-7849-452b-8dc9-a555193da209"></a> 
Implement a null safe operator:



obj?.prop: Returns obj.prop if obj exists; otherwise, it returns undefined.



obj?.[prop]: Returns obj[prop] if obj exists; otherwise, it returns undefined - for dynamic or special characters.



obj.method?.(): Calls obj.method() if obj.method exists; otherwise, it returns undefined.

#### Assistance 
#### Suggestion <a name="7518d685-a31d-42ab-acaf-bf128a199ab2"></a> 
Kotlin has good null handling <https://kotlinlang.org/docs/null-safety.html>.

> ##### $${\color{lightgreen} Reason \space For}$$
#### Question <a name="e1a57996-a18a-414d-b64c-7fccd4f72b6b"></a> 
Yes I like the way Kotlin easily declares nullable or not.

## Job <a name="bed0fd0e-eebe-471a-a6b6-89b2ed2a6cc0"></a>
### Look for more founders
Our current decision making and coding scaling well so consider talent if available.

## Job <a name="b3ecd020-2fa2-437b-aaa8-78034ba2f573"></a>
### Create our hero statement
Every good language is really direct in what it's trying to solve

For example, Rust's: ![](https://dev.imagecdn.uclusion.com/0f13660a-8420-401a-8340-315c9505b2de/ef3f3b90-384e-4a76-98e2-82d2f38f463b.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiIwZjEzNjYwYS04NDIwLTQwMWEtODM0MC0zMTVjOTUwNWIyZGUifQ.tT_0yXgZYmMnylV1p23HSX6CecCPV3Yp7ejgemucaz8)



Similarly we need to tell the user's what UScript is about, in the simplest words possible.

## Job <a name="a5c6dd67-95cc-40d3-a151-6ddc2ebe9aa8"></a>
### Find events to attend
Want to introduce the language at some developer conference.

## Job <a name="e6dc00f5-e134-4977-a60a-46f78b0ce725"></a>
### Create our logo
We need a Logo for UScript, something simple, but impactful.

#### Reports 
#### Report <a name="ace4e4df-fcf4-43c6-b2da-5ab43838c67c"></a> 
What do think of this?

![](https://dev.imagecdn.uclusion.com/0f13660a-8420-401a-8340-315c9505b2de/a1422a63-9816-4f2f-90c2-7f7b9d65f5f2.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiIwZjEzNjYwYS04NDIwLTQwMWEtODM0MC0zMTVjOTUwNWIyZGUifQ.tT_0yXgZYmMnylV1p23HSX6CecCPV3Yp7ejgemucaz8)

## Job <a name="b9d86ae9-c0e0-483a-b2a4-a8e9420fb325"></a>
### Get basic grammar defined
What are our statement literals? How do you want to define functions? Operators?

> ##### $${\color{green} Reason \space For}$$
#### Question <a name="c11144c8-30f9-4ead-9109-df8844f54ef3"></a> 
Will look at expressions in literals as well.

#### Tasks 
#### Task <a name="e8081664-1ac5-4676-8581-51f84f31b08a"></a> 
Definition of statement literals.

#### Task <a name="1d4b7f65-61a8-4d65-9b27-8840c165a39b"></a> 
Function declaration syntax.

## Job <a name="aa7cec30-e564-4747-bba3-4afdab740554"></a>
### Design Union Types
Union types like typescript has would make UScript much easier to work with

We need to sit down and make a formal spec.

> ##### $${\color{lightgreen} Reason \space For}$$
#### Question <a name="0655af0e-20b4-43bd-b85c-d5763ac7212e"></a> 
Yeah, they come in really handy when handling api error responses.

#### Reports 
#### Report <a name="ee6f2bbc-eb63-46f7-a7f9-e144eb6f4502"></a> 
Union types are defined [here](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types) (i.e. exactly as defined in TypeScript).

﻿@Samantha Demo﻿ I'd really like your feedback.

#### Tasks 
#### Task <a name="4c64a184-eb4b-405f-8d36-d09924fc915b"></a> 
Incorporate the Union definition from TypeScript into *our* spec.

> ##### Grouped task <a name="57bf3160-3ef5-4ac7-9008-2fd45aa7d358"></a> 
I'm trying a note now but this is grouped task.

#### Notes 
#### Note <a name="a4960ff1-1c61-40e6-a971-82db2d5eb904"></a> 
Now try note again with fix.

## Job <a name="99fe110d-0abd-4699-8c0b-e5257f01f112"></a>
### Unicode Handling
Make character strings support the entire byte array via UTF-8.

## Job <a name="b6a16330-d393-42e5-a56f-08613bb39211"></a>
### Prototype CLANG backend
We need to be able to compile the language as we're running it.

## Job <a name="1888169f-9203-4f53-929b-4954bbcbcb00"></a>
### Automated tests for CLANG backend
We need to be able test compiling the language.

## Job <a name="db79a92a-b477-407c-b531-af0dabbca307"></a>
### Main explanatory blog
Tip of the spear explanation of the value of our new script.

## Job <a name="dd91cc95-3e1d-4633-b5db-e25cb2eb925e"></a>
### Initial pass at UScript syntax
Emphasis on developer experience.

> ##### $${\color{green} Reason \space For}$$
#### Question <a name="b76f0b3d-7fd0-4a94-b255-510e210cc78d"></a> 
Should tie in with the testing strategy.

#### Reports 
#### Report <a name="462f9141-7412-41df-af7d-55e0c71390f3"></a> 
Please review the latest checked in syntax docs.

> ##### Reply <a name="7d93daf9-c6f1-48bb-aa23-6b5b607a1229"></a> 
Please add a section on arrow functions.


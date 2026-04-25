| No Estimate | Estimated | | Done |
|--------------|---------------|--------------|--------------|
| [Need a UScript Intellij plugin.](#069e714f-de96-4d6a-86e1-b45885d62a63)| [Get basic grammar defined](#a1335a75-1c0d-4d62-a1f0-708f60cc4890)| 12/05|  |
| [Get basic REPL interpreter running](#78cc4792-5176-46f5-9dde-1bd3a137ae15)| [Look for more founders](#71548762-7b41-44fe-8daf-3f6f058d255c)| 11/28|  |
| [Create our hero statement](#16a60002-5210-40a4-b014-4a65fd8465b7)| [Figure out IPC](#dd358d6f-76f2-49d2-881b-eca1a2f5d367)| 11/26|  |
| [Null safety](#afdae2c5-1265-4006-913c-5ef923034b09)| [Add C bindings](#45a4380a-0479-4a3f-8ac2-d11b7c55f87d)| 11/19|  |
| [Find events to attend](#cd946053-a9c5-449d-b8bd-de56db83042b)| [Create our logo](#23c510dc-5570-4ae0-9e06-226521abb300)| 11/28|  |
| [Error handling](#621c33ba-54d3-443b-a0d1-7ec6797b6e99)| [Design Union Types](#dbc49201-c3cc-46b0-af53-a70cd9b23738)| 11/22|  |
| [Region based memory management for garbage collection.](#13ae3aa4-9e1a-482b-8c56-290e77b0443b)| | |  |
## Job <a name="a1335a75-1c0d-4d62-a1f0-708f60cc4890"></a>
### Get basic grammar defined
<p>What are our statement literals? How do you want to define functions? Operators?</p>> ##### $${\color{green} Reason \space For}$$
<p>Will look at expressions in literals as well.</p>#### Task <a name="6c1900bb-72a3-4a6a-a0a0-aad7e793dd3b"></a> 
<p>Definition of statement literals.</p>#### Task <a name="41d70ef3-04c3-4866-8151-7d07ae9261e9"></a> 
<p>Function declaration syntax.</p>## Job <a name="069e714f-de96-4d6a-86e1-b45885d62a63"></a>
### Need a UScript Intellij plugin.
<p>Even for our own usage this is required.</p>#### Suggestion <a name="b478bdb7-aa63-4ec3-b122-d1611344aa14"></a> 
<p>Find a base language plugin upon which we can build.</p>## Job <a name="78cc4792-5176-46f5-9dde-1bd3a137ae15"></a>
### Get basic REPL interpreter running
<p>Even if we wind up compiled later a basic REPL will give us a feel for how usable Demo really is.</p>#### Issue <a name="1865fd3b-d58d-41b7-9130-7b0122c04f26"></a> 
<p>We don't have a language spec yet. We can bring up a language shell, but without basic language definitions we can't go much further.</p>> ##### Reply <a name="2747c0b0-2942-453e-a662-28b8c234efbe"></a> 
<p><span class="mention" data-denotation-char="@" data-external-id="7936a39f-067d-4473-bd87-9a75aafc63c2" data-id="29050f0d-8cf9-486c-b4cf-ad47578c4693" data-value="John Doe"><span>&#xFEFF;<span class="ql-mention-denotation-char">@</span>John Doe</span>&#xFEFF;</span> can you create a job with requirements for basic language definitions?</p>## Job <a name="71548762-7b41-44fe-8daf-3f6f058d255c"></a>
### Look for more founders
<p>Our current decision making and coding scaling well so consider talent if available.</p>## Job <a name="16a60002-5210-40a4-b014-4a65fd8465b7"></a>
### Create our hero statement
<p>Every good language is really direct in what it's trying to solve </p><p>For example, Rust's: <img src="https://dev.imagecdn.uclusion.com/3a2c3b12-336b-4d72-b36c-fd3a27a884b2/84623b32-7cd7-47da-b377-a1854c46f7be.png" width="300"></p> <p>Similarly we need to tell the user's what UScript is about, in the simplest words possible.</p>## Job <a name="afdae2c5-1265-4006-913c-5ef923034b09"></a>
### Null safety
<p>Handle nulls in a developer friendly way.</p>> ##### $${\color{orange} Reason \space For}$$
<p>Avoid the billion dollar mistake now.</p>#### Task <a name="5c35772e-2d7c-4a77-848d-2f3f71552ac3"></a> 
<p>Allow explicitly creating a variable as nullable. Variables are non-nullable by default.</p>#### Task <a name="6b566720-d494-4cda-b99b-2ea2a9de1aa5"></a> 
<p>Unit tests.</p>> ##### Grouped task <a name="dfff3633-d095-4ff6-a280-62db16733467"></a> 
<p>Test run time nullable assigned null.</p>> ##### Grouped task <a name="9bf5feaa-1d34-41ad-ba07-98280f82f1c0"></a> 
<p>Test compile time non-nullable unassigned.</p>> ##### Grouped task <a name="8d77547e-535e-4c06-83cb-1dd9e5fe6641"></a> 
<p>Test run time non-nullable unassigned.</p>> ##### Grouped task <a name="2fcd5a30-542b-408c-b650-f2ea57e6b170"></a> 
<p>Test compile time nullable unassigned.</p>#### Suggestion <a name="07320e5c-990a-436e-a4da-faf749b1f7b5"></a> 
<p>Kotlin has good null handling <a href="https://kotlinlang.org/docs/null-safety.html">https://kotlinlang.org/docs/null-safety.html</a>.</p>> ##### $${\color{lightgreen} Reason \space For}$$
<p>Yes I like the way Kotlin easily declares nullable or not.</p>#### Task <a name="2068c774-d548-4495-a4c4-32c7b9ecbeae"></a> 
<p>Implement a null safe operator:</p> <p>obj?.prop: Returns obj.prop if obj exists; otherwise, it returns undefined.</p> <p>obj?.[prop]: Returns obj[prop] if obj exists; otherwise, it returns undefined - for dynamic or special characters.</p> <p>obj.method?.(): Calls obj.method() if obj.method exists; otherwise, it returns undefined.</p>## Job <a name="cd946053-a9c5-449d-b8bd-de56db83042b"></a>
### Find events to attend
<p>Want to introduce the language at some developer conference.</p>## Job <a name="621c33ba-54d3-443b-a0d1-7ec6797b6e99"></a>
### Error handling
<p>We need basic error handling with a returned value scheme like Go.</p>> ##### $${\color{orange} Reason \space For}$$
<p>By the time you Go 1.13 wrap everything it's very similar to a stack trace.</p>#### Question <a name="e90f917f-2479-46d9-a656-ca57cc7141e6"></a> 
<h2>Can we do better than wrapping errors?</h2><p>Wrapping errors feels like building a stack trace by hand. What are our options?</p>### Option<a name="c953bd7d-4aaa-4663-93f5-8e47d2a57438"></a>
### Support both raise catch and Go style return errors.
<p>The syntax should allow for any combination of raise and return of errors on a function. If you expect the caller to handle the error then lean towards return and otherwise lean towards raise.</p>> ##### $${\color{lightgreen} Reason \space For}$$
<p>This allows us an immediate two classes of errors - expected to be handled and likely needing to be fixed.</p>> ##### $${\color{orange} Reason \space For}$$
<p>The flexibility is good but will mean growing the error handling in two directions.</p>### Option<a name="e091381f-5a9f-466e-9755-09962719d89a"></a>
### Automatic error context creation
<p>A function will be provided that allows you to return an error with the runtime argument values of the enclosing function automatically included.</p>#### Issue <a name="b3224e1f-70e9-4a3e-b48e-a63a59bef360"></a> 
<p>Then you would be automatically logging values that might be sensitive.</p>## Job <a name="dd358d6f-76f2-49d2-881b-eca1a2f5d367"></a>
### Figure out IPC
<p>We need a way to define how sub threads or processes will pass data to each other.</p>#### Task <a name="86e037da-491c-497e-9e16-821198d4b3af"></a> 
<p>What happens when include a <a href="/dialog/3a2c3b12-336b-4d72-b36c-fd3a27a884b2/dd358d6f-76f2-49d2-881b-eca1a2f5d367#c13c8c616-3e10-4033-87b4-f95495db0a92">Figure out IPC - T-Engineering-7</a> link?</p>#### Question <a name="ba91f000-2faf-446e-9cc1-44f9ea41a512"></a> 
<p>Something similar to Erlang mailboxes?  Go channels? <span class="mention" data-denotation-char="@" data-external-id="1763748457.666025uclusiondemo@uclusion.com" data-id="8c97e6fe-e3ec-4fa7-9496-5a4a6cf335b9" data-value="TARGET USER"><span>&#xFEFF;<span class="ql-mention-denotation-char">@</span>TARGET USER</span>&#xFEFF;</span> what do you think?</p>> ##### Reply <a name="9917c0ef-b99b-4f9a-bb34-066394a501c1"></a> 
<p>What is our main use case? Now what?</p>### Option<a name="56329608-9890-4a28-9f4b-cac64df426b4"></a>
### Pub/Sub
<p>Each process will subscribe to one or more topics, and you send to all receivers</p>### Option<a name="03e7b32e-f778-4d5a-844b-decf5176c5f4"></a>
### Mailboxes
<p>Each process will have a unique mailbox, and you send to it by broadcasting to it's PID.</p>### Option<a name="1d246802-9e4c-47c6-b9ea-28358e20d93b"></a>
### Channels
<p>We'd have generic channels as first class objects that any process can write to or read from.</p>> ##### $${\color{yellow} Reason \space For}$$
<p>Try and see how it goes.</p>#### Task <a name="13c8c616-3e10-4033-87b4-f95495db0a92"></a> 
<p><strong>Subject</strong>:&nbsp;Better&nbsp;planning&nbsp;for&nbsp;an&nbsp;elite&nbsp;developer&nbsp;like&nbsp;you</p><p><br></p><p>Shrijith,</p><p><br></p><p>Hexmos is extremely impressive. I’m reaching out because after many years coding, we’re finally seeking our first customers for Uclusion.</p><p><br></p><p>Uclusion is designed specifically for developer flow state. For your solo dev work, it's a superior way to keep organized. When you collaborate, it’s an asynchronous solution that treats design and approval as first class citizens.</p><p><br></p><p>If&nbsp;you&nbsp;are&nbsp;interested,&nbsp;our&nbsp;<a href="https://www.uclusion.com">landing&nbsp;page</a>&nbsp;sets&nbsp;you&nbsp;up&nbsp;with&nbsp;already&nbsp;populated&nbsp;solo&nbsp;and&nbsp;team&nbsp;sandbox&nbsp;workspaces&nbsp;-&nbsp;no&nbsp;credit&nbsp;card&nbsp;required.</p>## Job <a name="45a4380a-0479-4a3f-8ac2-d11b7c55f87d"></a>
### Add C bindings
<p>We would have a much easier time building out the standard library if we can call into C.</p>> ##### $${\color{green} Reason \space For}$$
<p>Starting that integration now will prevent duplicating functionality.</p>> ##### $${\color{lightgreen} Reason \space For}$$
<p>Agreed - front load this work.</p>#### Task <a name="dc5e2c93-e6c8-4841-9079-3eb0585e6dae"></a> 
<p>Runtime binding.</p>#### Task <a name="21d00007-5f2d-4768-bae1-584a40050520"></a> 
<p>Define and include for make file linkage.</p>## Job <a name="23c510dc-5570-4ae0-9e06-226521abb300"></a>
### Create our logo
<p>We need a Logo for UScript, something simple, but impactful.</p>#### Report <a name="563c85ae-29ca-4105-a3eb-11e769cc515b"></a> 
<p>What do think of this?</p><p><img src="https://dev.imagecdn.uclusion.com/3a2c3b12-336b-4d72-b36c-fd3a27a884b2/d409b821-e71c-4340-8bda-5dbbd89bd6cc.png" width="200"></p>## Job <a name="dbc49201-c3cc-46b0-af53-a70cd9b23738"></a>
### Design Union Types
<p>Union types like typescript has would make UScript much easier to work with</p><p>We need to sit down and make a formal spec.</p>> ##### $${\color{lightgreen} Reason \space For}$$
<p>Yeah, they come in really handy when handling api error responses.</p>#### Report <a name="857770ac-04d7-42ad-9808-81d8f8f60b6b"></a> 
<p>Union types are defined <a href="https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types">here</a> (i.e. exactly as defined in TypeScript).</p><p><span class="mention" data-denotation-char="@" data-external-id="040a6f70-466d-4687-a2e8-6e714a116d23" data-id="8c2c0aed-9631-4a86-8d80-5ab1b2d3dc71" data-value="Samantha Demo"><span>&#xFEFF;<span class="ql-mention-denotation-char">@</span>Samantha Demo</span>&#xFEFF;</span> I'd really like your feedback.</p>#### Task <a name="f7f6be6e-149a-461b-92b5-2d099e410bb2"></a> 
<p>Incorporate the Union definition from TypeScript into <em>our</em> spec.</p><p><br></p><h2>Blah</h2><p><br></p><p><img src="https://dev.imagecdn.uclusion.com/3a2c3b12-336b-4d72-b36c-fd3a27a884b2/0e7a1228-76ea-4361-88b3-5ea81a5b2d35.png"></p>## Job <a name="13ae3aa4-9e1a-482b-8c56-290e77b0443b"></a>
### Region based memory management for garbage collection.
<p><a href="https://en.wikipedia.org/wiki/Region-based_memory_management">Region based memory management</a> for garbage collection. That will still be useful even if we go with reference counting later as internal references won't have to be tracked.</p>
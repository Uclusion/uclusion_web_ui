## Job <a name="dd358d6f-76f2-49d2-881b-eca1a2f5d367"></a>
### Figure out IPC
We need a way to define how sub threads or processes will pass data to each other.

#### Task <a name="86e037da-491c-497e-9e16-821198d4b3af"></a> 
What happens when include a [Figure out IPC - T-Engineering-7](#13c8c616-3e10-4033-87b4-f95495db0a92) link?

#### Question <a name="ba91f000-2faf-446e-9cc1-44f9ea41a512"></a> 
Something similar to Erlang mailboxes? Go channels? ﻿@TARGET USER﻿ what do you think?

> ##### Reply <a name="9917c0ef-b99b-4f9a-bb34-066394a501c1"></a> 
What is our main use case? Now what?

### Option<a name="56329608-9890-4a28-9f4b-cac64df426b4"></a>
### Pub/Sub
Each process will subscribe to one or more topics, and you send to all receivers

### Option<a name="03e7b32e-f778-4d5a-844b-decf5176c5f4"></a>
### Mailboxes
Each process will have a unique mailbox, and you send to it by broadcasting to it's PID.

### Option<a name="1d246802-9e4c-47c6-b9ea-28358e20d93b"></a>
### Channels
We'd have generic channels as first class objects that any process can write to or read from.

> ##### $${\color{yellow} Reason \space For}$$
Try and see how it goes.

#### Task <a name="13c8c616-3e10-4033-87b4-f95495db0a92"></a> 
**Subject**: Better planning for an elite developer like you




Shrijith,




Hexmos is extremely impressive. I’m reaching out because after many years coding, we’re finally seeking our first customers for Uclusion.




Uclusion is designed specifically for developer flow state. For your solo dev work, it's a superior way to keep organized. When you collaborate, it’s an asynchronous solution that treats design and approval as first class citizens.




If you are interested, our [landing page](https://www.uclusion.com) sets you up with already populated solo and team sandbox workspaces - no credit card required.


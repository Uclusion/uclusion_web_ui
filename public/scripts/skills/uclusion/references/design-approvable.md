<!-- uclusion-skill-reference:v1 -->
# Design for Approvable jobs

When starting work on an Approvable job, finish handling the questions and suggestions about what to build, then complete and publish the design. Do this before asking what to do next or recording an AI approval.

Do not make or authorize manual stage changes.

Use the job's current Markdown. If it says **AI user is a required approver** and **You may approve this job**, assess its value without asking whether to approve. If it says the AI has already voted, do not offer or record another AI approval.

When the initial design is published and the job is still Approvable, ask whether to move it or assess it only when the Markdown says **You may approve this job** and does not say AI approval is required. Use exactly two options in this order: **Move to Doable**, then **Perform AI approval**. Vote for Move to Doable and explain why. Return the question's code as the pending decision about what to do next.

If the human chooses **Perform AI approval**, resolve that question using the [question rules](question-tools.md), then check that the job now allows approval. This choice gives permission for the assessment only. When assessing the job's value, use the evidence and related work, asking missing questions and making relevant suggestions before approving. Give lower certainty when the case for the job is weak, untested or contradicted by the evidence. Record the assessment with `approve_job_or_option`.
<!-- /uclusion-skill-reference:v1 -->

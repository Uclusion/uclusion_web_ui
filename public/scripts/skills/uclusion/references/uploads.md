<!-- uclusion-skill-reference:v1 -->
# Uploading files

Call `get_upload` with exact byte size and MIME type. POST every returned
presigned field and then the file bytes as multipart data to the returned URL.
Reference `file_url` in the artifact body and pass its metadata through
`uploaded_files` on the creating tool call. An unreferenced upload is not
retained. File bytes do not pass through the model.

<!-- /uclusion-skill-reference:v1 -->

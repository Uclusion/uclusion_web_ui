/**
 * Helper function to determine which of the uploaded files are used in the text body,
 * and to strip out components of the upload that the backend won't accept
 * @param uploadedFiles a data structure with at least a { path } component
 * @param text the body of the context
 * @return a filtered list of file uploads
 */
export function filterUploadsUsedInText(uploadedFiles, text) {
  console.debug(uploadedFiles);
  const used = uploadedFiles.filter((file) => {
    console.debug(file)
    const { path } = file;
    console.debug(path);
    console.debug(text);
    return text.includes(path);
  });
  console.debug(used);
  return used.map((element) => {
    const { path, content_type, content_length } = element;
    return { path, content_type, content_length };
  });
}

/**
 * Helper function to determine which of the uploaded files are used in the text body
 * @param uploadedFiles a data structure with at least a { path } component
 * @param text
 */
export function listUploadsUsedInText(uploadedFiles, text){
  const used = uploadedFiles.filter((file) => {
    const { path } = file;
    return text.includes(path);
  });
  return used;
}
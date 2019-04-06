
export function formatInvestibles(investibles) {
  return investibles.map((investible) => {
    const newInvestible = { ...investible };
    newInvestible.created_at = new Date(investible.created_at);
    newInvestible.updated_at = new Date(investible.updated_at);
    newInvestible.last_investment_at = new Date(investible.last_investment_at);
    return newInvestible;
  });
}



export function reFormatComments(comments) {
  return comments.map((comment) => {
    const newComment = { ...comment };
    newComment.created_at = new Date(comment.created_at);
    newComment.updated_at = new Date(comment.updated_at);
    return newComment;
  });
}

export function clearReduxStore() {
  console.debug('Clearing Redux Store');

  const DBOpenRequest = window.indexedDB.open('localforage', 2);
  let db;

  function deleteData() {
    console.debug(db.objectStoreNames);
    // open a read/write db transaction, ready for deleting the data
    let transaction = db.transaction(['keyvaluepairs'], 'readwrite');
    // report on the success of the transaction completing, when everything is done
    let objStore = transaction.objectStore('keyvaluepairs');
    objStore.clear();
    transaction.oncomplete = function (event) {
      console.debug('Clear transaction completed.');
    };
    transaction.onerror = function (event) {
      console.debug('Clear transaction not opened due to error');
    };
  }


  DBOpenRequest.onsuccess = function (event) {
    console.debug('Db opened for clear');
    // store the result of opening the database in the db variable. This is used a lot below
    db = DBOpenRequest.result;
    // Run the deleteData() function to delete a record from the database
    deleteData();
  };
}

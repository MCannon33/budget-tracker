// connection
let db;
// establish a connection to IndexedDB database and set version
const request = indexedDB.open("budget_tracker", 1);

// this event will emit if the database version changes
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store
  db.createObjectStore("budget_tracker", { autoIncrement: true });
};
// upon a successful
request.onsuccess = function (event) {
  db = event.target.result;

  // check if app is online,
  if (navigator.onLine) {
    // we haven't created this yet, but we will soon, so let's comment it out for now
    updateTracker();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};
// This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["budget_tracker"], "readwrite");

  // access the object store for `new_pizza`
  const budgetObjectStore = transaction.objectStore("budget_tracker");

  // add record to your store with add method
  budgetObjectStore.add(record);
}

// Update once back online
function updateTracker() {
  // open a transaction on your db
  const transaction = db.transaction(["budget_tracker"], "readwrite");

  // access your object store
  const budgetObjectStore = transaction.objectStore("budget_tracker");

  // get all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  // upon a successful .getAll() execution, run this function

  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["budget_tracker"], "readwrite");
          // access the object store
          const budgetObjectStore = transaction.objectStore("budget_tracker");
          // clear all items in your store
          budgetObjectStore.clear();

          alert("saved!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}
// listen for app coming back online
window.addEventListener("online", updateTracker);
